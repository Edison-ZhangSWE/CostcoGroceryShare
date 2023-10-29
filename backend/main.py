# main.py

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from database import SessionLocal, Order
from database import Product
import re

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["chrome-extension://*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class OrderCreate(BaseModel):
    product_name: str
    user_id: str
    quantity: int

# Dependency for database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/orders/")
def create_order(order: OrderCreate, db: Session = Depends(get_db)):
    # Check if the product exists in the products table
    product = db.query(Product).filter(Product.product_name == order.product_name).first()

    # If the product doesn't exist, create a new entry
    if not product:
        # Extract the total packs from the product name (or use a default value)
        totalQuantityMatch = re.search(r'(\d+)\s*total\s*packs', order.product_name, re.I)
        total_packs = int(totalQuantityMatch.group(1)) if totalQuantityMatch else 14

        new_product = Product(product_name=order.product_name, total_packs=total_packs)
        db.add(new_product)
        db.commit()

    # Add the order to the orders table
    db_order = Order(**order.dict())
    db.add(db_order)
    db.commit()
    db.refresh(db_order)

    # After saving the order, check if the threshold has been reached
    total_ordered = db.query(func.sum(Order.quantity)).filter(Order.product_name == order.product_name).scalar()
    product = db.query(Product).filter(Product.product_name == order.product_name).first()

    if product and total_ordered >= product.total_packs:
        process_order_fulfilled(product.product_name, db)

    return db_order


@app.get("/orders/count/")
def get_order_count(product_name: str, db: Session = Depends(get_db)):
    count = db.query(func.sum(Order.quantity)).filter(Order.product_name == product_name).scalar() or 0
    return {"count": count}


def process_order_fulfilled(product_name: str, db: Session):
    orders = db.query(Order).filter(Order.product_name == product_name).all()
    
    # Gather all relevant user IDs and their respective ordered quantities
    user_data = [{"user_id": order.user_id, "quantity": order.quantity} for order in orders]
    
    # Process the data as required. For now, we're just printing it.
    print(user_data)

    # Cleanup: Delete all relevant entries from the order table
    db.query(Order).filter(Order.product_name == product_name).delete()
    db.commit()

