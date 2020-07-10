/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable default-case */
/* eslint global-require: off, no-console: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build-main`, this file is compiled to
 * `./app/main.prod.js` using webpack. This gives us some performance wins.
 */
// eslint-disable-next-line prettier/prettier
import path from 'path';
import { app, BrowserWindow, session } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import { ElectronBlocker } from '@cliqz/adblocker-electron';
import fetch from 'cross-fetch'; // required 'fetch'
import MenuBuilder from './menu';

const express = require('express');

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

ElectronBlocker.fromPrebuiltAdsAndTracking(fetch)
  // eslint-disable-next-line promise/always-return
  .then((blocker) => {
    blocker.enableBlockingInSession(session.defaultSession);
  })
  .catch((err) => {
    console.log(err);
  });

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (
  process.env.NODE_ENV === 'development' ||
  process.env.DEBUG_PROD === 'true'
) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS'];

  return Promise.all(
    extensions.map((name) => installer.default(installer[name], forceDownload))
  ).catch(console.log);
};

const createWindow = async () => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
  ) {
    await installExtensions();
  }

  mainWindow = new BrowserWindow({
    width: 1024,
    height: 728,
    // fullscreen: true,
    // frame: true,
    transparent: false,
    webPreferences: {
      webSecurity: true,
      nodeIntegration: false,
      // allowRunningInsecureContent: true,
      devTools: true,
      preload: path.join(__dirname, 'preload/preload.js'),
    },
  });

  mainWindow.webContents.openDevTools();

  mainWindow.loadURL(`https://chess.com/live`, {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36'
  });

  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('ready', createWindow);

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow();
});

const expressApp = express();

expressApp.listen(3000);
expressApp.use(express.urlencoded());

expressApp.post('/stockfish', (req: any, res: any) => {
  const uciMessage = req.body.uci;
  const stockfish = require("./scripts/stockfish");
  const engine = stockfish();

function send(str: string)
{
    console.log(`Sending: ${  str}`)
    engine.postMessage(str);
}

if (process.argv[2] === "--help") {
    console.log("Usage: node simple_node.js [FEN OR move1 move2 ...moveN]");
    console.log("");
    console.log("Examples:");
    console.log("   node simple_node.js");
    console.log("   node simple_node.js \"rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2\"");
    console.log("   node simple_node.js g1f3 e7e5");
    process.exit();
}

engine.onmessage = function (line: string)
{
    let match;
    console.log(`Line: ${  line}`)
    
    if (typeof line !== "string") {
        console.log("Got line:");
        console.log(typeof line);
        console.log(line);
    }

  }
  send("uci");
})