import re
import math
from typing import List, Dict, Any, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy.orm import Session
from backend.models.activity import Activity

class IntelligentMatchingService:
    def __init__(self):
        self.stop_words = {"the", "a", "an", "of", "in", "to", "for", "with", "on", "at", "by", "from", "up", "is", "was", "completed", "done", "progress"}

    def _clean_text(self, text: str) -> str:
        if not text:
            return ""
        # Standardize pipe sizes (e.g. 24" -> 24 inch, 24-inch -> 24 inch)
        t = re.sub(r'(\d+)\s*["”\']', r'\1 inch ', text)
        t = re.sub(r'(\d+)-inch', r'\1 inch', t, flags=re.IGNORECASE)
        # Normalize punctuation
        t = re.sub(r'[^\w\s\-\.]', ' ', t)
        return t.lower().strip()

    def _extract_entities(self, text: str) -> Dict[str, List[str]]:
        raw = text.upper()
        entities = {
            "disciplines": [],
            "dimensions": [],
            "codes": []
        }
        
        # Check disciplines
        if any(w in raw for w in ["PIPE", "PIPING", "WELD", "ERECTION", "FLANGE", "VALVE"]):
            entities["disciplines"].append("Piping")
        if any(w in raw for w in ["CIVIL", "CONCRETE", "FOUNDATION", "EXCAVATION", "REBAR", "PILING", "RAFT"]):
            entities["disciplines"].append("Civil")
        if any(w in raw for w in ["ELECTRICAL", "CABLE", "TRANSFORMER", "PANEL", "TERMINATION", "CONDUIT"]):
            entities["disciplines"].append("Electrical")
        if any(w in raw for w in ["MECHANICAL", "PUMP", "COMPRESSOR", "VESSEL", "ALIGNMENT"]):
            entities["disciplines"].append("Mechanical")
        if any(w in raw for w in ["HSE", "SAFETY", "BARRIER", "FENCING", "TESTING", "HYDROTEST"]):
            entities["disciplines"].append("HSE")

        # Dimensions & numbers
        dims = re.findall(r'\b\d+\s*(?:INCH|MM|M|KM|DIA|DN|\")\b', raw)
        entities["dimensions"] = dims

        # Specific activity codes (e.g. PIP-L6-024, CIV-L5-012)
        codes = re.findall(r'\b[A-Z]{2,4}-L[1-6]-\d{3,4}\b', raw)
        entities["codes"] = codes

        return entities

    def match_update_to_activities(
        self, 
        db: Session, 
        project_id: int, 
        raw_text: str, 
        discipline_hint: str = None, 
        top_k: int = 5
    ) -> Dict[str, Any]:
        activities = db.query(Activity).filter(Activity.project_id == project_id).all()
        if not activities:
            return {
                "top_match": None,
                "matches": [],
                "requires_review": True,
                "overall_confidence": 0.0,
                "explanation": "No activities found for this project."
            }

        cleaned_query = self._clean_text(raw_text)
        query_entities = self._extract_entities(raw_text)
        
        # Build corpus from activities
        corpus = []
        for act in activities:
            text_repr = f"{act.activity_code} {act.activity_name} {act.discipline} {act.wbs_code or ''} {act.notes or ''}"
            corpus.append(self._clean_text(text_repr))

        # 1. TF-IDF Cosine Similarity
        vectorizer = TfidfVectorizer(ngram_range=(1, 3), token_pattern=r'(?u)\b\w+\b')
        tfidf_matrix = vectorizer.fit_transform(corpus)
        query_vec = vectorizer.transform([cleaned_query])
        cosine_scores = cosine_similarity(query_vec, tfidf_matrix).flatten()

        # 2. Hybrid Scoring with Domain Boosting
        scored_matches = []
        query_words = set(cleaned_query.split()) - self.stop_words

        for idx, act in enumerate(activities):
            tfidf_score = float(cosine_scores[idx])
            boost = 0.0
            matched_keywords = []

            act_code_upper = act.activity_code.upper()
            act_name_clean = self._clean_text(act.activity_name)
            act_words = set(act_name_clean.split())

            # Token overlap
            overlap = query_words.intersection(act_words)
            if overlap:
                matched_keywords.extend(list(overlap))
                boost += min(0.35, len(overlap) * 0.12)

            # Exact code mention (e.g. PIP-L6-024)
            if act.activity_code.upper() in raw_text.upper():
                boost += 0.45
                matched_keywords.append(act.activity_code)

            # Discipline alignment
            if discipline_hint and discipline_hint.lower() == act.discipline.lower():
                boost += 0.15
            elif any(d.lower() == act.discipline.lower() for d in query_entities["disciplines"]):
                boost += 0.12
                matched_keywords.append(act.discipline)

            # Dimension / Pipe size match (e.g. 24 inch)
            for dim in query_entities["dimensions"]:
                if dim.lower() in act_name_clean or dim.replace(" ", "").lower() in act_name_clean:
                    boost += 0.20
                    matched_keywords.append(dim)

            # WBS Level priority: Site updates are typically L5/L6 executable tasks
            if act.wbs_level in ["L5", "L6"]:
                boost += 0.08

            raw_confidence = min(0.99, max(0.05, tfidf_score * 0.55 + boost))
            
            # Form explanation breakdown
            score_breakdown = {
                "tfidf_similarity": round(tfidf_score, 3),
                "domain_entity_boost": round(boost, 3),
                "wbs_executable_weight": 0.08 if act.wbs_level in ["L5", "L6"] else 0.0,
                "matched_tokens_count": len(overlap)
            }

            requires_review = raw_confidence < 0.80

            scored_matches.append({
                "activity_id": act.id,
                "activity_code": act.activity_code,
                "activity_name": act.activity_name,
                "discipline": act.discipline,
                "wbs_level": act.wbs_level or "L5",
                "confidence_score": round(raw_confidence, 3),
                "match_method": "HYBRID_TFIDF_DOMAIN",
                "score_breakdown": score_breakdown,
                "matched_keywords": list(set(matched_keywords)),
                "requires_review": requires_review,
                "current_progress": act.actual_progress or 0.0
            })

        # Sort by confidence descending
        scored_matches.sort(key=lambda x: x["confidence_score"], reverse=True)
        top_matches = scored_matches[:top_k]
        top_match = top_matches[0] if top_matches else None

        # Build natural explanation for top match
        if top_match and top_match["confidence_score"] > 0.30:
            kws = ", ".join(f"'{k}'" for k in top_match["matched_keywords"][:4]) or "semantic terms"
            explanation = (
                f"Matched site update to '{top_match['activity_code']}: {top_match['activity_name']}' "
                f"with {int(top_match['confidence_score']*100)}% confidence based on {kws} "
                f"(Discipline: {top_match['discipline']}, Level: {top_match['wbs_level']})."
            )
            if top_match["requires_review"]:
                explanation += " Confidence is below 80% threshold — human verification recommended."
        else:
            explanation = "Low confidence matching. Please review and manually select the corresponding schedule activity."

        return {
            "top_match": top_match,
            "matches": top_matches,
            "requires_review": top_match["requires_review"] if top_match else True,
            "overall_confidence": top_match["confidence_score"] if top_match else 0.0,
            "explanation": explanation
        }

matching_service = IntelligentMatchingService()
