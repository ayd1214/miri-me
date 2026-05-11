import asyncio
import sys
import os
from google.cloud import firestore

# 현재 경로 추가
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.database import db

async def trigger():
    print("🔥 인덱스 에러 강제 유도 중...")
    try:
        # Collection Group 쿼리에 order_by를 섞으면 무조건 인덱스가 필요합니다.
        tasks = db.collection_group("tasks").where("status", "==", "todo").order_by("dueDate").stream()
        for doc in tasks:
            print(f"Task found: {doc.id}")
            break
        print("✅ 어라? 인덱스 없이 성공했습니다. 이미 설정되어 있을 수 있습니다.")
    except Exception as e:
        print("\n🚨 [인덱스 에러 발생!] 아래 링크를 클릭해서 색인을 생성하세요: 🚨")
        print("--------------------------------------------------")
        print(str(e))
        print("--------------------------------------------------")

if __name__ == "__main__":
    asyncio.run(trigger())
