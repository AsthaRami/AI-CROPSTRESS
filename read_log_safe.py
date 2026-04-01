import traceback

def read_log(path):
    print(f"Reading {path}...")
    try:
        # Try different encodings
        for enc in ['utf-16', 'utf-8', 'latin1']:
            try:
                with open(path, 'r', encoding=enc) as f:
                    content = f.read()
                    print(f"--- Decoded with {enc} ---")
                    print(content[-500:]) # Last 500 chars
                    return
            except Exception:
                continue
        print("Could not decode with any common encoding")
    except Exception as e:
        print(f"Error: {e}")

read_log('output.log')
