"""
打包白貓博士海洋復育行動為單一 HTML 檔案
用法：python build_standalone.py
輸出：OceanQuiz_Standalone.html

PNG 圖片內嵌為 base64，影片保持外部引用（太大無法內嵌）。
"""
import json, os, base64, mimetypes, re

DIR = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(DIR, "OceanQuiz_Standalone.html")

print("1/4  讀取題庫 ...")
with open(os.path.join(DIR, "questions.json"), "r", encoding="utf-8") as f:
    questions_json = f.read()

print("2/4  讀取 CSS + JS ...")
with open(os.path.join(DIR, "style.css"), "r", encoding="utf-8") as f:
    css = f.read()
with open(os.path.join(DIR, "game.js"), "r", encoding="utf-8") as f:
    game_js = f.read()

print("3/4  內嵌 PNG 圖片 ...")
# Find all PNG references in CSS and HTML
video_dir = os.path.join(DIR, "assets", "video")
png_map = {}
for fname in os.listdir(video_dir):
    if fname.lower().endswith('.png'):
        fpath = os.path.join(video_dir, fname)
        mime = 'image/png'
        with open(fpath, 'rb') as f:
            data = base64.b64encode(f.read()).decode('ascii')
        rel_path = f'assets/video/{fname}'
        data_url = f'data:{mime};base64,{data}'
        png_map[rel_path] = data_url
        print(f"   內嵌: {rel_path} ({os.path.getsize(fpath) / 1024:.0f} KB)")

# Replace PNG paths in CSS
patched_css = css
for path, data_url in png_map.items():
    patched_css = patched_css.replace(path, data_url)

# Replace PNG paths in JS (for title bg image)
patched_js = game_js
for path, data_url in png_map.items():
    patched_js = patched_js.replace(f"'{path}'", f"'{data_url}'")

print("4/4  組裝輸出 HTML ...")

html = f"""<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>白貓博士的海洋復育行動 - 益智問答遊戲</title>
    <style>
{patched_css}
    </style>
</head>
<body>
    <div id="game-viewport">
        <div id="video-layer">
            <video id="bg-video-a" muted playsinline></video>
            <video id="bg-video-b" muted playsinline style="opacity:0"></video>
        </div>
        <div id="ui-layer">
            <div id="loading-screen" class="screen active">
                <div class="loading-title">🐱 白貓博士的海洋復育行動</div>
                <div class="progress-bar-container">
                    <div class="progress-bar-fill" id="progress-fill"></div>
                </div>
                <div class="loading-text" id="loading-text">載入中...</div>
            </div>
            <div id="title-screen" class="screen">
                <img id="title-bg-image" src="" alt="">
                <button id="start-btn" aria-label="開始遊戲"></button>
            </div>
            <div id="quiz-screen" class="screen">
                <div class="top-bar">
                    <div id="score-box" class="info-box">
                        <span class="info-box-text" id="score-text">0</span>
                    </div>
                    <div id="timer-box" class="info-box">
                        <span class="info-box-text" id="timer-text">10</span>
                    </div>
                </div>
                <div id="question-box">
                    <span id="question-text"></span>
                </div>
                <button id="answer-0" class="answer-btn" data-idx="0">
                    <span class="answer-text"></span>
                </button>
                <button id="answer-1" class="answer-btn" data-idx="1">
                    <span class="answer-text"></span>
                </button>
                <button id="answer-2" class="answer-btn" data-idx="2">
                    <span class="answer-text"></span>
                </button>
                <button id="answer-3" class="answer-btn" data-idx="3">
                    <span class="answer-text"></span>
                </button>
            </div>
            <div id="explanation-overlay" class="screen">
                <div id="explanation-frame">
                    <div id="explanation-result"></div>
                    <div id="explanation-text"></div>
                    <div id="explanation-funfact"></div>
                    <div id="explanation-continue">點擊繼續</div>
                </div>
            </div>
            <div id="end-screen" class="screen">
                <div class="end-title">遊戲結束</div>
                <div class="end-rank" id="end-rank"></div>
                <div class="end-score" id="end-score"></div>
                <div class="end-detail" id="end-detail"></div>
                <button id="restart-btn">再玩一次</button>
            </div>
        </div>
    </div>
    <script>window.EMBEDDED_QUESTIONS = {questions_json};</script>
    <script>
{patched_js}
    </script>
</body>
</html>"""

with open(OUT, "w", encoding="utf-8") as f:
    f.write(html)

size_mb = os.path.getsize(OUT) / (1024 * 1024)
print(f"\\nDone!")
print(f"  File: {OUT}")
print(f"  Size: {size_mb:.1f} MB")
print(f"  注意：影片仍需外部引用，需放在 assets/video/ 資料夾")
