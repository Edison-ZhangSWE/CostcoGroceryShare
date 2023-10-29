import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

with open('api_key.txt', 'r') as file:
    SENDGRID_API_KEY = file.readline().strip()

def send_order_emails(item_name, orders):
    # Convert the list of dictionaries into a list of tuples (email, quantity)
    order_tuples = [(order['user_id'], order['quantity']) for order in orders]

    # Convert the list of tuples into a formatted string for the email body
    order_details = "\n".join([f"{email}: {quantity}" for email, quantity in order_tuples])

    # Create a list of recipient emails from the orders
    recipient_emails = [order['user_id'] for order in orders]

    # Create the email content
    message = Mail(
        from_email="edisonzhang2@gmail.com",
        to_emails=recipient_emails,
        subject=f"Order Confirmation for {item_name}",
        html_content=f"<strong>Order Details:</strong><br>{order_details}"
    )

    # Send the email
    try:
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        print(response.status_code, response.body, response.headers)
    except Exception as e:
        print(f"Error sending email: {e}")

