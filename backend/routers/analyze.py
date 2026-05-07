from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from core.auth import get_current_user
from services.ai_service import analyze_image_with_ai

router = APIRouter()

@router.post("/analyze")
async def analyze(image: UploadFile = File(...), user_id: str = Depends(get_current_user)):
    try:
        result = await analyze_image_with_ai(image)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
