from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
from typing import List, Optional
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime

# Firebase 초기화
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

app = FastAPI()

# 요청 데이터 모델
class TaskCreate(BaseModel):
    title: str
    dueDate: str
    submitType: str
    keywords: List[str]
    summary: str
    priority: str  # "high" | "medium" | "low"
    status: str = "todo"

@app.get("/")
def root():
    return {"message": "miri-me backend running"}

@app.post("/api/analyze")
async def analyze(image: UploadFile = File(...)):
    return {
        "filename": image.filename,
        "content_type": image.content_type,
        "message": "image upload success"
    }

@app.post("/api/tasks")
async def create_task(task: TaskCreate):
    # Firestore에 문서 추가
    doc_ref = db.collection("tasks").document()
    task_data = task.dict()
    task_data["createdAt"] = datetime.utcnow().isoformat()
    doc_ref.set(task_data)

    return {"id": doc_ref.id, **task_data}
