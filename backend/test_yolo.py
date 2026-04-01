import sys
import threading

def timeout_handler():
    print('TIMEOUT REACHED! Exiting.')
    import os
    os._exit(1)

timer = threading.Timer(10, timeout_handler)
timer.start()

print("Testing YOLO import...")
try:
    from ultralytics import YOLO
    print(" ultralytics imported!")
except Exception as e:
    print(f"Error importing ultralytics: {e}")

timer.cancel()
print("All done!")
