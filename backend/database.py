from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import Date
import datetime


DATABASE_URL = "postgresql://justus:costco4life@localhost:5432/costco_db"

Base = declarative_base()
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    product_name = Column(String, index=True)
    user_id = Column(String)
    quantity = Column(Integer)


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    product_name = Column(String, index=True, unique=True)
    total_packs = Column(Integer)

class PickupHistory(Base):
    __tablename__ = "pickup_history"

    email = Column(String, primary_key=True)
    last_pickup_date = Column(Date)




# Create the database tables
Base.metadata.create_all(bind=engine)

