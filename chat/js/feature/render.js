import{D}from"../core/dom.js";
function p(){let d=new Date();return d.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}
function a(o){
 let r=document.createElement("div");r.className="msg-row"
 let m=document.createElement("div");m.className="msg-meta"
 let u=document.createElement("span");u.className="msg-user";u.textContent=o.u
 let t=document.createElement("span");t.className="msg-time";t.textContent=" • "+p()
 m.appendChild(u);m.appendChild(t)
 let b=document.createElement("div");b.className="msg-bubble"+(o.own?" own":"");b.textContent=o.t
 r.appendChild(m);r.appendChild(b)
 if(o.a){
  let w=document.createElement("div");w.className="msg-attachment"
  if(o.a.type.startsWith("image/")){let img=document.createElement("img");img.src=o.a.url;w.appendChild(img)}
  else if(o.a.type.startsWith("video/")){let v=document.createElement("video");v.controls=1;v.src=o.a.url;w.appendChild(v)}
  r.appendChild(w)
 }
 D.m.appendChild(r);D.m.scrollTop=D.m.scrollHeight
}
function w(){a({u:"Favnc System",t:"Welcome to Favnc Chat client.\nThis instance is local-only until you connect a backend.",own:0})}
export{a,w}
