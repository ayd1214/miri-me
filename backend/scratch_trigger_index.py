import asyncio
import sys
import os

# 현재 경로를 sys.path에 추가하여 모듈 임포트 가능하게 함
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.scheduler_service import check_due_tasks
import core.database

async def main():
    print("🚀 Firestore 인덱스 생성을 위한 쿼리 트리거 중...")
    try:
        await check_due_tasks()
        print("✅ 쿼리가 성공했습니다. (이미 인덱스가 생성되어 있을 수 있습니다.)")
    except Exception as e:
        print("\n🚨 --- FIREBASE INDEX ERROR DETECTED --- 🚨")
        print(str(e))
        print("------------------------------------------")

if __name__ == "__main__":
    asyncio.run(main())
