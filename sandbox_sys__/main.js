import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { TextureBank } from "https://favnc.pages.dev/sandbox_sys__/texture.js";
import { VFX } from "https://favnc.pages.dev/sandbox_sys__/vfx.js";
import * as CANNON from "https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js";

const ENGINE="NexusCommandEngine_1_0_0";
const SAVE_KEY=ENGINE+"_save";

const SFX={
  waterTouch:"https://favnc.pages.dev/sandbox_sys__/sfx/water-touch.mp3",
  waterFlow:"https://favnc.pages.dev/sandbox_sys__/sfx/water-flow.mp3",
  walk:"https://favnc.pages.dev/sandbox_sys__/sfx/walk.mp3",
  pickup:"https://favnc.pages.dev/sandbox_sys__/sfx/item-pickup.mp3",
  drop:"https://favnc.pages.dev/sandbox_sys__/sfx/item-drop.mp3",
  fire:"https://favnc.pages.dev/sandbox_sys__/sfx/fire.mp3"
};

const DEFAULTS={
  settings:{volume:0.65,sensitivity:0.65,fov:85,chunks:8},
  keybinds:{
    forward:"KeyW",backward:"KeyS",left:"KeyA",right:"KeyD",
    jump:"Space",sprint:"ShiftLeft",
    rotate:"KeyR",
    throw:"KeyG",
    settings:"KeyO",
    save:"KeyP",
    toolProp:"Digit1",
    toolGrav:"Digit2",
    toolWeld:"Digit3",
    toolRope:"Digit4",
    toolThruster:"Digit5",
    toolExplode:"Digit6",
    toolFire:"Digit7",
    toolWater:"Digit8",
    toolDelete:"Digit9",
    pause:"Escape"
  },
  player:{pos:[0,2.2,6]},
  world:{objects:[],constraints:[],thrusters:[]}
};

function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function safeJSONParse(s,f){try{return JSON.parse(s);}catch(e){return f;}}
function clone(o){return JSON.parse(JSON.stringify(o));}
function log(){console.log.apply(console,["[NCE]",...arguments]);}

function loadSave(){
  const raw=localStorage.getItem(SAVE_KEY);
  if(!raw) return clone(DEFAULTS);
  const data=safeJSONParse(raw,null);
  if(!data) return clone(DEFAULTS);
  const merged=clone(DEFAULTS);
  merged.settings=Object.assign({},merged.settings,data.settings||{});
  merged.keybinds=Object.assign({},merged.keybinds,data.keybinds||{});
  merged.player=Object.assign({},merged.player,data.player||{});
  merged.world=Object.assign({},merged.world,data.world||{});
  if(!Array.isArray(merged.world.objects)) merged.world.objects=[];
  if(!Array.isArray(merged.world.constraints)) merged.world.constraints=[];
  if(!Array.isArray(merged.world.thrusters)) merged.world.thrusters=[];
  return merged;
}
function saveAll(state){localStorage.setItem(SAVE_KEY,JSON.stringify(state));}
function clearSave(){localStorage.removeItem(SAVE_KEY);}

const ui={
  intro:document.getElementById("intro"),
  btnStart:document.getElementById("btnStart"),
  btnReset:document.getElementById("btnReset"),
  canvas:document.getElementById("c"),
  hud:document.getElementById("hud"),
  slots:Array.from(document.querySelectorAll(".slot")),
  btnSave:document.getElementById("btnSave"),
  btnReload:document.getElementById("btnReload"),
  btnClearWorld:document.getElementById("btnClearWorld"),
  btnSettings:document.getElementById("btnSettings"),
  panel:document.getElementById("settingsPanel"),
  btnCloseSettings:document.getElementById("btnCloseSettings"),
  blocker:document.getElementById("blocker"),
  setVolume:document.getElementById("setVolume"),
  setSens:document.getElementById("setSens"),
  setFov:document.getElementById("setFov"),
  setChunks:document.getElementById("setChunks"),
  hotkeys:document.getElementById("hotkeys"),
  btnExport:document.getElementById("btnExport"),
  btnImport:document.getElementById("btnImport"),
  btnDefaults:document.getElementById("btnDefaults"),
  saveBox:document.getElementById("saveBox"),
  btnDupeSave:document.getElementById("btnDupeSave"),
  btnDupeLoad:document.getElementById("btnDupeLoad"),
  dupeBox:document.getElementById("dupeBox")
};

const state=loadSave();
let currentTool="prop";
let pendingRebind=null;

function getKey(k){return state.keybinds[k]||DEFAULTS.keybinds[k];}
function setTool(t){
  currentTool=t;
  ui.slots.forEach(b=>b.classList.toggle("active",b.dataset.tool===t));
  log("Tool:",t);
}
function showHUD(v){ui.hud.classList.toggle("hidden",!v);}
function showBlocker(v){ui.blocker.classList.toggle("hidden",!v);}
function openSettings(v){ui.panel.classList.toggle("hidden",!v);}

function toolFromKey(code){
  if(code===getKey("toolProp")) return "prop";
  if(code===getKey("toolGrav")) return "grav";
  if(code===getKey("toolWeld")) return "weld";
  if(code===getKey("toolRope")) return "rope";
  if(code===getKey("toolThruster")) return "thruster";
  if(code===getKey("toolExplode")) return "explode";
  if(code===getKey("toolFire")) return "fire";
  if(code===getKey("toolWater")) return "water";
  if(code===getKey("toolDelete")) return "delete";
  return null;
}

/* -------------------- AUDIO (3D distance attenuation) -------------------- */
function makeAudioEngine(volume){
  const ctx=new (window.AudioContext||window.webkitAudioContext)();
  const master=ctx.createGain();
  master.gain.value=volume;
  master.connect(ctx.destination);

  const buffers={};
  const oneShots=[]; // active one-shots (cleanup not required but kept)
  const loops=new Map(); // id -> {src,gain,panner,pos,kind}

  async function load(name,url){
    const r=await fetch(url);
    const ab=await r.arrayBuffer();
    buffers[name]=await ctx.decodeAudioData(ab);
    log("SFX loaded:",name);
  }

  function resume(){ if(ctx.state!=="running") return ctx.resume(); }
  function setVolume(v){ master.gain.value=v; }

  function makePanner(){
    const p=ctx.createPanner();
    p.panningModel="HRTF";
    p.distanceModel="linear";
    p.refDistance=2;
    p.maxDistance=40;
    p.rolloffFactor=1;
    p.coneInnerAngle=360;
    p.coneOuterAngle=360;
    p.coneOuterGain=0.2;
    return p;
  }

  function playOneShot(name, pos, opts){
    const buf=buffers[name]; if(!buf) return;
    const src=ctx.createBufferSource();
    src.buffer=buf;

    const gain=ctx.createGain();
    gain.gain.value=(opts&&opts.gain!=null)?opts.gain:1;

    if(pos){
      const p=makePanner();
      p.positionX.value=pos.x; p.positionY.value=pos.y; p.positionZ.value=pos.z;
      src.connect(gain); gain.connect(p); p.connect(master);
    }else{
      src.connect(gain); gain.connect(master);
    }

    src.start(0);
    oneShots.push(src);
    return src;
  }

  function startLoop(id, name, kind, pos){
    stopLoop(id);
    const buf=buffers[name]; if(!buf) return;

    const src=ctx.createBufferSource();
    src.buffer=buf;
    src.loop=true;

    const gain=ctx.createGain();
    gain.gain.value=1;

    const p=makePanner();
    p.positionX.value=pos.x; p.positionY.value=pos.y; p.positionZ.value=pos.z;

    src.connect(gain); gain.connect(p); p.connect(master);
    src.start(0);

    loops.set(id,{src,gain,panner:p,pos:{x:pos.x,y:pos.y,z:pos.z},kind});
  }

  function stopLoop(id){
    const L=loops.get(id);
    if(!L) return;
    try{L.src.stop();}catch(e){}
    loops.delete(id);
  }

  function setListener(camPos, forward){
    ctx.listener.positionX.value=camPos.x;
    ctx.listener.positionY.value=camPos.y;
    ctx.listener.positionZ.value=camPos.z;
    ctx.listener.forwardX.value=forward.x;
    ctx.listener.forwardY.value=forward.y;
    ctx.listener.forwardZ.value=forward.z;
    ctx.listener.upX.value=0; ctx.listener.upY.value=1; ctx.listener.upZ.value=0;
  }

  function updateLoopPos(id, pos){
    const L=loops.get(id);
    if(!L) return;
    L.panner.positionX.value=pos.x;
    L.panner.positionY.value=pos.y;
    L.panner.positionZ.value=pos.z;
    L.pos.x=pos.x; L.pos.y=pos.y; L.pos.z=pos.z;
  }

  return { load, resume, setVolume, playOneShot, startLoop, stopLoop, setListener, updateLoopPos, loops };
}

const audio=makeAudioEngine(state.settings.volume);

/* -------------------- THREE -------------------- */
const renderer=new THREE.WebGLRenderer({canvas:ui.canvas,antialias:true,alpha:false});
renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
renderer.setSize(window.innerWidth,window.innerHeight,false);
renderer.outputColorSpace=THREE.SRGBColorSpace;

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x000000);

const camera=new THREE.PerspectiveCamera(state.settings.fov,window.innerWidth/window.innerHeight,0.05,520);

// ✅ IMPORTANT: lock controls to canvas + use controls.getObject as the player
const controls=new PointerLockControls(camera, ui.canvas);
const player=controls.getObject();
player.position.fromArray(state.player.pos);
scene.add(player);

const ray=new THREE.Raycaster();
const pointer=new THREE.Vector2(0,0);

const texGrid=new THREE.CanvasTexture(TextureBank.gridTexture());
texGrid.wrapS=texGrid.wrapT=THREE.RepeatWrapping;
texGrid.repeat.set(6,6);

const texMetal=new THREE.CanvasTexture(TextureBank.metalTexture());
texMetal.wrapS=texMetal.wrapT=THREE.RepeatWrapping;

const texWater=new THREE.CanvasTexture(TextureBank.waterTexture());
texWater.wrapS=texWater.wrapT=THREE.RepeatWrapping;
texWater.repeat.set(2,2);

const matGround=new THREE.MeshStandardMaterial({map:texGrid,roughness:0.95,metalness:0.05});
const matProp=new THREE.MeshStandardMaterial({map:texMetal,roughness:0.75,metalness:0.25});
const matWater=new THREE.MeshStandardMaterial({map:texWater,roughness:0.12,metalness:0.05,transparent:true,opacity:0.85});

scene.add(new THREE.HemisphereLight(0xffffff,0x080a15,0.95));
const sun=new THREE.DirectionalLight(0xffffff,0.6);
sun.position.set(12,20,8);
scene.add(sun);

const ground=new THREE.Mesh(new THREE.PlaneGeometry(320,320),matGround);
ground.rotation.x=-Math.PI/2;
ground.userData.type="ground";
scene.add(ground);

const arms=makeArms();
camera.add(arms);

function makeArms(){
  const g=new THREE.Group();
  const armMat=new THREE.MeshStandardMaterial({color:0x10131f,roughness:0.6,metalness:0.05});
  const glowMat=new THREE.MeshStandardMaterial({color:0x1a1f30,roughness:0.2,metalness:0.15,emissive:0x05070f});
  const left=new THREE.Mesh(new THREE.BoxGeometry(0.14,0.44,0.16),armMat);
  const right=new THREE.Mesh(new THREE.BoxGeometry(0.14,0.44,0.16),armMat);
  left.position.set(-0.22,-0.28,-0.55);
  right.position.set(0.22,-0.28,-0.55);
  const wristL=new THREE.Mesh(new THREE.BoxGeometry(0.16,0.16,0.18),glowMat);
  const wristR=new THREE.Mesh(new THREE.BoxGeometry(0.16,0.16,0.18),glowMat);
  wristL.position.set(-0.22,-0.50,-0.55);
  wristR.position.set(0.22,-0.50,-0.55);
  g.add(left,right,wristL,wristR);
  return g;
}

function updateFogFromChunks(){
  const d=state.settings.chunks*22;
  scene.fog=new THREE.FogExp2(0x000000,1/(d*d));
  camera.far=clamp(d*3.2,150,520);
  camera.updateProjectionMatrix();
}
updateFogFromChunks();

window.addEventListener("resize",()=>{
  renderer.setSize(window.innerWidth,window.innerHeight,false);
  camera.aspect=window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
});

/* -------------------- VFX -------------------- */
const fireFX=VFX.makeFire(THREE);
const waterFX=VFX.makeWater(THREE);
const sparksFX=VFX.makeSparks(THREE);
scene.add(fireFX.object,waterFX.object,sparksFX.object);

function sparksBurst(p){
  for(let i=0;i<22;i++){
    sparksFX.spawn(new THREE.Vector3(p.x,p.y+0.12,p.z),new THREE.Vector3((Math.random()*2-1)*3.2,2+Math.random()*2.8,(Math.random()*2-1)*3.2));
  }
}
function fireBurst(p){
  for(let i=0;i<14;i++){
    fireFX.spawn(new THREE.Vector3(p.x+(Math.random()*2-1)*0.12,p.y+0.2,p.z+(Math.random()*2-1)*0.12),new THREE.Vector3((Math.random()*2-1)*0.8,1.6+Math.random()*2.2,(Math.random()*2-1)*0.8));
  }
}
function waterSplash(p){
  for(let i=0;i<22;i++){
    waterFX.spawn(new THREE.Vector3(p.x+(Math.random()*2-1)*0.28,p.y+0.22,p.z+(Math.random()*2-1)*0.28),new THREE.Vector3((Math.random()*2-1)*2.6,2.6+Math.random()*1.8,(Math.random()*2-1)*2.6));
  }
}

/* -------------------- PHYSICS -------------------- */
const world=new CANNON.World({gravity:new CANNON.Vec3(0,-9.82,0)});
world.broadphase=new CANNON.SAPBroadphase(world);
world.allowSleep=true;

const physMat=new CANNON.Material("phys");
const groundMat=new CANNON.Material("ground");
world.addContactMaterial(new CANNON.ContactMaterial(groundMat,physMat,{friction:0.6,restitution:0.08}));
world.addContactMaterial(new CANNON.ContactMaterial(physMat,physMat,{friction:0.35,restitution:0.14}));

const groundBody=new CANNON.Body({type:CANNON.Body.STATIC,material:groundMat});
groundBody.addShape(new CANNON.Plane());
groundBody.quaternion.setFromEuler(-Math.PI/2,0,0);
world.addBody(groundBody);

const objects=[]; // {mesh,body,def}
const constraints=[]; // cannon constraints + def for save
const thrusters=[]; // {id,targetId,force,on}

let propRot=0;

/* -------------------- WORLD HELPERS -------------------- */
function addPhysProp(def){
  const id=def.id||crypto.randomUUID();
  const pos=def.pos||[0,3,0];
  const rot=def.rot||[0,0,0];
  const size=def.size||[1,1,1];
  const mass=def.mass!=null?def.mass:3.5;

  const mesh=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),matProp);
  mesh.scale.set(size[0],size[1],size[2]);
  mesh.position.set(pos[0],pos[1],pos[2]);
  mesh.rotation.set(rot[0],rot[1],rot[2]);
  mesh.userData={type:"prop",id};
  scene.add(mesh);

  const half=new CANNON.Vec3(size[0]*0.5,size[1]*0.5,size[2]*0.5);
  const body=new CANNON.Body({mass,material:physMat});
  body.addShape(new CANNON.Box(half));
  body.position.set(pos[0],pos[1],pos[2]);
  body.quaternion.setFromEuler(rot[0],rot[1],rot[2]);
  body.linearDamping=0.02;
  body.angularDamping=0.06;
  world.addBody(body);

  const obj={mesh,body,def:{type:"prop",id,pos,rot,size,mass}};
  objects.push(obj);
  return obj;
}

function addWater(def){
  const id=def.id||crypto.randomUUID();
  const pos=def.pos||[0,0.22,0];
  const size=def.size||[3.0,0.35,3.0];

  const mesh=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),matWater);
  mesh.scale.set(size[0],size[1],size[2]);
  mesh.position.set(pos[0],pos[1],pos[2]);
  mesh.userData={type:"water",id};
  scene.add(mesh);

  // spatial loop
  audio.startLoop("water_"+id, "waterFlow", "water", mesh.position);

  const obj={mesh,body:null,def:{type:"water",id,pos,size}};
  objects.push(obj);
  return obj;
}

function addFire(def){
  const id=def.id||crypto.randomUUID();
  const pos=def.pos||[0,0.35,0];

  const mesh=new THREE.Mesh(
    new THREE.CylinderGeometry(0.22,0.42,0.6,14),
    new THREE.MeshStandardMaterial({color:0xffaa33,emissive:0xff6600,emissiveIntensity:0.7,transparent:true,opacity:0.55})
  );
  mesh.position.set(pos[0],pos[1],pos[2]);
  mesh.userData={type:"fire",id};
  scene.add(mesh);

  audio.startLoop("fire_"+id, "fire", "fire", mesh.position);

  const obj={mesh,body:null,def:{type:"fire",id,pos}};
  objects.push(obj);
  return obj;
}

function clearWorld(){
  for(const o of objects){
    if(o.mesh){
      if(o.mesh.userData.type==="fire") audio.stopLoop("fire_"+o.mesh.userData.id);
      if(o.mesh.userData.type==="water") audio.stopLoop("water_"+o.mesh.userData.id);
      scene.remove(o.mesh);
    }
    if(o.body) world.removeBody(o.body);
  }
  objects.length=0;

  for(const c of constraints){
    try{world.removeConstraint(c.c);}catch(e){}
  }
  constraints.length=0;

  thrusters.length=0;
}

function serializeWorld(){
  const out=[];
  for(const o of objects){
    const t=o.def.type;
    if(t==="prop"){
      const e=new CANNON.Vec3();
      o.body.quaternion.toEuler(e);
      out.push({type:"prop",id:o.mesh.userData.id,pos:[o.body.position.x,o.body.position.y,o.body.position.z],rot:[e.x,e.y,e.z],size:[o.mesh.scale.x,o.mesh.scale.y,o.mesh.scale.z],mass:o.body.mass});
    }
    if(t==="water"){
      out.push({type:"water",id:o.mesh.userData.id,pos:[o.mesh.position.x,o.mesh.position.y,o.mesh.position.z],size:[o.mesh.scale.x,o.mesh.scale.y,o.mesh.scale.z]});
    }
    if(t==="fire"){
      out.push({type:"fire",id:o.mesh.userData.id,pos:[o.mesh.position.x,o.mesh.position.y,o.mesh.position.z]});
    }
  }
  return out;
}

function serializeConstraints(){
  return constraints.map(x=>x.def);
}
function serializeThrusters(){
  return thrusters.map(t=>({id:t.id,targetId:t.targetId,force:t.force,on:t.on}));
}

function loadWorldFromSave(){
  clearWorld();
  const list=state.world.objects||[];
  for(const def of list){
    if(def.type==="prop") addPhysProp(def);
    if(def.type==="water") addWater(def);
    if(def.type==="fire") addFire(def);
  }
  loadConstraintsFromSave(state.world.constraints||[]);
  loadThrustersFromSave(state.world.thrusters||[]);
  log("World loaded:",list.length,"objects");
}

function saveTick(){
  state.player.pos=[player.position.x,player.position.y,player.position.z];
  state.world.objects=serializeWorld();
  state.world.constraints=serializeConstraints();
  state.world.thrusters=serializeThrusters();
  saveAll(state);
  log("Saved.");
}

/* -------------------- RAY + HIT -------------------- */
function intersectScene(){
  ray.setFromCamera(pointer,camera);
  const meshes=objects.map(o=>o.mesh);
  const hits=ray.intersectObjects(meshes,true);
  if(hits.length) return hits[0];
  const gHits=ray.intersectObject(ground,false);
  if(gHits.length) return gHits[0];
  return null;
}
function findObjByMesh(mesh){
  return objects.find(o=>o.mesh===mesh)||null;
}
function findObjById(id){
  return objects.find(o=>o.mesh&&o.mesh.userData&&o.mesh.userData.id===id)||null;
}

/* -------------------- TOOLS -------------------- */
function spawnAtLook(kind){
  const hit=intersectScene();
  if(!hit) return;

  const p=hit.point.clone();
  const n=hit.face?hit.face.normal.clone():new THREE.Vector3(0,1,0);
  n.transformDirection(hit.object.matrixWorld);

  const place=p.clone().add(n.multiplyScalar(1.0));
  place.x=Math.round(place.x*2)/2;
  place.y=Math.max(0.25,Math.round(place.y*2)/2);
  place.z=Math.round(place.z*2)/2;

  if(kind==="prop"){
    const s=0.7+Math.random()*0.9;
    const size=[s,s*(0.7+Math.random()*0.8),s];
    addPhysProp({type:"prop",pos:[place.x,place.y,place.z],rot:[0,propRot,0],size,mass:2.5+Math.random()*4.5});
    sparksBurst(place);
  }

  if(kind==="fire"){
    addFire({type:"fire",pos:[place.x,0.35,place.z]});
    fireBurst(place);
    audio.playOneShot("fire", place, {gain:0.55}); // spawn one-shot
  }

  if(kind==="water"){
    addWater({type:"water",pos:[place.x,0.22,place.z],size:[3.0,0.35,3.0]});
    waterSplash(place);
    audio.playOneShot("waterTouch", place, {gain:0.9});
  }

  saveTick();
}

function deleteLookedAt(){
  const hit=intersectScene();
  if(!hit||!hit.object) return;

  let mesh=hit.object;
  while(mesh&&mesh.parent&&!mesh.userData.type) mesh=mesh.parent;
  if(!mesh||mesh.userData.type==="ground") return;

  const idx=objects.findIndex(o=>o.mesh===mesh);
  if(idx===-1) return;

  const obj=objects[idx];

  if(mesh.userData.type==="fire") audio.stopLoop("fire_"+mesh.userData.id);
  if(mesh.userData.type==="water") audio.stopLoop("water_"+mesh.userData.id);

  scene.remove(obj.mesh);
  if(obj.body) world.removeBody(obj.body);
  objects.splice(idx,1);

  sparksBurst(hit.point);
  saveTick();
}

function explodeAtLook(){
  const hit=intersectScene();
  if(!hit) return;
  const p=hit.point.clone();

  sparksBurst(p);
  for(let i=0;i<20;i++) fireBurst(p);

  const blast=new CANNON.Vec3(p.x,p.y,p.z);
  const radius=7.5;
  const force=55;

  for(const o of objects){
    if(!o.body) continue;
    const bp=o.body.position;
    const dx=bp.x-blast.x,dy=bp.y-blast.y,dz=bp.z-blast.z;
    const dist=Math.sqrt(dx*dx+dy*dy+dz*dz);
    if(dist>radius||dist<0.001) continue;
    const k=(1-dist/radius);
    o.body.applyImpulse(new CANNON.Vec3((dx/dist)*force*k,(dy/dist)*force*k,(dz/dist)*force*k),o.body.position);
    o.body.wakeUp();
  }

  saveTick();
  log("BOOM");
}

/* -------------------- GRAV GUN -------------------- */
let grabbed=null; // {obj,dist}
let grabConstraint=null;
let grabPivotBody=null;

function tryGrab(){
  const hit=intersectScene();
  if(!hit||!hit.object) return;

  let mesh=hit.object;
  while(mesh&&mesh.parent&&!mesh.userData.type) mesh=mesh.parent;
  if(!mesh||mesh.userData.type!=="prop") return;

  const obj=findObjByMesh(mesh);
  if(!obj||!obj.body) return;

  const dist=player.position.distanceTo(hit.point);
  grabbed={obj,dist};

  grabPivotBody=new CANNON.Body({mass:0});
  grabPivotBody.addShape(new CANNON.Sphere(0.1));
  grabPivotBody.position.set(hit.point.x,hit.point.y,hit.point.z);
  world.addBody(grabPivotBody);

  grabConstraint=new CANNON.PointToPointConstraint(obj.body,new CANNON.Vec3(0,0,0),grabPivotBody,new CANNON.Vec3(0,0,0),4e6);
  world.addConstraint(grabConstraint);

  obj.body.wakeUp();
  audio.playOneShot("pickup", null, {gain:0.95});
}

function dropGrab(){
  if(!grabbed) return;
  if(grabConstraint) world.removeConstraint(grabConstraint);
  if(grabPivotBody) world.removeBody(grabPivotBody);
  grabConstraint=null;
  grabPivotBody=null;
  grabbed=null;
  audio.playOneShot("drop", null, {gain:0.95});
  saveTick();
}

function throwGrab(){
  if(!grabbed) return;
  const obj=grabbed.obj;
  const dir=new THREE.Vector3();
  camera.getWorldDirection(dir);
  obj.body.applyImpulse(new CANNON.Vec3(dir.x*18,dir.y*18,dir.z*18),obj.body.position);
  obj.body.wakeUp();
  dropGrab();
}

function updateGrabPivot(){
  if(!grabbed||!grabPivotBody) return;
  const dir=new THREE.Vector3();
  camera.getWorldDirection(dir);
  const target=player.position.clone().add(dir.multiplyScalar(clamp(grabbed.dist,2.0,8.0)));
  grabPivotBody.position.set(target.x,target.y,target.z);
}

/* -------------------- WELD / ROPE -------------------- */
let weldFirst=null; // first prop selected
let ropeFirst=null;

function pickProp(){
  const hit=intersectScene();
  if(!hit||!hit.object) return null;
  let mesh=hit.object;
  while(mesh&&mesh.parent&&!mesh.userData.type) mesh=mesh.parent;
  if(!mesh||mesh.userData.type!=="prop") return null;
  return findObjByMesh(mesh);
}

function makeWeld(a,b){
  const c=new CANNON.LockConstraint(a.body,b.body,{maxForce:1e7});
  world.addConstraint(c);
  const def={type:"weld",a:a.mesh.userData.id,b:b.mesh.userData.id};
  constraints.push({c,def});
  sparksBurst(a.mesh.position);
  saveTick();
}

function makeRope(a,b){
  const c=new CANNON.DistanceConstraint(a.body,b.body, a.body.position.distanceTo(b.body.position), 1e7);
  world.addConstraint(c);
  const def={type:"rope",a:a.mesh.userData.id,b:b.mesh.userData.id};
  constraints.push({c,def});
  sparksBurst(a.mesh.position);
  saveTick();
}

function loadConstraintsFromSave(list){
  for(const def of list){
    const a=findObjById(def.a);
    const b=findObjById(def.b);
    if(!a||!b||!a.body||!b.body) continue;

    if(def.type==="weld"){
      const c=new CANNON.LockConstraint(a.body,b.body,{maxForce:1e7});
      world.addConstraint(c);
      constraints.push({c,def});
    }

    if(def.type==="rope"){
      const c=new CANNON.DistanceConstraint(a.body,b.body,a.body.position.distanceTo(b.body.position),1e7);
      world.addConstraint(c);
      constraints.push({c,def});
    }
  }
}

/* -------------------- THRUSTER -------------------- */
function addThrusterToLook(){
  const obj=pickProp();
  if(!obj) return;
  const id=crypto.randomUUID();
  thrusters.push({id,targetId:obj.mesh.userData.id,force:22,on:true});
  sparksBurst(obj.mesh.position);
  saveTick();
}

function loadThrustersFromSave(list){
  thrusters.length=0;
  for(const t of list){
    thrusters.push({id:t.id||crypto.randomUUID(),targetId:t.targetId,force:t.force||22,on:!!t.on});
  }
}

function tickThrusters(dt){
  for(const t of thrusters){
    if(!t.on) continue;
    const obj=findObjById(t.targetId);
    if(!obj||!obj.body) continue;

    // push forward based on camera direction for chaos (gmod-ish)
    const dir=new THREE.Vector3();
    camera.getWorldDirection(dir);
    obj.body.applyForce(new CANNON.Vec3(dir.x*t.force,dir.y*t.force*0.2,dir.z*t.force),obj.body.position);
    obj.body.wakeUp();
  }
}

/* -------------------- DUPES (export/import subset) -------------------- */
function buildDupe(){
  // just props + constraints + thrusters for now (portable)
  const dupe={
    objects: serializeWorld().filter(o=>o.type==="prop"),
    constraints: serializeConstraints(),
    thrusters: serializeThrusters()
  };
  return dupe;
}

function loadDupe(dupe){
  if(!dupe||!Array.isArray(dupe.objects)) return;
  // spawn dupe near player forward
  const forward=new THREE.Vector3();
  camera.getWorldDirection(forward);
  const base=player.position.clone().add(forward.multiplyScalar(5));

  // map old ids -> new ids
  const idMap=new Map();

  for(const d of dupe.objects){
    const nid=crypto.randomUUID();
    idMap.set(d.id,nid);
    const p=[base.x + (d.pos[0]*0.2), base.y + Math.max(0.5,d.pos[1]*0.2), base.z + (d.pos[2]*0.2)];
    addPhysProp({type:"prop",id:nid,pos:p,rot:d.rot,size:d.size,mass:d.mass});
  }

  // constraints
  const cons=Array.isArray(dupe.constraints)?dupe.constraints:[];
  for(const c of cons){
    const a=idMap.get(c.a), b=idMap.get(c.b);
    if(!a||!b) continue;
    const A=findObjById(a), B=findObjById(b);
    if(!A||!B) continue;
    if(c.type==="weld") makeWeld(A,B);
    if(c.type==="rope") makeRope(A,B);
  }

  // thrusters
  const th=Array.isArray(dupe.thrusters)?dupe.thrusters:[];
  for(const t of th){
    const nid=idMap.get(t.targetId);
    if(!nid) continue;
    thrusters.push({id:crypto.randomUUID(),targetId:nid,force:t.force||22,on:!!t.on});
  }

  saveTick();
}

/* -------------------- MOVEMENT + FOOTSTEPS -------------------- */
const keys=new Set();
const clock=new THREE.Clock();
let canJump=false;
let velocity=new THREE.Vector3();
let direction=new THREE.Vector3();
let lastFoot=0;

function movement(dt){
  direction.set(0,0,0);
  const running=keys.has(getKey("sprint"));
  const speed=running?9.2:6.1;

  if(keys.has(getKey("forward"))) direction.z-=1;
  if(keys.has(getKey("backward"))) direction.z+=1;
  if(keys.has(getKey("left"))) direction.x-=1;
  if(keys.has(getKey("right"))) direction.x+=1;
  direction.normalize();

  velocity.x-=velocity.x*9.5*dt;
  velocity.z-=velocity.z*9.5*dt;
  velocity.y-=18.8*dt;

  const moving=direction.lengthSq()>0;

  if(moving){
    const accel=speed*12.0;
    velocity.x+=direction.x*accel*dt;
    velocity.z+=direction.z*accel*dt;

    const t=performance.now();
    if(t-lastFoot>(running?240:340)){
      audio.playOneShot("walk", null, {gain:0.22});
      lastFoot=t;
    }
  }

  if(canJump && keys.has(getKey("jump"))){
    velocity.y=7.4;
    canJump=false;
  }

  controls.moveRight(velocity.x*dt);
  controls.moveForward(velocity.z*dt);
  player.position.y+=velocity.y*dt;

  if(player.position.y<2.2){
    velocity.y=0;
    player.position.y=2.2;
    canJump=true;
  }
}

function animateArms(){
  const moving=direction.lengthSq()>0;
  const t=performance.now()*0.001;
  const swing=moving?Math.sin(t*10)*0.05:0;
  arms.rotation.x=swing;
  arms.rotation.z=moving?Math.sin(t*10+1.3)*0.03:0;
}

/* -------------------- SYNC + AUDIO UPDATES -------------------- */
function syncMeshesFromBodies(){
  for(const o of objects){
    if(!o.body) continue;
    o.mesh.position.set(o.body.position.x,o.body.position.y,o.body.position.z);
    o.mesh.quaternion.set(o.body.quaternion.x,o.body.quaternion.y,o.body.quaternion.z,o.body.quaternion.w);
  }
}

function tickSpatialLoops(){
  // keep loop panners on their mesh positions
  for(const o of objects){
    if(!o.mesh) continue;
    const t=o.mesh.userData.type;
    if(t==="fire") audio.updateLoopPos("fire_"+o.mesh.userData.id, o.mesh.position);
    if(t==="water") audio.updateLoopPos("water_"+o.mesh.userData.id, o.mesh.position);
  }
  const fwd=new THREE.Vector3(); camera.getWorldDirection(fwd);
  audio.setListener(player.position, fwd);
}

/* -------------------- UI / SETTINGS -------------------- */
function buildHotkeyUI(){
  ui.hotkeys.innerHTML="";
  const entries=[
    ["Tool: Prop","toolProp"],["Tool: Grav","toolGrav"],["Tool: Weld","toolWeld"],["Tool: Rope","toolRope"],
    ["Tool: Thruster","toolThruster"],["Tool: Boom","toolExplode"],["Tool: Fire","toolFire"],["Tool: Water","toolWater"],["Tool: Delete","toolDelete"],
    ["Move: Forward","forward"],["Move: Back","backward"],["Move: Left","left"],["Move: Right","right"],
    ["Jump","jump"],["Sprint","sprint"],["Rotate","rotate"],["Throw","throw"],["Settings","settings"],["Save","save"],["Pause","pause"]
  ];

  for(const [label,key] of entries){
    const row=document.createElement("div");
    row.className="hk";
    row.dataset.key=key;
    row.innerHTML=`<b>${label}</b><span class="key">${state.keybinds[key]||"Unbound"}</span>`;
    row.addEventListener("click",()=>{
      pendingRebind=key;
      Array.from(ui.hotkeys.children).forEach(n=>n.classList.remove("waiting"));
      row.classList.add("waiting");
    });
    ui.hotkeys.appendChild(row);
  }
}
function updateHotkeyUI(){
  Array.from(ui.hotkeys.children).forEach(row=>{
    const key=row.dataset.key;
    row.querySelector(".key").textContent=state.keybinds[key]||"Unbound";
    row.classList.toggle("waiting",pendingRebind===key);
  });
}
function applySettingsToUI(){
  ui.setVolume.value=state.settings.volume;
  ui.setSens.value=state.settings.sensitivity;
  ui.setFov.value=state.settings.fov;
  ui.setChunks.value=state.settings.chunks;
}

function bootUI(){
  setTool(currentTool);

  ui.slots.forEach(b=>b.addEventListener("click",()=>setTool(b.dataset.tool)));

  ui.btnReset.addEventListener("click",()=>{clearSave();location.reload();});
  ui.btnSave.addEventListener("click",()=>saveTick());
  ui.btnReload.addEventListener("click",()=>location.reload());
  ui.btnClearWorld.addEventListener("click",()=>{
    state.world.objects=[]; state.world.constraints=[]; state.world.thrusters=[];
    saveAll(state);
    location.reload();
  });

  ui.btnSettings.addEventListener("click",()=>openSettings(true));
  ui.btnCloseSettings.addEventListener("click",()=>openSettings(false));

  ui.setVolume.addEventListener("input",()=>{
    state.settings.volume=Number(ui.setVolume.value);
    audio.setVolume(state.settings.volume);
    saveAll(state);
  });

  ui.setSens.addEventListener("input",()=>{
    state.settings.sensitivity=Number(ui.setSens.value);
    // pointer speed is in the controls
    controls.pointerSpeed=clamp(state.settings.sensitivity,0.05,2.0);
    saveAll(state);
  });

  ui.setFov.addEventListener("input",()=>{
    state.settings.fov=Number(ui.setFov.value);
    camera.fov=state.settings.fov;
    camera.updateProjectionMatrix();
    saveAll(state);
  });

  ui.setChunks.addEventListener("input",()=>{
    state.settings.chunks=Number(ui.setChunks.value);
    updateFogFromChunks();
    saveAll(state);
  });

  ui.btnExport.addEventListener("click",()=>{ui.saveBox.value=JSON.stringify(state);});
  ui.btnImport.addEventListener("click",()=>{
    const data=safeJSONParse(ui.saveBox.value,null);
    if(!data){alert("Invalid JSON");return;}
    localStorage.setItem(SAVE_KEY,JSON.stringify(data));
    location.reload();
  });
  ui.btnDefaults.addEventListener("click",()=>{
    localStorage.setItem(SAVE_KEY,JSON.stringify(DEFAULTS));
    location.reload();
  });

  ui.btnDupeSave.addEventListener("click",()=>{
    ui.dupeBox.value=JSON.stringify(buildDupe());
  });
  ui.btnDupeLoad.addEventListener("click",()=>{
    const dupe=safeJSONParse(ui.dupeBox.value,null);
    if(!dupe){alert("Invalid dupe JSON");return;}
    loadDupe(dupe);
  });

  window.addEventListener("keydown",(e)=>{
    if(pendingRebind){
      state.keybinds[pendingRebind]=e.code;
      pendingRebind=null;
      updateHotkeyUI();
      saveAll(state);
      e.preventDefault();
    }
  });

  buildHotkeyUI();
  applySettingsToUI();
  updateHotkeyUI();
}

/* -------------------- INPUT + LOCK -------------------- */
function bindEvents(){
  window.addEventListener("keydown",(e)=>{
    keys.add(e.code);

    const tool=toolFromKey(e.code);
    if(tool){setTool(tool); return;}

    if(e.code===getKey("rotate")){ propRot+=Math.PI/2; }
    if(e.code===getKey("throw")){ if(grabbed) throwGrab(); }

    if(e.code===getKey("settings")){
      openSettings(ui.panel.classList.contains("hidden"));
    }

    if(e.code===getKey("save")) saveTick();

    if(e.code===getKey("pause")){
      if(document.pointerLockElement) controls.unlock();
      else controls.lock();
    }
  });

  window.addEventListener("keyup",(e)=>keys.delete(e.code));

  ui.canvas.addEventListener("mousedown",(e)=>{
    if(e.button!==0) return;

    if(document.pointerLockElement!==ui.canvas){
      controls.lock();
      return;
    }

    if(currentTool==="prop") spawnAtLook("prop");
    if(currentTool==="fire") spawnAtLook("fire");
    if(currentTool==="water") spawnAtLook("water");
    if(currentTool==="delete") deleteLookedAt();
    if(currentTool==="explode") explodeAtLook();

    if(currentTool==="grav"){
      if(grabbed) dropGrab();
      else tryGrab();
    }

    if(currentTool==="thruster"){
      addThrusterToLook();
    }

    if(currentTool==="weld"){
      const p=pickProp();
      if(!p) return;
      if(!weldFirst){ weldFirst=p; sparksBurst(p.mesh.position); return; }
      if(weldFirst && p!==weldFirst){ makeWeld(weldFirst,p); weldFirst=null; }
    }

    if(currentTool==="rope"){
      const p=pickProp();
      if(!p) return;
      if(!ropeFirst){ ropeFirst=p; sparksBurst(p.mesh.position); return; }
      if(ropeFirst && p!==ropeFirst){ makeRope(ropeFirst,p); ropeFirst=null; }
    }
  });

  ui.blocker.addEventListener("click",()=>controls.lock());

  document.addEventListener("pointerlockchange",()=>{
    const locked=document.pointerLockElement===ui.canvas;
    showBlocker(!locked);
  });
}

/* -------------------- START -------------------- */
ui.btnStart.addEventListener("click",()=>{
  ui.intro.classList.add("hidden");
  showHUD(true);
  audio.resume();
  controls.pointerSpeed=clamp(state.settings.sensitivity,0.05,2.0);
  loadWorldFromSave();
  updateFogFromChunks();
  controls.lock();
  log("Engine started");
});

/* -------------------- INIT -------------------- */
bootUI();
bindEvents();

(async function(){
  log("Init audio...");
  await audio.load("waterTouch",SFX.waterTouch);
  await audio.load("waterFlow",SFX.waterFlow);
  await audio.load("walk",SFX.walk);
  await audio.load("pickup",SFX.pickup);
  await audio.load("drop",SFX.drop);
  await audio.load("fire",SFX.fire);
  log("Audio ready.");
})();

/* -------------------- LOOP -------------------- */
function loop(){
  const dt=clamp(clock.getDelta(),0,0.05);

  if(document.pointerLockElement===ui.canvas){
    movement(dt);
    animateArms();
  }

  world.step(1/60,dt,3);
  updateGrabPivot();
  tickThrusters(dt);
  syncMeshesFromBodies();

  fireFX.tick(dt,0.8);
  waterFX.tick(dt,6.5);
  sparksFX.tick(dt,7.5);

  tickSpatialLoops();

  renderer.render(scene,camera);
  requestAnimationFrame(loop);
}
loop();
