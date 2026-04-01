import os
os.environ['OPENBLAS_NUM_THREADS'] = '1'
os.environ['KMP_DUPLICATE_LIB_OK'] = 'TRUE'

from app import create_app

app = create_app()

if __name__ == '__main__':
    app.run(
        debug = True,
        use_reloader = False, 
        port  = 5001,
        host  = '0.0.0.0'
    )