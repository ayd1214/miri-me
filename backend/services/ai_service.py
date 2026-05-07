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
3. 우선순위(priority): 단순히 마감일만 보지 말고, 과제의 난이도, 예상 노력, 배점 등을 종합적으로 분석하여 "high", "medium", "low" 중 하나로 산정하세요.
   - high: 배점(Points)이 높거나, 제출 방식이 까다롭고 시간이 오래 걸리는 경우(예: 동영상 제작, 유튜브 업로드, 발표, 팀 프로젝트), 특수 조건(선착순 등)이 있거나, 마감일이 임박한(3일 이내) 경우.
   - medium: 일반적인 노력과 시간이 들어가는 표준적인 과제(예: 일반 코딩, 짧은 레포트)이거나, 마감일이 1주일 이내인 경우.
   - low: 배점이 아주 낮거나, 5분 이내에 끝낼 수 있는 단순 텍스트 입력, 출석 체크성 과제, 또는 마감일이 한 달 이상 남은 경우.

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
