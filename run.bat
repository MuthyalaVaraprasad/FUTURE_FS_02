@echo off
echo ==========================================================
echo Starting Client Lead Management System (Mini CRM) Setup
echo ==========================================================
echo.
echo Installing dependencies (Root, Backend, and Frontend)...
call npm run install:all
echo.
echo Launching fullstack application in development mode...
echo Backend API will start on http://localhost:5000
echo Frontend Dev Server will start on http://localhost:5173
echo.
call npm run dev
pause
