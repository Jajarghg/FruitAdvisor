const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let recommendationWindow;
const dataPath = path.join(__dirname, 'data', 'recommendations.json');

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));
}

function createRecommendationWindow() {
  recommendationWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  recommendationWindow.loadFile(path.join(__dirname, 'renderer/recommendations.html'));
}

ipcMain.on('open-recommendation-window', () => {
  createRecommendationWindow();
});

ipcMain.on('go-back-main', () => {
  if (recommendationWindow) {
    recommendationWindow.close();
  }
});

ipcMain.on('save-recommendation', (event, newData) => {
  let data = [];
  if (fs.existsSync(dataPath)) {
    data = JSON.parse(fs.readFileSync(dataPath));
  }
  const existingFruitIndex = data.findIndex(item => item.fruit === newData.fruit);
  if (existingFruitIndex !== -1) {
    data[existingFruitIndex].servings = parseInt(data[existingFruitIndex].servings) + parseInt(newData.servings);
  } else {
    data.push(newData);
  }
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
});

ipcMain.handle('load-recommendations', () => {
  if (!fs.existsSync(dataPath)) return [];
  return JSON.parse(fs.readFileSync(dataPath));
});

ipcMain.on('delete-recommendation', (event, index) => {
  let data = JSON.parse(fs.readFileSync(dataPath));
  data.splice(index, 1);
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
});

ipcMain.on('update-recommendation', (event, { index, servings }) => {
  if (!fs.existsSync(dataPath)) return;
  let data = JSON.parse(fs.readFileSync(dataPath));
  if (data[index]) {
    data[index].servings = servings; 
  }
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
});

app.whenReady().then(createMainWindow);