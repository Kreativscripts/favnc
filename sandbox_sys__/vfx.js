export const VFX = (function(){
  function makeParticleSystem(THREE, opts){
    const count = opts.count || 200;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count*3);
    const vel = new Float32Array(count*3);
    const life = new Float32Array(count);
    const maxLife = opts.maxLife || 1.2;

    for(let i=0;i<count;i++){
      pos[i*3+0]=9999; pos[i*3+1]=9999; pos[i*3+2]=9999;
      vel[i*3+0]=0; vel[i*3+1]=0; vel[i*3+2]=0;
      life[i]=0;
    }

    geo.setAttribute("position", new THREE.BufferAttribute(pos,3));
    geo.setAttribute("aLife", new THREE.BufferAttribute(life,1));

    const mat = new THREE.PointsMaterial({
      size: opts.size || 0.12,
      transparent: true,
      opacity: 0.9,
      depthWrite: false
    });

    const pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false;

    let cursor = 0;

    function spawn(p, v){
      const i = cursor++ % count;
      pos[i*3+0]=p.x; pos[i*3+1]=p.y; pos[i*3+2]=p.z;
      vel[i*3+0]=v.x; vel[i*3+1]=v.y; vel[i*3+2]=v.z;
      life[i]=maxLife;
      geo.attributes.position.needsUpdate = true;
      geo.attributes.aLife.needsUpdate = true;
    }

    function tick(dt, gravity){
      for(let i=0;i<count;i++){
        if(life[i]<=0) continue;
        life[i]-=dt;
        vel[i*3+1] -= (gravity||0)*dt;

        pos[i*3+0]+=vel[i*3+0]*dt;
        pos[i*3+1]+=vel[i*3+1]*dt;
        pos[i*3+2]+=vel[i*3+2]*dt;

        if(life[i]<=0){
          pos[i*3+0]=9999; pos[i*3+1]=9999; pos[i*3+2]=9999;
        }
      }
      geo.attributes.position.needsUpdate = true;
    }

    return { object: pts, spawn, tick, mat };
  }

  function makeFire(THREE){
    const sys = makeParticleSystem(THREE,{count:700,size:0.18,maxLife:1.0});
    sys.mat.color.setHex(0xffaa33);
    return sys;
  }

  function makeWater(THREE){
    const sys = makeParticleSystem(THREE,{count:900,size:0.16,maxLife:1.2});
    sys.mat.color.setHex(0xa0dcff);
    sys.mat.opacity = 0.75;
    return sys;
  }

  function makeSparks(THREE){
    const sys = makeParticleSystem(THREE,{count:240,size:0.10,maxLife:0.55});
    sys.mat.color.setHex(0xffffff);
    sys.mat.opacity = 0.9;
    return sys;
  }

  return { makeFire, makeWater, makeSparks };
})();
