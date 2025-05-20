from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from app.services.resume_parser import extract_text_from_pdf, extract_resume_details_with_azure, clean_json_string
from app.database import get_db
import tempfile
import os
import traceback
from docx2pdf import convert
import uuid
import time
from typing import Dict, Any

router = APIRouter()

# In-memory task storage (replace with Redis or DB in production)
TASKS = {}


class TaskStatus:
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


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
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name
        
        # Initialize task status
        TASKS[task_id] = {
            "status": TaskStatus.PENDING,
            "stage": "upload",
            "progress": 0,
            "data": None,
            "error": None,
            "file_path": tmp_path,
            "file_extension": file_extension
        }
        
        # Start processing in background
        background_tasks.add_task(process_resume, task_id)
        
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


async def process_resume(task_id: str):
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

    except Exception as e:
        traceback.print_exc()
        task["status"] = TaskStatus.FAILED
        task["error"] = str(e)
    finally:
        # Clean up temporary files
        try:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
            if pdf_path != tmp_path and os.path.exists(pdf_path):
                os.remove(pdf_path)
        except:
            pass