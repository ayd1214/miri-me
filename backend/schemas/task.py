from pydantic import BaseModel, Field
from typing import List, Optional, Dict

class TaskCreate(BaseModel):
    title: str
    dueDate: str
    submitType: str
    keywords: List[str]
    summary: Optional[str] = None
    priority: str
    status: str = "todo"
    # 알림 설정: [분 단위 리스트] (예: [60, 1440] -> 1시간 전, 1일 전)
    notificationSettings: List[int] = Field(default_factory=lambda: [60, 1440])
    # 이미 발송된 알림 오프셋 기록
    notifiedOffsets: List[int] = Field(default_factory=list)

class TaskStatusUpdate(BaseModel):
    status: Optional[str] = None
    dueDate: Optional[str] = None
    notifiedOffsets: Optional[List[int]] = None
