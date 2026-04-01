import sys

def read_file(filepath):
    try:
        with open('output_repr.txt', 'w', encoding='utf-8') as out:
            with open(filepath, 'rb') as f:
                lines = f.readlines()
            for i, line in enumerate(lines):
                if 150 <= i + 1 <= 180:
                    out.write(f"{i + 1}: {repr(line)}\n")
    except Exception as e:
        print(e)
read_file('app/routes/kisan_bot.py')
