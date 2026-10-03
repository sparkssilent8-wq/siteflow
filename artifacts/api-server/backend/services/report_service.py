import re
import json
from typing import Dict, Any, List
import pypdf

class DPRReportParserService:
    def extract_text_from_pdf(self, file_bytes: bytes) -> str:
        try:
            reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            text = ""
            for page in reader.pages:
                text += page.extract_text() or ""
            return text
        except Exception as e:
            return f"Error extracting PDF: {str(e)}"

    def parse_dpr_text(self, text: str) -> Dict[str, Any]:
        lines = [l.strip() for l in text.split("\n") if l.strip()]
        
        # Extract metadata
        date_match = re.search(r'(?:Date|Dated|Report Date)[\s:]+([A-Za-z0-9\-\.\/]+)', text, re.IGNORECASE)
        report_date = date_match.group(1) if date_match else None
        
        weather_match = re.search(r'(?:Weather|Site Conditions)[\s:]+([A-Za-z\s]+)', text, re.IGNORECASE)
        weather = weather_match.group(1).strip() if weather_match else "Clear / Favorable"

        contractor_match = re.search(r'(?:Contractor|Agency)[\s:]+([A-Za-z0-9\-\s]+)', text, re.IGNORECASE)
        contractor = contractor_match.group(1).strip() if contractor_match else "Site EPC Team"

        # Extract Work Execution line items
        work_items = []
        for line in lines:
            # Check if line contains percentage or progress indicators
            pct_match = re.search(r'(\d+(?:\.\d+)?)\s*%', line)
            if pct_match and len(line) > 15:
                pct = float(pct_match.group(1))
                work_items.append({
                    "raw_text": line,
                    "extracted_progress": min(100.0, pct),
                    "confidence": 0.85
                })
            elif any(k in line.lower() for k in ["completed", "erected", "laid", "tested", "welded", "poured", "installed", "executed"]):
                if len(line) > 20 and not line.startswith("#"):
                    work_items.append({
                        "raw_text": line,
                        "extracted_progress": None,
                        "confidence": 0.70
                    })

        return {
            "report_date": report_date,
            "contractor": contractor,
            "weather": weather,
            "raw_text_length": len(text),
            "extracted_items": work_items
        }

report_service = DPRReportParserService()
