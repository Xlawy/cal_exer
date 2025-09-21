const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    icon: path.join(__dirname, 'assets/icon.png'),
    title: '数学练习题生成器'
  });

  mainWindow.loadFile('index.html');

  // 开发模式下打开开发者工具
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// 处理保存PDF的IPC消息
ipcMain.handle('save-pdf', async (event, { filename, data }) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: '保存PDF文件',
      defaultPath: filename,
      filters: [
        { name: 'PDF文件', extensions: ['pdf'] }
      ]
    });

    if (!result.canceled) {
      fs.writeFileSync(result.filePath, data);
      return { success: true, path: result.filePath };
    }
    return { success: false, message: '用户取消了保存' };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// 处理保存答案的IPC消息
ipcMain.handle('save-answers', async (event, { filename, data }) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: '保存答案文件',
      defaultPath: filename,
      filters: [
        { name: '文本文件', extensions: ['txt'] }
      ]
    });

    if (!result.canceled) {
      fs.writeFileSync(result.filePath, data);
      return { success: true, path: result.filePath };
    }
    return { success: false, message: '用户取消了保存' };
  } catch (error) {
    return { success: false, message: error.message };
  }
});
