window.addEventListener("DOMContentLoaded",function(){
  var KEY="favnc_autoPerms";
  var ok=document.getElementById("okayBtn");
  var bg=document.getElementById("bgVideo");
  var audio=document.getElementById("songAudio");

  function enable(){
    try{localStorage.setItem(KEY,"1");}catch(e){}
    if(bg){bg.muted=false;bg.play().catch(function(){});}
    if(audio){audio.play().catch(function(){});}
  }

  if(ok){ok.addEventListener("click",enable);}
  try{
    if(localStorage.getItem(KEY)==="1"){enable();}
  }catch(e){}
});
