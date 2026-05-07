from pydantic import BaseModel
from typing import List, Optional

class TaskCreate(BaseModel):
    title: str
    dueDate: str
    submitType: str
    keywords: List[str]
    summary: Optional[str] = None
    priority: str
    status: str = "todo"

class TaskStatusUpdate(BaseModel):
    status: str
