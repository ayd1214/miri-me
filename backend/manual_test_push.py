import asyncio
import sys
import os

# 현재 경로 추가
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.notification_service import send_push_notification

async def force_test():
    token = "ExponentPushToken[ndZ33eG7-E_B_3ZXMxbC9l]"
    title = "🔔 miri-me 알림 연동 성공!"
    body = "test"
    
    print(f"🚀 {token}으로 알림 발송 시도 중...")
    success = await send_push_notification(token, title, body, {"type": "test"})
    
    if success:
        print("✅ 알림 발송 성공! 폰을 확인해 보세요.")
    else:
        print("❌ 알림 발송 실패. (네트워크나 토큰 유효성 확인 필요)")

if __name__ == "__main__":
    asyncio.run(force_test())
