"""
白貓博士的海洋復育行動 - 靜態檔案伺服器
提供 /api/videos 回傳影片清單，讓前端自動偵測可用影片
"""
import http.server
import json
import os
import re
import urllib.parse

PORT = 8004
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
VIDEO_DIR = os.path.join(BASE_DIR, 'assets', 'video')


class GameHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == '/api/videos':
            self._handle_video_list()
        else:
            super().do_GET()

    def end_headers(self):
        self.send_header('Accept-Ranges', 'bytes')
        # 禁止瀏覽器快取，確保每次都載入最新檔案
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def _handle_video_list(self):
        """掃描 assets/video/ 回傳分類後的影片清單"""
        files = sorted(f for f in os.listdir(VIDEO_DIR) if f.endswith('.mp4'))

        result = {
            'correct7s': [],
            'wrong7s': [],
            'correct3s': [],
            'wrong3s': [],
        }

        for f in files:
            path = 'assets/video/' + f
            if re.match(r'^7秒_答對\d+\.mp4$', f):
                result['correct7s'].append(path)
            elif re.match(r'^7秒_答錯\d+\.mp4$', f):
                result['wrong7s'].append(path)
            elif re.match(r'^3秒_答對.*\.mp4$', f):
                result['correct3s'].append(path)
            elif re.match(r'^3秒_答錯.*\.mp4$', f):
                result['wrong3s'].append(path)

        body = json.dumps(result, ensure_ascii=False).encode('utf-8')
        self.send_response(200)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        path = str(args[0]) if args else ''
        if not any(path.endswith(ext) for ext in ('.png', '.mp4', '.js', '.css')):
            super().log_message(format, *args)


if __name__ == '__main__':
    os.chdir(BASE_DIR)
    print(f'白貓博士的海洋復育行動 - 益智問答遊戲')
    print(f'  遊戲: http://localhost:{PORT}')
    print()
    server = http.server.HTTPServer(('', PORT), GameHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nStopped.')
