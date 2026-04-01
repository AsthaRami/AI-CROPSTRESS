from app import db
from datetime import datetime

class Query(db.Model):
    __tablename__ = 'queries'

    id          = db.Column(db.Integer, primary_key=True)
    farmer_id   = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title       = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    crop_type   = db.Column(db.String(100), nullable=False)
    image_path  = db.Column(db.String(255))
    ai_diagnosis = db.Column(db.JSON)  # Stores AI analysis result
    status      = db.Column(db.Enum('pending', 'answered', 'closed'), default='pending')
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at  = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    responses = db.relationship('Response', backref='query', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'farmer_id': self.farmer_id,
            'title': self.title,
            'description': self.description,
            'crop_type': self.crop_type,
            'image_path': self.image_path,
            'ai_diagnosis': self.ai_diagnosis,
            'status': self.status,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
