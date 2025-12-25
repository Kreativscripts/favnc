import * as THREE from "https://unpkg.com/three@0.161.0/build/three.module.js";
import { PointerLockControls } from "https://unpkg.com/three@0.161.0/examples/jsm/controls/PointerLockControls.js";
import { TextureBank } from "https://favnc.pages.dev/sandbox_sys__/texture.js";
import { VFX } from "https://favnc.pages.dev/sandbox_sys__/vfx.js";

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
    forward: "KeyW",
    backward: "KeyS",
    left: "KeyA",
    right: "KeyD",
    jump: "Space",
    sprint: "ShiftLeft",
    rotate: "KeyR",
    flashlight: "KeyF",
    save: "KeyP",
    toolBlock: "Digit1",
    toolLight: "Digit2",
    toolFire: "Digit3",
    toolWater: "Digit4",
    toolDelete: "Digit5",
    toolGrab: "Digit6",
    pause: "Escape"
  },
  player: { pos: [0,2.2,6], yaw: 0, pitch: 0 },
  world: { objects: [] }
};

function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }
function now(){ return performance.now(); }

function log(){
  console.log.apply(console, ["[NCE]", ...arguments]);
}

function safeJSONParse(s, fallback){
  try { return JSON.parse(s); } catch(e){ return fallback; }
}

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
  log("Saved", state.world.objects.length, "objects");
}

function clearSave(){
  localStorage.removeItem(SAVE_KEY);
  log("Save cleared");
}

function structuredClone(obj){
  return JSON.parse(JSON.stringify(obj));
}

function isCodePressed(keys, code){
  return keys.has(code);
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

  function setVolume(v){
    master.gain.value = v;
  }

  function resume(){
    if(ctx.state !== "running") return ctx.resume();
  }

  return { ctx, load, play, stop, setVolume, resume };
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
let currentTool = "block";
let pendingRebind = null;

function setTool(t){
  currentTool = t;
  ui.slots.forEach(b => b.classList.toggle("active", b.dataset.tool === t));
  log("Tool:", t);
}

function openSettings(open){
  ui.panel.classList.toggle("hidden", !open);
}

function showHUD(show){
  ui.hud.classList.toggle("hidden", !show);
}

function showBlocker(show){
  ui.blocker.classList.toggle("hidden", !show);
}

function buildHotkeyUI(){
  ui.hotkeys.innerHTML = "";
  const entries = [
    ["Tool: Block", "toolBlock"],
    ["Tool: Light", "toolLight"],
    ["Tool: Fire", "toolFire"],
    ["Tool: Water", "toolWater"],
    ["Tool: Delete", "toolDelete"],
    ["Tool: Grab", "toolGrab"],
    ["Move: Forward", "forward"],
    ["Move: Back", "backward"],
    ["Move: Left", "left"],
    ["Move: Right", "right"],
    ["Jump", "jump"],
    ["Sprint", "sprint"],
    ["Rotate Block", "rotate"],
    ["Flashlight", "flashlight"],
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

  ui.slots.forEach(b=>{
    b.addEventListener("click", ()=> setTool(b.dataset.tool));
  });

  ui.btnReset.addEventListener("click", ()=>{
    clearSave();
    location.reload();
  });

  ui.btnSave.addEventListener("click", ()=> saveAll(state));
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

  ui.btnExport.addEventListener("click", ()=>{
    ui.saveBox.value = JSON.stringify(state);
  });

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

const camera = new THREE.PerspectiveCamera(state.settings.fov, window.innerWidth / window.innerHeight, 0.05, 400);
camera.position.set(state.player.pos[0], state.player.pos[1], state.player.pos[2]);

const controls = new PointerLockControls(camera, document.body);

const clock = new THREE.Clock();
const keys = new Set();
let canJump = false;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let lastFootstep = 0;

const audio = makeAudioBank(state.settings.volume);

async function loadSFX(){
  await audio.load("waterTouch", SFX.waterTouch);
  await audio.load("waterFlow", SFX.waterFlow);
  await audio.load("walk", SFX.walk);
  await audio.load("pickup", SFX.pickup);
  await audio.load("drop", SFX.drop);
  await audio.load("fire", SFX.fire);
}

const texGridCanvas = TextureBank.gridTexture();
const texMetalCanvas = TextureBank.metalTexture();
const texWaterCanvas = TextureBank.waterTexture();

const texGrid = new THREE.CanvasTexture(texGridCanvas);
texGrid.wrapS = texGrid.wrapT = THREE.RepeatWrapping;
texGrid.repeat.set(6,6);

const texMetal = new THREE.CanvasTexture(texMetalCanvas);
texMetal.wrapS = texMetal.wrapT = THREE.RepeatWrapping;
texMetal.repeat.set(1,1);

const texWater = new THREE.CanvasTexture(texWaterCanvas);
texWater.wrapS = texWater.wrapT = THREE.RepeatWrapping;
texWater.repeat.set(2,2);

const matGround = new THREE.MeshStandardMaterial({ map: texGrid, roughness: 0.95, metalness: 0.05 });
const matBlock = new THREE.MeshStandardMaterial({ map: texMetal, roughness: 0.75, metalness: 0.25 });
const matWater = new THREE.MeshStandardMaterial({ map: texWater, roughness: 0.15, metalness: 0.05, transparent: true, opacity: 0.85 });

const ground = new THREE.Mesh(new THREE.PlaneGeometry(200,200,1,1), matGround);
ground.rotation.x = -Math.PI/2;
ground.receiveShadow = false;
ground.userData.type = "ground";
scene.add(ground);

const hemi = new THREE.HemisphereLight(0xffffff, 0x080a15, 0.95);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xffffff, 0.65);
sun.position.set(10, 18, 6);
scene.add(sun);

const flashlight = new THREE.SpotLight(0xffffff, 2.2, 40, Math.PI/8, 0.25, 1);
flashlight.visible = false;
flashlight.position.set(0,0,0);
flashlight.target.position.set(0,0,-1);
camera.add(flashlight);
camera.add(flashlight.target);

const arms = makeArms();
camera.add(arms);

const fireFX = VFX.makeFire(THREE);
const waterFX = VFX.makeWater(THREE);
const sparksFX = VFX.makeSparks(THREE);
scene.add(fireFX.object);
scene.add(waterFX.object);
scene.add(sparksFX.object);

const ray = new THREE.Raycaster();
const pointer = new THREE.Vector2(0,0);

const worldObjects = [];
let grabbed = null;
let grabbedOffset = new THREE.Vector3();
let blockRot = 0;

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
  const d = state.settings.chunks * 18;
  scene.fog = new THREE.FogExp2(0x000000, 1/(d*d));
  camera.far = clamp(d*3.0, 120, 420);
  camera.updateProjectionMatrix();
  log("Chunks:", state.settings.chunks, "FogDist:", d, "Far:", camera.far);
}
updateFogFromChunks();

function resize(){
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);

function addObject(def){
  const t = def.type;

  let obj = null;

  if(t === "block"){
    obj = new THREE.Mesh(new THREE.BoxGeometry(def.sx||1, def.sy||1, def.sz||1), matBlock);
    obj.position.fromArray(def.pos || [0,1,0]);
    obj.rotation.set(0, def.ry||0, 0);
    obj.userData.type = "block";
    obj.userData.id = def.id || crypto.randomUUID();
  }

  if(t === "light"){
    obj = new THREE.PointLight(0xffffff, def.intensity||1.3, def.range||16, 2);
    obj.position.fromArray(def.pos || [0,3,0]);
    obj.userData.type = "light";
    obj.userData.id = def.id || crypto.randomUUID();

    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.7 }));
    bulb.position.set(0,0,0);
    obj.add(bulb);
  }

  if(t === "water"){
    obj = new THREE.Mesh(new THREE.BoxGeometry(def.sx||2.5, def.sy||0.3, def.sz||2.5), matWater);
    obj.position.fromArray(def.pos || [0,0.2,0]);
    obj.userData.type = "water";
    obj.userData.id = def.id || crypto.randomUUID();
  }

  if(t === "fire"){
    obj = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.42, 0.6, 14), new THREE.MeshStandardMaterial({ color: 0xffaa33, emissive: 0xff6600, emissiveIntensity: 0.7, transparent: true, opacity: 0.55 }));
    obj.position.fromArray(def.pos || [0,0.35,0]);
    obj.userData.type = "fire";
    obj.userData.id = def.id || crypto.randomUUID();
  }

  if(!obj) return null;

  scene.add(obj);
  worldObjects.push(obj);
  return obj;
}

function serializeWorld(){
  const out = [];
  for(const obj of worldObjects){
    if(!obj || !obj.userData || !obj.userData.type) continue;
    const type = obj.userData.type;

    if(type === "block"){
      out.push({
        type: "block",
        id: obj.userData.id,
        pos: [obj.position.x,obj.position.y,obj.position.z],
        ry: obj.rotation.y,
        sx: obj.scale.x, sy: obj.scale.y, sz: obj.scale.z
      });
    }

    if(type === "light"){
      out.push({
        type: "light",
        id: obj.userData.id,
        pos: [obj.position.x,obj.position.y,obj.position.z],
        intensity: obj.intensity,
        range: obj.distance
      });
    }

    if(type === "water"){
      out.push({
        type: "water",
        id: obj.userData.id,
        pos: [obj.position.x,obj.position.y,obj.position.z],
        sx: obj.scale.x, sy: obj.scale.y, sz: obj.scale.z
      });
    }

    if(type === "fire"){
      out.push({
        type: "fire",
        id: obj.userData.id,
        pos: [obj.position.x,obj.position.y,obj.position.z]
      });
    }
  }
  return out;
}

function loadWorldFromSave(){
  for(const o of worldObjects){
    scene.remove(o);
  }
  worldObjects.length = 0;

  const list = state.world.objects || [];
  for(const def of list){
    addObject(def);
  }

  log("World loaded:", list.length, "objects");
}

function writePlayerToState(){
  state.player.pos = [camera.position.x, camera.position.y, camera.position.z];
}

function writeWorldToState(){
  state.world.objects = serializeWorld();
}

function saveTick(){
  writePlayerToState();
  writeWorldToState();
  saveAll(state);
}

function getRebindOrDefault(action){
  return state.keybinds[action] || DEFAULTS.keybinds[action];
}

function toolFromDigit(code){
  if(code === getRebindOrDefault("toolBlock")) return "block";
  if(code === getRebindOrDefault("toolLight")) return "light";
  if(code === getRebindOrDefault("toolFire")) return "fire";
  if(code === getRebindOrDefault("toolWater")) return "water";
  if(code === getRebindOrDefault("toolDelete")) return "delete";
  if(code === getRebindOrDefault("toolGrab")) return "grab";
  return null;
}

function setPaused(p){
  if(p){
    controls.unlock();
    showBlocker(true);
  }else{
    showBlocker(false);
    ui.canvas.requestPointerLock();
  }
}

function pointerLockEvents(){
  document.addEventListener("pointerlockchange", ()=>{
    const locked = document.pointerLockElement === ui.canvas || document.pointerLockElement === document.body;
    if(locked){
      showBlocker(false);
    }else{
      showBlocker(true);
    }
    log("PointerLock:", locked);
  });
}

function intersectWorld(){
  ray.setFromCamera(pointer, camera);
  const hits = ray.intersectObjects(worldObjects, true);
  if(hits.length) return hits[0];
  const gHits = ray.intersectObject(ground, false);
  if(gHits.length) return gHits[0];
  return null;
}

function spawnAtLook(type){
  const hit = intersectWorld();
  if(!hit) return;

  const p = hit.point.clone();
  const n = hit.face ? hit.face.normal.clone() : new THREE.Vector3(0,1,0);
  n.transformDirection(hit.object.matrixWorld);

  const place = p.clone().add(n.multiplyScalar(0.6));
  place.x = Math.round(place.x * 2)/2;
  place.y = Math.max(0.15, Math.round(place.y * 2)/2);
  place.z = Math.round(place.z * 2)/2;

  if(type === "block"){
    const o = addObject({ type:"block", pos:[place.x, place.y, place.z], ry:blockRot });
    if(o) sparksBurst(place);
  }

  if(type === "light"){
    addObject({ type:"light", pos:[place.x, place.y+1.2, place.z], intensity:1.4, range:16 });
    sparksBurst(place);
  }

  if(type === "water"){
    addObject({ type:"water", pos:[place.x, 0.2, place.z], sx:2.5, sy:0.3, sz:2.5 });
    waterSplash(place);
    audio.play("waterTouch",{gain:0.9});
  }

  if(type === "fire"){
    addObject({ type:"fire", pos:[place.x, 0.35, place.z] });
    fireBurst(place);
    audio.play("fire",{gain:0.65, tag:"fireLoop", loop:true});
  }

  saveTick();
}

function deleteLookedAt(){
  const hit = intersectWorld();
  if(!hit || !hit.object) return;
  let o = hit.object;
  while(o && o.parent && !o.userData.type) o = o.parent;
  if(!o || !o.userData.type || o.userData.type === "ground") return;

  const idx = worldObjects.indexOf(o);
  if(idx !== -1){
    worldObjects.splice(idx,1);
  }
  scene.remove(o);
  sparksBurst(hit.point);
  saveTick();
  log("Deleted:", o.userData.type);
}

function grabLookedAt(){
  const hit = intersectWorld();
  if(!hit || !hit.object) return;
  let o = hit.object;
  while(o && o.parent && !o.userData.type) o = o.parent;
  if(!o || !o.userData.type || o.userData.type === "ground") return;

  grabbed = o;
  const lookPoint = hit.point.clone();
  grabbedOffset.copy(grabbed.position).sub(lookPoint);

  audio.play("pickup",{gain:0.9});
  log("Grabbed:", grabbed.userData.type);
}

function dropGrabbed(){
  if(!grabbed) return;
  audio.play("drop",{gain:0.9});
  grabbed = null;
  saveTick();
  log("Dropped");
}

function updateGrabbed(dt){
  if(!grabbed) return;

  const hit = intersectWorld();
  if(!hit) return;
  const p = hit.point.clone();
  const target = p.add(grabbedOffset);
  grabbed.position.lerp(target, clamp(dt*10,0,1));

  if(grabbed.userData.type === "fire"){
    fireBurst(grabbed.position);
  }
}

function sparksBurst(p){
  for(let i=0;i<22;i++){
    sparksFX.spawn(
      new THREE.Vector3(p.x, p.y+0.1, p.z),
      new THREE.Vector3((Math.random()*2-1)*2.6, 2+Math.random()*2.2, (Math.random()*2-1)*2.6)
    );
  }
}

function fireBurst(p){
  for(let i=0;i<16;i++){
    fireFX.spawn(
      new THREE.Vector3(p.x+(Math.random()*2-1)*0.12, p.y+0.15, p.z+(Math.random()*2-1)*0.12),
      new THREE.Vector3((Math.random()*2-1)*0.6, 1.2+Math.random()*1.8, (Math.random()*2-1)*0.6)
    );
  }
}

function waterSplash(p){
  audio.play("waterTouch",{gain:0.8});
  for(let i=0;i<26;i++){
    waterFX.spawn(
      new THREE.Vector3(p.x+(Math.random()*2-1)*0.25, p.y+0.2, p.z+(Math.random()*2-1)*0.25),
      new THREE.Vector3((Math.random()*2-1)*2.2, 2.4+Math.random()*1.6, (Math.random()*2-1)*2.2)
    );
  }
}

function handleToolUse(){
  if(currentTool === "block") spawnAtLook("block");
  if(currentTool === "light") spawnAtLook("light");
  if(currentTool === "fire") spawnAtLook("fire");
  if(currentTool === "water") spawnAtLook("water");
  if(currentTool === "delete") deleteLookedAt();
  if(currentTool === "grab"){
    if(grabbed) dropGrabbed();
    else grabLookedAt();
  }
}

function movement(dt){
  direction.set(0,0,0);

  const forward = getRebindOrDefault("forward");
  const backward = getRebindOrDefault("backward");
  const left = getRebindOrDefault("left");
  const right = getRebindOrDefault("right");
  const sprint = getRebindOrDefault("sprint");
  const jump = getRebindOrDefault("jump");

  const running = isCodePressed(keys, sprint);
  const speed = running ? 8.8 : 5.8;

  if(isCodePressed(keys, forward)) direction.z -= 1;
  if(isCodePressed(keys, backward)) direction.z += 1;
  if(isCodePressed(keys, left)) direction.x -= 1;
  if(isCodePressed(keys, right)) direction.x += 1;

  direction.normalize();

  velocity.x -= velocity.x * 9.0 * dt;
  velocity.z -= velocity.z * 9.0 * dt;

  velocity.y -= 18.5 * dt;

  if(direction.lengthSq() > 0){
    const accel = speed * 12.0;
    velocity.x += direction.x * accel * dt;
    velocity.z += direction.z * accel * dt;

    const t = now();
    if(t - lastFootstep > (running ? 260 : 360)){
      audio.play("walk",{gain:0.22});
      lastFootstep = t;
    }
  }

  if(canJump && isCodePressed(keys, jump)){
    velocity.y = 7.2;
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

function animateArms(dt){
  const moving = direction.lengthSq() > 0;
  const t = now() * 0.001;
  const swing = moving ? Math.sin(t * 10) * 0.05 : 0;
  arms.rotation.x = swing;
  arms.rotation.z = moving ? Math.sin(t*10+1.3)*0.03 : 0;
}

function tickVFX(dt){
  fireFX.tick(dt, 0.8);
  waterFX.tick(dt, 6.5);
  sparksFX.tick(dt, 7.5);
}

function applyMouseSensitivity(){
  const s = state.settings.sensitivity;
  controls.pointerSpeed = clamp(s, 0.05, 2.0);
}

function bindEvents(){
  window.addEventListener("keydown",(e)=>{
    keys.add(e.code);

    const tool = toolFromDigit(e.code);
    if(tool){
      setTool(tool);
      return;
    }

    if(e.code === getRebindOrDefault("rotate")){
      blockRot += Math.PI/2;
      log("Rotate block:", blockRot);
    }

    if(e.code === getRebindOrDefault("flashlight")){
      flashlight.visible = !flashlight.visible;
      log("Flashlight:", flashlight.visible);
    }

    if(e.code === getRebindOrDefault("save")){
      saveTick();
    }

    if(e.code === getRebindOrDefault("pause")){
      if(document.pointerLockElement) controls.unlock();
      else ui.canvas.requestPointerLock();
    }
  });

  window.addEventListener("keyup",(e)=>{
    keys.delete(e.code);
  });

  ui.canvas.addEventListener("mousedown",(e)=>{
    if(e.button !== 0) return;
    if(document.pointerLockElement !== ui.canvas && document.pointerLockElement !== document.body){
      ui.canvas.requestPointerLock();
      return;
    }
    handleToolUse();
  });

  ui.blocker.addEventListener("click", ()=>{
    ui.canvas.requestPointerLock();
  });
}

function startEngine(){
  ui.intro.classList.add("hidden");
  showHUD(true);
  ui.canvas.focus();

  audio.resume();
  applyMouseSensitivity();

  loadWorldFromSave();
  updateFogFromChunks();

  ui.canvas.requestPointerLock();
  log("Engine started");
}

ui.btnStart.addEventListener("click", startEngine);

bootUI();
bindEvents();
pointerLockEvents();

(async function init(){
  log("Init begin");
  await loadSFX();
  log("Init done");
})();

function renderLoop(){
  const dt = clamp(clock.getDelta(), 0, 0.05);

  if(document.pointerLockElement === ui.canvas || document.pointerLockElement === document.body){
    movement(dt);
    updateGrabbed(dt);
    animateArms(dt);
  }

  tickVFX(dt);

  flashlight.position.set(0,0,0);
  flashlight.target.position.set(0,0,-1);

  renderer.render(scene, camera);

  requestAnimationFrame(renderLoop);
}
renderLoop();
