import os
import base64
import json
from datetime import datetime, timedelta
import pytz
from openai import OpenAI
from fastapi import UploadFile

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

async def analyze_image_with_ai(image: UploadFile) -> dict:
    image_bytes = await image.read()
    base64_image = base64.b64encode(image_bytes).decode("utf-8")

    try:
        kst = pytz.timezone('Asia/Seoul')
        now = datetime.now(kst)
        current_time = now.strftime("%Y-%m-%d %H:%M:%S (%A)")
        
        # 요일 매핑을 더 명확하게 제공 (오늘부터 14일치)
        date_mapping = []
        for i in range(14):
            d = now + timedelta(days=i)
            date_mapping.append(f"- {d.strftime('%A')}: {d.strftime('%Y-%m-%d')}")
        upcoming_dates_str = "\n".join(date_mapping)
        
        prompt_text = f"""이 이미지는 학교 과제 공지이며 당신은 이를 분석하여 구조화된 데이터를 생성하는 AI입니다. 
현재 시간(KST): {current_time}

[마감 기한 분석 지침]
1. 이미지에 'Monday', 'Tuesday'와 같이 요일만 명시된 경우(예: "Due Monday"), 반드시 아래의 [요일-날짜 매핑]을 참고하여 오늘 이후 가장 가까운 해당 요일의 날짜로 변환하여 ISO 8601 형식(YYYY-MM-DDTHH:MM:SS)으로 작성하세요.
2. 'Due Monday'가 오늘(수요일)이라면, 이는 보통 다음 주 월요일을 의미합니다. 만약 오늘이 월요일인데 'Due Monday'라고 되어 있다면, 문맥을 보고 오늘 23:59인지 다음 주 월요일인지 판단하세요. 일반적으로는 미래의 날짜를 선택합니다.
3. 연도나 월이 명시되지 않은 경우 현재 날짜를 기준으로 가장 상식적인 미래의 날짜를 선택하세요.
4. 시간 정보가 없으면 23:59:59를 기본값으로 사용하세요. "by 11:59pm"과 같은 정보가 있으면 이를 반영하세요.

[요일-날짜 매핑]
{upcoming_dates_str}

[추출 및 분석 지침]
1. 분석적 사고 (Step-by-Step): 
   - 텍스트 전체를 훑으며 '제출 장소', '분량 제한', '첨부 필수 서류', '보너스 혜택' 등 구체적인 제약 사항을 모두 식별하세요.
   - 단순 단어가 아닌, 유저가 행동에 옮길 수 있는 '구체적인 구절' 단위로 추출합니다.

2. 제출 방식 (submitType): 
    - 단순히 '온라인/오프라인'이 아니라, "학과 사무실(301호) 제출함 직접 제출"처럼 장소와 방법이 포함된 상세 정보를 적으세요. 정보가 없으면 '미지정'으로 표기합니다.

3. 키워드 (keywords): 
   - 유저가 과제 수행 시 반드시 체크해야 할 상세 제약과 혜택을 아래 네 가지 기준에 따라 리스트 형태로 추출하세요.
     - 규격 관련: 파일 형식, 분량 제한, 기술 스택 등
     - 제출 요건: 필수 포함 서류, 서명 날인, 특정 툴 사용 여부 등
     - 보상 및 가산: 선착순 혜택, 조기 제출 가산점, 추가 점수 요건 등
     - 연계 활동: 오프라인 발표, 상호 피드백, 필수 참석 행사 등

   - [포맷팅 필수 지시]:
     - 각 항목은 반드시 "번호. 내용" 형태의 독립된 문자열로 작성하세요. (예: "1. A4 10장 이상 분량")
     - 한 문장에 여러 조건이 있다면(예: '서명이 포함된 보고서 제출') 반드시 "1. 보고서 제출", "2. 팀원 전체 서명 포함"과 같이 각각의 요소로 분리하세요.
     - 추출된 모든 항목은 JSON의 'keywords' 배열(`[]`) 안에 각각의 원소로 담겨야 합니다.

4. 우선순위 (priority) 산정 로직:
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
