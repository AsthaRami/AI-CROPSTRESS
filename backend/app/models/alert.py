from app import db
from datetime import datetime


class Alert(db.Model):
    __tablename__ = 'alerts'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    detection_id = db.Column(db.Integer, db.ForeignKey('detections.id'))

    message = db.Column(db.Text, nullable=False)
    severity = db.Column(db.Enum('low', 'medium', 'high', 'critical'), nullable=False)
    status = db.Column(db.Enum('active', 'resolved'), default='active')

    sent_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'message': self.message,
            'severity': self.severity,
            'status': self.status,
            'sent_at': str(self.sent_at),
            'detection_id': self.detection_id,
        }

