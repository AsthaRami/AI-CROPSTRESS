import os

# Fix for some Windows environments where platform.machine() may hang
try:
    import platform

    def _fast_machine():
        return (
            os.environ.get("PROCESSOR_ARCHITECTURE")
            or os.environ.get("PROCESSOR_ARCHITEW6432")
            or "x86_64"
        )

    platform.machine = _fast_machine
except Exception:
    pass


from flask import Flask, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_mail import Mail
from sqlalchemy import event

# Extensions
db = SQLAlchemy()
jwt = JWTManager()
mail = Mail()


def create_app():
    app = Flask(__name__)

    # Load environment variables (.env)
    try:
        from dotenv import load_dotenv
        load_dotenv()
    except Exception:
        pass

    # Basic Config
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "cropstress2024")
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "jwt2024")

    # Database - Fresh file to bypass persistent locks
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
        "DATABASE_URL", "sqlite:///crop_system_v2.db"
    )
    # Important for SQLite concurrency on Windows
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
        "connect_args": {
            "timeout": 60,
            "check_same_thread": False
        },
        "pool_size": 1,
        "max_overflow": 0,
        "pool_pre_ping": True,
    }
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # Mail Config
    app.config["MAIL_SERVER"] = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    app.config["MAIL_PORT"] = int(os.getenv("MAIL_PORT", 587))
    app.config["MAIL_USE_TLS"] = True
    app.config["MAIL_USERNAME"] = os.getenv("MAIL_USERNAME")
    app.config["MAIL_PASSWORD"] = os.getenv("MAIL_PASSWORD")
    app.config["MAIL_DEFAULT_SENDER"] = os.getenv("MAIL_USERNAME")

    # Initialize Extensions
    db.init_app(app)
    jwt.init_app(app)
    mail.init_app(app)

    # Enable WAL mode for SQLite to handle concurrency better
    if app.config["SQLALCHEMY_DATABASE_URI"].startswith("sqlite"):
        with app.app_context():
            @event.listens_for(db.engine, "connect")
            def set_sqlite_pragma(dbapi_connection, connection_record):
                cursor = dbapi_connection.cursor()
                cursor.execute("PRAGMA journal_mode=WAL")
                cursor.execute("PRAGMA synchronous=NORMAL")
                cursor.close()

    # CORS
    CORS(
        app,
        origins="*",
        supports_credentials=False,
        allow_headers=["Content-Type", "Authorization"]
    )

    # Import and Register Blueprints
    from .routes.auth import auth_bp
    from .routes.detection import detect_bp
    from .routes.farm import farm_bp
    from .routes.alerts import alerts_bp
    from .routes.weather import weather_bp
    from .routes.community import community_bp
    from .routes.kisan_bot import kisan_bot_bp
    from .routes.market import market_bp
    from .routes.agronomist import agronomist_bp
    from .routes.farmer import farmer_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(detect_bp)
    app.register_blueprint(farm_bp)
    app.register_blueprint(alerts_bp)
    app.register_blueprint(weather_bp)
    app.register_blueprint(community_bp)
    app.register_blueprint(kisan_bot_bp)
    app.register_blueprint(market_bp)
    app.register_blueprint(agronomist_bp)
    app.register_blueprint(farmer_bp)

    # Create DB tables for first time
    with app.app_context():
        db.create_all()

    return app