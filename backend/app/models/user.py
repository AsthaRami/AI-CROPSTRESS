from app import db
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

class User(db.Model):
    __tablename__ = 'users'

    id            = db.Column(db.Integer, primary_key=True)
    name          = db.Column(db.String(100), nullable=False)
    phone         = db.Column(db.String(15), unique=True, nullable=False)
    email         = db.Column(db.String(100), unique=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role          = db.Column(db.Enum('farmer','agronomist','admin'),
                              default='farmer')
    language      = db.Column(db.String(20), default='en')
    profession    = db.Column(db.String(100))
    location      = db.Column(db.String(255))
    bio           = db.Column(db.Text)
    photo         = db.Column(db.Text) # Base64 or URL
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)

    # Cascade relationships to delete all data when user is deleted
    farms      = db.relationship('Farm',      backref='owner', lazy=True, cascade="all, delete-orphan")
    detections = db.relationship('Detection', backref='user',  lazy=True, cascade="all, delete-orphan")
    alerts     = db.relationship('Alert',     backref='user',  lazy=True, cascade="all, delete-orphan")
    queries    = db.relationship('Query',     backref='farmer', lazy=True, cascade="all, delete-orphan")
    notifications = db.relationship('Notification', backref='user', lazy=True, cascade="all, delete-orphan")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id'      : self.id,
            'name'    : self.name,
            'phone'   : self.phone,
            'email'   : self.email,
            'role'    : self.role,
            'language': self.language,
            'profession': self.profession,
            'location': self.location,
            'bio': self.bio,
            'photo': self.photo
        }