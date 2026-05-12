import asyncio
import sys
import os

# 현재 경로 추가
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.notification_service import send_push_notification

async def identify_users():
    users = [
        {"uid": "KptiDIVmuUYlgfIggqUwpfBGfNq2", "token": "ExponentPushToken[c3DW1-IgNB6kIXYVLK1jE5]", "name": "유저 A (KptiD)"},
        {"uid": "OwW59GMpl2Ub0WGsVmgcNBf7E8g1", "token": "ExponentPushToken[ndZ33eG7-E_B_3ZXMxbC9l]", "name": "유저 B (OwW59)"}
    ]
    
    for u in users:
        print(f"🚀 {u['name']}에게 알림 발송 중...")
        await send_push_notification(
            u["token"],
            f"🔔 [식별 알림] 당신은 {u['name']}입니다.",
            f"이 메시지가 보인다면 당신의 UID는 {u['uid']}입니다.",
            {"uid": u["uid"]}
        )
    print("\n✅ 발송 완료! 각자 폰에 어떤 메시지가 왔는지 확인해 보세요.")

if __name__ == "__main__":
    asyncio.run(identify_users())
