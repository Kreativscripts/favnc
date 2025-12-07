import{S,C}from"../core/state.js";import{D}from"../core/dom.js";
function y(){
 let n=Date.now(),d=S.t+C.cd-n
 if(d<=0){D.c.textContent="";return 1}
 let s=Math.ceil(d/1000);D.c.textContent="Cooldown "+s+"s";return 0
}
export{y}
