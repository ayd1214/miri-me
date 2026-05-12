from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from core.auth import get_current_user
from core.database import db
from services.ai_service import analyze_image_with_ai
from datetime import datetime

router = APIRouter()

@router.post("/analyze")
async def analyze(image: UploadFile = File(...), user_id: str = Depends(get_current_user)):
    try:
        # 1. 사용량 제한 체크 (하루 50회)
        user_ref = db.collection("users").document(user_id)
        user_doc = user_ref.get()
        
        now = datetime.now()
        today_str = now.strftime("%Y-%m-%d")
        
        user_data = user_doc.to_dict() if user_doc.exists else {}
        last_date = user_data.get("lastAiDate")
        ai_count = user_data.get("aiCount", 0)
        
        # 날짜가 바뀌었으면 카운트 초기화
        if last_date != today_str:
            ai_count = 0
            last_date = today_str
            
        if ai_count >= 1:
            raise HTTPException(
                status_code=429, 
                detail="오늘 사용 가능한 AI 분석 횟수(1회)를 초과했습니다. 테스트 중입니다."
            )
            
        # 2. AI 분석 실행
        result = await analyze_image_with_ai(image)
        
        # 3. 사용량 업데이트
        user_ref.set({
            "aiCount": ai_count + 1,
            "lastAiDate": today_str
        }, merge=True)
        
        return result
        
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error in analyze endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
