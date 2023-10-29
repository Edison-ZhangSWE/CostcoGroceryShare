import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

SENDGRID_API_KEY = "API_KEY"

def send_order_emails(item_name, orders):
    # Convert the list of tuples into a formatted string for the email body
    order_details = "\n".join([f"{email}: {quantity}" for email, quantity in orders])

    # Create the email content
    message = Mail(
        from_email="edisonzhang2@gmail.com",
        to_emails=["edisonzhang10@gmail.com", "edisonzhangsw@gmail.com", "edisonzhang6969@gmail.com"],
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

# Hardcoded test data
item_name = "Test Item"
orders = [
    ("edisonzhang10@gmail.com", 5),
    ("edisonzhangsw@gmail.com", 3),
    ("edisonzhang6969@gmail.com", 2)
]

# Call the function with the test data
send_order_emails(item_name, orders)
