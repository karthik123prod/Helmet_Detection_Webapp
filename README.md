# 🏍️ SHIELD AI: Helmet & Triple Ride Detection System

A modern, full-stack web application designed to automatically detect vehicle safety violations—specifically missing helmets and triple riding—from both images and video footage.

## 🌟 Key Features

* **3-Stage AI Inference Pipeline**:
  1. **Bike/Person Detection:** YOLOv3 standard model filtering for persons and motorbikes.
  2. **Helmet Detection:** Custom-trained YOLOv3 model detecting safety helmets.
  3. **License Plate Capture:** CNN-based 20-class demo categorizer triggering upon rule violation.
* **Violation Engine:** Automatically flags "No Helmet" and "Triple Riding" violations.
* **Automated Email Alerts:** Sends an email notification containing annotated violation snapshots in the background.
* **Interactive Dashboard:** Beautiful React + Vite UI with drag-and-drop processing and historical logs.
* **Cloud-Ready Deployment:** Configured for Vercel (Frontend) and Render (Backend).

## 🏗️ Technology Stack

* **Frontend:** React 18, Vite, Vanilla CSS.
* **Backend:** FastAPI (Python), Uvicorn, SQLAlchemy (SQLite), Pydantic.
* **Machine Learning:** OpenCV DNN for swift CPU-based YOLO inference & TensorFlow-CPU for CNN classification.
* **Alerts:** Yagmail.

## 🚀 Local Development Setup

### 1. Backend Setup

Open a terminal in the project root:

```bash
# 1. Create a virtual environment
python -m venv venv
venv\Scripts\activate

# 2. Install dependencies (using tensorflow-cpu for faster builds)
pip install -r requirements.txt

# 3. Add your Environment variables (Create `.env` based on `.env.example`)
# Make sure to configure your Database Path, Model Paths, and Email Setup!

# 4. Start the FastAPI server
uvicorn backend.main:app --reload --port 8000
```
*The backend API will be running at `http://localhost:8000` with Swagger Docs at `http://localhost:8000/docs`.*

### 2. Frontend Setup

Open a new terminal in the `frontend/` directory:

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Create your frontend Config
# Create frontend/.env and add: VITE_API_URL=http://localhost:8000

# 3. Start the development server
npm run dev
```

*The web interface will be running at `http://localhost:5173`.*

> **Quick Start (Windows):** Simply double-click the `run.bat` file in the root directory to instantly boot up both backend and frontend servers simultaneously!

## ☁️ Deployment Instructions

### Deploying the Backend (Render.com)
1. Set up a new Web Service pointing to your GitHub repository.
2. Build Command: `pip install -r requirements.txt`
3. Start Command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
4. Copy all configuration from your local `.env` into Render's Environment Variables settings.
5. *Note: The background email alerts and fast tensorflow-cpu builds are pre-configured to keep Render processes optimized!*

### Deploying the Frontend (Vercel)
1. Import the repository into Vercel. 
2. Change the Root Directory to `frontend`.
3. Under Environment Variables, add `VITE_API_URL` pointing to your new Render backend URL (e.g., `https://my-backend.onrender.com`).
4. Keep in mind that `CORS_ORIGINS` inside your *Backend's* environment variables must be updated to include your final Vercel domain!

## 🧠 Pipeline Architecture

1. **Input Frame** arrives via FastAPI.
2. Resized and processed into **YOLOv3 COCO**, tracking people and motorbikes.
3. If motorbikes > 0 and persons >= 3, flag **Triple Riding**.
4. If motorbikes > 0, run bounding boxes through **YOLOv3 Helmet Model**.
5. Compare helmet count vs. person count. If fewer helmets than riders, flag **Helmet Violation**.
6. If violations exist, trigger **CNN Number Plate Classifier**.
7. Annotate frame and save record into SQLite Database.
8. FastAPI Background Tasks seamlessly shoot off email notifications.

---
*Created for traffic monitoring computer vision systems.*
