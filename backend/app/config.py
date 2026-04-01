# backend/app/config.py

import os
from dotenv import load_dotenv # pyright: ignore[reportMissingImports]
load_dotenv()

class Config:
    SECRET_KEY         = os.getenv('SECRET_KEY')
    JWT_SECRET_KEY     = os.getenv('JWT_SECRET_KEY')

    # MySQL Connection
    SQLALCHEMY_DATABASE_URI = (
        f"mysql+pymysql://"
        f"{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}"
        f"@{os.getenv('DB_HOST')}/{os.getenv('DB_NAME')}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Redis
    CELERY_BROKER_URL  = os.getenv('REDIS_URL')
    RESULT_BACKEND     = os.getenv('REDIS_URL')

    # Mail
    MAIL_SERVER        = os.getenv('MAIL_SERVER')
    MAIL_PORT          = 587
    MAIL_USE_TLS       = True
    MAIL_USERNAME      = os.getenv('MAIL_USERNAME')
    MAIL_PASSWORD      = os.getenv('MAIL_PASSWORD')