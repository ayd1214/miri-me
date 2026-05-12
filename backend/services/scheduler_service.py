from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import datetime
import pytz
import asyncio
from core.database import db
from services.notification_service import send_push_notification

scheduler = AsyncIOScheduler()

async def check_due_tasks():
    """
    전체 유저의 과제를 효율적으로 훑으며 설정된 시간에 맞춰 알림을 보냅니다. (Collection Group 사용)
    """
    print(f"[{datetime.now()}] Checking deadlines for all users...")
    
    # 한국 시간(KST)으로 현재 시간 설정
    kst = pytz.timezone('Asia/Seoul')
    now = datetime.now(kst)
    
    # 1. 모든 유저의 'todo' 상태 과제를 한 번의 쿼리로 가져옵니다.
    # (주의: Firestore 콘솔에서 collectionGroup 'tasks'에 대한 인덱스 생성이 필요할 수 있습니다.)
    tasks = db.collection_group("tasks").where("status", "==", "todo").stream()
    
    # 동일 유저에 대한 토큰 조회를 최적화하기 위한 캐시
    user_tokens = {}

    for task_doc in tasks:
        task = task_doc.to_dict()
        task_id = task_doc.id
        
        # 부모 문서 경로에서 user_id 추출 (users/{user_id}/tasks/{task_id})
        path_segments = task_doc.reference.path.split('/')
        if len(path_segments) < 2:
            continue
        user_id = path_segments[1]
        
        due_date_str = task.get('dueDate')
        if not due_date_str:
            continue
            
        try:
            # 시간 차이 계산 (분 단위)
            due_date_naive = datetime.fromisoformat(due_date_str.replace('Z', ''))
            due_date = kst.localize(due_date_naive)
            time_diff_min = int((due_date - now).total_seconds() / 60)
            
            # 유저가 설정한 알림 오프셋 (기본값: 1시간 전, 1일 전)
            settings = task.get("notificationSettings", [60, 1440])
            notified = task.get("notifiedOffsets", [])
            
            for offset in settings:
                # 조건: 남은 시간이 설정된 오프셋 이내이고, 아직 해당 시점 알림을 보낸 적이 없을 때
                if 0 <= time_diff_min <= offset and offset not in notified:
                    # 유저 토큰 조회
                    if user_id not in user_tokens:
                        user_doc = db.collection("users").document(user_id).get()
                        user_tokens[user_id] = user_doc.to_dict().get("pushToken") if user_doc.exists else None
                    
                    push_token = user_tokens[user_id]
                    if push_token:
                        # 사람이 읽기 쉬운 시간 표현으로 변환 (1주일, 1일, 1시간 등)
                        if offset >= 10080 and offset % 10080 == 0:
                            time_str = f"{offset//10080}주일 전"
                        elif offset >= 1440 and offset % 1440 == 0:
                            time_str = f"{offset//1440}일 전"
                        elif offset >= 60 and offset % 60 == 0:
                            time_str = f"{offset//60}시간 전"
                        else:
                            time_str = f"{offset}분 전"
                        
                        await send_push_notification(
                            push_token,
                            f"⏰ {time_str} 마감 임박!",
                            f"'{task['title']}' 마감이 {time_str} 남았습니다. 잊지 말고 준비하세요!",
                            {"taskId": task_id, "offset": offset}
                        )
                        
                        # 보낸 알림 기록 추가 및 DB 업데이트
                        notified.append(offset)
                        task_doc.reference.update({"notifiedOffsets": notified})
                        print(f"[{time_str}] Notification sent to {user_id} for task: {task['title']}")
                        
        except Exception as e:
            print(f"Error processing task {task_id}: {e}")

def start_scheduler():
    # 1분마다 체크 수행
    scheduler.add_job(check_due_tasks, 'interval', minutes=1)
    if not scheduler.running:
        scheduler.start()
        print("Optimized Background Scheduler started.")
