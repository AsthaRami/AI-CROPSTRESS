import sys
import os

# Add backend to path so we can import app
backend_dir = os.path.join(os.getcwd(), 'backend')
sys.path.append(backend_dir)

from app import create_app, db
from app.models.detection import Detection

def test_db_insert():
    app = create_app()
    with app.app_context():
        try:
            det = Detection(
                user_id=1,
                crop_id=None,
                image_path="test_image.jpg",
                stress_type="Test___Stress",
                confidence=99.99,
                severity="low",
                treatment="None needed"
            )
            db.session.add(det)
            db.session.commit()
            print("Database insertion successful!")
            # Clean up
            db.session.delete(det)
            db.session.commit()
            print("Database cleanup successful!")
        except Exception as e:
            print(f"Database insertion failed: {str(e)}")
            import traceback
            traceback.print_exc()

if __name__ == '__main__':
    test_db_insert()
