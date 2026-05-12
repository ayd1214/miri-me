import os
import base64
import json
from datetime import datetime, timedelta
from openai import OpenAI
from fastapi import UploadFile

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

async def analyze_image_with_ai(image: UploadFile) -> dict:
    image_bytes = await image.read()
    base64_image = base64.b64encode(image_bytes).decode("utf-8")

    try:
        now = datetime.now()
        current_time = now.strftime("%Y-%m-%d %H:%M:%S")
        
        upcoming_dates = ", ".join([f"{(now + timedelta(days=i)).strftime('%A')}({(now + timedelta(days=i)).strftime('%Y-%m-%d')})" for i in range(8)])
        
        prompt_text = f"""이 이미지는 과제 및 업무 공지이며, 당신은 이를 분석하여 구조화된 데이터를 생성하는 AI입니다. 
오늘 날짜/시간: {current_time} 
참고용 요일-날짜 표: [{upcoming_dates}]

[추출 및 분석 지침]
1. 분석적 사고 (Step-by-Step): 
   - 텍스트 전체를 훑으며 '제출 장소', '분량 제한', '첨부 필수 서류', '보너스 혜택' 등 구체적인 제약 사항을 모두 식별하세요.
   - 단순 단어가 아닌, 유저가 행동에 옮길 수 있는 '구체적인 구절' 단위로 추출합니다.

2. 마감기한 (dueDate): 
   - '마감', '제출기한', '언제까지' 등의 키워드를 찾으세요. 
   - 요일만 표기된 경우 반드시 [요일-날짜 표]를 사용하여 ISO 8601 형식으로 변환하세요.

3. 제출 방식 (submitType): 
   - 단순히 '온라인/오프라인'이 아니라, "학과 사무실(301호) 제출함 직접 제출"처럼 장소와 방법이 포함된 상세 정보를 적으세요. 정보가 없으면 '미지정'으로 표기합니다.

4. 키워드 (keywords): 
   - 다음 카테고리에 해당하는 내용을 한국어로 추출하세요:
     - 제약 조건: (예: A4 10장 이상, 팀원 전체 서명 필수)
     - 혜택/가산점: (예: 선착순 20팀 주제 선택권 부여)
     - 특이사항: (예: 기말 발표회 참석 필수, 개인 기여도 평가서 포함)

5. 우선순위 (priority) 산정 로직:
   - high: (마감 3일 이내 AND 중요도 높음) OR (선착순 혜택이 있어 빠른 행동이 필요한 경우)
   - medium: 일반적인 과제 수행이 필요한 경우.
   - low: 단순 공지, 시설 안내 등 유저가 제출할 결과물이 없는 경우.

[출력 JSON 구조]
{{
  "title": "과제명 (가장 핵심적인 주제)",
  "dueDate": "YYYY-MM-DDTHH:MM:SS",
  "submitType": "상세한 제출 방법 및 장소",
  "keywords": ["추출된 구체적 제약/혜택/특이사항 구절들"],
  "summary": "과제 성격과 핵심 목표를 포함한 한 줄 요약",
  "priority": "high | medium | low"
}}

[주의사항]
- JSON 형식 외에 어떠한 설명도 덧붙이지 마세요.
- 줄글 속에 숨겨진 숫자(분량, 인원 제한 등)를 절대로 누락하지 마세요."""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            response_format={ "type": "json_object" },
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": prompt_text
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=500
        )

        raw_content = response.choices[0].message.content
        
        if raw_content.startswith("```json"):
            raw_content = raw_content.replace("```json", "", 1)
        if raw_content.endswith("```"):
            raw_content = raw_content.rsplit("```", 1)[0]
            
        result = json.loads(raw_content.strip())
        return result
        
    except Exception as e:
        print(f"Error in ai_service: {str(e)}")
        raise e
