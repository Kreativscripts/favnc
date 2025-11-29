window.addEventListener("DOMContentLoaded",function(){
  var video=document.getElementById("introVideo");
  var brand=document.getElementById("brandOverlay");
  var modalBackdrop=document.getElementById("nameModalBackdrop");
  var nameInput=document.getElementById("nameInput");
  var errorBox=document.getElementById("modalError");
  var submitBtn=document.getElementById("submitName");
  var statusBox=document.getElementById("status");
  var statusText=document.getElementById("statusText");
  var charCounter=document.getElementById("charCounter");
  var STORAGE_KEY="favnc_username";
  var MAIN_URL="https://favnc.pages.dev/main";
  var brandShown=false;
  var finished=false;

  function setStatus(text){
    if(!text){statusBox.classList.remove("show");statusText.textContent="";return;}
    statusText.textContent=text;
    statusBox.classList.add("show");
  }

  function showBrand(){
    if(brandShown)return;
    brandShown=true;
    brand.classList.add("show");
    setStatus("Initializing Nexus Command…");
  }

  function hasBadWords(name){
    var n=name.toLowerCase();
    var banned=[
      "admin","owner","mod","staff","discord","nexus","command","favnc","fav_nonchalant",
      "fuck","shit","bitch","cunt","whore","porn","sex","nigger","cuck","dick","bia"
    ];
    return banned.some(function(w){return n.includes(w);});
  }

  function redirect(delay){
    setTimeout(function(){window.location.href=MAIN_URL;},delay);
  }

  function openPromptIfNeeded(){
    var existing=localStorage.getItem(STORAGE_KEY);
    if(existing && existing.trim()){
      setStatus("Welcome back, "+existing+".");
      redirect(1400);
      return;
    }
    modalBackdrop.classList.add("active");
    nameInput.focus();
    setStatus("New connection detected. Identity required.");
  }

  function handleNameSubmit(){
    var raw=nameInput.value||"";
    var trimmed=raw.trim();
    errorBox.textContent="";

    if(!trimmed){
      errorBox.textContent="Please enter a name.";
      return;
    }
    if(trimmed.length>15){
      errorBox.textContent="Name must be 15 characters or less.";
      return;
    }
    var allowed=/^[A-Za-z0-9 _.\-]+$/;
    if(!allowed.test(trimmed)){
      errorBox.textContent="Use letters, numbers, spaces and basic symbols only.";
      return;
    }

    var finalName=trimmed;

    if(hasBadWords(trimmed)){
      finalName="Clown";
      localStorage.setItem(STORAGE_KEY,finalName);
      modalBackdrop.classList.remove("active");
      setStatus("You disgust me. From now on you will be named Clown.");
      redirect(1600);
      return;
    }

    localStorage.setItem(STORAGE_KEY,finalName);
    modalBackdrop.classList.remove("active");
    setStatus("Welcome "+finalName);
    redirect(1400);
  }

  if(charCounter && nameInput){
    nameInput.addEventListener("input",function(){
      var len=(nameInput.value||"").length;
      charCounter.textContent=len+" / 15";
    });
  }

  if(submitBtn){
    submitBtn.addEventListener("click",handleNameSubmit);
  }

  if(nameInput){
    nameInput.addEventListener("keydown",function(e){
      if(e.key==="Enter"){
        e.preventDefault();
        handleNameSubmit();
      }
    });
  }

  if(video){
    video.addEventListener("timeupdate",function(){
      if(!brandShown && video.currentTime>=6){showBrand();}
    });
    video.addEventListener("ended",function(){
      if(finished)return;
      finished=true;
      openPromptIfNeeded();
    });
    setTimeout(function(){
      if(!finished){
        finished=true;
        openPromptIfNeeded();
      }
    },10500);
    try{
      var playPromise=video.play();
      if(playPromise && playPromise.catch){
        playPromise.catch(function(){showBrand();});
      }
    }catch(e){
      showBrand();
    }
  }else{
    openPromptIfNeeded();
  }
});
