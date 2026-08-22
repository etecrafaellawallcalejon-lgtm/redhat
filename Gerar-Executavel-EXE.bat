@echo off
chcp 65001 > nul
title RedChat v3 - Gerador de Executavel Windows (.EXE)

echo ========================================================
echo         🔴 REDCHAT V3 - GERADOR DE .EXE (ELECTRON)
echo ========================================================
echo.

:: 1. Instalar dependências se necessário
if not exist "node_modules\" (
    echo [1/4] Instalando dependências básicas do projeto...
    call npm install
)

:: 2. Instalar electron e electron-builder se não estiverem instalados
echo [2/4] Verificando ferramentas de empacotamento Windows (Electron)...
call npm install --save-dev electron electron-builder concurrently wait-on

:: 3. Gerar o Build do React e do Servidor Backend
echo [3/4] Compilando arquivos frontend e backend...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Falha durante a compilação (npm run build).
    pause
    exit /b %errorlevel%
)

:: 4. Empacotar em executável Windows .exe
echo [4/4] Gerando instalador e executável .exe portátil...
call npx electron-builder --win --x64 --dir

echo.
echo ========================================================
echo  ✅ CONCLUÍDO COM SUCESSO!
echo  Seu executável foi gerado na pasta: dist/win-unpacked/
echo  Execute: dist/win-unpacked/redchat.exe
echo ========================================================
echo.
pause
