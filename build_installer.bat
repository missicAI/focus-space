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
echo Building Focus Space installer/exe...
call npm run dist
if errorlevel 1 (
  echo.
  echo Build fail. Hay chup man hinh loi gui lai de sua.
  pause
  exit /b 1
)
echo.
echo Build output:
echo src-tauri\target\release\bundle
pause
