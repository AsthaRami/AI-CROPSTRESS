import urllib.request
import json

url = "http://localhost:5001/api/auth/register"
payload = {
    "name": "Test User",
    "phone": "2222222222",
    "email": "test2@example.com",
    "password": "password123",
    "role": "farmer"
}
data = json.dumps(payload).encode('utf-8')
req = urllib.request.Request(url, data=data)
req.add_header('Content-Type', 'application/json')

try:
    with urllib.request.urlopen(req) as response:
        print(f"Status Code: {response.getcode()}")
        print(f"Response: {response.read().decode('utf-8')}")
except Exception as e:
    if hasattr(e, 'read'):
         print(f"Error Code: {e.code}")
         print(f"Error Response: {e.read().decode('utf-8')}")
    else:
         print(f"Error: {e}")
