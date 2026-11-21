# Сигнал — приложение для Windows и Mac

Программа для схем видеосигнала пультовых. Веб-версия: https://slavahoh1976-ops.github.io/signalflow/

**Скачать:** https://github.com/slavahoh1976-ops/signal-app/releases/latest

- Mac Intel — macOS 10.14.6 Mojave и все новее (Catalina, Big Sur … Sequoia): `Signal-Mac-Intel.zip`
- Mac M1/M2/M3/M4 (macOS 11 и новее): `Signal-Mac-AppleSilicon.zip`
- Windows 10/11: `Signal-Windows-Setup.exe` (установка) или `Signal-Windows-Portable.exe` (без установки)

## Как устроено
- `app/` — оболочка на Electron 26 (последняя версия Electron, которая работает на macOS 10.14).
- `app/web/index.html` — сама программа (та же, что на сайте, с встроенной базой приборов с фото), `app/web/version.txt` — её версия.
- Сборку делает GitHub Actions («Сборка для Windows и Mac») при каждом изменении в `app/` и выкладывает в Releases.

## Обновления
- **Программа** обновляется сама: при запуске и раз в 6 часов приложение читает
  `https://slavahoh1976-ops.github.io/signalflow/version.json`; если там версия новее —
  скачивает `…/signalflow/desktop/index.html` в папку пользователя и предлагает перезапуститься.
- **Приложение (оболочка)**: если в `version.json` поле `desktop.shell` новее версии приложения,
  оно предлагает открыть страницу загрузки.

## Архив Signal-All.zip
- `Signal-Mac-Intel.zip`, `Signal-Mac-AppleSilicon.zip` — приложение для Mac;
- `Signal-Windows-Setup.exe`, `Signal-Windows-Portable.exe` — для Windows;
- `Signal-web.html` — вся программа одним файлом (открывается в любом браузере, база с фото внутри);
- `source-program.zip` — исходники программы (репозиторий signalflow: src/app.js, lib.js, art.js, style.css, index.html, build.py, база devices.json);
- `source-app.zip` — исходники приложения-оболочки (этот репозиторий: Electron, сборка, обновления).
