// scripts/3dglobe.js
// Creates a subtle 3D globe spinning in the background using Three.js.

(function(win){
  const THREE=win.THREE;
  if(!THREE){
    console.error("Three.js not loaded");
    return;
  }

  const container=document.getElementById("globeCanvas");
  if(!container){
    console.error("FavTime: #globeCanvas container not found");
    return;
  }

  const scene=new THREE.Scene();
  scene.background=new THREE.Color(0x020308);

  const camera=new THREE.PerspectiveCamera(
    45,
    container.clientWidth/container.clientHeight,
    0.1,
    100
  );
  camera.position.set(0,0,4);

  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
  renderer.setPixelRatio(win.devicePixelRatio||1);
  renderer.setSize(container.clientWidth,container.clientHeight);
  container.appendChild(renderer.domElement);

  // Lighting: soft white only, no colors.
  const dirLight=new THREE.DirectionalLight(0xffffff,1.1);
  dirLight.position.set(4,2,2);
  scene.add(dirLight);
  scene.add(new THREE.AmbientLight(0xffffff,0.18));

  // Base globe (dark).
  const globeGeo=new THREE.SphereGeometry(1.4,64,64);
  const globeMat=new THREE.MeshPhongMaterial({
    color:0x111111,
    shininess:40,
    reflectivity:0.25
  });
  const globe=new THREE.Mesh(globeGeo,globeMat);
  scene.add(globe);

  // Wireframe grid overlay (white, low opacity).
  const gridGeo=new THREE.SphereGeometry(1.402,32,32);
  const gridMat=new THREE.MeshBasicMaterial({
    color:0xffffff,
    wireframe:true,
    transparent:true,
    opacity:0.12
  });
  const grid=new THREE.Mesh(gridGeo,gridMat);
  scene.add(grid);

  // Slight glow shell (white, very faint).
  const haloGeo=new THREE.SphereGeometry(1.55,64,64);
  const haloMat=new THREE.MeshBasicMaterial({
    color:0xffffff,
    transparent:true,
    opacity:0.04
  });
  const halo=new THREE.Mesh(haloGeo,haloMat);
  scene.add(halo);

  // OrbitControls to allow subtle interaction (drag / scroll).
  let controls=null;
  if(THREE.OrbitControls){
    controls=new THREE.OrbitControls(camera,renderer.domElement);
    controls.enablePan=false;
    controls.minDistance=3;
    controls.maxDistance=6;
    controls.enableDamping=true;
    controls.dampingFactor=0.06;
    controls.rotateSpeed=0.5;
  }

  function resize(){
    const w=container.clientWidth||win.innerWidth;
    const h=container.clientHeight||win.innerHeight;
    camera.aspect=w/h;
    camera.updateProjectionMatrix();
    renderer.setSize(w,h);
  }

  win.addEventListener("resize",resize);
  resize();

  function animate(){
    win.requestAnimationFrame(animate);
    globe.rotation.y+=0.0018;
    grid.rotation.y+=0.0018;
    halo.rotation.y+=0.0018;
    if(controls)controls.update();
    renderer.render(scene,camera);
  }

  animate();
})(window);
