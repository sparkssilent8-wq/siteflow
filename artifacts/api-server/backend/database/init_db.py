from sqlalchemy import inspect, text
from backend.database.database import engine, Base
import backend.models
from backend.seed_india_projects import seed_india_projects

SITE_UPDATE_COLUMNS = {
    "source": "VARCHAR(50)",
    "event_type": "VARCHAR(50)",
    "voice_transcript": "TEXT",
    "extracted_activity": "TEXT",
    "extracted_discipline": "VARCHAR(100)",
    "actual_event_time": "TIMESTAMP",
    "extraction_confidence": "FLOAT",
}

def migrate_site_update_columns():
    inspector = inspect(engine)
    if "site_updates" not in inspector.get_table_names():
        return
    existing = {c["name"] for c in inspector.get_columns("site_updates")}
    with engine.begin() as conn:
        for name, sql_type in SITE_UPDATE_COLUMNS.items():
            if name not in existing:
                conn.execute(text(f"ALTER TABLE site_updates ADD COLUMN {name} {sql_type}"))


def migrate_review_decision_activity_nullable():
    inspector = inspect(engine)
    if "review_decisions" not in inspector.get_table_names():
        return
    activity_column = next(
        (column for column in inspector.get_columns("review_decisions") if column["name"] == "activity_id"),
        None,
    )
    if not activity_column or not activity_column.get("nullable", True):
        return

    with engine.begin() as conn:
        if engine.dialect.name == "postgresql":
            conn.execute(text("ALTER TABLE review_decisions ALTER COLUMN activity_id DROP NOT NULL"))
        elif engine.dialect.name == "sqlite":
            conn.execute(text("PRAGMA foreign_keys=OFF"))
            conn.execute(text("""
                CREATE TABLE review_decisions_new (
                    id INTEGER NOT NULL PRIMARY KEY,
                    site_update_id INTEGER NOT NULL UNIQUE,
                    activity_id INTEGER,
                    decision VARCHAR(50) NOT NULL,
                    previous_status VARCHAR(50),
                    reviewer_name VARCHAR(100),
                    review_notes TEXT,
                    created_at DATETIME,
                    FOREIGN KEY(site_update_id) REFERENCES site_updates (id),
                    FOREIGN KEY(activity_id) REFERENCES activities (id)
                )
            """))
            conn.execute(text("""
                INSERT INTO review_decisions_new
                (id, site_update_id, activity_id, decision, previous_status, reviewer_name, review_notes, created_at)
                SELECT id, site_update_id, activity_id, decision, previous_status, reviewer_name, review_notes, created_at
                FROM review_decisions
            """))
            conn.execute(text("DROP TABLE review_decisions"))
            conn.execute(text("ALTER TABLE review_decisions_new RENAME TO review_decisions"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_review_decisions_id ON review_decisions (id)"))
            conn.execute(text("PRAGMA foreign_keys=ON"))

def init_db():
    Base.metadata.create_all(bind=engine)
    migrate_site_update_columns()
    migrate_review_decision_activity_nullable()
    seed_india_projects()
    print("Database tables created/migrated successfully.")

if __name__ == "__main__":
    init_db()
