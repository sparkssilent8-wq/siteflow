import datetime
import re
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api/time-agent", tags=["Time Agent"])

class TimeAgentRequest(BaseModel):
    project_id: int
    transcript: str

class TimeAgentResponse(BaseModel):
    project_id: int
    transcript: str
    extracted: dict
    extraction_confidence: float

START_TERMS = ["started", "start", "began", "commenced", "initiated", "work started", "kaam start", "kaam shuru", "shuru ho gaya"]
END_TERMS = ["completed", "complete", "finished", "done", "erection completed", "installation complete", "kaam complete", "kaam khatam"]
DISCIPLINE_TERMS = {
    "Piping": ["pipe", "piping", "spool", "line", "weld", "welding", "hydrotest", "erection"],
    "Civil": ["civil", "foundation", "excavation", "concrete", "valve pit", "earthwork"],
    "Mechanical": ["mechanical", "compressor", "pump", "vessel", "equipment"],
    "Electrical": ["electrical", "cable", "cable tray", "33kv", "substation", "termination"],
    "Instrumentation": ["instrumentation", "instrument", "junction box", "loop check", "calibration"],
    "HSE": ["hse", "safety", "permit", "toolbox talk", "ppe"],
}

def _contains_any(text, terms):
    return any(re.search(rf"\b{re.escape(term)}\b", text, re.I) for term in terms)

def _extract_time(text):
    m = re.search(r"\b(?:at\s*)?(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)\b", text, re.I)
    if not m:
        return None, None
    hour, minute = int(m.group(1)), int(m.group(2) or 0)
    mer = m.group(3).lower().replace('.', '')
    if mer == 'pm' and hour < 12: hour += 12
    if mer == 'am' and hour == 12: hour = 0
    now = datetime.datetime.utcnow()
    dt = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
    label = dt.strftime('%H:%M')
    return label, dt

def _extract_progress(text):
    m = re.search(r"\b(?:up\s+to|at|around|approximately|about)?\s*(\d{1,3})\s*%", text, re.I)
    return max(0, min(100, float(m.group(1)))) if m else None

def _extract_location(text):
    patterns = [
        r"\b(?:at|near|in)\s+(.+?)(?=\s+(?:at\s+)?\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)\b|\s+(?:started|completed|finished|done|today|yesterday)\b|[.!?]|$)",
        r"\b(?:location|station|site)\s*[:=-]\s*(.+?)(?:[.!?]|$)",
    ]
    for pattern in patterns:
        m = re.search(pattern, text, re.I)
        if m and m.group(1).strip(): return re.sub(r"\s+", " ", m.group(1).strip())
    return None

def _discipline(text):
    low = text.lower()
    scores = {d: sum(1 for t in terms if t in low) for d, terms in DISCIPLINE_TERMS.items()}
    best = max(scores, key=scores.get)
    return best if scores[best] else None

def _activity_description(text):
    cleaned = re.sub(r"\b(?:started?|began|commenced|initiated|completed?|finished?|done|complete)\b", "", text, flags=re.I)
    cleaned = re.sub(r"\b(?:at|around|approximately|about)\s+\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)\b", "", cleaned, flags=re.I)
    cleaned = re.sub(r"\s+(?:at|near|in)\s+[^.!?]+$", "", cleaned, flags=re.I)
    cleaned = re.sub(r"\s+", " ", cleaned).strip(" ,.-")
    return cleaned or text.strip()

def extract(transcript):
    text = transcript.strip()
    has_start = _contains_any(text, START_TERMS)
    has_end = _contains_any(text, END_TERMS)
    progress = _extract_progress(text)
    # “completed up to 60%” means a completed portion of work, not completion
    # of the whole L5/L6 activity. Treat it as progress unless explicitly 100%.
    partial_completion = has_end and progress is not None and progress < 100
    event_type = "ACTUAL_START" if has_start and not has_end else "ACTUAL_END" if has_end and not has_start and not partial_completion else "PROGRESS"
    time_label, time_dt = _extract_time(text)
    location = _extract_location(text)
    discipline = _discipline(text)
    activity = _activity_description(text)
    confidence = 0.55
    if len(activity) >= 12: confidence += 0.12
    if discipline: confidence += 0.10
    if event_type != "PROGRESS": confidence += 0.10
    if time_dt: confidence += 0.06
    if location: confidence += 0.04
    if progress is not None: confidence += 0.06
    return {
        "activity_description": activity,
        "activity_type": "START" if event_type == "ACTUAL_START" else "COMPLETION" if event_type == "ACTUAL_END" else "PROGRESS_UPDATE",
        "discipline": discipline,
        "event_type": event_type,
        "actual_time": time_label,
        "actual_event_time": time_dt,
        "location": location,
        "reference": None,
        "progress_pct": progress,
    }, min(0.97, confidence)

@router.post("/process", response_model=TimeAgentResponse)
def process_time_agent(req: TimeAgentRequest):
    extracted, confidence = extract(req.transcript)
    return TimeAgentResponse(project_id=req.project_id, transcript=req.transcript, extracted=extracted, extraction_confidence=confidence)
