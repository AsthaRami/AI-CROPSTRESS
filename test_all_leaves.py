import urllib.request
import json
import os

url_single = 'http://localhost:5001/api/detect/image'
uploads_dir = os.path.join('backend', 'uploads')
files = [f for f in os.listdir(uploads_dir) if f.endswith('.jpg') and not f.startswith('gradcam_')][:4]

print("=== TESTING SINGLE LEAF SCANNER FOR ALL UPLOADED USER LEAVES ===")
for f_name in files:
    boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
    body = bytearray()
    with open(os.path.join(uploads_dir, f_name), 'rb') as f:
        img_bytes = f.read()
    
    header = f'--{boundary}\r\nContent-Disposition: form-data; name="image"; filename="{f_name}"\r\nContent-Type: image/jpeg\r\n\r\n'
    footer = f'\r\n--{boundary}--\r\n'
    
    body.extend(header.encode('utf-8'))
    body.extend(img_bytes)
    body.extend(footer.encode('utf-8'))

    req = urllib.request.Request(url_single, data=bytes(body), headers={'Content-Type': f'multipart/form-data; boundary={boundary}'})
    try:
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode('utf-8'))
            print("--------------------------------------------------")
            print(f"Leaf Image: {f_name}")
            print(f"Crop: {res.get('crop_name')} | Condition: {res.get('disease', {}).get('type')}")
            print(f"Severity: {res.get('severity').upper()} | Confidence: {res.get('disease', {}).get('confidence')}%")
            print(f"Positive Message: {res.get('positive_message')}")
            print(f"Email Sent: {res.get('email_sent')}")
    except Exception as e:
        print(f"Error testing {f_name}: {e}")
