import default_vertShader from './basic.vert.wgsl?raw';
import default_fragShader from './vertexPositionColor.frag.wgsl?raw';

const initialState = {}

async function init() {
  const vertShaderEl = document.querySelector('#vertShader');
  vertShaderEl.value = default_vertShader;
  const fragShaderEl = document.querySelector('#fragShader');
  fragShaderEl.value = default_fragShader;
  const computeShaderEl = document.querySelector('#computeShader');
  computeShaderEl.value = '<HARDCODED: NOT SET>';
}


/*
 * Process state
 */

const proc = new Worker(new URL('./proc-worker.js', import.meta.url));


/*
 * Renderer
 */

const canvas = document.querySelector('canvas#spinning-cube');

const offscreenCanvas = canvas.transferControlToOffscreen();
const devicePixelRatio = window.devicePixelRatio;
offscreenCanvas.width = canvas.clientWidth * devicePixelRatio;
offscreenCanvas.height = canvas.clientHeight * devicePixelRatio;

const renderer = new Worker(new URL('./gpu-worker.js', import.meta.url));

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

const submitBtn = document.querySelector('button[type=submit]')
submitBtn.addEventListener('click', (ev) => {
  ev.preventDefault();
  const vertShader = document.querySelector('textarea#vertShader').value;
  const fragShader = document.querySelector('textarea#fragShader').value;
  const computeShader = document.querySelector('textarea#computeShader').value;

  renderer.postMessage({ type: 'updateShader', args: {
    vertShader,
    fragShader,
    computeShader,
  }});
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

(async () => await init())();