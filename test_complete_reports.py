import urllib.request
import json
import os

url_single = 'http://localhost:5001/api/detect/image'
url_batch = 'http://localhost:5001/api/detect/batch'
uploads_dir = os.path.join('backend', 'uploads')
files = [f for f in os.listdir(uploads_dir) if f.endswith('.jpg') and not f.startswith('gradcam_')][:4]

print("=== 1. TESTING SINGLE LEAF SCANNER COMPLETE REPORTS ===")
for f_name in files[:2]:
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
            print(f"File: {f_name}")
            print(f"Crop: {res.get('crop_name')} | Condition: {res.get('disease', {}).get('type')}")
            print(f"Severity: {res.get('severity').upper()} | Accuracy: {res.get('disease', {}).get('confidence')}%")
            print(f"Cause: {res.get('disease', {}).get('details', {}).get('cause')}")
            print(f"Chemical Control: {res.get('disease', {}).get('details', {}).get('chemical_control')}")
            print(f"Organic Control: {res.get('disease', {}).get('details', {}).get('organic_control')}")
            print(f"Email Sent: {res.get('email_sent')}")
    except Exception as e:
        print(f"Error testing single {f_name}: {e}")

print("\n=== 2. TESTING MULTI-LEAF BATCH SCANNER COMPLETE REPORTS ===")
boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
body = bytearray()
for i, f_name in enumerate(files[:3]):
    with open(os.path.join(uploads_dir, f_name), 'rb') as f:
        img_bytes = f.read()
    header = f'--{boundary}\r\nContent-Disposition: form-data; name="images"; filename="{f_name}"\r\nContent-Type: image/jpeg\r\n\r\n'
    body.extend(header.encode('utf-8'))
    body.extend(img_bytes)
    body.extend(f'\r\n'.encode('utf-8'))

body.extend(f'--{boundary}--\r\n'.encode('utf-8'))
req = urllib.request.Request(url_batch, data=bytes(body), headers={'Content-Type': f'multipart/form-data; boundary={boundary}'})

try:
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode('utf-8'))
        print("--------------------------------------------------")
        print(f"Batch Total Leaves: {res.get('total_leaves')}")
        print(f"Batch Critical Count: {res.get('critical_count')}")
        print(f"Batch Healthy Count: {res.get('healthy_count')}")
        print(f"Overall Batch Risk: {res.get('overall_risk')}")
        print(f"Email Sent: {res.get('email_sent')}")
        print("Individual Leaf Diagnostic Reports in Batch:")
        for leaf in res.get('leaf_results', []):
            print(f"  - Leaf #{leaf.get('leaf_index')}: {leaf.get('disease_type')} (Healthy: {leaf.get('is_healthy')}, Severity: {leaf.get('severity')})")
            print(f"    Cause: {leaf.get('details', {}).get('cause')}")
            print(f"    Chemical: {leaf.get('details', {}).get('chemical_control')}")
            print(f"    Organic: {leaf.get('details', {}).get('organic_control')}")
except Exception as e:
    print(f"Error testing batch scan: {e}")
