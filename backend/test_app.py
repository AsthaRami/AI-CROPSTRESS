import sys
import threading

def timeout_handler():
    print('TIMEOUT REACHED! Exiting.')
    import os
    os._exit(1)

timer = threading.Timer(10, timeout_handler)
timer.start()

try:
    print("Importing app...")
    from app import create_app
    print(" create_app imported!")
    print("Calling create_app()...")
    app = create_app()
    print(" App created!")
except Exception as e:
    print(f"Error: {e}")

timer.cancel()
print("All done!")
