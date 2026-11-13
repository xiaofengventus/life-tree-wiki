import { withApi, json, readJson, ApiError } from '../../../server/http.js';
import { requireUser, requireSiteOwner } from '../../../server/auth.js';
import { loadProject, publishProject, acquireLease, renewLease, releaseLease, commitSubtree, checkImports } from '../../../server/lsProjects.js';
import { enforceRateLimit } from '../../../server/rateLimit.js';
export const onRequest=withApi(async({request,env,params})=>{
 const path=Array.isArray(params.path)?params.path: String(params.path||'').split('/');const [name,id]=path;
 if(request.method==='GET'&&name==='main'){const main=await env.DB.prepare('SELECT project_uid FROM ls_main WHERE singleton=1').first();return json({projectUid:main?.project_uid||null});}
 if(request.method==='GET'&&name==='projects'&&id){const p=await loadProject(env,id);return json({uid:p.uid,title:p.title,revision:p.revision,model:p.model},{headers:{ETag:'"'+p.revision+'"','Cache-Control':'public, max-age=30'}});}
 const user=await requireUser(env.DB,request);await enforceRateLimit(env.DB,'ls-write:'+user.id,40,60);const body=await readJson(request,4*1024*1024);
 if(name==='projects'&&request.method==='POST')return json(await publishProject(env,user,body));
 if(name==='main'&&request.method==='PUT'){requireSiteOwner(user);const p=await loadProject(env,body.projectUid);await checkImports(env,p.model,p.uid);await env.DB.prepare('INSERT INTO ls_main(singleton,project_uid) VALUES(1,?) ON CONFLICT(singleton) DO UPDATE SET project_uid=excluded.project_uid').bind(p.uid).run();return json({projectUid:p.uid});}
 if(name==='checkout'){if(request.method==='POST')return json(await acquireLease(env,user,body));if(request.method==='PATCH')return json(await renewLease(env,user,body.token));if(request.method==='DELETE'){await releaseLease(env,user,body.token);return json({ok:true});}}
 if(name==='commit'&&request.method==='POST')return json(await commitSubtree(env,user,body));
 throw new ApiError(404,'接口不存在');
});
