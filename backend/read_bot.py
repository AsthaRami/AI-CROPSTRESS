import sys

def read_file(filepath):
    try:
        with open('output.txt', 'w', encoding='utf-8') as out:
            with open(filepath, 'rb') as f:
                lines = f.readlines()
            for i, line in enumerate(lines):
                decoded = line.decode('utf-8', errors='replace').rstrip('\r\n')
                if 140 <= i + 1 <= 180:
                    out.write(f"{i + 1}: {decoded}\n")
    except Exception as e:
        print(e)
read_file('app/routes/kisan_bot.py')
