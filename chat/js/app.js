import{D}from"./core/dom.js";import{S}from"./core/state.js";
import{k}from"./feature/user.js";import{z}from"./feature/upload.js";
import{x}from"./feature/filter.js";import{y}from"./feature/cooldown.js";
import{a,w}from"./feature/render.js";

function q(){
 if(!S.u){D.c.textContent="Set a username first.";return}
 if(!y())return
 let r=D.i.value,s=x(r,!!S.f)
 if(!s.ok){D.c.textContent=s.msg;return}
 let att=null
 if(S.f){let u=URL.createObjectURL(S.f);att={url:u,type:S.f.type}}
 a({u:S.u,t:s.text,own:1,a:att})
 D.i.value="";D.f.value="";D.n.textContent="";S.f=null;S.t=Date.now();y()
}

function j(){
 k();z();w()
 D.form.addEventListener("submit",e=>{e.preventDefault();q()})
}

j()
