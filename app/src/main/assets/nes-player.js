import { Browser, Controller } from 'jsnes';

const screen = document.getElementById('screen');
const statusLine = document.getElementById('status');
const picker = document.getElementById('rom-picker');
const chooseRom = document.getElementById('choose-rom');
const touchControls = document.getElementById('touch-controls');
const pauseButton = document.getElementById('pause-button');
let emulator = null;
let paused = false;

function setStatus(message, kind) {
  statusLine.textContent = message;
  statusLine.dataset.kind = kind || 'info';
}

function bytesToBinary(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + chunkSize, bytes.length)));
  }
  return binary;
}

function showPicker(message) {
  setStatus(message || 'No se ha encontrado la ROM integrada. Selecciona famidash.nes.', 'warning');
  chooseRom.hidden = false;
  picker.hidden = true;
}

function startEmulator(romData, name) {
  try {
    if (emulator) {
      emulator.destroy();
      emulator = null;
    }
    screen.replaceChildren();
    emulator = new Browser({
      container: screen,
      romData,
      onError: (error) => setStatus('Error del emulador: ' + (error && error.message ? error.message : error), 'error')
    });
    const keys = { ...emulator.keyboard.keys };
    keys[32] = [1, Controller.BUTTON_A, 'Space'];
    keys[38] = [1, Controller.BUTTON_A, 'Up / Jump'];
    keys[87] = [1, Controller.BUTTON_A, 'W'];
    keys[13] = [1, Controller.BUTTON_START, 'Enter'];
    keys[73] = [1, Controller.BUTTON_UP, 'I'];
    emulator.keyboard.setKeys(keys);
    paused = false;
    pauseButton.textContent = 'Pausar';
    chooseRom.hidden = true;
    picker.hidden = true;
    touchControls.hidden = false;
    setStatus(name + ' · En ejecución', 'ok');
    window.scrollTo(0, 0);
  } catch (error) {
    showPicker('No se pudo cargar la ROM: ' + (error && error.message ? error.message : error));
  }
}

function tryLoadBundledRom() {
  try {
    if (window.AndroidBridge && typeof window.AndroidBridge.readAssetBase64 === 'function') {
      const base64 = window.AndroidBridge.readAssetBase64('famidash.nes');
      if (base64 && base64.length > 100) {
        startEmulator(atob(base64), 'Famidash');
        return;
      }
    }
  } catch (error) {
    console.warn('No se pudo leer la ROM integrada', error);
  }
  showPicker('La ROM no está integrada en esta compilación. Selecciona tu archivo .nes.');
}

picker.addEventListener('change', () => {
  const file = picker.files && picker.files[0];
  if (!file) return;
  if (!file.name.toLowerCase().endsWith('.nes')) {
    showPicker('El archivo debe tener extensión .nes.');
    return;
  }
  const reader = new FileReader();
  reader.onerror = () => showPicker('No se pudo leer el archivo seleccionado.');
  reader.onload = () => {
    try {
      const bytes = new Uint8Array(reader.result);
      if (bytes.length < 16 || bytes[0] !== 0x4e || bytes[1] !== 0x45 || bytes[2] !== 0x53 || bytes[3] !== 0x1a) {
        showPicker('El archivo seleccionado no tiene una cabecera NES válida.');
        return;
      }
      startEmulator(bytesToBinary(reader.result), file.name);
    } catch (error) {
      showPicker('No se pudo preparar la ROM.');
    }
  };
  reader.readAsArrayBuffer(file);
});

chooseRom.addEventListener('click', () => picker.click());

pauseButton.addEventListener('click', () => {
  if (!emulator) return;
  if (paused) {
    emulator.start();
    paused = false;
    pauseButton.textContent = 'Pausar';
    setStatus('Famidash · En ejecución', 'ok');
  } else {
    emulator.stop();
    paused = true;
    pauseButton.textContent = 'Continuar';
    setStatus('Pausa', 'warning');
  }
});

const touchMap = {
  a: Controller.BUTTON_A,
  b: Controller.BUTTON_B,
  start: Controller.BUTTON_START,
  select: Controller.BUTTON_SELECT,
  up: Controller.BUTTON_UP,
  down: Controller.BUTTON_DOWN,
  left: Controller.BUTTON_LEFT,
  right: Controller.BUTTON_RIGHT
};

function bindTouchButton(element) {
  const button = touchMap[element.dataset.button];
  if (button === undefined) return;
  const down = (event) => {
    event.preventDefault();
    if (!emulator || paused) return;
    try { emulator.nes.buttonDown(1, button); } catch (_) {}
    element.classList.add('pressed');
    if (emulator._speakers && emulator._speakers.audioCtx && emulator._speakers.audioCtx.state === 'suspended') {
      emulator._speakers.audioCtx.resume().catch(() => {});
    }
  };
  const up = (event) => {
    event.preventDefault();
    if (emulator) {
      try { emulator.nes.buttonUp(1, button); } catch (_) {}
    }
    element.classList.remove('pressed');
  };
  element.addEventListener('pointerdown', down);
  element.addEventListener('pointerup', up);
  element.addEventListener('pointercancel', up);
  element.addEventListener('lostpointercapture', up);
  element.addEventListener('contextmenu', (event) => event.preventDefault());
}

document.querySelectorAll('[data-button]').forEach(bindTouchButton);

window.gameBack = function () {
  if (!emulator) return;
  if (!paused) {
    emulator.stop();
    paused = true;
    pauseButton.textContent = 'Continuar';
    setStatus('Pausa', 'warning');
  } else {
    emulator.start();
    paused = false;
    pauseButton.textContent = 'Pausar';
    setStatus('Famidash · En ejecución', 'ok');
  }
};

window.addEventListener('resize', () => {
  if (emulator) emulator.fitInParent();
});

tryLoadBundledRom();