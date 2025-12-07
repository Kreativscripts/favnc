import{D}from"../core/dom.js";import{S,C}from"../core/state.js";
function z(){
 D.f.addEventListener("change",()=>{
  let f=D.f.files[0];S.f=null;D.n.textContent=""
  if(!f)return
  if(f.size>C.max){D.f.value="";D.n.textContent="File too big (10MB max)";return}
  S.f=f;D.n.textContent=f.name+" ("+Math.round(f.size/1024)+" KB)"
 })
}
export{z}
