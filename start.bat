@echo off
echo ==========================================
echo   海洋知識大挑戰 - Ocean Quiz
echo   http://localhost:8004
echo   按 Ctrl+C 關閉伺服器
echo ==========================================
start http://localhost:8004
python server.py
pause
