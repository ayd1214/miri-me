import sys
import os

# 현재 경로 추가
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.database import db

def check_tokens():
    print("\n🔍 Firestore 'users' 컬렉션 조회 중...")
    users = db.collection("users").stream()
    
    found = False
    for user in users:
        data = user.to_dict()
        token = data.get("pushToken", "토큰 없음 ❌")
        print(f"UID: {user.id}")
        print(f"Token: {token}")
        print("-" * 30)
        found = True
        
    if not found:
        print("유저 데이터가 전혀 없습니다. (로그인 및 토큰 등록이 필요합니다.)")

if __name__ == "__main__":
    check_tokens()
