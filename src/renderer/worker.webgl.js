"user strict";

let instance = null

self.addEventListener('message', async (e) => {
  const { integer, module } = e.data
  const importObject = {}

  instance = instance || await WebAssembly.instantiate(module, importObject) 
  const factorial = instance.exports.factorial
  const result = factorial(integer)

  self.postMessage({ result })
})