// scripts/TZdetector.js
// Handles timezone detection + saving to localStorage + updating the clock UI.

console.log("Made By Favnonchalant");

(function(){
  const KEY="FavTime:timezone";
  const clockEl=document.getElementById("clock");
  const dateEl=document.getElementById("clockDate");
  const tzEl=document.getElementById("tzLabel");
  if(!clockEl||!dateEl||!tzEl){
    console.error("FavTime: clock elements not found in DOM");
    return;
  }

  // Try to load previously saved timezone info from localStorage.
  function loadSaved(){
    try{
      const raw=localStorage.getItem(KEY);
      if(!raw)return null;
      const data=JSON.parse(raw);
      if(!data)return null;
      if(typeof data.offsetHours!=="number")return null;
      return data;
    }catch(e){
      return null;
    }
  }

  // Detect timezone from the browser (once, then cached).
  function detectTimezone(){
    const now=new Date();
    const offsetMinutes=-now.getTimezoneOffset(); // minutes ahead of UTC
    const offsetHours=offsetMinutes/60;
    let timeZoneLabel="Local Time";
    try{
      const opt=Intl.DateTimeFormat().resolvedOptions();
      if(opt&&opt.timeZone)timeZoneLabel=opt.timeZone;
    }catch(e){}
    return{timeZone:timeZoneLabel,offsetHours};
  }

  // Save current config to localStorage.
  function saveConfig(cfg){
    try{localStorage.setItem(KEY,JSON.stringify(cfg));}catch(e){}
  }

  // Convert numeric offset to string label like "UTC+2" or "UTC-4:30".
  function pad2(n){return n<10?"0"+n:String(n);}
  function offsetLabel(h){
    const sign=h>=0?"+":"-";
    const abs=Math.abs(h);
    const whole=Math.floor(abs);
    const frac=abs-whole;
    const minutes=Math.round(frac*60);
    if(minutes===0){
      if(whole===0)return"UTC";
      return"UTC"+sign+whole;
    }
    return"UTC"+sign+whole+":"+pad2(minutes);
  }

  // Initialize config (load or detect).
  let cfg=loadSaved();
  if(!cfg){
    cfg=detectTimezone();
    saveConfig(cfg);
  }

  // Compute formatted time/date based on saved offset.
  function getTimeInfo(){
    const now=new Date();
    const utcMs=now.getTime()+now.getTimezoneOffset()*60000;
    const localMs=utcMs+cfg.offsetHours*3600000;
    const t=new Date(localMs);

    const hh=pad2(t.getUTCHours());
    const mm=pad2(t.getUTCMinutes());
    const ss=pad2(t.getUTCSeconds());
    const timeStr=hh+":"+mm+":"+ss;

    const dateStr=t.toLocaleDateString(undefined,{
      weekday:"short",day:"2-digit",month:"short",year:"numeric"
    });

    const label=cfg.timeZone+" ("+offsetLabel(cfg.offsetHours)+")";
    return{time:timeStr,date:dateStr,label};
  }

  // Update the UI every 500ms.
  function tick(){
    const info=getTimeInfo();
    clockEl.textContent=info.time;
    dateEl.textContent=info.date;
    tzEl.textContent=info.label;
  }

  tick();
  setInterval(tick,500);

  // Optional API in case you want to reset later:
  window.FavTimeTZ={
    reset:function(){
      try{localStorage.removeItem(KEY);}catch(e){}
      cfg=detectTimezone();
      saveConfig(cfg);
    },
    getConfig:function(){return{...cfg};}
  };
})();
