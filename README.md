# TimeLoop PDF Table → Excel Converter

An enterprise-quality tool to extract structured tables from PDFs and export them to Excel with a futuristic dashboard theme.

## Architecture

- **Frontend**: Next.js (TS) + TailwindCSS + TanStack Table
- **Backend (API Gateway)**: Node.js (Fastify)
- **Extraction Service**: Python (FastAPI) + Camelot + pdfplumber

## Getting Started

### 1. Extraction Service (Python)
```bash
cd extraction-service
pip install -r requirements.txt
python main.py
```
*Note: Requires Ghostscript to be installed on your system for Camelot's lattice mode.*
*Environment Variables:*
- `PORT`: Server port (default: 8000)

### 2. Backend (Node.js Gateway)
```bash
cd server
npm install
node index.js
```
*Environment Variables:*
- `PORT`: Server port (default: 3001)
- `PYTHON_SERVICE_URL`: URL of the Extraction Service (default: `http://localhost:8000/extract-tables`)

### 3. Frontend (Next.js)
```bash
cd client
npm install
npm run dev
```
*Environment Variables:*
- `NEXT_PUBLIC_API_URL`: URL of the Node.js Gateway (default: `http://localhost:3001`)

## Features

- **Multi-PDF Upload**: Drag and drop multiple files simultaneously.
- **Table Detection**: Advanced lattice and stream extraction algorithms.
- **Data Preview**: Spreadsheet-style interface to edit, add, or delete rows.
- **Excel Export**: High-fidelity .xlsx export with custom sheet naming.
- **TimeLoop Theme**: Premium futuristic enterprise dashboard UI.
