#!/usr/bin/env python3
"""Local comparison player with byte-range support for instant MP4 seeking."""
import argparse
import functools
import http.server
from pathlib import Path
import re
import threading
import webbrowser

ROOT = Path(__file__).resolve().parents[2]

class Handler(http.server.SimpleHTTPRequestHandler):
    remaining = None

    def log_message(self, *_):
        pass

    def handle(self):
        try:
            super().handle()
        except (BrokenPipeError, ConnectionResetError):
            pass

    def send_head(self):
        self.remaining = None
        path = Path(self.translate_path(self.path))
        if path.suffix.lower() != '.mp4' or not path.is_file():
            return super().send_head()
        f = path.open('rb')
        size = path.stat().st_size
        start, end = 0, size - 1
        value = self.headers.get('Range')
        if value:
            match = re.fullmatch(r'bytes=(\d*)-(\d*)', value.strip())
            try:
                if not match or not any(match.groups()):
                    raise ValueError()
                left, right = match.groups()
                if left:
                    start = int(left)
                    end = min(int(right), size - 1) if right else size - 1
                else:
                    start = max(0, size - int(right))
                if start > end or start >= size:
                    raise ValueError()
            except ValueError:
                f.close()
                self.send_response(416)
                self.send_header('Content-Range', f'bytes */{size}')
                self.send_header('Content-Length', '0')
                self.end_headers()
                return None
        self.send_response(206 if value else 200)
        self.send_header('Content-Type', 'video/mp4')
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Content-Length', str(end - start + 1))
        self.send_header('Cache-Control', 'no-store')
        if value:
            self.send_header('Content-Range', f'bytes {start}-{end}/{size}')
        self.end_headers()
        f.seek(start)
        self.remaining = end - start + 1
        return f

    def copyfile(self, source, outputfile):
        if self.remaining is None:
            return super().copyfile(source, outputfile)
        while self.remaining:
            data = source.read(min(self.remaining, 256 * 1024))
            if not data:
                break
            outputfile.write(data)
            self.remaining -= len(data)

class PreviewServer(http.server.ThreadingHTTPServer):
    request_queue_size = 64
    daemon_threads = True

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8766)
    parser.add_argument('--no-open', action='store_true')
    args = parser.parse_args()
    server = PreviewServer(('127.0.0.1', args.port), functools.partial(Handler, directory=str(ROOT)))
    url = f'http://127.0.0.1:{args.port}/comparisons/episode01/'
    print(f'Porchlight comparison: {url}\nPress Ctrl+C to stop.', flush=True)
    if not args.no_open:
        threading.Timer(.3, webbrowser.open, args=(url,)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
