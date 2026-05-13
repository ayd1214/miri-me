# miri-me

캡처 한 장으로 과제 공지를 분석하고, 마감 일정을 To-do와 캘린더로 관리하는 AI 기반 과제 일정 관리 서비스입니다.

## Demo

- Web Demo: https://miri-me.vercel.app/
- Backend: https://miri-me-backend.onrender.com
- 시연 영상: https://youtu.be/pw2aU0QRhnU

## 주요 기능

- **AI 공지 분석**: 과제 공지 이미지 업로드 시 과제명, 마감일, 제출 방식, 중요 키워드, 요약, 우선순위를 자동 추출합니다.
- **수동 과제 등록**: 이미지 없이도 사용자가 과제 정보를 직접 입력해 To-do에 추가할 수 있습니다.
- **과제 수정/삭제**: 등록된 과제의 전체 필드를 수정하거나 삭제할 수 있습니다.
- **To-do 관리**: 홈 화면에서 과제 목록을 확인하고 완료/미완료 상태를 바로 변경할 수 있습니다.
- **캘린더 보기**: 월간/주간 캘린더에서 마감일 기준으로 과제를 확인할 수 있습니다.
- **푸시 알림**: Expo Push Token을 백엔드에 등록하고, 서버 스케줄러가 마감 전 알림을 발송합니다.
- **AI 사용량 제한 대응**: 하루 AI 분석 횟수 초과 시 사용자에게 안내 메시지를 표시합니다.

## 기술 스택

### Frontend

- Expo
- React Native
- Expo Router
- TypeScript
- Firebase Authentication
- expo-image-picker
- expo-notifications

### Backend

- FastAPI
- Firebase Admin SDK
- Firestore
- OpenAI API
- APScheduler
- Expo Push API

### Deployment

- Frontend: Vercel
- Backend: Render

## 프로젝트 구조

```txt
miri-me
├── backend
│   ├── core
│   ├── routers
│   ├── schemas
│   ├── services
│   ├── main.py
│   └── requirements.txt
├── frontend
│   ├── app
│   ├── src
│   ├── app.json
│   ├── eas.json
│   └── package.json
└── README.md
```

## 실행 방법

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

백엔드 실행에는 Firebase Admin 서비스 계정과 OpenAI API 키가 필요합니다.

### 2. Frontend

```bash
cd frontend
npm install
npx expo start
```

웹으로 실행하려면 다음 명령을 사용할 수 있습니다.

```bash
npx expo start --web
```

## 환경 변수

### Frontend

`frontend/.env`에 Firebase Web App 설정값을 넣습니다.

```env
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
```

### Backend

백엔드에는 OpenAI API 키와 Firebase Admin SDK 인증 정보가 필요합니다. 서비스 계정 파일은 저장소에 공개하지 않고 배포 환경의 secret으로 관리해야 합니다.

## 주요 API

| Method | Endpoint | 설명 |
| --- | --- | --- |
| `GET` | `/tasks` | 현재 사용자의 과제 목록 조회 |
| `POST` | `/tasks` | 과제 생성 |
| `GET` | `/tasks/{task_id}` | 과제 상세 조회 |
| `PATCH` | `/tasks/{task_id}` | 과제 전체 정보 수정 |
| `PATCH` | `/tasks/{task_id}/status` | 과제 완료 상태 변경 |
| `DELETE` | `/tasks/{task_id}` | 과제 삭제 |
| `POST` | `/analyze` | 공지 이미지 AI 분석 |
| `POST` | `/push-token` | Expo push token 등록 |
| `POST` | `/test-push` | 테스트 푸시 알림 발송 |

## 데이터 예시

```json
{
  "title": "운영체제 과제 1",
  "dueDate": "2026-05-10T23:59:00",
  "submitType": "LMS 제출",
  "keywords": ["필수 제출", "PDF", "지각 감점"],
  "summary": "운영체제 과제 1을 PDF 형식으로 LMS에 제출해야 합니다.",
  "priority": "high",
  "status": "todo"
}
```

## 검증된 시나리오

- 이메일/비밀번호 로그인
- 공지 이미지 업로드 후 AI 분석
- 분석 결과 수정 후 To-do 저장
- 직접 입력으로 과제 등록
- 과제 상세 조회 및 수정
- 완료/미완료 상태 변경
- 과제 삭제
- 캘린더 월간/주간 보기
- 테스트 푸시 알림 수신
- 마감 전 스케줄러 푸시 알림 수신

## 참고 사항

- 실제 모바일 푸시 알림은 Expo Go와 development build 환경에 따라 동작 제한이 있을 수 있습니다.
- iOS development build를 만들려면 Apple Developer 계정이 필요합니다.
- 웹 데모에서는 주요 CRUD와 AI 분석 기능을 확인할 수 있으며, 푸시 알림은 모바일 시연 영상에서 확인하는 것을 권장합니다.
