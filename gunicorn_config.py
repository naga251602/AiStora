# gunicorn_config.py
import multiprocessing

bind = "0.0.0.0:5000"

# [CRITICAL FIX]
# We MUST use 1 worker in dev/docker to prevent JWT Signature Mismatches (422 Errors)
# caused by multiple workers holding different secret states.
workers = 1 

threads = 4
timeout = 120

accesslog = "-"
errorlog = "-"
loglevel = "debug"