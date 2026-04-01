import sqlite3
import os

db_path = os.path.join(os.getcwd(), 'backend', 'instance', 'crop_stress.db')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("PRAGMA table_info(detections)")
cols = cursor.fetchall()
print("DETECTIONS SCHEMA:")
for col in cols:
    # col: (id, name, type, notnull, pk, ...)
    print(f"Col: {col[1]}, Type: {col[2]}, NotNull: {col[3]}")

conn.close()
