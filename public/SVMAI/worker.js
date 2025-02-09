import { WebWorkerMLCEngineHandler, MLCEngine, AppConfig } from '@mlc-ai/web-llm';

const engine = new MLCEngine();
const handler = new WebWorkerMLCEngineHandler();
handler.engine = engine;

// Initialize the engine with the model configuration
engine.setAppConfig({
  model_list: [{
    model_lib: '/SVMAI/web-llm.wasm',
    model_id: 'model',
    model: '/SVMAI/model.gguf'
  }]
});

onmessage = (event) => handler.onmessage(event);
