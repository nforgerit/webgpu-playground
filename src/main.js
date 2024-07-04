const initialState = {}

/*
 * Process state
 */

const proc = new Worker(new URL('./proc/worker.js', import.meta.url));


/*
 * Renderer
 */

const canvas = document.querySelector('canvas#main');

const offscreenCanvas = canvas.transferControlToOffscreen();
const devicePixelRatio = window.devicePixelRatio;
offscreenCanvas.width = canvas.clientWidth * devicePixelRatio;
offscreenCanvas.height = canvas.clientHeight * devicePixelRatio;

const renderer = new Worker(new URL('./renderer/worker.js', import.meta.url));

renderer.addEventListener('message', (ev) => {
  switch (ev.data.type) {
    case 'ready': {
      renderer.postMessage({ type: 'init', offscreenCanvas }, [offscreenCanvas]);
      break;
    }
    default: {
      console.error(`Unknown Message Type: ${ev.data.type}`);
    }
  }
});


/*
 * Event handlers
 */

const calculateBtn = document.querySelector('button[type=submit]')
calculateBtn.addEventListener('click', (ev) => {
  ev.preventDefault();
  const input = document.querySelector('input[type=text]').value
  proc.postMessage({ type: 'input', data: parseInt(input) })
})

canvas.addEventListener('click', (ev) => {
  // proc.postMessage({ type: 'click', data: ev.data })
});

proc.addEventListener('message', (ev) => {
  switch (ev.data.type) {
    case 'update': {
      renderer.postMessage({ type: 'update', data: ev.data })
      const out = document.querySelector('output')
      out.value = ev.data.data.result;
      break;
    }
    case 'ready': {
      proc.postMessage({ type: 'init', initialState });
      break;
    }
    default: {
      console.error(`Unknown Message Type: ${ev.data.type}`);
    }
  }
});

