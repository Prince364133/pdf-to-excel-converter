from fastapi import FastAPI, UploadFile, File, HTTPException
import camelot
import pdfplumber
import pandas as pd
import os
import json
import shutil
import tempfile
import warnings

# Suppress warnings from Camelot/pdfminer about image-based pages
warnings.filterwarnings("ignore", category=UserWarning, module="camelot")

app = FastAPI(title="TimeLoop PDF Extraction Service")

@app.get("/")
async def root():
    return {"message": "TimeLoop PDF Extraction Service is running"}

@app.post("/extract-tables")
async def extract_tables(file: UploadFile = File(...)):
    # Create a temporary file to store the uploaded PDF
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        data = []
        is_image_based = False
        
        # Check if PDF has text content using pdfplumber
        with pdfplumber.open(tmp_path) as pdf:
            text_chunks = []
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    text_chunks.append(str(text))
            
            text_content = "".join(text_chunks)
            if not text_content or not text_content.strip():
                is_image_based = True

        # Strategy 1: Camelot (Preferred for lattice-style tables)
        if not is_image_based:
            try:
                tables = camelot.read_pdf(tmp_path, pages='all', flavor='lattice')
                if len(tables) == 0:
                    tables = camelot.read_pdf(tmp_path, pages='all', flavor='stream')
                
                for table in tables:
                    df = table.df
                    records = json.loads(df.to_json(orient='records'))
                    data.extend(records)
            except Exception as e:
                print(f"Camelot failed: {e}")
        
        # Strategy 2: pdfplumber fallback (always try if camelot found nothing or failed)
        if not data:
            with pdfplumber.open(tmp_path) as pdf:
                for page in pdf.pages:
                    pdf_tables = page.extract_tables()
                    for table in pdf_tables:
                        if table:
                            # Filter out empty rows/headers
                            df = pd.DataFrame(table[1:], columns=table[0])
                            if not df.empty:
                                records = json.loads(df.to_json(orient='records'))
                                data.extend(records)

        if not data and is_image_based:
            return {
                "filename": file.filename, 
                "data": [], 
                "warning": "This PDF appears to be image-based. Text extraction requires OCR which is not yet enabled.",
                "type": "image-based"
            }

        if not data:
            raise HTTPException(status_code=422, detail="No tables detected in the uploaded PDF")
        
        return {"filename": file.filename, "data": data, "is_image_based": is_image_based}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
