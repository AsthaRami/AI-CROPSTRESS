import sqlite3
import os

db_path = os.path.join(os.getcwd(), 'backend', 'instance', 'crop_stress.db')
if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='detections'")
    row = cursor.fetchone()
    if row:
        print(f"DETECTIONS SCHEMA:\n{row[0]}")
    else:
        print("Table 'detections' not found.")
        
    cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='crops'")
    row = cursor.fetchone()
    if row:
        print(f"\nCROPS SCHEMA:\n{row[0]}")
    else:
        print("\nTable 'crops' not found.")

    cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'")
    row = cursor.fetchone()
    if row:
        print(f"\nUSERS SCHEMA:\n{row[0]}")
    else:
        print("\nTable 'users' not found.")

except Exception as e:
    print(f"Error querying schema: {e}")

conn.close()
