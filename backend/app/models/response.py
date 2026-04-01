from app import db
from datetime import datetime

class Response(db.Model):
    __tablename__ = 'responses'

    id             = db.Column(db.Integer, primary_key=True)
    query_id       = db.Column(db.Integer, db.ForeignKey('queries.id'), nullable=False)
    agronomist_id  = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    message        = db.Column(db.Text, nullable=False)
    recommendation = db.Column(db.Text, nullable=False)
    created_at     = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship to get agronomist details
    agronomist = db.relationship('User', backref=db.backref('agronomist_responses', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'query_id': self.query_id,
            'agronomist_id': self.agronomist_id,
            'agronomist_name': self.agronomist.name if self.agronomist else "Unknown",
            'message': self.message,
            'recommendation': self.recommendation,
            'created_at': self.created_at.isoformat()
        }
