import sqlite3
import os

db_path = os.path.join(os.getcwd(), 'backend', 'instance', 'crop_stress.db')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("PRAGMA table_info(detections)")
cols = cursor.fetchall()
print("DETECTIONS COLUMNS:")
for col in cols:
    print(col)

cursor.execute("SELECT * FROM detections LIMIT 1")
row = cursor.fetchone()
print(f"\nDETECTIONS ROW: {row}")

conn.close()
