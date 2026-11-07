import { app, BrowserWindow, ipcMain, Menu, net, protocol, shell } from 'electron';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/**
 * Desktop shell: serves the built web game from `app://game/` in a sandboxed window with a
 * minimal preload. Works offline: the game makes no network requests.
 */
const here = path.dirname(fileURLToPath(import.meta.url));
const GAME_DIR = path.join(here, '..', 'game');
const ORIGIN = 'app://game';
const smoke = process.argv.includes('--smoke');

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true },
  },
]);

async function serve(req: Request): Promise<Response> {
  const url = new URL(req.url);
  if (url.host !== 'game') return new Response('Not found', { status: 404 });
  const rel = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
  const file = path.normalize(path.join(GAME_DIR, rel));
  if (!file.startsWith(GAME_DIR + path.sep)) return new Response('Not found', { status: 404 });
  const res = await net.fetch(pathToFileURL(file).toString());
  if (!res.ok) return new Response('Not found', { status: 404 });
  return new Response(res.body, {
    status: 200,
    headers: {
      'Content-Type': MIME[path.extname(file)] ?? 'application/octet-stream',
      // Everything the game needs is in the package; nothing may load from elsewhere.
      'Content-Security-Policy':
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'",
    },
  });
}

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 600,
    backgroundColor: '#050505',
    title: 'Noosphere',
    show: !smoke,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(here, '..', 'preload.cjs'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      devTools: !app.isPackaged,
      // The score and the idea notes start on the first click; let them play
      autoplayPolicy: 'no-user-gesture-required',
    },
  });
  // Stay inside the game: external links open in the browser, nothing else navigates.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) void shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(ORIGIN)) event.preventDefault();
  });
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown' && input.key === 'F11') {
      win.setFullScreen(!win.isFullScreen());
      event.preventDefault();
    }
  });
  const query = smoke ? '?smoke=1' : '';
  void win.loadURL(`${ORIGIN}/index.html${query}`);
  return win;
}

/** `--smoke`: open the game hidden, check it boots to the menu, print the result and exit. */
async function runSmoke(win: BrowserWindow): Promise<void> {
  const deadline = Date.now() + 60_000;
  let result: { ready?: boolean; font?: boolean; href?: string } | null = null;
  while (Date.now() < deadline) {
    result = await win.webContents
      .executeJavaScript(
        `({ ready: window.noosphereBoot?.ready === true, font: document.fonts.check('16px "Space Grotesk"'), href: location.href })`,
      )
      .catch(() => null);
    if (result?.ready) break;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  console.log(`SMOKE ${JSON.stringify(result)}`);
  app.exit(result?.ready === true ? 0 : 1);
}

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);
  ipcMain.on('noosphere:quit', () => app.quit());
  protocol.handle('app', serve);
  const win = createWindow();
  if (smoke) await runSmoke(win);
});

app.on('window-all-closed', () => app.quit());
