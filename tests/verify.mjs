import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
const data=await mkdtemp(path.join(tmpdir(),'knowledge-verification-'));
const port=process.env.TEST_PORT||'3199';
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',port],{env:{...process.env,LOCAL_DATA_PATH:data},stdio:['ignore','pipe','pipe']});
try{
 await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(new Error('Server did not become ready.')),20000);server.stdout.on('data',chunk=>{const text=chunk.toString();if(text.includes('Ready')){clearTimeout(timeout);resolve();}});server.stderr.on('data',chunk=>process.stderr.write(chunk));server.once('exit',code=>{clearTimeout(timeout);reject(new Error(`Server exited (${code}).`));});});
 const code=await new Promise(resolve=>{const test=spawn(process.execPath,['tests/smoke.mjs'],{env:{...process.env,TEST_BASE_URL:`http://127.0.0.1:${port}`},stdio:'inherit'});test.once('exit',resolve);});
 process.exitCode=code??1;
}finally{server.kill('SIGTERM');await new Promise(resolve=>server.once('exit',resolve));await rm(data,{recursive:true,force:true});}
