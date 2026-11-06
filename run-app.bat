@echo off
rem Starts the teacher server and the app, each in its own window.
start "Teacher server" cmd /k "cd /d %~dp0server && npm start"
start "App" cmd /k "cd /d %~dp0 && npm run dev"
echo Two windows were opened. Open http://localhost:5173 in your browser.
