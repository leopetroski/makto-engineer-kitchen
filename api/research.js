import crypto from "node:crypto";
export default async function handler(req,res){
  res.setHeader("Cache-Control","no-store");
  if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
  const key=process.env.OPENAI_API_KEY;
  if(!key)return res.status(503).json({error:"AI service not configured. Add OPENAI_API_KEY to Vercel project settings."});
  const {brief,mode,requirements}=req.body||{};
  if(typeof brief!=="string"||!brief.trim()||brief.length>6000||typeof requirements!=="string"&&requirements!==undefined||String(requirements||"").length>4000)return res.status(400).json({error:"Invalid input"});
  const allowed=["Hybrid","Open exploration","Goal-directed"];if(!allowed.includes(mode))return res.status(400).json({error:"Invalid research mode"});
  // Fail closed unless shared, persistent rate limiting is configured.
  const redisUrl=process.env.UPSTASH_REDIS_REST_URL;
  const redisToken=process.env.UPSTASH_REDIS_REST_TOKEN;
  const salt=process.env.MAKTO_RATE_SALT;
  if(!redisUrl||!redisToken||!salt)return res.status(503).json({error:"Public research is temporarily unavailable. Rate-limit protection is not configured."});
  const ip=String(req.headers["x-vercel-forwarded-for"]||req.headers["x-real-ip"]||"unknown").split(",")[0].trim();
  const hashed=crypto.createHmac("sha256",salt).update(ip).digest("hex");
  const day=new Date().toISOString().slice(0,10);
  const minute=Math.floor(Date.now()/60000);
  const perMinute=Math.max(1,Math.min(5,Number(process.env.MAKTO_PER_IP_MINUTE_LIMIT)||2));
  const perDay=Math.max(1,Math.min(100,Number(process.env.MAKTO_GLOBAL_DAILY_LIMIT)||20));
  const keys=[`makto:ip:${hashed}:${minute}`,`makto:global:${day}`];
  try{
    const limit=await fetch(redisUrl.replace(/\/$/,"")+"/pipeline",{method:"POST",headers:{Authorization:"Bearer "+redisToken,"Content-Type":"application/json"},body:JSON.stringify([["INCR",keys[0]],["EXPIRE",keys[0],120],["INCR",keys[1]],["EXPIRE",keys[1],172800]]),signal:AbortSignal.timeout(3500)});
    if(!limit.ok)throw Error("Rate-limit storage unavailable");
    const data=await limit.json();
    if(!Array.isArray(data)||data.some(x=>x.error)||!Number.isFinite(Number(data[0]?.result))||!Number.isFinite(Number(data[2]?.result)))throw Error("Rate-limit storage error");
    if(Number(data[0].result)>perMinute||Number(data[2].result)>perDay)return res.status(429).json({error:"Research usage limit reached. Please try again later."});
  }catch{return res.status(503).json({error:"Research temporarily unavailable. Usage protection could not be verified."})}
  const instruction="You are MAKTO Engineering Research, a careful engineering research assistant. Do not invent sources, dimensions, calculations, test results, or verified safety claims. Clearly distinguish facts, assumptions, and proposals. For research, cite source URLs only when verified through web search. Give concise structured sections: Problem framing, Evidence and sources, Alternatives, Tradeoffs, Validation plan, Risks, Next decision. Never execute purchases, changes, or external actions. Explain limitations. This is advisory, not a certified engineering analysis.";
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),25000);
  try{
    const response=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({model:process.env.MAKTO_MODEL||"gpt-4.1-mini",instructions:instruction,input:"Mode: "+mode+"\nProblem: "+brief+"\nRequirements: "+String(requirements||"None specified"),tools:[{type:"web_search_preview"}],max_output_tokens:1800,store:false}),signal:controller.signal});
    const data=await response.json();
    if(!response.ok)return res.status(502).json({error:"AI provider request failed",code:data.error?.code||response.status});
    const output=(data.output||[]).filter(x=>x.type==="message").flatMap(x=>x.content||[]).filter(x=>x.type==="output_text");
    const answer=output.map(x=>x.text).join("\n").trim();
    const citations=output.flatMap(x=>x.annotations||[]).filter(x=>x.type==="url_citation").map(x=>({title:x.title,url:x.url}));
    return res.status(200).json({answer:answer||"No response returned.",citations,model:data.model||null});
  }catch(e){return res.status(504).json({error:e.name==="AbortError"?"Research timed out":"Research service unavailable"})}finally{clearTimeout(timer)}
}