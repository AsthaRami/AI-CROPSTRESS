import requests
import os

BASE_URL = "http://127.0.0.1:5000"

def test_api():
    # 1) Login
    login_url = f"{BASE_URL}/api/auth/login"
    login_data = {"phone": "1234567890", "password": "password123"} # Assuming these credentials exist
    
    # Try to register first just in case
    reg_url = f"{BASE_URL}/api/auth/register"
    reg_data = {"phone": "1234567890", "password": "password123", "name": "Test User"}
    requests.post(reg_url, json=reg_data)
    
    res = requests.post(login_url, json=login_data)
    if res.status_code != 200:
        print(f"Login failed: {res.text}")
        return
    
    token = res.json().get('token')
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2) Upload image
    upload_url = f"{BASE_URL}/api/detect/image"
    # Find a test file
    test_image_dir = os.path.join(os.getcwd(), 'backend', 'uploads')
    images = [f for f in os.listdir(test_image_dir) if f.endswith('.jpg')]
    if not images:
        print("No test images found in uploads.")
        return
    
    image_path = os.path.join(test_image_dir, images[0])
    print(f"Uploading {image_path}...")
    
    with open(image_path, 'rb') as f:
        files = {'image': ('test.jpg', f, 'image/jpeg')}
        res = requests.post(upload_url, headers=headers, files=files)
        
    print(f"Response ({res.status_code}): {res.text}")

if __name__ == '__main__':
    test_api()
