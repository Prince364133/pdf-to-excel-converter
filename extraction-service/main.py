from fastapi import FastAPI, UploadFile, File, HTTPException
import camelot
import pdfplumber
import pandas as pd
import os
import json
import shutil
import tempfile

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
        
        # Strategy 1: Camelot (Preferred for lattice-style tables)
        # Note: Camelot can be picky about Ghostscript installation.
        # We'll try 'lattice' first, then 'stream'.
        try:
            tables = camelot.read_pdf(tmp_path, pages='all', flavor='lattice')
            if len(tables) == 0:
                tables = camelot.read_pdf(tmp_path, pages='all', flavor='stream')
            
            for table in tables:
                df = table.df
                # Simple cleanup: use first row as header if it looks like one
                # For this specific task, we expect specific columns
                records = json.loads(df.to_json(orient='records'))
                data.extend(records)
        except Exception as e:
            print(f"Camelot failed: {e}")
            # Strategy 2: pdfplumber fallback
            with pdfplumber.open(tmp_path) as pdf:
                for page in pdf.pages:
                    pdf_tables = page.extract_tables()
                    for table in pdf_tables:
                        if table:
                            df = pd.DataFrame(table[1:], columns=table[0])
                            records = json.loads(df.to_json(orient='records'))
                            data.extend(records)

        if not data:
            raise HTTPException(status_code=422, detail="No tables detected in the uploaded PDF")

        # Map the columns to the expected structure if possible
        # Serial No | Reference ID | Plate Number | Description | RFID Status
        # We'll return the raw data and let the backend/frontend handle mapping if they don't match exactly.
        
        return {"filename": file.filename, "data": data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
