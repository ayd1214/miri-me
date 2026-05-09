from fastapi import APIRouter, Depends, HTTPException
from core.auth import get_current_user
from core.database import db
from schemas.task import TaskCreate, TaskStatusUpdate
from datetime import datetime

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
    doc_ref = db.collection("users").document(user_id).collection("tasks").document()
    task_data = task.dict()
    task_data["createdAt"] = datetime.utcnow().isoformat()
    doc_ref.set(task_data)
    return {"id": doc_ref.id, **task_data}

@router.get("/tasks/{task_id}")
async def get_task(task_id: str, user_id: str = Depends(get_current_user)):
    doc_ref = db.collection("users").document(user_id).collection("tasks").document(task_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Task not found")
    task_data = doc.to_dict()
    task_data["id"] = doc.id
    return task_data

@router.patch("/tasks/{task_id}")
async def update_task(task_id: str, task_update: TaskStatusUpdate, user_id: str = Depends(get_current_user)):
    doc_ref = db.collection("users").document(user_id).collection("tasks").document(task_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_data = {k: v for k, v in task_update.dict(exclude_unset=True).items() if v is not None}
    
    # 만약 마감일(dueDate)이 수정되었다면, 알림 기록을 초기화하여 다시 알림이 갈 수 있게 합니다.
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
