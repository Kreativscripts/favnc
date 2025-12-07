const B=["fuck","shit","bitch","cunt","nigga","nigger","hoe","whore","slut","dick","cock","pussy","faggot"]
const R=/discord\.gg\/|\.gg\/|discord\/invite/i
function x(t,h){
 let r=t.trim()
 if(!r&& !h)return{ok:0,msg:"Empty message."}
 if(R.test(r))return{ok:0,msg:"Invite links are not allowed."}
 B.forEach(w=>{
  let e=new RegExp("\\b"+w.replace(/[-/\\^$*+?.()|[\]{}]/g,"\\$&")+"\\b","ig")
  r=r.replace(e,m=>"#".repeat(m.length))
 })
 return{ok:1,text:r}
}
export{x}
