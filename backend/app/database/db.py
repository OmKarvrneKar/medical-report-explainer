from sqlalchemy import create_engine, Column, String, Text, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime
import uuid

SQLALCHEMY_DATABASE_URL = "sqlite:///./reports.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class ReportDB(Base):
    __tablename__ = "reports"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    summary = Column(Text)
    overall_status = Column(String)
    parameters = Column(Text) # JSON string
    what_to_do = Column(Text)
    disclaimer = Column(Text)
    language = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
