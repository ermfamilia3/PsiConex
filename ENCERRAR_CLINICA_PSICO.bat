@echo off
title Clinica PSICO - Encerrar Sistema
chcp 65001 > nul
cls

echo ========================================================
echo        ENCERRANDO O SISTEMA CLINICA PSICO
echo ========================================================
echo.

echo [1/2] Encerrando o servidor Backend FastAPI (porta 8000)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a > nul 2>&1
)

echo [2/2] Encerrando o servidor Frontend React (porta 5173)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do (
    taskkill /F /PID %%a > nul 2>&1
)

:: Fecha janelas associadas caso ainda estejam abertas
taskkill /F /FI "WINDOWTITLE eq Clinica PSICO - Backend API*" > nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Clinica PSICO - Frontend React*" > nul 2>&1

echo.
echo ========================================================
echo  Todos os serviços foram encerrados com sucesso!
echo ========================================================
echo.
timeout /t 3 > nul
