@echo off
chcp 65001 > nul
title RedChat v3 - Inicializador Rápido

echo ========================================================
echo               🔴 REDCHAT V3 - INICIALIZAÇÃO
echo ========================================================
echo.

:: Verifica se a pasta node_modules existe
if not exist "node_modules\" (
    echo [1/3] Dependências não encontradas. Instalando agora...
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo [ERRO] Falha ao instalar dependências. Verifique o Node.js.
        pause
        exit /b %errorlevel%
    )
) else (
    echo [1/3] Dependências já instaladas!
)

echo [2/3] Abrindo o RedChat no seu navegador padrão...
start http://localhost:3000

echo [3/3] Iniciando o servidor RedChat...
echo.
echo Servidor rodando em: http://localhost:3000
echo (Para fechar o servidor, feche esta janela ou pressione Ctrl+C)
echo ========================================================
echo.

call npm run dev
pause
