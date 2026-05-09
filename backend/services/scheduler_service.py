from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import datetime, timedelta
import asyncio
from core.database import db
from services.notification_service import send_push_notification

scheduler = AsyncIOScheduler()

async def check_due_tasks():
    """
    1분마다 실행되며 마감이 임박한 과제를 찾아 알림을 보냅니다.
    """
    print(f"[{datetime.now()}] Checking deadlines...")
    
    # 1. 모든 유저 가져오기
    users_ref = db.collection("users")
    users = users_ref.stream()
    
    now = datetime.now()
    # 1시간 이내 마감인 것들을 체크
    alert_threshold = now + timedelta(hours=1)
    
    for user_doc in users:
        user_id = user_doc.id
        user_data = user_doc.to_dict()
        push_token = user_data.get("pushToken")
        
        if not push_token:
            continue
            
        # 2. 해당 유저의 과제 중 'todo' 상태인 것 조회
        tasks_ref = db.collection("users").document(user_id).collection("tasks")
        tasks = tasks_ref.where("status", "==", "todo").stream()
        
        for task_doc in tasks:
            task = task_doc.to_dict()
            task_id = task_doc.id
            
            # 이미 알림을 보낸 과제는 스킵
            if task.get("notified"):
                continue
                
            try:
                # ISO 포맷 파싱 (예: 2026-05-11T23:59:00)
                due_date_str = task.get('dueDate')
                if not due_date_str:
                    continue
                
                due_date_str = due_date_str.replace('Z', '')
                due_date = datetime.fromisoformat(due_date_str)
                
                # 마감까지 1시간 이내라면 알림 발송
                if now <= due_date <= alert_threshold:
                    title = "과제 마감 임박! ⏰"
                    body = f"'{task['title']}' 마감이 1시간 남았습니다. 서두르세요!"
                    
                    # 비동기로 알림 발송
                    await send_push_notification(
                        push_token, 
                        title, 
                        body, 
                        {"taskId": task_id, "type": "DEADLINE_APPROACHING"}
                    )
                    
                    # 중복 알림 방지를 위해 상태 업데이트
                    tasks_ref.document(task_id).update({"notified": True})
                    print(f"Notification sent to {user_id} for task: {task['title']}")
                    
            except Exception as e:
                print(f"Error parsing date for task {task_id}: {e}")

def start_scheduler():
    # 1분마다 체크 수행
    scheduler.add_job(check_due_tasks, 'interval', minutes=1)
    if not scheduler.running:
        scheduler.start()
        print("Background Scheduler started successfully.")
