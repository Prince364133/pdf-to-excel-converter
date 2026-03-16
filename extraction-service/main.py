from fastapi import FastAPI, UploadFile, File, HTTPException
import os
import json
import shutil
import tempfile
import pandas as pd
import warnings
from typing import List, Dict, Any
import fitz  # PyMuPDF
import easyocr
import numpy as np

app = FastAPI(title="TimeLoop OCR PDF Extraction Service")

# Initialize OCR Engine (EasyOCR)
# Downloads models on first call if not present
reader = easyocr.Reader(['en'])

@app.get("/")
async def root():
    return {"message": "TimeLoop Custom OCR Service is running"}

def process_page_ocr(page: fitz.Page) -> List[Dict[str, Any]]:
    """Renders page to image and uses EasyOCR to detect table-like structures."""
    # Render page to Pixmap (300 DPI for good OCR quality)
    pix = page.get_pixmap(matrix=fitz.Matrix(300/72, 300/72))
    img_data = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.h, pix.w, pix.n)
    
    # Run EasyOCR
    # results format: [([[x1, y1], [x2, y1], [x2, y2], [x1, y2]], 'text', confidence), ...]
    results = reader.readtext(img_data)
    
    if not results:
        return []

    # Sort results by y-coordinate (rows) and then x-coordinate (columns)
    # We use a small threshold for y to group items in the same row
    Y_THRESHOLD = 20  # Pixels
    
    # First sort by Y
    results.sort(key=lambda x: x[0][0][1])
    
    rows = []
    if results:
        current_row = [results[0]]
        for i in range(1, len(results)):
            prev_y = current_row[-1][0][0][1]
            curr_y = results[i][0][0][1]
            
            if abs(curr_y - prev_y) < Y_THRESHOLD:
                current_row.append(results[i])
            else:
                # Sort the current row by x-coordinate
                current_row.sort(key=lambda x: x[0][0][0])
                rows.append(current_row)
                current_row = [results[i]]
        # Last row
        current_row.sort(key=lambda x: x[0][0][0])
        rows.append(current_row)

    # Convert rows to a flat list of dictionaries (normalized for the frontend)
    # We'll try to map to 0, 1, 2, 3, 4 indices or just return raw cells
    data = []
    for row in rows:
        row_dict = {}
        for idx, cell in enumerate(row):
            row_dict[str(idx)] = cell[1]
        if row_dict:
            data.append(row_dict)
            
    return data

@app.post("/extract-tables")
async def extract_tables(file: UploadFile = File(...)):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        data = []
        doc = fitz.open(tmp_path)
        
        for page in doc:
            page_data = process_page_ocr(page)
            data.extend(page_data)
        
        doc.close()

        if not data:
            raise HTTPException(status_code=422, detail="No readable text found in PDF via OCR.")

        return {
            "filename": file.filename,
            "data": data,
            "method": "EasyOCR Custom",
            "count": len(data)
        }

    except Exception as e:
        print(f"OCR Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"OCR Extraction failed: {str(e)}")
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
