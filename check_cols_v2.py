import sqlite3
import os

db_path = os.path.join(os.getcwd(), 'backend', 'instance', 'crop_stress.db')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("PRAGMA table_info(detections)")
cols = cursor.fetchall()
print("COLUMN NAMES:")
for col in cols:
    print(f"- {col[1]} ({col[2]})")

conn.close()
