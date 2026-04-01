from app import create_app, db
from app.models.user import User
import json

app = create_app()
with app.app_context():
    users = User.query.all()
    print(json.dumps([u.to_dict() for u in users], indent=2))
