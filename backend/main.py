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
        now = datetime.now()
        current_time = now.strftime("%Y-%m-%d %H:%M:%S")
        
        # AI가 날짜 계산을 틀리지 않도록 오늘부터 7일간의 요일-날짜 매핑표를 제공합니다.
        from datetime import timedelta
        upcoming_dates = ", ".join([f"{(now + timedelta(days=i)).strftime('%A')}({(now + timedelta(days=i)).strftime('%Y-%m-%d')})" for i in range(8)])
        
        prompt_text = f"""이 이미지는 학교 과제 공지입니다. 오늘 날짜와 시간은 {current_time} 입니다. 
만약 요일(예: Monday)만 적혀있다면 다음의 다가오는 요일-날짜 표를 참고하여 정확한 날짜를 적으세요: [{upcoming_dates}].
아래 규칙을 엄격히 지켜서 JSON 형식으로만 응답해주세요.

[규칙]
1. 마감기한(dueDate): 'Due', '마감' 등으로 표기된 날짜를 최우선으로 찾으세요. 'Available until' 등은 마감일이 아닙니다. 만약 'Monday'처럼 요일이나 상대적 날짜가 적혀있다면, 직접 계산하지 말고 반드시 위에 제공된 [요일-날짜 표]에서 해당 요일을 찾아 그 날짜를 YYYY-MM-DDTHH:MM:SS 형식으로 적어주세요.
2. 키워드(keywords): 과제의 내용(예: 디버깅, C언어)보다는 특이사항이나 제한조건(예: "개인 과제", "표절 금지", "선착순", "동영상 제출")을 위주로 추출해주세요. 영문으로 적혀있더라도 한국어로 번역해서 추출하세요.
3. 우선순위(priority): 마감일이 3일 이내면 "high", 7일 이내면 "medium", 그 외는 "low"로 설정하세요.

[출력 JSON 구조]
{{
  "title": "과제명",
  "dueDate": "YYYY-MM-DDTHH:MM:SS",
  "submitType": "제출 방식",
  "keywords": ["키워드1", "키워드2"],
  "summary": "한 줄 요약",
  "priority": "high 또는 medium 또는 low"
}}"""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            response_format={ "type": "json_object" },
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": prompt_text
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
