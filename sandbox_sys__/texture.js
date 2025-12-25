export const TextureBank = (function(){
  function makeCanvasTexture(size, drawFn){
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const g = c.getContext("2d");
    drawFn(g, size);
    return c;
  }

  function noise(g, w, h, amount){
    const img = g.getImageData(0,0,w,h);
    const d = img.data;
    for (let i=0;i<d.length;i+=4){
      const n = (Math.random()*2-1)*amount;
      d[i] = Math.max(0, Math.min(255, d[i] + n));
      d[i+1] = Math.max(0, Math.min(255, d[i+1] + n));
      d[i+2] = Math.max(0, Math.min(255, d[i+2] + n));
    }
    g.putImageData(img,0,0);
  }

  function gridTexture(){
    return makeCanvasTexture(512,(g,s)=>{
      g.fillStyle="#05060a";
      g.fillRect(0,0,s,s);

      g.strokeStyle="rgba(255,255,255,0.08)";
      g.lineWidth=2;
      for(let i=0;i<=s;i+=32){
        g.beginPath(); g.moveTo(i,0); g.lineTo(i,s); g.stroke();
        g.beginPath(); g.moveTo(0,i); g.lineTo(s,i); g.stroke();
      }

      g.strokeStyle="rgba(255,255,255,0.14)";
      g.lineWidth=3;
      for(let i=0;i<=s;i+=128){
        g.beginPath(); g.moveTo(i,0); g.lineTo(i,s); g.stroke();
        g.beginPath(); g.moveTo(0,i); g.lineTo(s,i); g.stroke();
      }

      noise(g,s,s,18);
    });
  }

  function metalTexture(){
    return makeCanvasTexture(512,(g,s)=>{
      g.fillStyle="#0b0e18";
      g.fillRect(0,0,s,s);

      for(let i=0;i<90;i++){
        const y = Math.random()*s;
        const a = Math.random()*0.18;
        g.fillStyle=`rgba(255,255,255,${a})`;
        g.fillRect(0,y,s,1+Math.random()*2);
      }

      g.strokeStyle="rgba(255,255,255,0.16)";
      g.lineWidth=6;
      g.strokeRect(10,10,s-20,s-20);

      noise(g,s,s,28);
    });
  }

  function waterTexture(){
    return makeCanvasTexture(512,(g,s)=>{
      g.fillStyle="#05060a";
      g.fillRect(0,0,s,s);

      for(let i=0;i<1400;i++){
        const x=Math.random()*s, y=Math.random()*s;
        const r=1+Math.random()*3;
        const a=0.04+Math.random()*0.10;
        g.fillStyle=`rgba(160,220,255,${a})`;
        g.beginPath(); g.arc(x,y,r,0,Math.PI*2); g.fill();
      }

      g.strokeStyle="rgba(160,220,255,0.16)";
      g.lineWidth=2;
      for(let i=0;i<12;i++){
        g.beginPath();
        g.arc(Math.random()*s,Math.random()*s,70+Math.random()*140,0,Math.PI*2);
        g.stroke();
      }

      noise(g,s,s,10);
    });
  }

  return {
    gridTexture,
    metalTexture,
    waterTexture
  };
})();
