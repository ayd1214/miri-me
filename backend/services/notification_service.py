import httpx
import os

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"

async def send_push_notification(push_token: str, title: str, body: str, data: dict = None):
    """
    Expo Push API를 사용하여 모바일 기기로 푸시 알림을 발송합니다.
    """
    if not push_token or not push_token.startswith("ExponentPushToken"):
        print(f"Invalid push token skipped: {push_token}")
        return

    payload = {
        "to": push_token,
        "title": title,
        "body": body,
        "sound": "default",
        "data": data or {}
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(EXPO_PUSH_URL, json=payload)
            response.raise_for_status()
            result = response.json()
            print(f"Push sent successfully to {push_token}: {result}")
            return result
        except Exception as e:
            print(f"Failed to send push notification to {push_token}: {e}")
            return None
