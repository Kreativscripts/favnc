const k='autosave',i=document.querySelector('textarea');
if(i){
  i.value=localStorage.getItem(k)||'';
  i.addEventListener('input',()=>localStorage.setItem(k,i.value));
}
