import os
from flask import Flask
from flask_mail import Mail, Message
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_USERNAME')

mail = Mail(app)

with app.app_context():
    print(f"Attempting to send mail as {app.config['MAIL_USERNAME']}")
    try:
        msg = Message(subject="TEST FROM CROP SYSTEM", recipients=[app.config['MAIL_USERNAME']])
        msg.body = "If you see this, real email is working!"
        mail.send(msg)
        print("SUCCESS: Real email sent!")
    except Exception as e:
        print(f"FAILURE: {e}")
