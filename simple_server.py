#!/usr/bin/env python3
"""
Ultra-simple HTTP server for testing Railway
"""
import os
from http.server import HTTPServer, BaseHTTPRequestHandler

class SimpleHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            response = '{"message": "Simple server is working!", "status": "success"}'
            self.wfile.write(response.encode())
        elif self.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            response = '{"status": "healthy", "message": "Simple server is running"}'
            self.wfile.write(response.encode())
        else:
            self.send_response(404)
            self.end_headers()
            response = '{"error": "Not found"}'
            self.wfile.write(response.encode())

    def do_POST(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        response = '{"message": "POST request received", "status": "success"}'
        self.wfile.write(response.encode())

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8080))
    print(f"🚀 Starting simple HTTP server on port {port}")
    server = HTTPServer(('0.0.0.0', port), SimpleHandler)
    print(f"✅ Server started successfully on 0.0.0.0:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("🛑 Server stopped")
        server.server_close()
