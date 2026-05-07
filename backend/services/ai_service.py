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
        
        prompt_text = f"""이 이미지는 학교 과제 공지입니다. 오늘 날짜와 시간은 {current_time} 입니다. 
만약 요일(예: Monday)만 적혀있다면 다음의 다가오는 요일-날짜 표를 참고하여 정확한 날짜를 적으세요: [{upcoming_dates}].
아래 규칙을 엄격히 지켜서 JSON 형식으로만 응답해주세요.

[규칙]
1. 마감기한(dueDate): 'Due', '마감' 등으로 표기된 날짜를 최우선으로 찾으세요. 'Available until' 등은 마감일이 아닙니다. 만약 'Monday'처럼 요일이나 상대적 날짜가 적혀있다면, 직접 계산하지 말고 반드시 위에 제공된 [요일-날짜 표]에서 해당 요일을 찾아 그 날짜를 YYYY-MM-DDTHH:MM:SS 형식으로 적어주세요.
2. 키워드(keywords): 과제의 내용(예: 디버깅, C언어)보다는 특이사항이나 제한조건(예: "개인 과제", "표절 금지", "선착순", "동영상 제출")을 위주로 추출해주세요. 영문으로 적혀있더라도 한국어로 번역해서 추출하세요.
3. 우선순위(priority): 마감일(긴급도)과 내용(중요도)을 **반드시 함께 종합적으로 고려**하여 "high", "medium", "low" 중 하나로 산정하세요.
   - 긴급도: 3일 이내(높음), 7일 이내(보통), 그 이상(낮음)
   - 중요도: 배점이 높거나 동영상/발표 등 고난이도(높음), 일반 과제(보통), 단순 텍스트/출석/안내/신청(낮음)
   [최종 판별 기준]
   - high: 긴급도와 중요도가 모두 '높음'이거나, 둘 중 하나가 '매우 높음'인 경우.
   - medium: 긴급도와 중요도 중 하나는 높고 하나는 낮거나, 둘 다 '보통'인 경우. (예: 중요도는 낮으나 마감이 당장 내일인 경우)
   - low: 긴급도와 중요도가 모두 '낮음'이거나, 마감이 한 달 이상 남은 단순 과제인 경우.

[출력 JSON 구조]
{{
  "title": "과제명",
  "dueDate": "YYYY-MM-DDTHH:MM:SS",
  "submitType": "제출 방식",
  "keywords": ["키워드1", "키워드2"],
  "summary": "한 줄 요약",
  "priority": "high 또는 medium 또는 low"
}}"""

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
