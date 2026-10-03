@echo off
setlocal
cd /d "%~dp0"
echo Open http://127.0.0.1:4827 in your browser.
echo Keep this window open while previewing. Press Ctrl+C to stop.
node scripts\preview-server.mjs
pause
