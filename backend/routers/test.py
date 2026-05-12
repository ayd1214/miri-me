from fastapi import APIRouter, Depends, HTTPException
from core.auth import get_current_user
from core.database import db
from services.notification_service import send_push_notification

router = APIRouter()

@router.post("/test-push")
async def test_push_notification(user_id: str = Depends(get_current_user)):
    """
    현재 유저에게 즉시 테스트 푸시 알림을 보냅니다.
    """
    try:
        user_doc = db.collection("users").document(user_id).get()
        if not user_doc.exists:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_data = user_doc.to_dict()
        push_token = user_data.get("pushToken")
        
        if not push_token:
            raise HTTPException(status_code=400, detail="Push token not found. Please register token first.")
        
        success = await send_push_notification(
            push_token,
            "🔔 테스트 알림",
            "축하합니다! miri-me 푸시 알림 연동에 성공했습니다. 🎉",
            {"test": "data"}
        )
        
        if success:
            return {"message": "Test notification sent successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to send notification")
            
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
