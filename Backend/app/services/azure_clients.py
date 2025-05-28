import httpx
from app.config import AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_KEY
from .image_processors import image_to_base64


def extract_resume_details_with_azure(text: str) -> dict:
    """Enhanced text-based extraction with improved table and certification parsing"""
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
        "- certifications (as a list - extract ALL certifications mentioned anywhere including Microsoft, AWS, Google, Oracle, etc.)\n"
        "- experience_data (as a list of objects with each object containing the following keys: 'company', 'startDate', 'endDate', 'role', 'clientEngagement', 'program', and 'responsibilities' which is a list of bullet points describing duties)\n\n"
        
        "CRITICAL INSTRUCTIONS FOR EXPERIENCE TABLE PARSING:\n"
        "- Look for sections marked 'EXPERIENCE TABLE X START' and 'EXPERIENCE TABLE X END'\n"
        "- The text shows 'TOTAL_EXPERIENCE_ROWS: X' - this is the EXACT number of experience entries you MUST extract\n"
        "- Each line starting with 'EXPERIENCE_ROW_X:' represents ONE separate job/role\n"
        "- You MUST create a separate experience_data object for EVERY SINGLE ROW\n"
        "- If TOTAL_EXPERIENCE_ROWS shows 7, you MUST return exactly 7 objects in experience_data array\n"
        "- Parse the pipe-separated data carefully: Role | Company | Duration | Location | Domain | etc.\n"
        "- DO NOT combine multiple rows into one object\n"
        "- DO NOT skip any rows - process EVERY EXPERIENCE_ROW_X entry\n"
        "- Count your output objects to match TOTAL_EXPERIENCE_ROWS\n\n"
        
        "CERTIFICATION EXTRACTION REQUIREMENTS:\n"
        "- Extract ALL Microsoft certifications (MCSA, MCSE, MCP, Microsoft Certified Technology Specialist, etc.)\n"
        "- Look for AWS, Google Cloud, Oracle, Salesforce, and other vendor certifications\n"
        "- Check header sections, footer sections, and dedicated certification areas\n"
        "- Include certification names, vendors, and dates if available\n"
        "- Look for certification logos or badges mentioned in text\n\n"
        
        "Return the data as valid JSON. Ensure experience_data array length matches TOTAL_EXPERIENCE_ROWS count."
    )

    user_prompt = f"Resume Text with Enhanced Table Structure:\n{text}"

    payload = {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.05,  # Very low for consistent parsing
        "max_tokens": 12000   # Increased for comprehensive responses
    }

    try:
        response = httpx.post(url, headers=headers, json=payload, timeout=120.0)
        response.raise_for_status()
        try:
            data = response.json()
            extracted_content = data["choices"][0]["message"]["content"]
            print(f"Enhanced text-based parsing response length: {len(extracted_content)} characters")
            return extracted_content
        except Exception as json_error:
            print("Raw response text:", response.text)
            raise RuntimeError(f"Failed to parse JSON: {json_error}")
    except httpx.HTTPStatusError as e:
        print("Azure returned an HTTP error:", e.response.text)
        raise RuntimeError(f"Request failed with status {e.response.status_code}: {e.response.text}")


def extract_resume_details_with_azure_vision(images: list) -> dict:
    """Extract resume details using Azure OpenAI with enhanced vision capabilities for certification detection"""
    url = AZURE_OPENAI_ENDPOINT
    headers = {
        "Content-Type": "application/json",
        "api-key": AZURE_OPENAI_KEY
    }

    system_prompt = (
        "You are an expert resume parser with advanced vision capabilities. Extract the following fields from the resume:\n"
        "- name\n"
        "- email\n"
        "- mobile\n"
        "- skills (group related skills together, and return as a list of objects with category as the key and related skills as the value. For example: [{ 'Programming Languages': ['Java', 'C++'] }, { 'Cloud': ['AWS', 'Docker'] }])\n"
        "- education (as a list of degrees/institutions)\n"
        "- professional_experience (Try to get the entire resume summary. Note that it should be in format 'professional_experience':['point1','point2',..])\n"
        "- certifications (as a list - extract ALL certifications including those in logos, badges, and images)\n"
        "- experience_data (as a list of objects with each object containing the following keys: 'company', 'startDate', 'endDate', 'role', 'clientEngagement', 'program', and 'responsibilities' which is a list of bullet points describing duties)\n\n"
        
        "CRITICAL VISION-BASED INSTRUCTIONS:\n"
        "1. EXPERIENCE TABLE EXTRACTION:\n"
        "   - Identify ALL experience tables across ALL pages\n"
        "   - Extract EVERY SINGLE ROW from each table - do not miss any\n"
        "   - Count rows visually and ensure you capture all visible entries\n"
        "   - If a table spans multiple pages, continue extraction on subsequent pages\n"
        "   - Create separate experience_data objects for each table row\n"
        "   - Look for tables with columns: Role, Company, Duration, Location, Domain, etc.\n\n"
        
        "2. CERTIFICATION DETECTION (CRITICAL):\n"
        "   - Scan ALL pages for certification logos, badges, and images\n"
        "   - Look for Microsoft certification logos (like Microsoft Certified Technology Specialist)\n"
        "   - Detect AWS, Google Cloud, Oracle, Salesforce certification badges\n"
        "   - Read text within certification images and logos\n"
        "   - Extract certification names from both text and visual elements\n"
        "   - Pay special attention to header areas, sidebars, and dedicated certification sections\n"
        "   - Include certifications shown as images, not just text\n\n"
        
        "3. COMPREHENSIVE PAGE ANALYSIS:\n"
        "   - Process ALL pages thoroughly - this is a 10-page document\n"
        "   - Look at headers, footers, sidebars, and main content areas\n"
        "   - Don't skip any sections that might contain certifications or experience data\n"
        "   - Pay attention to visual elements like logos, badges, and formatted tables\n\n"
        
        "Return the data as valid JSON with complete extraction of all visual and textual elements."
    )

    # Enhanced content processing for better certification detection
    content = [{"type": "text", "text": "Analyze this complete 10-page resume with special focus on:\n1. Extracting ALL experience table rows\n2. Detecting certification logos and badges in images\n3. Reading text from certification images\n4. Comprehensive analysis of all visual and textual content:"}]
    
    # Process ALL pages for comprehensive coverage
    max_pages = min(len(images), 10)  # Process up to 10 pages
    print(f"Processing ALL {max_pages} pages with enhanced vision analysis for certification detection")
    
    for i, image in enumerate(images[:max_pages]):
        base64_image = image_to_base64(image)
        content.append({
            "type": "image_url", 
            "image_url": {
                "url": f"data:image/png;base64,{base64_image}",
                "detail": "high"  # Use high detail for better text recognition in images
            }
        })
        print(f"Added page {i+1} with high-detail processing for certification logo detection")
        
    payload = {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": content}
        ],
        "temperature": 0.01,  # Extremely low for maximum consistency
        "max_tokens": 16000   # Increased significantly for comprehensive responses
    }

    try:
        response = httpx.post(url, headers=headers, json=payload, timeout=240.0)  # Increased timeout
        response.raise_for_status()
        try:
            data = response.json()
            extracted_content = data["choices"][0]["message"]["content"]
            print(f"Enhanced Azure Vision API response length: {len(extracted_content)} characters")
            return extracted_content
        except Exception as json_error:
            print("Raw response text:", response.text)
            raise RuntimeError(f"Failed to parse JSON: {json_error}")
    except httpx.HTTPStatusError as e:
        print("Azure returned an HTTP error:", e.response.text)
        raise RuntimeError(f"Request failed with status {e.response.status_code}: {e.response.text}")