from app import db
from datetime import datetime

class Detection(db.Model):
    __tablename__ = 'detections'
    id           = db.Column(db.Integer, primary_key=True)
    user_id      = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    crop_id      = db.Column(db.Integer, db.ForeignKey('crops.id'), nullable=True)
    image_path   = db.Column(db.String(255))
    stress_type  = db.Column(db.String(100))
    confidence   = db.Column(db.Numeric(5,2))
    severity     = db.Column(db.Enum('low','medium','high','critical'))
    gradcam_path = db.Column(db.String(255))
    bounding_box = db.Column(db.JSON, nullable=True)
    treatment    = db.Column(db.Text)
    detected_at  = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        crop_name = (self.stress_type or '').split('___')[0] if self.stress_type else 'Unknown'
        return {
            'id': self.id,
            'crop_name': crop_name,
            'stress_type': self.stress_type,
            'confidence': float(self.confidence or 0),
            'severity': self.severity,
            'treatment': self.treatment,
            'detected_at': str(self.detected_at)
        }
