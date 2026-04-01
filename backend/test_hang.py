import sys
import threading

def timeout_handler():
    print('TIMEOUT REACHED! Exiting.')
    import os
    os._exit(1)

timer = threading.Timer(10, timeout_handler)
timer.start()

print("Testing imports...")
try:
    print("Importing pymysql...")
    import pymysql
    print(" pymysql imported.")
    
    print("Testing db connection...")
    conn = pymysql.connect(host='localhost', user='system', password='1234', database='crop_stress_db', connect_timeout=3)
    print(" db connected!")
except Exception as e:
    print(f"Error connecting to db: {e}")

try:
    print("Importing tensorflow...")
    import tensorflow as tf
    print(" tensorflow imported!")
except Exception as e:
    print(f"Error importing tensorflow: {e}")

try:
    print("Importing ultralytics...")
    from ultralytics import YOLO
    print(" ultralytics imported!")
except Exception as e:
    print(f"Error importing ultralytics: {e}")

timer.cancel()
print("All done!")
