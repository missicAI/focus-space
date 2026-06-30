@echo off
cd /d "%~dp0"

set "PROJECT_DIR=%CD%"
set "RELEASE_DIR=%PROJECT_DIR%\release\FocusSpace-Windows-Beta"

echo Building Focus Space for users...
call npm install
call npm run dist

if errorlevel 1 (
  echo.
  echo Build fail. Hay chup man hinh loi gui lai de sua.
  pause
  exit /b 1
)

if exist "%RELEASE_DIR%" rmdir /s /q "%RELEASE_DIR%"
mkdir "%RELEASE_DIR%"

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$bundle = Join-Path $env:PROJECT_DIR 'src-tauri\target\release\bundle';" ^
  "$release = $env:RELEASE_DIR;" ^
  "if (Test-Path $bundle) {" ^
  "  Get-ChildItem $bundle -Recurse -File | Where-Object { $_.Extension -in '.exe','.msi' } | Copy-Item -Destination $release -Force;" ^
  "}" ^
  "$portable = Join-Path $env:PROJECT_DIR 'src-tauri\target\release\focus_space.exe';" ^
  "if (Test-Path $portable) { Copy-Item $portable -Destination (Join-Path $release 'FocusSpace-portable.exe') -Force }" ^
  "$readme = Join-Path $release 'README_FOR_USERS.txt';" ^
  "Set-Content -Encoding UTF8 $readme @('Focus Space Beta for Windows','','Cach cai dat:','1. Uu tien chay file installer .exe hoac .msi neu co.','2. Neu dung ban portable, mo FocusSpace-portable.exe.','3. Windows co the bao Unknown publisher vi app chua ky so. Bam More info -> Run anyway neu ban tin nguon tai.','','Du lieu duoc luu local tren may. App khong gui lich su hoc len server.');"

echo.
echo Xong. File de gui cho nguoi khac nam o:
echo %RELEASE_DIR%
echo.
echo Ban co the upload cac file trong thu muc release len Google Drive, GitHub Releases, hoac website rieng.
pause
