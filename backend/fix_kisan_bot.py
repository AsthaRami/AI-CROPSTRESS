import os

def fix_file(filepath):
    # Read raw bytes to preserve line endings and avoid decode errors
    with open(filepath, 'rb') as f:
        lines = f.readlines()
    
    # We want to keep lines up to '        print(f"CRITICAL ERROR in kisan-bot: {e}")\r\n'
    # And then append '        return jsonify({"key": "default", "response": "System error. Please try again later."}), 200\r\n'
    
    new_lines = []
    found_error = False
    for line in lines:
        try:
            # We'll try to decode the line
            decoded = line.decode('utf-8', errors='ignore')
            if 'print(f"CRITICAL ERROR in kisan-bot: {e}")' in decoded:
                new_lines.append(line)
                new_lines.append(b'        return jsonify({"key": "default", "response": "System error. Please try again later."}), 200\r\n')
                found_error = True
                break
            else:
                new_lines.append(line)
        except Exception:
            new_lines.append(line)
            
    if found_error:
        # write the fixed lines back
        with open(filepath, 'wb') as f:
            f.writelines(new_lines)
            
fix_file('app/routes/kisan_bot.py')
