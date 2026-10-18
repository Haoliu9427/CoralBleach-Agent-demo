import {compoundBenchmark} from './compound.js';
import {benchmark} from './engine.js';
import {runLLM} from './planner.js';
import {chat,postAPI,SYSTEM} from './llm-client.js';
self.onmessage=async e=>{
  const {config,connection}=e.data;
  try{
    if(config.mode==='llm'){
      const result=await runLLM(config, messages=>connection.transport==='modelscope-browser'
        ?chat(connection.credentials,[{role:'system',content:SYSTEM},...messages])
        :postAPI('plan',{modelId:config.modelId,runId:config.runId,messages}),progress=>self.postMessage({progress}));
      self.postMessage({llm:result,runId:config.runId,modelId:config.modelId,connectionId:connection.connectionId});
    }else self.postMessage(config.track==='compound'?compoundBenchmark(config):benchmark(config));
  }catch(error){self.postMessage({error:error.message});}
};
