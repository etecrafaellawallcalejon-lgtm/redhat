const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

let mainWindow = null;
let serverChildProcess = null;
const SERVER_PORT = 3000;
const SERVER_URL = `http://localhost:${SERVER_PORT}`;

// Função para checar se o servidor já está pronto
function checkServerReady(timeoutMs = 15000) {
  const startTime = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      const req = http.get(`${SERVER_URL}/api/health`, (res) => {
        if (res.statusCode === 200) {
          resolve(true);
        } else {
          retry();
        }
      });

      req.on('error', () => {
        retry();
      });

      req.setTimeout(1000, () => {
        req.destroy();
        retry();
      });

      function retry() {
        if (Date.now() - startTime > timeoutMs) {
          reject(new Error('Tempo limite excedido aguardando o servidor RedChat inicializar.'));
        } else {
          setTimeout(check, 400);
        }
      }
    };
    check();
  });
}

function startBackendServer() {
  const isPackaged = app.isPackaged;
  const serverPath = isPackaged
    ? path.join(process.resourcesPath, 'app.asar', 'dist', 'server.cjs')
    : path.join(__dirname, 'dist', 'server.cjs');

  try {
    serverChildProcess = spawn(process.execPath, [serverPath], {
      env: {
        ...process.env,
        NODE_ENV: 'production',
        PORT: String(SERVER_PORT)
      },
      stdio: 'ignore',
      shell: false
    });

    serverChildProcess.on('error', (err) => {
      console.error('Erro no processo do servidor backend:', err);
    });
  } catch (err) {
    console.error('Falha ao iniciar servidor backend:', err);
  }
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 840,
    minWidth: 960,
    minHeight: 640,
    title: 'RedChat v3',
    backgroundColor: '#0a0505',
    autoHideMenuBar: true,
    show: false, // Só exibe quando estiver pronto para evitar tela branca
    icon: path.join(__dirname, 'public', 'favicon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'electron-preload.cjs')
    }
  });

  mainWindow.loadURL(SERVER_URL);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Abrir links externos no navegador padrão do sistema
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    // 1. Tenta verificar se já existe um servidor rodando
    let alreadyRunning = false;
    try {
      await checkServerReady(1000);
      alreadyRunning = true;
    } catch {
      alreadyRunning = false;
    }

    // 2. Se não estiver rodando, inicia o backend embutido
    if (!alreadyRunning) {
      startBackendServer();
      await checkServerReady(15000);
    }

    // 3. Cria e exibe a janela do RedChat
    createMainWindow();
  } catch (error) {
    console.error('Erro na inicialização:', error);
    // Mesmo com erro tenta abrir para permitir visualização
    createMainWindow();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (serverChildProcess) {
    try {
      serverChildProcess.kill();
    } catch {}
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
