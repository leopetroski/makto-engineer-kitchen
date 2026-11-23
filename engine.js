(()=>{"use strict";
const KEY="makto-mission2-v1",STAGES=["Discover","Define","Research","Evaluate","Design","Validate","Review"];
const load=()=>{try{return JSON.parse(localStorage.getItem(KEY))||[]}catch{return []}};
let projects=load(),active=null;
const $=s=>document.querySelector(s),safe=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const persist=()=>{localStorage.setItem(KEY,JSON.stringify(projects));render()};
function score(o,w){return Math.round((o.impact*w.impact+o.feasibility*w.feasibility+o.cost*w.cost+o.speed*w.speed)/(w.impact+w.feasibility+w.cost+w.speed)*20)}
function weights(){return Object.fromEntries(["impact","feasibility","cost","speed"].map(k=>[k,Number($("#w-"+k).value)]))}
function selected(){return projects.find(p=>p.id===active)}
function render(){const p=selected();$("#count").textContent=projects.length;$("#projectList").innerHTML=projects.map(x=>`<button class="project ${x.id===active?"selected":""}" data-id="${safe(x.id)}"><b>${safe(x.name)}</b><small>${safe(x.mode)} · ${safe(x.stage)}</small></button>`).join("")||'<p class="muted">No projects yet.</p>';
document.querySelectorAll(".project").forEach(b=>b.onclick=()=>{active=b.dataset.id;render()});
$("#workspace").hidden=!p;$("#empty").hidden=!!p;if(!p)return;
$("#title").textContent=p.name;$("#description").textContent=p.brief;$("#stage").value=p.stage;$("#modeLabel").textContent=p.mode;
$("#steps").innerHTML=STAGES.map((s,i)=>`<button class="step ${s===p.stage?"current":""}" data-stage="${s}">${i+1}. ${s}</button>`).join("");
document.querySelectorAll(".step").forEach(b=>b.onclick=()=>{p.stage=b.dataset.stage;note(p,"Stage changed to "+p.stage);persist()});
$("#requirements").value=p.requirements||"";$("#notes").value=p.notes||"";
const w=weights();$("#options").innerHTML=p.options.map((o,i)=>`<article class="option"><div class="optionTop"><strong>${safe(o.name)}</strong><span class="score">${score(o,w)}/100</span></div><div class="metrics">${["impact","feasibility","cost","speed"].map(k=>`<span>${k}: ${o[k]}/5</span>`).join("")}</div><p>${safe(o.reason)}</p><button class="remove" data-index="${i}">Remove</button></article>`).join("")||'<p class="muted">Add candidate solutions to compare them with weighted criteria.</p>';
document.querySelectorAll(".remove").forEach(b=>b.onclick=()=>{p.options.splice(Number(b.dataset.index),1);note(p,"Removed an alternative");persist()});
$("#timeline").innerHTML=p.events.slice().reverse().map(e=>`<div class="event"><time>${safe(new Date(e.at).toLocaleString())}</time><span>${safe(e.text)}</span></div>`).join("");
$("#sources").innerHTML=p.sources.map((s,i)=>`<div class="source"><a href="${safe(s.url)}" target="_blank" rel="noopener noreferrer">${safe(s.title)}</a><button data-source="${i}">×</button></div>`).join("")||'<p class="muted">No sources recorded. External research is not yet automated.</p>';
document.querySelectorAll("[data-source]").forEach(b=>b.onclick=()=>{p.sources.splice(Number(b.dataset.source),1);persist()});
}
function note(p,text){p.events.push({at:new Date().toISOString(),text})}
$("#newProject").onsubmit=e=>{e.preventDefault();const name=$("#name").value.trim(),brief=$("#brief").value.trim();if(!name||!brief)return;const p={id:crypto.randomUUID(),name,brief,mode:$("#mode").value,stage:"Discover",requirements:"",notes:"",options:[],sources:[],events:[]};note(p,"Project created");projects.unshift(p);active=p.id;e.target.reset();persist()};
$("#stage").onchange=e=>{const p=selected();p.stage=e.target.value;note(p,"Stage changed to "+p.stage);persist()};
["requirements","notes"].forEach(k=>$("#"+k).addEventListener("change",e=>{const p=selected();p[k]=e.target.value;note(p,"Updated "+k);persist()}));
$("#addOption").onsubmit=e=>{e.preventDefault();const p=selected();if(!p)return;const o={name:$("#optionName").value.trim(),reason:$("#optionReason").value.trim()};if(!o.name)return;["impact","feasibility","cost","speed"].forEach(k=>o[k]=Number($("#"+k).value));p.options.push(o);note(p,"Added alternative: "+o.name);e.target.reset();persist()};
$("#addSource").onsubmit=e=>{e.preventDefault();const p=selected();if(!p)return;let url;try{url=new URL($("#sourceUrl").value);if(!["https:","http:"].includes(url.protocol))return}catch{return}p.sources.push({title:$("#sourceTitle").value.trim()||url.hostname,url:url.href});note(p,"Recorded source");e.target.reset();persist()};
["impact","feasibility","cost","speed"].forEach(k=>$("#w-"+k).oninput=()=>{ $("#label-"+k).textContent=$("#w-"+k).value;render()});
$("#export").onclick=()=>{const blob=new Blob([JSON.stringify({schema:"makto-mission2-v1",exported:new Date().toISOString(),projects},null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="makto-engineering-memory.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
$("#import").onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const data=JSON.parse(await f.text());if(data.schema!=="makto-mission2-v1"||!Array.isArray(data.projects)||data.projects.length>1000)throw Error("Invalid format");const valid=data.projects.every(p=>typeof p.id==="string"&&typeof p.name==="string"&&Array.isArray(p.options)&&Array.isArray(p.events)&&Array.isArray(p.sources));if(!valid)throw Error("Invalid records");if(!confirm("Replace current local projects with imported data?"))return;projects=data.projects;active=null;persist()}catch(err){alert("Import failed: "+err.message)}e.target.value=""};
$("#deleteProject").onclick=()=>{const p=selected();if(!p||!confirm("Delete "+p.name+" permanently from this browser?"))return;projects=projects.filter(x=>x.id!==p.id);active=null;persist()};
$("#copyBrief").onclick=()=>{const p=selected();if(!p)return;const prompt=`You are an engineering research assistant. Distinguish facts, assumptions and estimates. Cite verifiable sources. Do not claim simulations or testing without evidence. Project: ${p.name}. Goal: ${p.brief}. Requirements: ${p.requirements}. Current stage: ${p.stage}. Provide options, tradeoffs, risks, validation plan, and ask for approval before external actions.`;navigator.clipboard?.writeText(prompt).then(()=>alert("Research brief copied")).catch(()=>promptFallback(prompt))||promptFallback(prompt)};
function promptFallback(t){window.prompt("Copy research brief",t)}
$("#stage").innerHTML=STAGES.map(s=>`<option>${s}</option>`).join("");
render();
})();