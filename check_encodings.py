import os

files = ['.env', 'backend/.env']
for f in files:
    if os.path.exists(f):
        with open(f, 'rb') as fd:
            head = fd.read(4)
            print(f"{f}: {head}")
    else:
        print(f"{f} not found")
