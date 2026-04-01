from app import db
from datetime import datetime

class Farm(db.Model):
    __tablename__ = 'farms'
    id         = db.Column(db.Integer, primary_key=True)
    user_id    = db.Column(db.Integer, db.ForeignKey('users.id'))
    name       = db.Column(db.String(100))
    location   = db.Column(db.String(200))
    latitude   = db.Column(db.Numeric(10,8))
    longitude  = db.Column(db.Numeric(11,8))
    area_acres = db.Column(db.Numeric(8,2))
    soil_type  = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {'id': self.id, 'name': self.name, 'location': self.location}
