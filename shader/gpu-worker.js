import * as wgpu from 'wgpu-matrix';
import vertShader from './basic.vert.wgsl?raw';
import fragShader from './vertexPositionColor.frag.wgsl?raw';

const { mat4, vec3 } = wgpu;

let _canvas;
let _adapter;
let _device;
let _context;
let _presentationFormat;
let _frameFn;
let _projectionMatrix;
let _renderPassDescriptor;
let _uniformBindGroup;
let _uniformBuffer;
let _pipeline;
let _verticesBuffer;

(async () => {
const {
  cubeVertexArray,
  cubeVertexSize,
  cubeUVOffset,
  cubePositionOffset,
  cubeVertexCount,
} = await import('./cube.js');

let direction = 0;

self.addEventListener('message', (ev) => {
  console.log('gpu update', ev)

  switch (ev.data.type) {
    case 'update': {
      direction = direction === 0 ? 1 : 0;
      break;
    }
    case 'click': {
      break;
    }
    case 'updateShader': {
      try {
        const { 
          vertShader,
          fragShader,
          computeShader, 
        } = ev.data.args;
        console.log('vertShader', vertShader);
        console.log('fragShader', fragShader);
        console.log('computeShader', computeShader);
        update({ vertShader, fragShader, computeShader });
      } catch (err) {
        console.error(
          `Error updating WebGPU worker process: ${err.message}`
        )
      }
      break;
    }
    case 'init': {
      try {
        init(ev.data.offscreenCanvas);
      } catch (err) {
        console.error(
          `Error while initializing WebGPU in worker process: ${err.message}`
        );
      }
      break;
    }
  }
});

function getTransformationMatrix() {
  const modelViewProjectionMatrix = mat4.create();
  const viewMatrix = mat4.identity();
  mat4.translate(viewMatrix, vec3.fromValues(0, 0, -4), viewMatrix);

  const now = Date.now() / 1000;

  if (direction) {
    mat4.rotate(
      viewMatrix,
      vec3.fromValues(Math.sin(now), Math.cos(now), 0),
      1,
      viewMatrix
    );
  } else {
    mat4.rotate(
      viewMatrix,
      vec3.fromValues(Math.cos(now), Math.sin(now), 0),
      1,
      viewMatrix
    );
  }
  mat4.multiply(_projectionMatrix, viewMatrix, modelViewProjectionMatrix);

  return modelViewProjectionMatrix;
}

function _default_frameFn() {
  const transformationMatrix = getTransformationMatrix();
  _device.queue.writeBuffer(
    _uniformBuffer,
    0,
    transformationMatrix.buffer,
    transformationMatrix.byteOffset,
    transformationMatrix.byteLength
  );
  _renderPassDescriptor.colorAttachments[0].view = _context
    .getCurrentTexture()
    .createView();

  const commandEncoder = _device.createCommandEncoder();
  const passEncoder = commandEncoder.beginRenderPass(_renderPassDescriptor);
  passEncoder.setPipeline(_pipeline);
  passEncoder.setBindGroup(0, _uniformBindGroup);
  passEncoder.setVertexBuffer(0, _verticesBuffer);
  passEncoder.draw(cubeVertexCount);
  passEncoder.end();
  _device.queue.submit([commandEncoder.finish()]);

  requestAnimationFrame(_frameFn);
}


async function update(shaders) {
  console.log('-> update render worker.js');

  const { 
    vertShader,
    fragShader,
    computeShader 
  } = shaders;

  // Create a vertex buffer from the cube data.
  _verticesBuffer = _device.createBuffer({
    size: cubeVertexArray.byteLength,
    usage: GPUBufferUsage.VERTEX,
    mappedAtCreation: true,
  });
  new Float32Array(_verticesBuffer.getMappedRange()).set(cubeVertexArray);
  _verticesBuffer.unmap();

  _pipeline = _device.createRenderPipeline({
    layout: 'auto',
    vertex: {
      module: _device.createShaderModule({
        code: vertShader,
      }),
      buffers: [
        {
          arrayStride: cubeVertexSize,
          attributes: [
            {
              // position
              shaderLocation: 0,
              offset: cubePositionOffset,
              format: 'float32x4',
            },
            {
              // uv
              shaderLocation: 1,
              offset: cubeUVOffset,
              format: 'float32x2',
            },
          ],
        },
      ],
    },
    fragment: {
      module: _device.createShaderModule({
        code: fragShader,
      }),
      targets: [
        {
          format: _presentationFormat,
        },
      ],
    },
    primitive: {
      topology: 'triangle-list',
      cullMode: 'back',
    },

    depthStencil: {
      depthWriteEnabled: true,
      depthCompare: 'less',
      format: 'depth24plus',
    },
  });

  const depthTexture = _device.createTexture({
    size: [_canvas.width, _canvas.height],
    format: 'depth24plus',
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });

  const uniformBufferSize = 4 * 16; // 4x4 matrix
  _uniformBuffer = _device.createBuffer({
    size: uniformBufferSize,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  _uniformBindGroup = _device.createBindGroup({
    layout: _pipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: _uniformBuffer,
        },
      },
    ],
  });

  _renderPassDescriptor = {
    colorAttachments: [
      {
        view: undefined, // Assigned later

        clearValue: [0.5, 0.5, 0.5, 1.0],
        loadOp: 'clear',
        storeOp: 'store',
      },
    ],
    depthStencilAttachment: {
      view: depthTexture.createView(),

      depthClearValue: 1.0,
      depthLoadOp: 'clear',
      depthStoreOp: 'store',
    },
  };

  const aspect = _canvas.width / _canvas.height;
  _projectionMatrix = mat4.perspective(
    (2 * Math.PI) / 5,
    aspect,
    1,
    100.0
  );

  requestAnimationFrame(_frameFn);
}

async function init(canvas) {
  console.log('-> init render worker.js');

  if (!canvas) {
    throw Error('no canvas given')
  }

  _canvas = canvas;

  if (!navigator.gpu) {
    throw Error('WebGPU not supported')
  }

  _adapter = await navigator.gpu.requestAdapter();

  if (!_adapter) {
    throw Error('Could not request WebGPU adapter')
  }

  _device = await _adapter.requestDevice();

  if (!_device) {
    throw Error('Could not request renderer device')
  }

  _context = _canvas.getContext('webgpu');

  if (!_context) {
    throw Error('Could not acquire WebGPU context')
  }

  _presentationFormat = navigator.gpu.getPreferredCanvasFormat();

  _context.configure({
    device: _device,
    format: _presentationFormat,
    alphaMode: 'premultiplied',
  });

  _frameFn = _default_frameFn;
  
  // initiate 1st render
  update({
    vertShader,
    fragShader,
    computeShader: '<HARDCODED: NOT SET>',
  });
}

self.postMessage({ type: 'ready' })
})();