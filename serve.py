"""Serve the ./docs folder at http://localhost:8000/

Put this file next to the `docs` folder (not inside it), then run:
    python3 serve.py          (or: python serve.py / py serve.py on Windows)
Stop with Ctrl + C.
"""
import functools
import http.server
import socketserver
from pathlib import Path

PORT = 8000
ROOT = Path(__file__).resolve().parent / "docs"

if not (ROOT / "index.html").exists():
    raise SystemExit(f"index.html not found in {ROOT}. Put serve.py next to the docs folder.")

handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT))
socketserver.TCPServer.allow_reuse_address = True

with socketserver.TCPServer(("", PORT), handler) as server:
    print(f"Serving {ROOT}")
    print(f"  en: http://localhost:{PORT}/index.html")
    print(f"  ja: http://localhost:{PORT}/ja.html")
    print(f"  zh: http://localhost:{PORT}/zh.html")
    print("Press Ctrl + C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
