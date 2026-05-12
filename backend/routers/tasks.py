from fastapi import APIRouter, Depends, HTTPException
from core.auth import get_current_user
from core.database import db
from schemas.task import TaskCreate, TaskStatusUpdate, TaskUpdate
from datetime import datetime, timedelta

router = APIRouter()

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
    # 현재 시간 기준으로 이미 지나간 알림 오프셋은 미리 '알림 완료' 처리 (스팸 방지)
    now = datetime.now()
    notified_offsets = []
    due_date = datetime.fromisoformat(task.dueDate.replace("Z", ""))
    
    if task.notificationSettings:
        for offset in task.notificationSettings:
            target_time = due_date - timedelta(minutes=offset)
            if now >= target_time:
                notified_offsets.append(offset)

    task_data = task.dict()
    task_data["userId"] = user_id
    task_data["createdAt"] = datetime.now().isoformat()
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
        now = datetime.now()
        new_notified_offsets = []
        current_due_date_str = update_data.get("dueDate", doc.to_dict().get("dueDate"))
        current_settings = update_data.get("notificationSettings", doc.to_dict().get("notificationSettings", []))
        
        try:
            current_due_date = datetime.fromisoformat(current_due_date_str.replace("Z", ""))
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
    
    # 마감일이 수정되면 알림 기록 초기화
    if "dueDate" in update_data:
        update_data["notifiedOffsets"] = []
    
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
