import requests
import json

url = "http://localhost:5001/api/auth/register"
payload = {
    "name": "Test User",
    "phone": "1234567890",
    "email": "test@example.com",
    "password": "password123",
    "role": "farmer"
}
headers = {'Content-Type': 'application/json'}

try:
    response = requests.post(url, data=json.dumps(payload), headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
