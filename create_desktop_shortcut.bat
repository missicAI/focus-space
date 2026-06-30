@echo off
cd /d "%~dp0"

set "PROJECT_DIR=%CD%"
set "APP_EXE=%PROJECT_DIR%\src-tauri\target\release\focus_space.exe"

if not exist "%APP_EXE%" (
  echo Chua co file app release.
  echo Dang build truoc khi tao shortcut...
  call npm install
  call npm run dist
)

if not exist "%APP_EXE%" (
  echo.
  echo Khong tim thay file:
  echo %APP_EXE%
  echo.
  echo Hay chup man hinh loi build gui lai de sua tiep.
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$shortcutPath = Join-Path ([Environment]::GetFolderPath('Desktop')) 'Focus Space.lnk';" ^
  "$shortcut = (New-Object -ComObject WScript.Shell).CreateShortcut($shortcutPath);" ^
  "$shortcut.TargetPath = $env:APP_EXE;" ^
  "$shortcut.WorkingDirectory = Split-Path $env:APP_EXE;" ^
  "$shortcut.IconLocation = Join-Path $env:PROJECT_DIR 'src-tauri\icons\icon.ico';" ^
  "$shortcut.Save();" ^
  "Write-Host 'Da tao shortcut:' $shortcutPath"

echo.
echo Xong. Ngoai Desktop se co loi mo nhanh: Focus Space
pause
