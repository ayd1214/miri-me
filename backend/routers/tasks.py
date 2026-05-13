from fastapi import APIRouter, Depends, HTTPException
from core.auth import get_current_user
from core.database import db
from schemas.task import TaskCreate, TaskStatusUpdate, TaskUpdate
from datetime import datetime, timedelta
import pytz

router = APIRouter()

def parse_due_date(due_date_str: str, kst):
    try:
        due_date_naive = datetime.fromisoformat(due_date_str.replace("Z", ""))
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="dueDate must be in YYYY-MM-DDTHH:MM:SS format",
        )

    if due_date_naive.tzinfo is not None:
        return due_date_naive.astimezone(kst)

    return kst.localize(due_date_naive)

@router.get("/tasks")
async def get_tasks(user_id: str = Depends(get_current_user)):
    tasks_ref = db.collection("users").document(user_id).collection("tasks")
    docs = tasks_ref.stream()
    tasks = []
    for doc in docs:
        task_data = doc.to_dict()
        task_data["id"] = doc.id
        tasks.append(task_data)
    return tasks

@router.post("/tasks")
async def create_task(task: TaskCreate, user_id: str = Depends(get_current_user)):
    # 한국 시간(KST)으로 현재 시간 설정
    kst = pytz.timezone('Asia/Seoul')
    now = datetime.now(kst)
    notified_offsets = []
    
    # dueDate 파싱 및 KST 설정
    due_date = parse_due_date(task.dueDate, kst)
    
    if task.notificationSettings:
        for offset in task.notificationSettings:
            target_time = due_date - timedelta(minutes=offset)
            if now >= target_time:
                notified_offsets.append(offset)

    task_data = task.dict()
    task_data["userId"] = user_id
    task_data["createdAt"] = now.isoformat()
    task_data["notifiedOffsets"] = notified_offsets
    
    doc_ref = db.collection("users").document(user_id).collection("tasks").add(task_data)
    return {"id": doc_ref[1].id, **task_data}

@router.get("/tasks/{task_id}")
async def get_task(task_id: str, user_id: str = Depends(get_current_user)):
    doc_ref = db.collection("users").document(user_id).collection("tasks").document(task_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Task not found")
    task_data = doc.to_dict()
    task_data["id"] = doc.id
    return task_data

@router.patch("/tasks/{task_id}/status")
async def update_task_status(task_id: str, status_update: TaskStatusUpdate, user_id: str = Depends(get_current_user)):
    doc_ref = db.collection("users").document(user_id).collection("tasks").document(task_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_data = {k: v for k, v in status_update.dict(exclude_unset=True).items() if v is not None}
    
    # 마감일이나 알림 설정이 바뀌면 알림 기록 초기화 (이미 지난 것은 제외)
    if "dueDate" in update_data or "notificationSettings" in update_data:
        kst = pytz.timezone('Asia/Seoul')
        now = datetime.now(kst)
        new_notified_offsets = []
        current_due_date_str = update_data.get("dueDate", doc.to_dict().get("dueDate"))
        current_settings = update_data.get("notificationSettings", doc.to_dict().get("notificationSettings", []))
        
        try:
            current_due_date = parse_due_date(current_due_date_str, kst)
            for offset in current_settings:
                target_time = current_due_date - timedelta(minutes=offset)
                if now >= target_time:
                    new_notified_offsets.append(offset)
        except:
            pass
            
        update_data["notifiedOffsets"] = new_notified_offsets
        
    doc_ref.update(update_data)
    return {"id": task_id, **update_data}

@router.patch("/tasks/{task_id}")
async def update_full_task(task_id: str, task_update: TaskUpdate, user_id: str = Depends(get_current_user)):
    doc_ref = db.collection("users").document(user_id).collection("tasks").document(task_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_data = {k: v for k, v in task_update.dict(exclude_unset=True).items() if v is not None}
    
    # 마감일이나 알림 설정이 바뀌면 알림 기록 초기화 (이미 지난 것은 제외)
    if "dueDate" in update_data or "notificationSettings" in update_data:
        kst = pytz.timezone('Asia/Seoul')
        now = datetime.now(kst)
        new_notified_offsets = []
        current_due_date_str = update_data.get("dueDate", doc.to_dict().get("dueDate"))
        current_settings = update_data.get("notificationSettings", doc.to_dict().get("notificationSettings", []))
        
        try:
            current_due_date = parse_due_date(current_due_date_str, kst)
            for offset in current_settings:
                target_time = current_due_date - timedelta(minutes=offset)
                if now >= target_time:
                    new_notified_offsets.append(offset)
        except:
            pass
            
        update_data["notifiedOffsets"] = new_notified_offsets
    
    doc_ref.update(update_data)
    return {"id": task_id, **update_data}

@router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, user_id: str = Depends(get_current_user)):
    doc_ref = db.collection("users").document(user_id).collection("tasks").document(task_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Task not found")
    
    doc_ref.delete()
    return {"message": "Task deleted successfully"}
