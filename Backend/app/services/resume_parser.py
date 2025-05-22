import PyPDF2
import httpx
from app.config import AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_KEY
import json
import re
import tempfile
import os
import base64  # For encoding images
import fitz  # PyMuPDF
from PIL import Image
import io

def extract_text_from_pdf(file_path: str) -> str:
    """Legacy function to extract text from PDF - kept for backward compatibility"""
    with open(file_path, "rb") as file:
        reader = PyPDF2.PdfReader(file)
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        return text

def convert_pdf_to_images(file_path: str, dpi: int = 300) -> list:
    """Convert PDF to a list of PIL Images using PyMuPDF (fitz)"""
    try:
        # Open the PDF
        pdf_document = fitz.open(file_path)
        images = []
        
        # Get number of pages
        page_count = len(pdf_document)
        print(f"PDF has {page_count} pages")
        
        # Convert each page to an image
        for page_num in range(page_count):
            page = pdf_document.load_page(page_num)
            
            # Set the rendering matrix for higher quality
            zoom = dpi / 72  # 72 is the default DPI for PDF
            matrix = fitz.Matrix(zoom, zoom)
            
            # Render page to a pixmap (image)
            pixmap = page.get_pixmap(matrix=matrix, alpha=False)
            
            # Convert pixmap to PIL Image
            img = Image.frombytes("RGB", [pixmap.width, pixmap.height], pixmap.samples)
            images.append(img)
            
            print(f"Converted page {page_num + 1} to image: {img.width}x{img.height}")
        
        # Close the document
        pdf_document.close()
        
        return images
    except Exception as e:
        print(f"Error converting PDF to images with PyMuPDF: {str(e)}")
        raise

def image_to_base64(image) -> str:
    """Convert PIL Image to base64 string"""
    buffer = io.BytesIO()
    image.save(buffer, format='PNG')
    img_str = base64.b64encode(buffer.getvalue()).decode('utf-8')
    return img_str

def extract_resume_details_with_azure(text: str) -> dict:
    """Legacy function that uses text-based extraction - kept for backward compatibility"""
    url = AZURE_OPENAI_ENDPOINT
    headers = {
        "Content-Type": "application/json",
        "api-key": AZURE_OPENAI_KEY
    }

    system_prompt = (
        "You are an expert resume parser. Extract the following fields from the resume:\n"
        "- name\n"
        "- email\n"
        "- mobile\n"
        "- skills (group related skills together, and return as a list of objects with category as the key and related skills as the value. For example: [{ 'Programming Languages': ['Java', 'C++'] }, { 'Cloud': ['AWS', 'Docker'] }])\n"
        "- education (as a list of degrees/institutions)\n"
        "- professional_experience (Try to get the entire resume summary. Note that it should be in format 'professional_experience':['point1','point2',..])\n"
        "- certifications (as a list)\n"
        "- experience_data (as a list of objects with each object containing the following keys: 'company', 'startDate', 'endDate', 'role', 'clientEngagement', 'program', and 'responsibilities' which is a list of bullet points describing duties)\n"
        "Return the data as valid JSON. If there is no data available for a section, try to infer it from the resume. If not possible, return 'Not available' for that section."
    )

    user_prompt = f"Resume Text:\n{text}"

    payload = {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.2,
        "max_tokens": 6000
    }

    try:
        response = httpx.post(url, headers=headers, json=payload, timeout=50.0)
        response.raise_for_status()
        try:
            data = response.json()
            return data["choices"][0]["message"]["content"]
        except Exception as json_error:
            print("Raw response text:", response.text)  # This will show what Azure actually returned
            raise RuntimeError(f"Failed to parse JSON: {json_error}")
    except httpx.HTTPStatusError as e:
        print("Azure returned an HTTP error:", e.response.text)
        raise RuntimeError(f"Request failed with status {e.response.status_code}: {e.response.text}")

def extract_resume_details_with_azure_vision(images: list) -> dict:
    """Extract resume details using Azure OpenAI with vision capabilities"""
    url = AZURE_OPENAI_ENDPOINT
    headers = {
        "Content-Type": "application/json",
        "api-key": AZURE_OPENAI_KEY
    }

    system_prompt = (
        "You are an expert resume parser. Extract the following fields from the resume:\n"
        "- name\n"
        "- email\n"
        "- mobile\n"
        "- skills (group related skills together, and return as a list of objects with category as the key and related skills as the value. For example: [{ 'Programming Languages': ['Java', 'C++'] }, { 'Cloud': ['AWS', 'Docker'] }])\n"
        "- education (as a list of degrees/institutions)\n"
        "- professional_experience (Try to get the entire resume summary. Note that it should be in format 'professional_experience':['point1','point2',..])\n"
        "- certifications (as a list)\n"
        "- experience_data (as a list of objects with each object containing the following keys: 'company', 'startDate', 'endDate', 'role', 'clientEngagement', 'program', and 'responsibilities' which is a list of bullet points describing duties)\n"
        "Return the data as valid JSON. If there is no data available for a section, try to infer it from the resume. If not possible, return 'Not available' for that section."
    )

    # Process up to first 4 pages (to stay within token limits)
    content = [{"type": "text", "text": "Parse this resume:"}]
    
    # Add up to 4 pages as images (to avoid token limits)
    for i, image in enumerate(images[:4]):
        base64_image = image_to_base64(image)
        content.append({
            "type": "image_url", 
            "image_url": {"url": f"data:image/png;base64,{base64_image}"}
        })
        
    payload = {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": content}
        ],
        "temperature": 0.2,
        "max_tokens": 6000
    }

    try:
        response = httpx.post(url, headers=headers, json=payload, timeout=90.0)  # Increased timeout for image processing
        response.raise_for_status()
        try:
            data = response.json()
            return data["choices"][0]["message"]["content"]
        except Exception as json_error:
            print("Raw response text:", response.text)
            raise RuntimeError(f"Failed to parse JSON: {json_error}")
    except httpx.HTTPStatusError as e:
        print("Azure returned an HTTP error:", e.response.text)
        raise RuntimeError(f"Request failed with status {e.response.status_code}: {e.response.text}")
    
def clean_json_string(raw: str):
    # Remove triple backticks and language hint (```json)
    cleaned = re.sub(r"^```json\s*|\s*```$", "", raw.strip(), flags=re.MULTILINE)
    return json.loads(cleaned)
