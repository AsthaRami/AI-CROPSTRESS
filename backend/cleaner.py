import os

def clean_file(filepath, outpath):
    with open(filepath, 'rb') as f:
        content = f.read()
    
    # decode with ignore
    clean_text = content.decode('utf-8', errors='ignore')
    
    with open(outpath, 'w', encoding='utf-8') as f:
        f.write(clean_text)

clean_file('app/routes/kisan_bot.py', 'clean_kisan_bot.py')
