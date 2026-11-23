export default async function handler(req,res){
  res.setHeader("Cache-Control","no-store");
  if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
  const key=process.env.OPENAI_API_KEY;\n  const access=process.env.MAKTO_ACCESS_KEY;\n  if(!access)return res.status(503).json({error:"Access control not configured"});\n  const supplied=req.headers["x-makto-access-key"];\n  if(typeof supplied!=="string"||supplied!==access)return res.status(401).json({error:"Invalid access key"});
  if(!key)return res.status(503).json({error:"AI service not configured. Add OPENAI_API_KEY to Vercel project settings."});
  const {brief,mode,requirements}=req.body||{};
  if(typeof brief!=="string"||!brief.trim()||brief.length>6000||typeof requirements!=="string"&&requirements!==undefined||String(requirements||"").length>4000)return res.status(400).json({error:"Invalid input"});
  const allowed=["Hybrid","Open exploration","Goal-directed"];if(!allowed.includes(mode))return res.status(400).json({error:"Invalid research mode"});
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