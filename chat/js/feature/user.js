import{D}from"../core/dom.js";import{S}from"../core/state.js";
function k(){
 let v=localStorage.getItem("favnc_username")||"";
 if(v.trim()){S.u=v.trim().slice(0,24);D.o.style.display="none";D.u.textContent="You are: "+S.u}
 else{D.o.style.display="flex";D.ui.focus()}
}
D.us.onclick=()=>{let v=D.ui.value.trim();if(!v)return;S.u=v.slice(0,24);localStorage.setItem("favnc_username",S.u);D.o.style.display="none";D.u.textContent="You are: "+S.u}
export{k}
