import fitz  # PyMuPDF
from PIL import Image
import io
import base64


def convert_pdf_to_images(file_path: str, dpi: int = 300) -> list:
    """Convert PDF to a list of PIL Images using PyMuPDF (fitz) with enhanced quality"""
    try:
        # Open the PDF
        pdf_document = fitz.open(file_path)
        images = []
        
        # Get number of pages
        page_count = len(pdf_document)
        print(f"PDF has {page_count} pages - converting all pages to high-quality images for certification detection")
        
        # Convert each page to an image with higher quality for better text recognition
        for page_num in range(page_count):
            page = pdf_document.load_page(page_num)
            
            # Set the rendering matrix for higher quality - increased DPI for better logo/certification recognition
            zoom = max(dpi / 72, 4.0)  # Minimum 4x zoom for better image quality
            matrix = fitz.Matrix(zoom, zoom)
            
            # Render page to a pixmap (image) with enhanced settings
            pixmap = page.get_pixmap(matrix=matrix, alpha=False)
            
            # Convert pixmap to PIL Image
            img = Image.frombytes("RGB", [pixmap.width, pixmap.height], pixmap.samples)
            
            # Enhance image quality for better OCR
            img = img.convert('RGB')
            images.append(img)
            
            print(f"Converted page {page_num + 1}/{page_count} to high-quality image: {img.width}x{img.height}")
        
        # Close the document
        pdf_document.close()
        
        print(f"Successfully converted all {page_count} pages to enhanced images for certification detection")
        return images
    except Exception as e:
        print(f"Error converting PDF to images with PyMuPDF: {str(e)}")
        raise


def image_to_base64(image) -> str:
    """Convert PIL Image to base64 string with optimized quality"""
    buffer = io.BytesIO()
    # Save with high quality for better text recognition
    image.save(buffer, format='PNG', optimize=True)
    img_str = base64.b64encode(buffer.getvalue()).decode('utf-8')
    return img_str