import sys
import threading

def timeout_handler():
    print('TIMEOUT REACHED! Exiting.')
    import os
    os._exit(1)

timer = threading.Timer(10, timeout_handler)
timer.start()

try:
    print("Importing cv2...")
    import cv2
    print(" cv2 imported!")
except:
    pass

try:
    print("Importing torch...")
    import torch
    print(" torch imported!")
except:
    pass

timer.cancel()
print("All done!")
