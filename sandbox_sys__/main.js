import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { TextureBank } from "https://favnc.pages.dev/sandbox_sys__/texture.js";
import { VFX } from "https://favnc.pages.dev/sandbox_sys__/vfx.js";
import * as CANNON from "https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js";

const ENGINE = "NexusCommandEngine_1_0_0";
const SAVE_KEY = ENGINE + "_save";

const SFX = {
  waterTouch: "https://favnc.pages.dev/sandbox_sys__/sfx/water-touch.mp3",
  waterFlow: "https://favnc.pages.dev/sandbox_sys__/sfx/water-flow.mp3",
  walk: "https://favnc.pages.dev/sandbox_sys__/sfx/walk.mp3",
  pickup: "https://favnc.pages.dev/sandbox_sys__/sfx/item-pickup.mp3",
  drop: "https://favnc.pages.dev/sandbox_sys__/sfx/item-drop.mp3",
  fire: "https://favnc.pages.dev/sandbox_sys__/sfx/fire.mp3"
};

const DEFAULTS = {
  settings: { volume: 0.65, sensitivity: 0.65, fov: 85, chunks: 8 },
  keybinds: {
    forward: "KeyW", backward: "KeyS", left: "KeyA", right: "KeyD",
    jump: "Space", sprint: "ShiftLeft",
    rotate: "KeyR",
    throw: "KeyG",
    save: "KeyP",
    toolProp: "Digit1",
    toolGrav: "Digit2",
    toolExplode: "Digit3",
    toolFire: "Digit4",
    toolWater: "Digit5",
    toolDelete: "Digit6",
    pause: "Escape"
  },
  player: { pos: [0,2.2,6] },
  world: { objects: [] }
};

function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }
function safeJSONParse(s, fallback){ try { return JSON.parse(s); } catch(e){ return fallback; } }
function structuredClone(obj){ return JSON.parse(JSON.stringify(obj)); }
function log(){ console.log.apply(console, ["[NCE]", ...arguments]); }

function loadSave(){
  const raw = localStorage.getItem(SAVE_KEY);
  if(!raw) return structuredClone(DEFAULTS);
  const data = safeJSONParse(raw, null);
  if(!data) return structuredClone(DEFAULTS);
  const merged = structuredClone(DEFAULTS);
  merged.settings = Object.assign({}, merged.settings, data.settings||{});
  merged.keybinds = Object.assign({}, merged.keybinds, data.keybinds||{});
  merged.player = Object.assign({}, merged.player, data.player||{});
  merged.world = Object.assign({}, merged.world, data.world||{});
  if(!Array.isArray(merged.world.objects)) merged.world.objects = [];
  return merged;
}

function saveAll(state){
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  log("Saved", (state.world.objects||[]).length, "objects");
}

function clearSave(){
  localStorage.removeItem(SAVE_KEY);
  log("Save cleared");
}

function makeAudioBank(volume){
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const master = ctx.createGain();
  master.gain.value = volume;
  master.connect(ctx.destination);
  const buffers = {};
  const active = {};

  async function load(name, url){
    const r = await fetch(url);
    const a = await r.arrayBuffer();
    buffers[name] = await ctx.decodeAudioData(a);
    log("SFX loaded:", name);
  }

  function play(name, opts){
    const buf = buffers[name];
    if(!buf) return;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = !!(opts && opts.loop);

    const gain = ctx.createGain();
    gain.gain.value = (opts && opts.gain != null) ? opts.gain : 1.0;

    src.connect(gain);
    gain.connect(master);

    src.start(0);

    if(opts && opts.tag){
      stop(opts.tag);
      active[opts.tag] = src;
    }
    return src;
  }

  function stop(tag){
    const src = active[tag];
    if(!src) return;
    try { src.stop(); } catch(e) {}
    delete active[tag];
  }

  function setVolume(v){ master.gain.value = v; }
  function resume(){ if(ctx.state !== "running") return ctx.resume(); }

  return { load, play, stop, setVolume, resume };
}

const ui = {
  intro: document.getElementById("intro"),
  btnStart: document.getElementById("btnStart"),
  btnReset: document.getElementById("btnReset"),
  canvas: document.getElementById("c"),
  hud: document.getElementById("hud"),
  slots: Array.from(document.querySelectorAll(".slot")),
  btnSave: document.getElementById("btnSave"),
  btnReload: document.getElementById("btnReload"),
  btnClearWorld: document.getElementById("btnClearWorld"),
  btnSettings: document.getElementById("btnSettings"),
  panel: document.getElementById("settingsPanel"),
  btnCloseSettings: document.getElementById("btnCloseSettings"),
  blocker: document.getElementById("blocker"),
  setVolume: document.getElementById("setVolume"),
  setSens: document.getElementById("setSens"),
  setFov: document.getElementById("setFov"),
  setChunks: document.getElementById("setChunks"),
  hotkeys: document.getElementById("hotkeys"),
  btnExport: document.getElementById("btnExport"),
  btnImport: document.getElementById("btnImport"),
  btnDefaults: document.getElementById("btnDefaults"),
  saveBox: document.getElementById("saveBox")
};

const state = loadSave();
const audio = makeAudioBank(state.settings.volume);

let currentTool = "prop";
let pendingRebind = null;

function setTool(t){
  currentTool = t;
  ui.slots.forEach(b => b.classList.toggle("active", b.dataset.tool === t));
  log("Tool:", t);
}

function openSettings(open){ ui.panel.classList.toggle("hidden", !open); }
function showHUD(show){ ui.hud.classList.toggle("hidden", !show); }
function showBlocker(show){ ui.blocker.classList.toggle("hidden", !show); }

function getKey(action){ return state.keybinds[action] || DEFAULTS.keybinds[action]; }

function toolFromKey(code){
  if(code === getKey("toolProp")) return "prop";
  if(code === getKey("toolGrav")) return "grav";
  if(code === getKey("toolExplode")) return "explode";
  if(code === getKey("toolFire")) return "fire";
  if(code === getKey("toolWater")) return "water";
  if(code === getKey("toolDelete")) return "delete";
  return null;
}

function buildHotkeyUI(){
  ui.hotkeys.innerHTML = "";
  const entries = [
    ["Tool: Prop Gun", "toolProp"],
    ["Tool: Gravity Gun", "toolGrav"],
    ["Tool: Explode", "toolExplode"],
    ["Tool: Fire", "toolFire"],
    ["Tool: Water", "toolWater"],
    ["Tool: Delete", "toolDelete"],
    ["Move: Forward", "forward"],
    ["Move: Back", "backward"],
    ["Move: Left", "left"],
    ["Move: Right", "right"],
    ["Jump", "jump"],
    ["Sprint", "sprint"],
    ["Rotate Prop", "rotate"],
    ["Throw", "throw"],
    ["Save", "save"],
    ["Pause", "pause"]
  ];

  entries.forEach(([label, key])=>{
    const row = document.createElement("div");
    row.className = "hk";
    row.dataset.key = key;
    row.innerHTML = `<b>${label}</b><span class="key">${state.keybinds[key]||"Unbound"}</span>`;
    row.addEventListener("click", ()=>{
      pendingRebind = key;
      Array.from(ui.hotkeys.children).forEach(n=>n.classList.remove("waiting"));
      row.classList.add("waiting");
      log("Rebind waiting:", key);
    });
    ui.hotkeys.appendChild(row);
  });
}

function applySettingsToUI(){
  ui.setVolume.value = state.settings.volume;
  ui.setSens.value = state.settings.sensitivity;
  ui.setFov.value = state.settings.fov;
  ui.setChunks.value = state.settings.chunks;
}

function updateHotkeyUI(){
  Array.from(ui.hotkeys.children).forEach(row=>{
    const key = row.dataset.key;
    const span = row.querySelector(".key");
    span.textContent = state.keybinds[key] || "Unbound";
    row.classList.toggle("waiting", pendingRebind === key);
  });
}

function bootUI(){
  setTool(currentTool);

  ui.slots.forEach(b=> b.addEventListener("click", ()=> setTool(b.dataset.tool)));

  ui.btnReset.addEventListener("click", ()=>{ clearSave(); location.reload(); });
  ui.btnSave.addEventListener("click", ()=> saveTick());
  ui.btnReload.addEventListener("click", ()=> location.reload());
  ui.btnClearWorld.addEventListener("click", ()=>{
    state.world.objects = [];
    saveAll(state);
    location.reload();
  });

  ui.btnSettings.addEventListener("click", ()=> openSettings(true));
  ui.btnCloseSettings.addEventListener("click", ()=> openSettings(false));

  ui.setVolume.addEventListener("input", ()=>{
    state.settings.volume = Number(ui.setVolume.value);
    audio.setVolume(state.settings.volume);
    saveAll(state);
  });

  ui.setSens.addEventListener("input", ()=>{
    state.settings.sensitivity = Number(ui.setSens.value);
    saveAll(state);
  });

  ui.setFov.addEventListener("input", ()=>{
    state.settings.fov = Number(ui.setFov.value);
    camera.fov = state.settings.fov;
    camera.updateProjectionMatrix();
    saveAll(state);
  });

  ui.setChunks.addEventListener("input", ()=>{
    state.settings.chunks = Number(ui.setChunks.value);
    updateFogFromChunks();
    saveAll(state);
  });

  ui.btnExport.addEventListener("click", ()=>{ ui.saveBox.value = JSON.stringify(state); });
  ui.btnImport.addEventListener("click", ()=>{
    const data = safeJSONParse(ui.saveBox.value, null);
    if(!data){ alert("Invalid JSON"); return; }
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    location.reload();
  });
  ui.btnDefaults.addEventListener("click", ()=>{
    localStorage.setItem(SAVE_KEY, JSON.stringify(DEFAULTS));
    location.reload();
  });

  window.addEventListener("keydown", (e)=>{
    if(pendingRebind){
      state.keybinds[pendingRebind] = e.code;
      pendingRebind = null;
      updateHotkeyUI();
      saveAll(state);
      e.preventDefault();
      return;
    }
  });

  buildHotkeyUI();
  applySettingsToUI();
  updateHotkeyUI();
}

const renderer = new THREE.WebGLRenderer({ canvas: ui.canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(state.settings.fov, window.innerWidth / window.innerHeight, 0.05, 500);
camera.position.fromArray(state.player.pos);

const controls = new PointerLockControls(camera, document.body);
controls.pointerSpeed = clamp(state.settings.sensitivity, 0.05, 2.0);

const keys = new Set();
const clock = new THREE.Clock();
let canJump = false;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let lastFootstep = 0;

const ray = new THREE.Raycaster();
const pointer = new THREE.Vector2(0,0);

const texGrid = new THREE.CanvasTexture(TextureBank.gridTexture());
texGrid.wrapS = texGrid.wrapT = THREE.RepeatWrapping;
texGrid.repeat.set(6,6);

const texMetal = new THREE.CanvasTexture(TextureBank.metalTexture());
texMetal.wrapS = texMetal.wrapT = THREE.RepeatWrapping;
texMetal.repeat.set(1,1);

const texWater = new THREE.CanvasTexture(TextureBank.waterTexture());
texWater.wrapS = texWater.wrapT = THREE.RepeatWrapping;
texWater.repeat.set(2,2);

const matGround = new THREE.MeshStandardMaterial({ map: texGrid, roughness: 0.95, metalness: 0.05 });
const matProp = new THREE.MeshStandardMaterial({ map: texMetal, roughness: 0.75, metalness: 0.25 });
const matWater = new THREE.MeshStandardMaterial({ map: texWater, roughness: 0.12, metalness: 0.05, transparent: true, opacity: 0.85 });

const hemi = new THREE.HemisphereLight(0xffffff, 0x080a15, 0.95);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xffffff, 0.6);
sun.position.set(12, 20, 8);
scene.add(sun);

const ground = new THREE.Mesh(new THREE.PlaneGeometry(320,320,1,1), matGround);
ground.rotation.x = -Math.PI/2;
ground.userData.type = "ground";
scene.add(ground);

const arms = makeArms();
camera.add(arms);

const fireFX = VFX.makeFire(THREE);
const waterFX = VFX.makeWater(THREE);
const sparksFX = VFX.makeSparks(THREE);
scene.add(fireFX.object, waterFX.object, sparksFX.object);

// ---------------- PHYSICS (CANNON) ----------------
const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) });
world.broadphase = new CANNON.SAPBroadphase(world);
world.allowSleep = true;

const physMat = new CANNON.Material("phys");
const groundMat = new CANNON.Material("ground");
world.addContactMaterial(new CANNON.ContactMaterial(groundMat, physMat, { friction: 0.6, restitution: 0.08 }));
world.addContactMaterial(new CANNON.ContactMaterial(physMat, physMat, { friction: 0.35, restitution: 0.14 }));

const groundBody = new CANNON.Body({ type: CANNON.Body.STATIC, material: groundMat });
groundBody.addShape(new CANNON.Plane());
groundBody.quaternion.setFromEuler(-Math.PI/2, 0, 0);
world.addBody(groundBody);

const objects = []; // { mesh, body, def }
let propRot = 0;

// Gravity gun grab
let grabbed = null; // { obj, dist, localHit }
let grabConstraint = null;
let grabPivotBody = null;

function makeArms(){
  const g = new THREE.Group();
  const armMat = new THREE.MeshStandardMaterial({ color: 0x10131f, roughness: 0.6, metalness: 0.05 });
  const glowMat = new THREE.MeshStandardMaterial({ color: 0x1a1f30, roughness: 0.2, metalness: 0.15, emissive: 0x05070f });
  const left = new THREE.Mesh(new THREE.BoxGeometry(0.14,0.44,0.16), armMat);
  const right = new THREE.Mesh(new THREE.BoxGeometry(0.14,0.44,0.16), armMat);
  left.position.set(-0.22,-0.28,-0.55);
  right.position.set(0.22,-0.28,-0.55);
  const wristL = new THREE.Mesh(new THREE.BoxGeometry(0.16,0.16,0.18), glowMat);
  const wristR = new THREE.Mesh(new THREE.BoxGeometry(0.16,0.16,0.18), glowMat);
  wristL.position.set(-0.22,-0.50,-0.55);
  wristR.position.set(0.22,-0.50,-0.55);
  g.add(left, right, wristL, wristR);
  return g;
}

function updateFogFromChunks(){
  const d = state.settings.chunks * 22;
  scene.fog = new THREE.FogExp2(0x000000, 1/(d*d));
  camera.far = clamp(d*3.2, 150, 520);
  camera.updateProjectionMatrix();
  log("Chunks:", state.settings.chunks, "FogDist:", d, "Far:", camera.far);
}
updateFogFromChunks();

function resize(){
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);

function intersectScene(){
  ray.setFromCamera(pointer, camera);
  const meshes = objects.map(o=>o.mesh);
  const hits = ray.intersectObjects(meshes, true);
  if(hits.length) return hits[0];
  const gHits = ray.intersectObject(ground, false);
  if(gHits.length) return gHits[0];
  return null;
}

function sparksBurst(p){
  for(let i=0;i<20;i++){
    sparksFX.spawn(
      new THREE.Vector3(p.x, p.y+0.12, p.z),
      new THREE.Vector3((Math.random()*2-1)*3.2, 2+Math.random()*2.8, (Math.random()*2-1)*3.2)
    );
  }
}
function fireBurst(p){
  for(let i=0;i<14;i++){
    fireFX.spawn(
      new THREE.Vector3(p.x+(Math.random()*2-1)*0.12, p.y+0.2, p.z+(Math.random()*2-1)*0.12),
      new THREE.Vector3((Math.random()*2-1)*0.8, 1.6+Math.random()*2.2, (Math.random()*2-1)*0.8)
    );
  }
}
function waterSplash(p){
  for(let i=0;i<22;i++){
    waterFX.spawn(
      new THREE.Vector3(p.x+(Math.random()*2-1)*0.28, p.y+0.22, p.z+(Math.random()*2-1)*0.28),
      new THREE.Vector3((Math.random()*2-1)*2.6, 2.6+Math.random()*1.8, (Math.random()*2-1)*2.6)
    );
  }
}

function addPhysProp(def){
  const id = def.id || crypto.randomUUID();
  const pos = def.pos || [0,3,0];
  const rot = def.rot || [0,0,0];
  const size = def.size || [1,1,1];
  const mass = def.mass != null ? def.mass : 3.5;

  const mesh = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), matProp);
  mesh.scale.set(size[0], size[1], size[2]);
  mesh.position.set(pos[0], pos[1], pos[2]);
  mesh.rotation.set(rot[0], rot[1], rot[2]);
  mesh.userData = { type: "prop", id };

  scene.add(mesh);

  const half = new CANNON.Vec3(size[0]*0.5, size[1]*0.5, size[2]*0.5);
  const shape = new CANNON.Box(half);
  const body = new CANNON.Body({ mass, material: physMat });
  body.addShape(shape);
  body.position.set(pos[0], pos[1], pos[2]);
  body.quaternion.setFromEuler(rot[0], rot[1], rot[2]);
  body.linearDamping = 0.02;
  body.angularDamping = 0.06;
  world.addBody(body);

  const obj = { mesh, body, def: { type:"prop", id, pos, rot, size, mass } };
  objects.push(obj);
  return obj;
}

function addWaterPatch(def){
  const id = def.id || crypto.randomUUID();
  const pos = def.pos || [0,0.2,0];
  const size = def.size || [3.0,0.35,3.0];

  const mesh = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), matWater);
  mesh.scale.set(size[0], size[1], size[2]);
  mesh.position.set(pos[0], pos[1], pos[2]);
  mesh.userData = { type: "water", id };
  scene.add(mesh);

  const obj = { mesh, body: null, def: { type:"water", id, pos, size } };
  objects.push(obj);
  return obj;
}

function addFireMarker(def){
  const id = def.id || crypto.randomUUID();
  const pos = def.pos || [0,0.35,0];

  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.42, 0.6, 14),
    new THREE.MeshStandardMaterial({ color: 0xffaa33, emissive: 0xff6600, emissiveIntensity: 0.7, transparent: true, opacity: 0.55 })
  );
  mesh.position.set(pos[0], pos[1], pos[2]);
  mesh.userData = { type: "fire", id };
  scene.add(mesh);

  const obj = { mesh, body: null, def: { type:"fire", id, pos } };
  objects.push(obj);
  return obj;
}

function serializeWorld(){
  const out = [];
  for(const o of objects){
    const t = o.def.type;
    if(t === "prop"){
      out.push({
        type:"prop",
        id:o.mesh.userData.id,
        pos:[o.body.position.x,o.body.position.y,o.body.position.z],
        rot:(function(){
          const e = new CANNON.Vec3();
          o.body.quaternion.toEuler(e);
          return [e.x,e.y,e.z];
        })(),
        size:[o.mesh.scale.x,o.mesh.scale.y,o.mesh.scale.z],
        mass:o.body.mass
      });
    }
    if(t === "water"){
      out.push({ type:"water", id:o.mesh.userData.id, pos:[o.mesh.position.x,o.mesh.position.y,o.mesh.position.z], size:[o.mesh.scale.x,o.mesh.scale.y,o.mesh.scale.z] });
    }
    if(t === "fire"){
      out.push({ type:"fire", id:o.mesh.userData.id, pos:[o.mesh.position.x,o.mesh.position.y,o.mesh.position.z] });
    }
  }
  return out;
}

function clearWorld(){
  for(const o of objects){
    scene.remove(o.mesh);
    if(o.body) world.removeBody(o.body);
  }
  objects.length = 0;
}

function loadWorldFromSave(){
  clearWorld();
  const list = state.world.objects || [];
  for(const def of list){
    if(def.type === "prop") addPhysProp(def);
    if(def.type === "water") addWaterPatch(def);
    if(def.type === "fire") addFireMarker(def);
  }
  log("World loaded:", list.length);
}

function saveTick(){
  state.player.pos = [camera.position.x,camera.position.y,camera.position.z];
  state.world.objects = serializeWorld();
  saveAll(state);
}

function spawnAtLook(kind){
  const hit = intersectScene();
  if(!hit) return;

  const p = hit.point.clone();
  const n = hit.face ? hit.face.normal.clone() : new THREE.Vector3(0,1,0);
  n.transformDirection(hit.object.matrixWorld);

  const place = p.clone().add(n.multiplyScalar(1.0));
  place.x = Math.round(place.x * 2)/2;
  place.y = Math.max(0.25, Math.round(place.y * 2)/2);
  place.z = Math.round(place.z * 2)/2;

  if(kind === "prop"){
    const s = 0.7 + Math.random()*0.9;
    const size = [s, s*(0.7+Math.random()*0.8), s];
    addPhysProp({ type:"prop", pos:[place.x, place.y, place.z], rot:[0, propRot, 0], size, mass: 2.5 + Math.random()*4.5 });
    sparksBurst(place);
  }

  if(kind === "water"){
    addWaterPatch({ type:"water", pos:[place.x, 0.22, place.z], size:[3.0,0.35,3.0] });
    waterSplash(place);
    audio.play("waterTouch",{gain:0.85});
  }

  if(kind === "fire"){
    addFireMarker({ type:"fire", pos:[place.x, 0.35, place.z] });
    fireBurst(place);
    audio.play("fire",{gain:0.65, tag:"fireLoop", loop:true});
  }

  saveTick();
}

function deleteLookedAt(){
  const hit = intersectScene();
  if(!hit || !hit.object) return;
  let mesh = hit.object;
  while(mesh && mesh.parent && !mesh.userData.type) mesh = mesh.parent;
  if(!mesh || mesh.userData.type === "ground") return;

  const idx = objects.findIndex(o=>o.mesh === mesh);
  if(idx === -1) return;

  const obj = objects[idx];
  scene.remove(obj.mesh);
  if(obj.body) world.removeBody(obj.body);
  objects.splice(idx,1);

  sparksBurst(hit.point);
  saveTick();
  log("Deleted:", mesh.userData.type);
}

function tryGrab(){
  const hit = intersectScene();
  if(!hit || !hit.object) return;

  let mesh = hit.object;
  while(mesh && mesh.parent && !mesh.userData.type) mesh = mesh.parent;
  if(!mesh || mesh.userData.type !== "prop") return;

  const obj = objects.find(o=>o.mesh === mesh);
  if(!obj || !obj.body) return;

  const dist = camera.position.distanceTo(hit.point);
  grabbed = { obj, dist };

  // pivot body that follows camera forward
  grabPivotBody = new CANNON.Body({ mass: 0 });
  grabPivotBody.addShape(new CANNON.Sphere(0.1));
  grabPivotBody.position.set(hit.point.x, hit.point.y, hit.point.z);
  world.addBody(grabPivotBody);

  // constraint: keep prop near pivot
  grabConstraint = new CANNON.PointToPointConstraint(
    obj.body, new CANNON.Vec3(0,0,0),
    grabPivotBody, new CANNON.Vec3(0,0,0),
    4e6
  );
  world.addConstraint(grabConstraint);

  obj.body.wakeUp();
  audio.play("pickup",{gain:0.95});
  log("Grabbed prop");
}

function dropGrab(){
  if(!grabbed) return;
  audio.play("drop",{gain:0.95});
  if(grabConstraint) world.removeConstraint(grabConstraint);
  if(grabPivotBody) world.removeBody(grabPivotBody);
  grabConstraint = null;
  grabPivotBody = null;
  grabbed = null;
  saveTick();
  log("Dropped prop");
}

function throwGrab(){
  if(!grabbed) return;
  const obj = grabbed.obj;
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  obj.body.applyImpulse(new CANNON.Vec3(dir.x*18, dir.y*18, dir.z*18), obj.body.position);
  sparksBurst(new THREE.Vector3(obj.body.position.x,obj.body.position.y,obj.body.position.z));
  dropGrab();
  log("Thrown");
}

function updateGrabPivot(){
  if(!grabbed || !grabPivotBody) return;
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  const target = camera.position.clone().add(dir.multiplyScalar(clamp(grabbed.dist, 2.0, 8.0)));
  grabPivotBody.position.set(target.x, target.y, target.z);
}

function explodeAtLook(){
  const hit = intersectScene();
  if(!hit) return;

  const p = hit.point.clone();
  sparksBurst(p);
  for(let i=0;i<24;i++) fireBurst(p);

  const blastPos = new CANNON.Vec3(p.x,p.y,p.z);
  const radius = 7.5;
  const force = 55;

  for(const o of objects){
    if(!o.body) continue;
    const bp = o.body.position;
    const dx = bp.x - blastPos.x;
    const dy = bp.y - blastPos.y;
    const dz = bp.z - blastPos.z;
    const dist = Math.sqrt(dx*dx+dy*dy+dz*dz);
    if(dist > radius || dist < 0.001) continue;
    const k = (1 - dist/radius);
    const nx = dx/dist, ny = dy/dist, nz = dz/dist;
    o.body.applyImpulse(new CANNON.Vec3(nx*force*k, ny*force*k, nz*force*k), o.body.position);
    o.body.wakeUp();
  }

  saveTick();
  log("BOOM");
}

function movement(dt){
  direction.set(0,0,0);

  const forward = getKey("forward");
  const backward = getKey("backward");
  const left = getKey("left");
  const right = getKey("right");
  const sprint = getKey("sprint");
  const jump = getKey("jump");

  const running = keys.has(sprint);
  const speed = running ? 9.2 : 6.1;

  if(keys.has(forward)) direction.z -= 1;
  if(keys.has(backward)) direction.z += 1;
  if(keys.has(left)) direction.x -= 1;
  if(keys.has(right)) direction.x += 1;

  direction.normalize();

  velocity.x -= velocity.x * 9.5 * dt;
  velocity.z -= velocity.z * 9.5 * dt;
  velocity.y -= 18.8 * dt;

  if(direction.lengthSq() > 0){
    const accel = speed * 12.0;
    velocity.x += direction.x * accel * dt;
    velocity.z += direction.z * accel * dt;

    const t = performance.now();
    if(t - lastFootstep > (running ? 240 : 340)){
      audio.play("walk",{gain:0.22});
      lastFootstep = t;
    }
  }

  if(canJump && keys.has(jump)){
    velocity.y = 7.4;
    canJump = false;
    log("Jump");
  }

  controls.moveRight(velocity.x * dt);
  controls.moveForward(velocity.z * dt);
  camera.position.y += velocity.y * dt;

  if(camera.position.y < 2.2){
    velocity.y = 0;
    camera.position.y = 2.2;
    canJump = true;
  }
}

function animateArms(){
  const moving = direction.lengthSq() > 0;
  const t = performance.now() * 0.001;
  const swing = moving ? Math.sin(t * 10) * 0.05 : 0;
  arms.rotation.x = swing;
  arms.rotation.z = moving ? Math.sin(t*10+1.3)*0.03 : 0;
}

function tickVFX(dt){
  fireFX.tick(dt, 0.8);
  waterFX.tick(dt, 6.5);
  sparksFX.tick(dt, 7.5);
}

function syncMeshesFromBodies(){
  for(const o of objects){
    if(!o.body) continue;
    o.mesh.position.set(o.body.position.x, o.body.position.y, o.body.position.z);
    o.mesh.quaternion.set(o.body.quaternion.x, o.body.quaternion.y, o.body.quaternion.z, o.body.quaternion.w);
  }
}

async function loadSFX(){
  await audio.load("waterTouch", SFX.waterTouch);
  await audio.load("waterFlow", SFX.waterFlow);
  await audio.load("walk", SFX.walk);
  await audio.load("pickup", SFX.pickup);
  await audio.load("drop", SFX.drop);
  await audio.load("fire", SFX.fire);
}

function bindEvents(){
  window.addEventListener("keydown",(e)=>{
    keys.add(e.code);

    const tool = toolFromKey(e.code);
    if(tool){ setTool(tool); return; }

    if(e.code === getKey("rotate")){
      propRot += Math.PI/2;
      log("Rotate prop:", propRot);
    }

    if(e.code === getKey("throw")){
      if(grabbed) throwGrab();
    }

    if(e.code === getKey("save")){
      saveTick();
    }

    if(e.code === getKey("pause")){
      if(document.pointerLockElement) controls.unlock();
      else ui.canvas.requestPointerLock();
    }
  });

  window.addEventListener("keyup",(e)=> keys.delete(e.code));

  ui.canvas.addEventListener("mousedown",(e)=>{
    if(e.button !== 0) return;

    if(document.pointerLockElement !== ui.canvas && document.pointerLockElement !== document.body){
      ui.canvas.requestPointerLock();
      return;
    }

    if(currentTool === "prop") spawnAtLook("prop");
    if(currentTool === "water") spawnAtLook("water");
    if(currentTool === "fire") spawnAtLook("fire");
    if(currentTool === "delete") deleteLookedAt();
    if(currentTool === "explode") explodeAtLook();

    if(currentTool === "grav"){
      if(grabbed) dropGrab();
      else tryGrab();
    }
  });

  ui.blocker.addEventListener("click", ()=> ui.canvas.requestPointerLock());

  document.addEventListener("pointerlockchange", ()=>{
    const locked = document.pointerLockElement === ui.canvas || document.pointerLockElement === document.body;
    showBlocker(!locked);
    log("PointerLock:", locked);
  });

  window.addEventListener("keydown",(e)=>{
    if(!pendingRebind) return;
    state.keybinds[pendingRebind] = e.code;
    pendingRebind = null;
    updateHotkeyUI();
    saveAll(state);
    e.preventDefault();
  });
}

function startEngine(){
  ui.intro.classList.add("hidden");
  showHUD(true);
  audio.resume();
  controls.pointerSpeed = clamp(state.settings.sensitivity, 0.05, 2.0);

  loadWorldFromSave();
  updateFogFromChunks();

  ui.canvas.requestPointerLock();
  log("Engine started");
}

ui.btnStart.addEventListener("click", startEngine);

function boot(){
  bootUI();
  bindEvents();
  setTool(currentTool);
  log("Boot UI done");
}

boot();

ui.btnReset.addEventListener("click", ()=>{ clearSave(); location.reload(); });

// load + run
(async function init(){
  log("Init begin");
  await loadSFX();
  log("Init done");
})();

function physicsStep(dt){
  world.step(1/60, dt, 3);
  updateGrabPivot();
  syncMeshesFromBodies();
}

function loop(){
  const dt = clamp(clock.getDelta(), 0, 0.05);

  if(document.pointerLockElement === ui.canvas || document.pointerLockElement === document.body){
    movement(dt);
    animateArms();
  }

  physicsStep(dt);
  tickVFX(dt);

  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}
loop();
