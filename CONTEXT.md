# miri-me — 프로젝트 컨텍스트

## 한 줄 요약
캡처 한 장으로 끝내는 AI 기반 과제 일정 관리 앱

## 해결하는 문제
- 학교 공지가 LMS, 카카오톡, PPT, 에브리타임 등으로 파편화됨
- 기존 앱(Notion, Todo list)은 직접 입력 필요
- 마감기한 놓치는 경우 발생

## 핵심 기능
1. **이미지 공지 자동 분석** — 캡처 업로드 시 GPT Vision으로 과제명·마감기한·제출 형태 자동 추출
2. **중요 키워드 강조** — "선착순", "오늘까지", "필수 제출" 등 AI 감지 후 알림
3. **AI 우선순위 산정** — 마감기한·배점·키워드 종합해 우선순위 제안, 사용자 드래그로 수정 가능
4. **캘린더 / ToDo 듀얼 뷰** — 월간·주간 캘린더 + 체크리스트 두 가지 뷰 전환
5. **스마트 알림** — 마감 1주 전 / 하루 전 / 당일 3단계 알림, 개별 커스텀 가능

## 기술 스택
- **Frontend**: (친구 담당)
- **Backend**: FastAPI (Python), Firestore (Firebase), OpenAI GPT-4o-mini
- **배포**: Railway (백엔드)

## API 엔드포인트
- `GET /tasks` — 전체 과제 목록
- `POST /tasks` — 과제 생성
- `GET /tasks/{id}` — 특정 과제 조회
- `PATCH /tasks/{id}/status` — 상태 변경 (todo/done)
- `DELETE /tasks/{id}` — 과제 삭제
- `POST /analyze` — 이미지 → AI 분석 결과 반환

## Task 데이터 구조
```json
{
  "title": "과제명",
  "dueDate": "YYYY-MM-DDTHH:MM:SS",
  "submitType": "제출 방식",
  "keywords": ["키워드1", "키워드2"],
  "summary": "한 줄 요약",
  "priority": "high | medium | low",
  "status": "todo | done"
}
