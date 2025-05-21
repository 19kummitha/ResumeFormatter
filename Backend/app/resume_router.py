from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import Column, Integer, String, DateTime, Text, JSON
from sqlalchemy.sql import func
from app.services.resume_parser import extract_text_from_pdf, extract_resume_details_with_azure, clean_json_string
from app.database import get_db, Base
import tempfile
import os
import traceback
from docx2pdf import convert
import uuid
import time
from typing import Dict, Any, List, Optional
from datetime import datetime
from pydantic import BaseModel

router = APIRouter()

# In-memory task storage (replace with Redis or DB in production)
TASKS = {}


class TaskStatus:
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


# Database model for resume history
class ResumeHistory(Base):
    __tablename__ = "resume_history"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    processed_at = Column(DateTime(timezone=True), server_default=func.now())
    user_id = Column(String(255), nullable=True)  # Can be linked to user authentication
    resume_data = Column(JSON, nullable=False)
    file_size = Column(Integer, nullable=True)
    status = Column(String(50), default="completed")
    original_file_type = Column(String(10), nullable=True)


# Pydantic model for response
class ResumeHistoryResponse(BaseModel):
    id: int
    filename: str
    processed_at: datetime
    file_size: Optional[int]
    status: str
    original_file_type: Optional[str]


@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db)
):
    try:
        # Generate a unique task ID
        task_id = str(uuid.uuid4())
        
        # Validate file type
        allowed_extensions = ['.pdf', '.doc', '.docx']
        allowed_mime_types = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
        file_extension = f".{file.filename.split('.')[-1].lower()}"
        if file_extension not in allowed_extensions or file.content_type not in allowed_mime_types:
            raise HTTPException(status_code=400, detail="Only PDF, DOC, or DOCX files are supported.")

        # Create temporary file with appropriate suffix
        suffix = file_extension
        file_content = await file.read()
        file_size = len(file_content)
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(file_content)
            tmp_path = tmp.name
        
        # Initialize task status
        TASKS[task_id] = {
            "status": TaskStatus.PENDING,
            "stage": "upload",
            "progress": 0,
            "data": None,
            "error": None,
            "file_path": tmp_path,
            "file_extension": file_extension,
            "filename": file.filename,
            "file_size": file_size,
            "user_id": None  # Can be populated from auth
        }
        
        # Start processing in background
        background_tasks.add_task(process_resume, task_id, db)
        
        # Return the task ID immediately
        return {"task_id": task_id, "status": "processing"}

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Unexpected error occurred: {str(e)}")


@router.get("/progress/{task_id}")
async def get_progress(task_id: str):
    if task_id not in TASKS:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task = TASKS[task_id]
    
    # Clean up completed tasks after some time (optional)
    if task["status"] in [TaskStatus.COMPLETED, TaskStatus.FAILED] and "cleanup_time" not in task:
        task["cleanup_time"] = time.time() + 3600  # Clean up after 1 hour
    
    return {
        "status": task["status"],
        "stage": task["stage"],
        "progress": task["progress"],
        "data": task["data"] if task["status"] == TaskStatus.COMPLETED else None,
        "error": task["error"] if task["status"] == TaskStatus.FAILED else None
    }


@router.get("/history", response_model=List[ResumeHistoryResponse])
async def get_resume_history(db: Session = Depends(get_db), limit: int = 10, skip: int = 0):
    """Get the resume processing history"""
    # Optionally filter by user_id if authentication is implemented
    history = db.query(ResumeHistory).order_by(
        ResumeHistory.processed_at.desc()
    ).offset(skip).limit(limit).all()
    
    return history


@router.get("/history/{resume_id}", response_model=dict)
async def get_resume_details(resume_id: int, db: Session = Depends(get_db)):
    """Get a specific resume from history by ID"""
    resume = db.query(ResumeHistory).filter(ResumeHistory.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    # Return full data including parsed resume content
    return {
        "id": resume.id,
        "filename": resume.filename,
        "processed_at": resume.processed_at,
        "file_size": resume.file_size,
        "status": resume.status,
        "original_file_type": resume.original_file_type,
        "resume_data": resume.resume_data
    }


@router.delete("/history/{resume_id}")
async def delete_resume(resume_id: int, db: Session = Depends(get_db)):
    """Delete a resume from history"""
    resume = db.query(ResumeHistory).filter(ResumeHistory.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    db.delete(resume)
    db.commit()
    
    return {"message": "Resume deleted successfully"}


async def process_resume(task_id: str, db: Session):
    task = TASKS[task_id]
    tmp_path = task["file_path"]
    file_extension = task["file_extension"]
    pdf_path = tmp_path
    
    try:
        # Update status to processing
        task["status"] = TaskStatus.PROCESSING
        
        # Convert DOC/DOCX to PDF if necessary
        if file_extension in ['.doc', '.docx']:
            task["stage"] = "conversion"
            task["progress"] = 0
            pdf_path = tmp_path.replace(file_extension, '.pdf')
            try:
                convert(tmp_path, pdf_path)  # Convert DOC/DOCX to PDF
                
                # Simulating progress for conversion
                for i in range(1, 6):
                    time.sleep(0.2)  # Simulate work
                    task["progress"] = i * 20
                
            except Exception as e:
                raise Exception(f"Failed to convert DOC/DOCX to PDF: {str(e)}")

        # Step 1: Extract text from PDF
        task["stage"] = "extraction"
        task["progress"] = 0
        try:
            # Simulate extraction progress updates
            for i in range(1, 6):
                time.sleep(0.3)  # Simulate work
                task["progress"] = i * 20
            
            text = extract_text_from_pdf(pdf_path)
            task["progress"] = 100
            
        except Exception as e:
            raise Exception(f"Failed to extract text: {str(e)}")

        # Step 2: Extract structured resume details (via Azure)
        task["stage"] = "parsing"
        task["progress"] = 0
        try:
            # Simulate parsing progress updates
            for i in range(1, 9):
                time.sleep(0.2)  # Simulate work
                task["progress"] = i * 12
                
            extracted = extract_resume_details_with_azure(text)
            parsed = clean_json_string(extracted)
            task["progress"] = 100
            
        except Exception as e:
            raise Exception(f"Failed to parse resume: {str(e)}")

        # Set completed status and store the parsed data
        task["stage"] = "completion"
        task["progress"] = 100
        task["status"] = TaskStatus.COMPLETED
        task["data"] = parsed
        
        # Save to history database
        resume_history = ResumeHistory(
            filename=task["filename"],
            resume_data=parsed,
            file_size=task["file_size"],
            original_file_type=file_extension.lstrip('.'),
            user_id=task["user_id"]
        )
        
        db.add(resume_history)
        db.commit()
        db.refresh(resume_history)

    except Exception as e:
        traceback.print_exc()
        task["status"] = TaskStatus.FAILED
        task["error"] = str(e)
        
        # Save failed job to history too
        try:
            resume_history = ResumeHistory(
                filename=task["filename"],
                resume_data={},  # Empty as processing failed
                file_size=task["file_size"],
                original_file_type=file_extension.lstrip('.'),
                user_id=task["user_id"],
                status="failed"
            )
            
            db.add(resume_history)
            db.commit()
        except:
            pass
    finally:
        # Clean up temporary files
        try:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
            if pdf_path != tmp_path and os.path.exists(pdf_path):
                os.remove(pdf_path)
        except:
            pass