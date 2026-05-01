from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
from typing import List
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime
from openai import OpenAI
from dotenv import load_dotenv
import os
import base64
import json

load_dotenv()

cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

app = FastAPI()

class TaskCreate(BaseModel):
    title: str
    dueDate: str
    submitType: str
    keywords: List[str]
    summary: str
    priority: str
    status: str = "todo"

@app.get("/")
def root():
    return {"message": "miri-me backend running"}

@app.post("/api/analyze")
async def analyze(image: UploadFile = File(...)):
    image_bytes = await image.read()
    base64_image = base64.b64encode(image_bytes).decode("utf-8")

    response = client.chat.completions.create(
        model="gpt-4o-mini",
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
                            "url": f"image/jpeg;base64,{base64_image}"
                        }
                    }
                ]
            }
        ],
        max_tokens=500
    )

    result = json.loads(response.choices[0].message.content)
    return result

@app.post("/api/tasks")
async def create_task(task: TaskCreate):
    doc_ref = db.collection("tasks").document()
    task_data = task.dict()
    task_data["createdAt"] = datetime.utcnow().isoformat()
    doc_ref.set(task_data)
    return {"id": doc_ref.id, **task_data}
