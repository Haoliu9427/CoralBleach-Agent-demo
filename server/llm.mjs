// Chat Completions adapter adapted from GlobalHAB platform_models.py / remote_qwen.py.
// Configuration is server-owned. Never include secrets in catalog or experiment outputs.
export function catalog(env=process.env){
  let entries=[];
  if(env.CORAL_PLATFORM_MODELS){try{entries=JSON.parse(env.CORAL_PLATFORM_MODELS);}catch{throw Error('CORAL_PLATFORM_MODELS must be a JSON array');}}
  const base_url=env.CORAL_LLM_BASE_URL||env.HAB_QWEN_BASE_URL,api_key=env.CORAL_LLM_API_KEY||env.HAB_QWEN_API_KEY,model=env.CORAL_LLM_MODEL||env.HAB_QWEN_MODEL;
  if(base_url&&api_key&&model)entries.push({name:model,base_url,api_key,model});
  return entries.filter(e=>e.enabled!==false&&e.base_url&&e.api_key&&e.model).map((e,i)=>({...e,id:`platform_${i}`}));
}
export const publicCatalog=entries=>entries.map(({id,name,model})=>({id,name:name||model,model}));
export {visibleText,chat,SYSTEM} from '../dist/llm-client.js';
