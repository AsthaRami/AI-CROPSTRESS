import sys
import os

# Add backend to path so we can import app
backend_dir = os.path.join(os.getcwd(), 'backend')
sys.path.append(backend_dir)

from app.services.ai_service import AIService

def test_analysis():
    ai = AIService()
    
    # Try an existing image from uploads if any
    uploads_dir = os.path.join(backend_dir, 'uploads')
    files = [f for f in os.listdir(uploads_dir) if f.endswith('.jpg') and not f.startswith('gradcam_')]
    
    if not files:
        print("No images found in uploads to test.")
        return
    
    test_file = os.path.join(uploads_dir, files[0])
    print(f"Testing analysis on {test_file}...")
    
    try:
        result = ai.analyze(test_file)
        print("Analysis successful!")
        print(f"Disease: {result['disease']}")
        print(f"Severity: {result['severity']}")
    except Exception as e:
        print(f"Analysis failed with exception: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_analysis()
