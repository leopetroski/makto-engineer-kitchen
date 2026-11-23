(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.MaktoMission=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){
"use strict";
const SCHEMA="makto-mission-control-v1",STATES=["Backlog","In Progress","Review","Done"];
const uid=()=>typeof crypto!=="undefined"&&crypto.randomUUID?crypto.randomUUID():"m-"+Date.now()+"-"+Math.random().toString(36).slice(2);
const now=()=>new Date().toISOString();
const clean=(v,max=2000)=>typeof v==="string"?v.trim().slice(0,max):"";
function createMission(input){const title=clean(input.title,120),goal=clean(input.goal,6000);if(!title||!goal)throw Error("Title and goal required");const t=now();return {id:uid(),title,goal,status:"Backlog",createdAt:t,updatedAt:t,tasks:[],parameters:[],decisions:[],history:[{at:t,action:"Mission created"}]};}
function touch(m,action){m.updatedAt=now();m.history.push({at:m.updatedAt,action});return m;}
function addTask(m,input){const title=clean(input.title,160);if(!title)throw Error("Task title required");m.tasks.push({id:uid(),title,status:"Backlog",acceptance:clean(input.acceptance,2000)});return touch(m,"Task added: "+title);}
function moveTask(m,id,status){if(!STATES.includes(status))throw Error("Invalid status");const task=m.tasks.find(t=>t.id===id);if(!task)throw Error("Task not found");task.status=status;return touch(m,"Task status: "+task.title+" → "+status);}
function addParameter(m,input){const name=clean(input.name,120),value=clean(input.value,200),unit=clean(input.unit,40);if(!name||!value)throw Error("Parameter name and value required");m.parameters.push({id:uid(),name,value,unit,verified:input.verified===true});return touch(m,"Parameter added: "+name);}
function addDecision(m,input){const text=clean(input.text,3000);if(!text)throw Error("Decision required");m.decisions.push({id:uid(),text,at:now()});return touch(m,"Decision recorded");}
function validMission(m){return m&&typeof m.id==="string"&&typeof m.title==="string"&&typeof m.goal==="string"&&Array.isArray(m.tasks)&&Array.isArray(m.parameters)&&Array.isArray(m.decisions)&&Array.isArray(m.history)&&m.tasks.every(t=>typeof t.id==="string"&&typeof t.title==="string"&&STATES.includes(t.status))&&m.parameters.every(p=>typeof p.name==="string"&&typeof p.value==="string")&&m.decisions.every(d=>typeof d.text==="string");}
function parseExport(text){if(text.length>2000000)throw Error("Import too large");const data=JSON.parse(text);if(data.schema!==SCHEMA||!Array.isArray(data.missions)||data.missions.length>500||!data.missions.every(validMission))throw Error("Invalid mission export");const ids=data.missions.map(m=>m.id);if(new Set(ids).size!==ids.length)throw Error("Duplicate mission IDs");return data.missions;}
function exportData(missions){return JSON.stringify({schema:SCHEMA,exportedAt:now(),missions},null,2);}
return {SCHEMA,STATES,createMission,addTask,moveTask,addParameter,addDecision,parseExport,exportData,validMission};
});
