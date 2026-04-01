from app import db
from datetime import datetime

class Notification(db.Model):
    __tablename__ = 'notifications'

    id           = db.Column(db.Integer, primary_key=True)
    user_id      = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    message      = db.Column(db.String(500), nullable=False)
    type         = db.Column(db.String(50), nullable=False) # 'query', 'response', 'alert'
    is_read      = db.Column(db.Boolean, default=False)
    reference_id = db.Column(db.Integer) # ID of the query or alert
    created_at   = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'message': self.message,
            'type': self.type,
            'is_read': self.is_read,
            'reference_id': self.reference_id,
            'created_at': self.created_at.isoformat()
        }
