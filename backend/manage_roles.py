import sys
import os

# Add the current directory to path so we can import 'app'
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models.user import User

def promote_to_agronomist(email):
    app = create_app()
    with app.app_context():
        user = User.query.filter_by(email=email).first()
        if not user:
            # Try by phone if email not found
            user = User.query.filter_by(phone=email).first()
            
        if not user:
            print(f"❌ User not found: {email}")
            return
            
        user.role = 'agronomist'
        db.session.commit()
        print(f"✅ Success! {user.name} is now an Agronomist!")
        print("They can now access the Agro Hub.")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python manage_roles.py your@email.com")
    else:
        promote_to_agronomist(sys.argv[1])