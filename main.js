const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  console.log('=== 创建主窗口 ===');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('isPackaged:', app.isPackaged);
  console.log('process.pkg:', process.pkg);
  console.log('process.resourcesPath:', process.resourcesPath);
  console.log('process.argv:', process.argv);

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
    console.log('开发模式：打开开发者工具');
    mainWindow.webContents.openDevTools();
  }
  
  // 只在明确指定调试模式时打开开发者工具
  if (process.env.DEBUG === 'true' || process.argv.includes('--debug')) {
    console.log('调试模式：打开开发者工具');
    mainWindow.webContents.openDevTools();
  }

  // 添加键盘快捷键来手动打开开发者工具
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.control && input.shift && input.key.toLowerCase() === 'i') {
      mainWindow.webContents.openDevTools();
    }
  });

  // 监听窗口准备就绪事件
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('窗口加载完成');
    // 只在明确指定调试模式时延迟打开开发者工具
    if (process.env.DEBUG === 'true' || process.argv.includes('--debug')) {
      console.log('延迟打开开发者工具');
      setTimeout(() => {
        mainWindow.webContents.openDevTools();
      }, 1000);
    }
  });
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
