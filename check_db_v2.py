import sqlite3
import os

db_path = os.path.join(os.getcwd(), 'backend', 'instance', 'crop_stress.db')
if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    cursor.execute("SELECT * FROM detections ORDER BY id DESC LIMIT 5")
    rows = cursor.fetchall()
    print("Recent detections:")
    for row in rows:
        print(row)
except Exception as e:
    print(f"Error querying detections: {e}")

try:
    cursor.execute("SELECT * FROM alerts ORDER BY id DESC LIMIT 5")
    rows = cursor.fetchall()
    print("\nRecent alerts:")
    for row in rows:
        print(row)
except Exception as e:
    print(f"Error querying alerts: {e}")

conn.close()
