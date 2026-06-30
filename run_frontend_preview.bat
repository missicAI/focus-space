@echo off
cd /d "%~dp0"
echo Installing packages if needed...
npm install
echo Starting frontend preview only. This does not read active Windows apps.
npm run dev
pause
