# Medical Report Explainer

A full-stack AI-powered application designed to demystify complex medical laboratory reports. Users can upload their medical reports (PDF or images), and the system extracts the text, analyzes the medical parameters using Google's Gemini AI, and provides a plain-language summary of the results. 

The application is fully multilingual, supporting English and several Indian languages, and features text-to-speech voice readout and PDF report generation.

---

## Key Features

- **Document Parsing:** Upload medical reports in PDF, JPG, or PNG formats. High-accuracy OCR (Tesseract) extracts text from scanned images, while PyMuPDF handles digital PDFs.
- **AI Analysis:** Integrates with **Google Gemini AI** to identify medical parameters, map them against normal ranges, assign risk levels, and provide actionable health advice.
- **Multilingual Support:** Translates complex medical results into plain language in English, Hindi, Marathi, Kannada, Tamil, and Telugu.
- **Accessibility:** Built-in **Voice Readout** (Text-to-Speech) reads the analysis aloud in the user's selected language.
- **Report History:** Automatically saves reports to a local SQLite database, allowing users to revisit past reports and track their health over time.
- **PDF Export:** Download beautifully formatted PDF summaries of the AI-generated health analysis.
- **Modern UI:** A stunning, responsive "Light Slate" Glassmorphism design built from scratch with custom CSS variables.

---

## Technology Stack

### Frontend
* **Framework:** React + Vite
* **Routing:** React Router v6
* **Styling:** Custom CSS (Glassmorphism, Modern typography using Outfit & Inter fonts)
* **Deployment:** Vercel

### Backend
* **Framework:** FastAPI (Python)
* **Database:** SQLite with SQLAlchemy ORM
* **OCR / PDF:** pytesseract, PyMuPDF (fitz), Pillow
* **AI & Translation:** `google-generativeai` (Gemini 1.5 Pro/Flash), `deep-translator`
* **PDF Generation:** ReportLab
* **Deployment:** Render (Containerized with Docker)

---

## Getting Started (Local Development)

### Prerequisites
* **Node.js** (v18+)
* **Python** (v3.9+)
* **Tesseract OCR:** Must be installed on your machine.
  * *Windows:* Install from [UB-Mannheim](https://github.com/UB-Mannheim/tesseract/wiki) and ensure the executable is at `C:\Program Files\Tesseract-OCR\tesseract.exe`.
* **Gemini API Key:** Get one from [Google AI Studio](https://aistudio.google.com/).

### Backend Setup
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # Mac/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file in the `backend` folder:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   TESSERACT_PATH="C:\Program Files\Tesseract-OCR\tesseract.exe" # Windows only
   FRONTEND_URL=http://localhost:5173
   ```
5. Start the FastAPI server:
   ```bash
   uvicorn app.main:app --reload
   ```

### Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.development` file in the `frontend` folder:
   ```env
   VITE_API_URL=http://localhost:8000/api
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:5173` in your browser.

---

## Deployment Configuration

This repository is pre-configured for cloud deployment:
* **Backend (Render):** Uses the provided `backend/Dockerfile` and `render.yaml` to automatically install Linux Tesseract dependencies (including Hindi/Kannada language packs) before launching FastAPI.
* **Frontend (Vercel):** Uses `vercel.json` to handle React Router client-side routing rewrites. Points to the live backend using `.env.production`.

---
*..Built to make healthcare data accessible for everyone..* 

