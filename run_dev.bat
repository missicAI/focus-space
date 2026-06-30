@echo off
cd /d "%~dp0"
echo Installing packages if needed...
call npm install
if errorlevel 1 (
  echo.
  echo npm install fail. Hay chup man hinh loi gui lai de sua.
  pause
  exit /b 1
)
echo Starting Focus Space in dev mode...
call npm run app
if errorlevel 1 (
  echo.
  echo App fail. Hay chup man hinh loi gui lai de sua.
  pause
  exit /b 1
)
pause
