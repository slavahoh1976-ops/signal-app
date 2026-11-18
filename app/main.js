// Сигнал — настольная оболочка (Windows / macOS 10.14+).
// Программа — это index.html (та же, что на сайте, с встроенной базой с фото).
// Обновления: при запуске и раз в 6 часов оболочка сверяется с сайтом и тихо скачивает
// новую index.html в папку пользователя; новая версия оболочки — предложение скачать.
const { app, BrowserWindow, Menu, dialog, shell, protocol, net, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const SITE = 'https://slavahoh1976-ops.github.io/signalflow/';
const RELEASES = 'https://slavahoh1976-ops.github.io/signalflow/download/';
const BUNDLED_DIR = path.join(__dirname, 'web');
const USER_DIR = () => path.join(app.getPath('userData'), 'web');

const num = v => String(v || '0').split('.').map(x => parseInt(x, 10) || 0);
const cmp = (a, b) => { a = num(a); b = num(b); for (let i = 0; i < 3; i++) if ((a[i] || 0) !== (b[i] || 0)) return (a[i] || 0) - (b[i] || 0); return 0; };
const readVer = dir => { try { return fs.readFileSync(path.join(dir, 'version.txt'), 'utf8').trim(); } catch (e) { return '0'; } };

// какую версию программы показывать: скачанную (если новее встроенной) или встроенную
function webDir() {
  const u = USER_DIR();
  if (fs.existsSync(path.join(u, 'index.html')) && cmp(readVer(u), readVer(BUNDLED_DIR)) > 0) return u;
  return BUNDLED_DIR;
}
const currentVer = () => readVer(webDir());

protocol.registerSchemesAsPrivileged([{ scheme: 'signal', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } }]);

let win = null;
function createWindow() {
  win = new BrowserWindow({
    width: 1440, height: 900, minWidth: 900, minHeight: 600, show: false,
    title: 'Сигнал', backgroundColor: '#ffffff',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, spellcheck: false },
  });
  win.once('ready-to-show', () => win.show());
  // внешние ссылки — в браузер
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (/^https?:/.test(url)) { e.preventDefault(); shell.openExternal(url); } });
  win.loadURL('signal://app/index.html');
}

// ---------- обновления
let checking = false;
async function checkUpdates(manual) {
  if (checking) return; checking = true;
  try {
    const r = await net.fetch(SITE + 'version.json?v=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const j = await r.json();
    const have = currentVer();
    let did = false;
    // 1) новая программа — скачиваем тихо
    if (cmp(j.version, have) > 0) {
      const h = await net.fetch(SITE + 'desktop/index.html?v=' + Date.now(), { cache: 'no-store' });
      if (!h.ok) throw new Error('HTTP ' + h.status);
      const html = await h.text();
      if (!html.includes(`APP_VERSION = '${j.version}'`)) throw new Error('файл версии ' + j.version + ' не совпал');
      const u = USER_DIR(); fs.mkdirSync(u, { recursive: true });
      fs.writeFileSync(path.join(u, 'index.html.tmp'), html);
      fs.renameSync(path.join(u, 'index.html.tmp'), path.join(u, 'index.html'));
      fs.writeFileSync(path.join(u, 'version.txt'), j.version);
      did = true;
      const res = await dialog.showMessageBox(win, {
        type: 'info', buttons: ['Перезапустить сейчас', 'Позже'], defaultId: 0, cancelId: 1,
        message: `Загружена новая версия «Сигнала» — ${j.version}`,
        detail: (j.notes ? j.notes + '\n\n' : '') + 'Схема и библиотека сохранятся. Если нажать «Позже», новая версия откроется при следующем запуске.',
      });
      if (res.response === 0 && win) win.webContents.reload();
    }
    // 2) новая оболочка — предлагаем скачать
    const sh = j.desktop && j.desktop.shell;
    if (sh && cmp(sh, app.getVersion()) > 0) {
      did = true;
      const res = await dialog.showMessageBox(win, {
        type: 'info', buttons: ['Открыть страницу загрузки', 'Позже'], defaultId: 0, cancelId: 1,
        message: `Вышла новая версия приложения «Сигнал» для компьютера — ${sh}`,
        detail: 'Скачайте и установите её поверх текущей. Схемы и библиотека сохранятся.',
      });
      if (res.response === 0) shell.openExternal((j.desktop && j.desktop.page) || RELEASES);
    }
    if (manual && !did) dialog.showMessageBox(win, { type: 'info', message: 'У вас последняя версия', detail: `Программа ${have}, приложение ${app.getVersion()}.` });
  } catch (e) {
    if (manual) dialog.showMessageBox(win, { type: 'warning', message: 'Не удалось проверить обновления', detail: String(e && e.message || e) + '\n\nПроверьте интернет и попробуйте позже.' });
  } finally { checking = false; }
}
ipcMain.handle('check-updates', () => checkUpdates(true));

// ---------- меню
function buildMenu() {
  const mac = process.platform === 'darwin';
  const upd = { label: 'Проверить обновления…', click: () => checkUpdates(true) };
  const about = { label: 'О программе', click: () => dialog.showMessageBox(win, { type: 'info', message: 'Сигнал — схемы видеосигнала', detail: `Программа ${currentVer()}\nПриложение ${app.getVersion()} (Electron ${process.versions.electron})\n\n${SITE}` }) };
  const tpl = [
    ...(mac ? [{ label: 'Сигнал', submenu: [about, upd, { type: 'separator' }, { role: 'hide', label: 'Скрыть «Сигнал»' }, { role: 'hideOthers', label: 'Скрыть остальные' }, { role: 'unhide', label: 'Показать все' }, { type: 'separator' }, { role: 'quit', label: 'Выйти из «Сигнала»' }] }] : []),
    { label: 'Правка', submenu: [{ role: 'undo', label: 'Отменить' }, { role: 'redo', label: 'Повторить' }, { type: 'separator' }, { role: 'cut', label: 'Вырезать' }, { role: 'copy', label: 'Копировать' }, { role: 'paste', label: 'Вставить' }, { role: 'selectAll', label: 'Выделить всё' }] },
    { label: 'Вид', submenu: [{ role: 'reload', label: 'Перезагрузить' }, { role: 'togglefullscreen', label: 'Во весь экран' }, { type: 'separator' }, { role: 'resetZoom', label: 'Масштаб окна 100%' }, { role: 'zoomIn', label: 'Крупнее' }, { role: 'zoomOut', label: 'Мельче' }, { type: 'separator' }, { role: 'toggleDevTools', label: 'Инструменты разработчика' }] },
    { label: 'Окно', submenu: [{ role: 'minimize', label: 'Свернуть' }, { role: 'close', label: 'Закрыть' }] },
    { label: 'Справка', submenu: [...(mac ? [] : [about, upd, { type: 'separator' }]), { label: 'Сайт программы', click: () => shell.openExternal(SITE) }, { label: 'Страница загрузки', click: () => shell.openExternal(RELEASES) }] },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(tpl));
}

if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
  app.whenReady().then(() => {
    // signal://app/<файл> → файл из текущей папки программы (адрес один и тот же, поэтому данные программы не теряются при обновлении)
    protocol.registerFileProtocol('signal', (req, cb) => {
      const rel = decodeURIComponent(new URL(req.url).pathname).replace(/^\/+/, '') || 'index.html';
      const file = path.normalize(path.join(webDir(), rel));
      if (!file.startsWith(webDir())) return cb({ error: -10 });
      cb({ path: file });
    });
    buildMenu(); createWindow();
    setTimeout(() => checkUpdates(false), 4000);
    setInterval(() => checkUpdates(false), 6 * 3600 * 1000);
    app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
  });
  app.on('window-all-closed', () => app.quit());
}
