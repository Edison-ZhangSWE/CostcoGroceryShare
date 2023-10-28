from fastapi import FastAPI
from sqlalchemy import create_engine, MetaData
from databases import Database

DATABASE_URL = "postgresql+asyncpg://your_username:your_password@localhost/costco_db"

database = Database(DATABASE_URL)
metadata = MetaData()

app = FastAPI()

@app.on_event("startup")
async def startup():
    await database.connect()

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()

@app.get("/")
async def read_root():
    return {"Hello": "World"}

