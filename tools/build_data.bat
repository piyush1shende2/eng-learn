@echo off
rem Builds the real-speaker accent data and the voice library from your datasets folder.
rem Usage:  tools\build_data.bat [datasets folder] [lite|standard|full|max]
rem Example: tools\build_data.bat F:\datasets full
setlocal
set ROOT=%~1
if "%ROOT%"=="" set ROOT=F:\datasets
set PROFILE=%~2
if "%PROFILE%"=="" set PROFILE=full
cd /d "%~dp0\.."

where python >nul 2>nul || (echo Python 3.10 or newer is required. Install it from python.org and tick "Add python.exe to PATH". & pause & exit /b 1)
python -m pip install -r tools\requirements.txt || goto :fail

echo.
echo === 1/3  Accent recordings (VCTK + Speech Accent Archive) ===
python tools\build_accent_data.py --root "%ROOT%" --profile %PROFILE% || goto :fail

echo.
echo === 2/3  Language voice library (Urdu, Japanese, Chuvash, German, Italian, Czech, Kurdish, Otomi) ===
python tools\build_voice_library.py --root "%ROOT%" --n 60 || goto :fail

echo.
echo === 3/3  Checks ===
call npm test

echo.
echo Done. Run "npm run build" or "npm run dev" to see the result. Commit public\accents and public\voices to GitHub.
pause
exit /b 0
:fail
echo.
echo Something went wrong. Read the message above, fix it, and run this file again (finished clips are kept, so it resumes).
pause
exit /b 1
