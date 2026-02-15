from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import process, style, health
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)

app = FastAPI(
    title="Apelier AI Engine",
    description="AI photo processing pipeline for Apelier — analysis, style application, composition, and output generation",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Railway handles auth via service-to-service — frontend bridge routes are the gatekeepers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["health"])
app.include_router(process.router, prefix="/api/process", tags=["processing"])
app.include_router(style.router, prefix="/api/style", tags=["style"])


@app.on_event("startup")
async def startup():
    print("Apelier AI Engine starting...")


@app.on_event("shutdown")
async def shutdown():
    print("Apelier AI Engine shutting down...")
