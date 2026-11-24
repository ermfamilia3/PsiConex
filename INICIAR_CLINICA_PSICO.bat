@echo off
title Clinica PSICO - Inicializador Automatico
chcp 65001 > nul
cls

echo ========================================================
echo        INICIANDO O SISTEMA CLINICA PSICO v2.0
echo ========================================================
echo.

set "PROJ_DIR=D:\home\Enzo_25370.LAB\Documents\Projeto TCC - 17-11-2026"

echo [1/3] Iniciando o Servidor Backend (FastAPI)...
start "Clinica PSICO - Backend API" cmd /k "cd /d "%PROJ_DIR%\backend" && ..\.venv\Scripts\python.exe -m uvicorn main:app --reload --host 127.0.0.1 --port 8000"

timeout /t 3 /nobreak > nul

echo [2/3] Iniciando o Servidor Frontend (React + Vite)...
start "Clinica PSICO - Frontend React" cmd /k "cd /d "%PROJ_DIR%\frontend\Clinica-PSICO-React" && npm run dev"

timeout /t 3 /nobreak > nul

echo [3/3] Abrindo o navegador no sistema...
start http://localhost:5173

echo.
echo ========================================================
echo  Sistema iniciado com sucesso!
echo  Acesse: http://localhost:5173
echo  Login inicial: admin@clinicapsico.com.br
echo  Senha: Admin@123
echo ========================================================
echo.
pause
