from fastapi import APIRouter, Depends, HTTPException
from core.auth import get_current_user
from core.database import db
from pydantic import BaseModel

router = APIRouter()

class TokenUpdate(BaseModel):
    pushToken: str

@router.post("/push-token")
async def update_push_token(token_data: TokenUpdate, user_id: str = Depends(get_current_user)):
    try:
        # 유저 문서에 pushToken 필드를 추가/업데이트합니다.
        user_ref = db.collection("users").document(user_id)
        user_ref.set({"pushToken": token_data.pushToken}, merge=True)
        return {"message": "Push token updated successfully"}
    except Exception as e:
        print(f"Error updating push token for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
