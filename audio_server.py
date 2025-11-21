#!/usr/bin/env python3
import http.server
import socketserver
import os
from urllib.parse import unquote

PORT = 8080

class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET')
        if self.path.endswith('.mp3'):
            self.send_header('Content-Type', 'audio/mpeg')
        super().end_headers()

    def translate_path(self, path):
        # Decode URL-encoded paths
        path = unquote(path)
        if path.startswith('/audio/'):
            # Serve from the audio directory
            relative_path = path[7:]  # Remove '/audio/' prefix
            full_path = os.path.join('/var/www/vanguard/public/audio', relative_path)
            return full_path
        return super().translate_path(path)

os.chdir('/var/www/vanguard/public')

with socketserver.TCPServer(("0.0.0.0", PORT), CORSHTTPRequestHandler) as httpd:
    print(f"Audio server running on http://162.220.14.239:{PORT}")
    print("MP3 files available at:")
    print("- http://162.220.14.239:8080/audio/welcome.mp3")
    print("- http://162.220.14.239:8080/audio/have%20a%20good%20day.mp3")
    httpd.serve_forever()