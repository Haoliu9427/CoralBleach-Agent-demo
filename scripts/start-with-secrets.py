"""Launch the local server using the same TOML sections as GlobalHAB.
Usage: python scripts/start-with-secrets.py /path/to/secrets.toml
Credentials stay in the child process environment, never browser output.
"""
import json, os, pathlib, subprocess, sys, tomllib
path=pathlib.Path(sys.argv[1])
with path.open('rb') as f: secrets=tomllib.load(f)
entries=list(secrets.get('platform_models',[]))
q=secrets.get('qwen',{})
if all(q.get(k) for k in ['base_url','model','api_key']):
    for mid in q.get('models',[q['model']]): entries.append(dict(q,model=mid))
ms=secrets.get('modelscope',{})
if ms.get('api_key'):
    for mid in ms.get('models',[]): entries.append(dict(name=mid,base_url='https://api-inference.modelscope.cn/v1',model=mid,api_key=ms['api_key']))
if not entries: raise SystemExit('No configured models; provide explicit model IDs available to your account.')
env=dict(os.environ,CORAL_PLATFORM_MODELS=json.dumps(entries))
subprocess.run(['node','scripts/serve.mjs'],env=env,cwd=pathlib.Path(__file__).resolve().parent.parent,check=True)
