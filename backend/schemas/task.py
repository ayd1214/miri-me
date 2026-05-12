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
    notificationSettings: List[int] = Field(default_factory=lambda: [60, 1440])
    notifiedOffsets: List[int] = Field(default_factory=list)

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    dueDate: Optional[str] = None
    submitType: Optional[str] = None
    keywords: Optional[List[str]] = None
    summary: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    notificationSettings: Optional[List[int]] = None

class TaskStatusUpdate(BaseModel):
    status: Optional[str] = None
    dueDate: Optional[str] = None
