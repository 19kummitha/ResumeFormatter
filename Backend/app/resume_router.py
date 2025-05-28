import gc
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, inspect
from sqlalchemy.sql import func
from app.services.azure_clients import extract_resume_details_with_azure, extract_resume_details_with_azure_vision
from app.services.image_processors import convert_pdf_to_images
from app.services.resume_parser import clean_json_string, convert_docx_to_pdf, extract_text_from_docx, extract_text_from_pdf
from app.database import get_db, Base, engine
import tempfile
import os
import traceback
import uuid
import time
from typing import Dict, Any, List, Optional
from datetime import datetime
from pydantic import BaseModel

# Check if processing_method column exists in resume_history table
def column_exists(table_name, column_name):
    inspector = inspect(engine)
    columns = inspector.get_columns(table_name)
    return any(col['name'] == column_name for col in columns)

# Flag to track if processing_method column exists
HAS_PROCESSING_METHOD_COLUMN = column_exists('resume_history', 'processing_method')

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
    
    # Only add this column to the model if it exists in the database
    if HAS_PROCESSING_METHOD_COLUMN:
        processing_method = Column(String(20), default="text")


# Pydantic model for response
class ResumeHistoryResponse(BaseModel):
    id: int
    filename: str
    processed_at: datetime
    file_size: Optional[int]
    status: str
    original_file_type: Optional[str]
    processing_method: Optional[str] = "text"


@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
    use_vision: bool = True  # New parameter to toggle between text and image processing
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
            "user_id": None,  # Can be populated from auth
            "use_vision": use_vision  # Store whether to use vision-based processing
        }
        
        # Start processing in background
        background_tasks.add_task(process_resume, task_id, db)
        
        # Return the task ID immediately
        return {"task_id": task_id, "status": "processing", "method": "vision" if use_vision else "text"}

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
    result = {
        "id": resume.id,
        "filename": resume.filename,
        "processed_at": resume.processed_at,
        "file_size": resume.file_size,
        "status": resume.status,
        "original_file_type": resume.original_file_type,
        "resume_data": resume.resume_data
    }
    
    # Only add processing_method if the column exists
    if HAS_PROCESSING_METHOD_COLUMN:
        result["processing_method"] = getattr(resume, "processing_method", "text")
    else:
        result["processing_method"] = "text"  # Default value
    
    return result


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
    use_vision = task.get("use_vision", True)
    converted_pdf_path = None
    
    try:
        task["status"] = TaskStatus.PROCESSING
        
        # For DOC/DOCX files, try conversion to PDF for vision processing with enhanced error handling
        if file_extension in ['.doc', '.docx'] and use_vision:
            try:
                task["stage"] = "converting_docx_to_pdf_with_aspose"
                task["progress"] = 20
                
                print(f"Attempting to convert {file_extension} to PDF using Aspose.Words for enhanced vision processing...")
                
                # Force garbage collection before conversion to free memory
                gc.collect()
                
                converted_pdf_path = convert_docx_to_pdf(tmp_path)
                
                if os.path.exists(converted_pdf_path):
                    file_extension = '.pdf'
                    tmp_path = converted_pdf_path
                    task["progress"] = 100
                    print(f"Successfully converted to PDF using Aspose.Words for certification detection: {converted_pdf_path}")
                else:
                    raise Exception("PDF file was not created")
                
            except Exception as e:
                print(f"DOCX to PDF conversion with Aspose.Words failed: {str(e)}")
                print("Falling back to enhanced text-based processing for certification extraction...")
                use_vision = False
                task["progress"] = 0
                
                # Force cleanup of any partial conversion attempts
                if converted_pdf_path and os.path.exists(converted_pdf_path):
                    try:
                        os.remove(converted_pdf_path)
                        converted_pdf_path = None
                    except:
                        pass
                
                # Force garbage collection after failed conversion
                gc.collect()
        
        # Process using enhanced vision-based approach for PDFs
        processing_method = "text"
        
        if use_vision and file_extension == '.pdf':
            try:
                task["stage"] = "high_quality_image_conversion"
                task["progress"] = 0
                
                print("Converting ALL pages to high-quality images for certification logo detection...")
                
                for i in range(1, 6):
                    time.sleep(0.4)
                    task["progress"] = i * 20
                
                images = convert_pdf_to_images(tmp_path, dpi=400)  # Higher DPI for better text recognition
                print(f"Converted all {len(images)} pages to high-quality images for certification detection")
                task["progress"] = 100
                
                task["stage"] = "comprehensive_vision_analysis"
                task["progress"] = 0
                
                print("Starting comprehensive vision analysis with certification logo detection...")
                
                for i in range(1, 11):
                    time.sleep(0.3)
                    task["progress"] = i * 10
                    
                extracted = extract_resume_details_with_azure_vision(images)
                parsed = clean_json_string(extracted)
                
                experience_data = parsed.get('experience_data', [])
                certifications = parsed.get('certifications', [])
                print(f"Vision processing complete: {len(experience_data)} experience entries, {len(certifications)} certifications extracted")
                
                # Log certification details for verification
                for cert in certifications:
                    print(f"Certification detected: {cert}")
                
                task["progress"] = 100
                processing_method = "enhanced_vision"
                
            except Exception as e:
                print(f"Enhanced vision processing failed: {str(e)}")
                print("Falling back to enhanced text-based processing...")
                use_vision = False
        
        # Enhanced text-based processing with improved table and certification extraction
        if not use_vision:
            task["stage"] = "enhanced_text_extraction_with_tables"
            task["progress"] = 0
            
            print("Starting enhanced text-based extraction with comprehensive table parsing...")
            
            for i in range(1, 6):
                time.sleep(0.3)
                task["progress"] = i * 20
            
            original_file_extension = task["file_extension"]
            original_file_path = task["file_path"]
            
            if original_file_extension == '.pdf':
                text = extract_text_from_pdf(original_file_path)
                print(f"Extracted {len(text)} characters from PDF")
            elif original_file_extension in ['.doc', '.docx']:
                text = extract_text_from_docx(original_file_path)
                print(f"Enhanced DOCX extraction: {len(text)} characters with comprehensive table parsing")
            else:
                raise Exception(f"Unsupported file type: {original_file_extension}")
                
            task["progress"] = 100
            
            task["stage"] = "comprehensive_parsing_analysis"
            task["progress"] = 0
            
            print("Starting comprehensive parsing with enhanced table and certification extraction...")
            
            for i in range(1, 9):
                time.sleep(0.2)
                task["progress"] = i * 12
                
            extracted = extract_resume_details_with_azure(text)
            parsed = clean_json_string(extracted)
            task["progress"] = 100
            
            processing_method = "enhanced_text_comprehensive"
            
            # Enhanced logging for verification
            experience_data = parsed.get('experience_data', [])
            certifications = parsed.get('certifications', [])
            print(f"Enhanced text processing complete: {len(experience_data)} experience entries, {len(certifications)} certifications")
            
            # Debug: Print experience entries to verify all rows were captured
            for i, exp in enumerate(experience_data):
                print(f"Experience {i+1}: Company={exp.get('company', 'N/A')}, Role={exp.get('role', 'N/A')}")
            
            # Debug: Print all certifications found
            for i, cert in enumerate(certifications):
                print(f"Certification {i+1}: {cert}")

        task["stage"] = "completion"
        task["progress"] = 100
        task["status"] = TaskStatus.COMPLETED
        task["data"] = parsed
        
        print(f"Processing completed successfully using {processing_method} method")
        print(f"Final result: Successfully processed resume with {len(parsed.get('experience_data', []))} experience entries and {len(parsed.get('certifications', []))} certifications using {processing_method} method")
        
        # Save to database
        resume_history = ResumeHistory(
            filename=task["filename"],
            resume_data=parsed,
            file_size=task["file_size"],
            original_file_type=task["file_extension"].lstrip('.'),
            user_id=task["user_id"]
        )
        
        if HAS_PROCESSING_METHOD_COLUMN:
            resume_history.processing_method = processing_method
        
        db.add(resume_history)
        db.commit()
        db.refresh(resume_history)

    except Exception as e:
        traceback.print_exc()
        task["status"] = TaskStatus.FAILED
        task["error"] = str(e)
        
        try:
            resume_history = ResumeHistory(
                filename=task["filename"],
                resume_data={},
                file_size=task["file_size"],
                original_file_type=task["file_extension"].lstrip('.'),
                user_id=task["user_id"],
                status="failed"
            )
            
            if HAS_PROCESSING_METHOD_COLUMN:
                resume_history.processing_method = "enhanced_text_comprehensive" if not use_vision else "enhanced_vision"
            
            db.add(resume_history)
            db.commit()
        except:
            pass
    finally:
        # Enhanced cleanup with better error handling
        try:
            if os.path.exists(task["file_path"]):
                os.remove(task["file_path"])
        except Exception as e:
            print(f"Error cleaning up original file: {e}")
            
        try:
            if converted_pdf_path and os.path.exists(converted_pdf_path) and converted_pdf_path != task["file_path"]:
                os.remove(converted_pdf_path)
        except Exception as e:
            print(f"Error cleaning up converted PDF: {e}")
        
        # Force garbage collection to clean up any COM objects
        gc.collect()