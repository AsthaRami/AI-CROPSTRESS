from app import db
from datetime import datetime

class Crop(db.Model):
    __tablename__ = 'crops'
    id         = db.Column(db.Integer, primary_key=True)
    farm_id    = db.Column(db.Integer, db.ForeignKey('farms.id'))
    crop_type  = db.Column(db.String(50))
    variety    = db.Column(db.String(100))
    planted_at = db.Column(db.Date)
    stage      = db.Column(db.String(50))
    status     = db.Column(db.Enum('healthy','stressed','critical'), default='healthy')

    def to_dict(self):
        return {'id': self.id, 'crop_type': self.crop_type, 'status': self.status}
