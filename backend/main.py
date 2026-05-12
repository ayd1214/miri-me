from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from routers import tasks, analyze, users, test
from services.scheduler_service import start_scheduler

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze.router)
app.include_router(tasks.router)
app.include_router(users.router)
app.include_router(test.router)

@app.on_event("startup")
async def startup_event():
    start_scheduler()

@app.get("/")
def root():
    return {"message": "miri-me backend running"}
