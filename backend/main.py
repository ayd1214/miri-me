from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime
from openai import OpenAI
from dotenv import load_dotenv
import os
import base64
import json

load_dotenv()

cred_path = "serviceAccountKey.json"
if os.path.exists(cred_path):
    cred = credentials.Certificate(cred_path)
else:
    # Use environment variable for Railway deployment
    firebase_env = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY")
    if not firebase_env:
        raise ValueError("Firebase credentials not found. Set FIREBASE_SERVICE_ACCOUNT_KEY env var.")
    cred_json = json.loads(firebase_env)
    cred = credentials.Certificate(cred_json)

firebase_admin.initialize_app(cred)
db = firestore.client()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TaskCreate(BaseModel):
    title: str
    dueDate: str
    submitType: str
    keywords: List[str]
    summary: Optional[str] = None
    priority: str
    status: str = "todo"

class TaskStatusUpdate(BaseModel):
    status: str

@app.get("/")
def root():
    return {"message": "miri-me backend running"}

@app.post("/analyze")
async def analyze(image: UploadFile = File(...)):
    image_bytes = await image.read()
    base64_image = base64.b64encode(image_bytes).decode("utf-8")

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            response_format={ "type": "json_object" },
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": """이 이미지는 학교 과제 공지입니다. 다음 JSON 형식으로만 응답해주세요:
{
  "title": "과제명",
  "dueDate": "YYYY-MM-DDTHH:MM:SS",
  "submitType": "제출 방식",
  "keywords": ["키워드1", "키워드2"],
  "summary": "한 줄 요약",
  "priority": "high 또는 medium 또는 low"
}"""
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=500
        )

        raw_content = response.choices[0].message.content
        
        # 혹시 모를 마크다운 백틱(```json ... ```) 제거 로직
        if raw_content.startswith("```json"):
            raw_content = raw_content.replace("```json", "", 1)
        if raw_content.endswith("```"):
            raw_content = raw_content.rsplit("```", 1)[0]
            
        result = json.loads(raw_content.strip())
        return result
        
    except Exception as e:
        print(f"Error in analyze: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/tasks")
async def get_tasks():
    tasks_ref = db.collection("tasks")
    docs = tasks_ref.stream()
    tasks = []
    for doc in docs:
        task_data = doc.to_dict()
        task_data["id"] = doc.id
        tasks.append(task_data)
    return tasks

@app.post("/tasks")
async def create_task(task: TaskCreate):
    doc_ref = db.collection("tasks").document()
    task_data = task.dict()
    task_data["createdAt"] = datetime.utcnow().isoformat()
    doc_ref.set(task_data)
    return {"id": doc_ref.id, **task_data}

@app.get("/tasks/{task_id}")
async def get_task(task_id: str):
    doc_ref = db.collection("tasks").document(task_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Task not found")
    task_data = doc.to_dict()
    task_data["id"] = doc.id
    return task_data

@app.patch("/tasks/{task_id}/status")
async def update_task_status(task_id: str, status_update: TaskStatusUpdate):
    doc_ref = db.collection("tasks").document(task_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Task not found")
    
    doc_ref.update({"status": status_update.status})
    return {"id": task_id, "status": status_update.status}

@app.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    doc_ref = db.collection("tasks").document(task_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Task not found")
    
    doc_ref.delete()
    return {"message": "Task deleted successfully"}
