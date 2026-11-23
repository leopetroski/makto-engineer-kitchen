import crypto from "node:crypto";
const secret=()=>process.env.MAKTO_SESSION_SECRET;
const sign=v=>crypto.createHmac("sha256",secret()).update(v).digest("base64url");
const cookie=(req,name)=>{const s=req.headers.cookie||"";return s.split(";").map(x=>x.trim()).find(x=>x.startsWith(name+"="))?.slice(name.length+1)||""};
const secure="Secure; HttpOnly; SameSite=Lax; Path=/";
export function createSession(res,user){const body=Buffer.from(JSON.stringify({id:user.id,login:user.login,exp:Date.now()+7*86400000})).toString("base64url");res.setHeader("Set-Cookie",`makto_session=${body}.${sign(body)}; Max-Age=604800; ${secure}`)}
export function clearSession(res){res.setHeader("Set-Cookie",`makto_session=; Max-Age=0; ${secure}`)}
export function session(req){if(!secret())return null;const value=cookie(req,"makto_session");const dot=value.lastIndexOf(".");if(dot<1)return null;const body=value.slice(0,dot),sig=value.slice(dot+1),expected=sign(body);if(sig.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(expected)))return null;try{const u=JSON.parse(Buffer.from(body,"base64url").toString());return u.exp>Date.now()&&Number(u.id)===Number(process.env.MAKTO_GITHUB_USER_ID)?u:null}catch{return null}}
export function stateCookie(req){return cookie(req,"makto_oauth_state")}
export function setState(res,value){res.setHeader("Set-Cookie",`makto_oauth_state=${value}; Max-Age=600; ${secure}`)}
export function clearState(res){res.setHeader("Set-Cookie",`makto_oauth_state=; Max-Age=0; ${secure}`)}
export function validConfig(){return !!(secret()&&process.env.MAKTO_GITHUB_CLIENT_ID&&process.env.MAKTO_GITHUB_CLIENT_SECRET&&process.env.MAKTO_GITHUB_USER_ID&&process.env.MAKTO_BASE_URL)}
