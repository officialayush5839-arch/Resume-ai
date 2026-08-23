@echo off
echo =========================================
echo          Starting ResumeIQ System        
echo =========================================

echo Starting Backend API (FastAPI)...
start "ResumeIQ Backend" cmd /k "cd backend && if exist venv\Scripts\activate.bat (call venv\Scripts\activate.bat) && uvicorn app.main:app --reload"

echo Starting Frontend UI (Vite/React)...
start "ResumeIQ Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Both services are starting up in separate terminal windows!
echo - Backend API will be available at: http://localhost:8000
echo - Frontend UI will be available at: http://localhost:5173
echo.
pause
