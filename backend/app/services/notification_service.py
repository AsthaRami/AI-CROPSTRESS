import os
from flask_mail import Message # pyright: ignore[reportMissingImports]
from app import mail

def send_email_notification(to_email, subject, body):
    """
    Sends a real email using Flask-Mail.
    Requires MAIL_USERNAME and MAIL_PASSWORD to be set in .env
    """
    if not to_email:
        return False, "No recipient email provided"
    
    try:
        msg = Message(subject=subject, recipients=[to_email])
        msg.body = body
        mail.send(msg)
        return True, "Email sent successfully"
    except Exception as e:
        print(f"FAILED TO SEND EMAIL: {e}")
        return False, str(e)

def send_sms_notification(to_phone, message):
    """
    Sends a real SMS using Twilio.
    Requires TWILIO_SID, TWILIO_TOKEN, and TWILIO_PHONE in .env
    """
    sid = os.getenv('TWILIO_SID')
    token = os.getenv('TWILIO_TOKEN')
    from_phone = os.getenv('TWILIO_PHONE')

    if not all([sid, token, from_phone]):
        return False, "Twilio credentials not configured"

    try:
        from twilio.rest import Client # pyright: ignore[reportMissingImports]
        client = Client(sid, token)
        client.messages.create(
            body=message,
            from_=from_phone,
            to=to_phone
        )
        return True, "SMS sent successfully"
    except Exception as e:
        print(f"FAILED TO SEND SMS: {e}")
        return False, str(e)
