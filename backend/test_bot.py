import requests
import json

url = "http://127.0.0.1:5000/api/kisan-bot/chat"
payload = {"message": "what is tamato growth process for healthy crop"}
headers = {"Content-Type": "application/json"}

try:
    response = requests.post(url, data=json.dumps(payload), headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
