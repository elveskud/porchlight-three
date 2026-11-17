#!/usr/bin/env python3
"""Start the local Three.js set collection; standard library only."""
import argparse
import functools
import http.server
from pathlib import Path
import threading
import webbrowser

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--port', type=int, default=8765)
parser.add_argument('--no-open', action='store_true')
parser.add_argument('--page', choices=('sets','town'), default='sets')
args = parser.parse_args()
root = Path(__file__).resolve().parents[2]
handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(root))
try:
    server = http.server.ThreadingHTTPServer(('127.0.0.1', args.port), handler)
except OSError as error:
    parser.exit(1, f'Cannot start port {args.port}: {error}. Try --port 8766.\n')
page = 'sets.html' if args.page == 'sets' else 'maple%20hollow%20tree.js/index.html'
url = f'http://127.0.0.1:{args.port}/{page}'
print(f'Porchlight sets: {url}\nPress Ctrl+C to stop.', flush=True)
if not args.no_open:
    threading.Timer(.3, webbrowser.open, args=(url,)).start()
try:
    server.serve_forever()
except KeyboardInterrupt:
    pass
finally:
    server.server_close()
