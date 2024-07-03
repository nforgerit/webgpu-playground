"user strict";

let instance

(async (self) => {
  self.addEventListener('message', async (ev) => {
    switch (ev.data.type) {
      case 'input': {
        let { data: input } = ev.data;
        const { factorial } = instance.exports;
        const result = factorial(input);

        self.postMessage({ type: 'update', data: { result }})
        break;
      }
      case 'click': {
        self.postMessage({ type: 'update', data: { i: 'got', updated: 'now' }})
        break;
      }
      case 'init': {
        try {
          await init();
        } catch (err) {
          console.error(
            `Error while initializing Processing in worker process: ${err.message}`
          );
        }
        break;
      }
    }
  });

  async function init() {
    console.log('-> init processing worker.js');

    if (!instance) {
      const importObject = { imports: { imported_func: (arg) => console.log(arg) } };
      const module = await WebAssembly.compileStreaming(fetch('app.wasm'));
      instance = await WebAssembly.instantiate(module, importObject);
    }
  }

  self.postMessage({ type: 'ready' })
})(self);


