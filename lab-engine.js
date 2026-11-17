/**
 * ============================================================================
 * CHEMVERSE 3D — 3D SPATIAL PHYSICS, MULTI-VESSEL HEATING & SECURE AI CLIENT
 * File: lab-engine.js
 * Features:
 *  - Multi-Vessel 3D Workbench: Drag any beaker, pot, or flask off/onto the flame
 *  - Spatial Proximity Heating: Automatically transfers heat to whichever vessel is over the burner
 *  - Vessel-to-Vessel Tilt & Pouring Physics + Unrestricted Sandbox with GHS Hazard Pop-Up
 *  - URL Query Auto-Loader (?preset=, ?rxn=, ?customA=, ?spawn=, ?spawnElement=, ?spawnCompound=)
 *  - Zero-Secret AI Client: Communicates via /api/gemini-proxy with local computational fallback
 * ============================================================================
 */

(function () {
  "use strict";

  const CV = window.CV;
  if (!CV) {
    console.error("ChemVerse Error: core-data.js must be loaded before lab-engine.js.");
    return;
  }

  // ==========================================================================
  // 1. CUSTOM GLSL SHADERS (Liquid Meniscus/Vortex & Bunsen Flame)
  // ==========================================================================
  const LIQUID_VERTEX_SHADER = `
    uniform float uTime;
    uniform float uSloshAmp;
    uniform float uVortexDepth;
    uniform float uMeniscus;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying float vLocalY;

    void main() {
      vec3 pos = position;
      if (pos.y > 0.92) {
        float radialDist = length(pos.xz);
        float meniscusLift = (radialDist * radialDist) * uMeniscus;
        float vortexDip = -uVortexDepth * exp(-radialDist * radialDist * 6.0);
        float wave = sin(pos.x * 5.5 + uTime * 6.5) * cos(pos.z * 5.5 + uTime * 5.5) * uSloshAmp;
        pos.y += meniscusLift + vortexDip + wave;
      }
      vLocalY = pos.y;
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      vViewPosition = -mvPosition.xyz;
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const LIQUID_FRAGMENT_SHADER = `
    uniform vec3 uColor;
    uniform float uOpacity;
    uniform float uTurbidity;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying float vLocalY;

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);
      float fresnel = pow(1.0 - abs(dot(normal, viewDir)), 2.2);
      vec3 deepColor = mix(uColor * 0.72, uColor * 1.15, vLocalY);
      vec3 finalColor = mix(deepColor, vec3(0.92, 0.97, 1.0), fresnel * 0.35 + uTurbidity * 0.25);
      float alpha = clamp(uOpacity + fresnel * 0.22 + uTurbidity * 0.35, 0.15, 0.96);
      gl_FragColor = vec4(finalColor, alpha);
    }
  `;

  const FLAME_VERTEX_SHADER = `
    uniform float uTime;
    varying float vHeight;

    void main() {
      vHeight = position.y;
      vec3 pos = position;
      float sway = sin(uTime * 22.0 + pos.y * 8.0) * 0.035 * pos.y;
      float pulse = 1.0 + sin(uTime * 18.0) * 0.04;
      pos.x = pos.x * pulse + sway;
      pos.z = pos.z * pulse + cos(uTime * 19.0 + pos.y * 7.0) * 0.03 * pos.y;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `;

  const FLAME_FRAGMENT_SHADER = `
    uniform vec3 uOuterColor;
    uniform vec3 uInnerColor;
    uniform float uAirRatio;
    varying float vHeight;

    void main() {
      float h = clamp(vHeight / 0.85, 0.0, 1.0);
      vec3 sootyYellow = vec3(1.0, 0.68, 0.08);
      vec3 activeOuter = mix(sootyYellow, uOuterColor, uAirRatio);
      vec3 col = mix(uInnerColor, activeOuter, smoothstep(0.15, 0.75, h));
      float alpha = (1.0 - smoothstep(0.65, 1.0, h)) * 0.88;
      gl_FragColor = vec4(col, alpha);
    }
  `;

  function createGraduationTexture(THREE, maxVolMl = 250) {
    const cvs = document.createElement("canvas");
    cvs.width = 256;
    cvs.height = 512;
    const ctx = cvs.getContext("2d");
    ctx.clearRect(0, 0, cvs.width, cvs.height);

    ctx.strokeStyle = "rgba(226, 232, 240, 0.78)";
    ctx.fillStyle = "rgba(226, 232, 240, 0.88)";
    ctx.font = 'bold 20px "JetBrains Mono", monospace';
    ctx.lineWidth = 3;

    const steps = 5;
    for (let i = 1; i <= steps; i++) {
      const y = cvs.height - (i / (steps + 0.6)) * cvs.height;
      ctx.beginPath();
      ctx.moveTo(95, y);
      ctx.lineTo(155, y);
      ctx.stroke();
      ctx.fillText(`${Math.round((maxVolMl / steps) * i)}`, 28, y + 7);
    }

    const tex = new THREE.CanvasTexture(cvs);
    tex.needsUpdate = true;
    return tex;
  }

  function getVesselLatheProfile(THREE, type, r, h) {
    if (type === "erlenmeyer") {
      return [
        new THREE.Vector2(0, 0), new THREE.Vector2(r, 0),
        new THREE.Vector2(r * 0.36, h * 0.68), new THREE.Vector2(r * 0.36, h),
        new THREE.Vector2(r * 0.41, h * 1.03)
      ];
    }
    if (type === "volumetric") {
      return [
        new THREE.Vector2(0, 0), new THREE.Vector2(r * 0.62, 0),
        new THREE.Vector2(r, h * 0.28), new THREE.Vector2(r * 0.24, h * 0.62),
        new THREE.Vector2(r * 0.24, h), new THREE.Vector2(r * 0.29, h * 1.02)
      ];
    }
    if (type === "round") {
      const pts = [];
      for (let i = 0; i <= 10; i++) {
        const a = (i / 10) * Math.PI * 0.75;
        pts.push(new THREE.Vector2(Math.sin(a) * r, (1 - Math.cos(a)) * r * 0.85));
      }
      pts.push(new THREE.Vector2(r * 0.32, h * 0.68), new THREE.Vector2(r * 0.32, h));
      return pts;
    }
    if (type === "sepfunnel") {
      return [
        new THREE.Vector2(0.06, 0), new THREE.Vector2(0.08, h * 0.22),
        new THREE.Vector2(r, h * 0.68), new THREE.Vector2(r * 0.32, h),
        new THREE.Vector2(r * 0.36, h * 1.02)
      ];
    }
    return [
      new THREE.Vector2(0, 0), new THREE.Vector2(r, 0),
      new THREE.Vector2(r, h), new THREE.Vector2(r * 1.05, h * 1.03)
    ];
  }

  // ==========================================================================
  // 2. GHS HAZARD WARNING POP-UP CONTROLLER
  // ==========================================================================
  function showGHSWarningPopup(warningsList, onNeutralizeCallback) {
    if (!warningsList || warningsList.length === 0) return;
    const modal = document.getElementById("hazard-warning-modal");
    const bodyEl = document.getElementById("hazard-body-text");
    if (!modal || !bodyEl) return;

    const uniqueWarnings = Array.from(new Set(warningsList));
    bodyEl.innerHTML = uniqueWarnings.map(w => `<p><i class="fa-solid fa-radiation" style="color:#f43f5e"></i> ${w}</p>`).join("") +
      `<p style="color:#94a3b8;font-size:0.76rem;margin-top:4px;"><strong>Unrestricted Sandbox Policy:</strong> All chemical reactions and extreme conditions are permitted in ChemVerse 3D so you can safely observe complete thermodynamic outcomes.</p>`;

    modal.classList.remove("hidden");

    document.getElementById("btn-hazard-acknowledge").onclick = () => {
      modal.classList.add("hidden");
    };
    document.getElementById("btn-hazard-neutralize").onclick = () => {
      modal.classList.add("hidden");
      if (typeof onNeutralizeCallback === "function") onNeutralizeCallback();
    };
  }

  // ==========================================================================
  // 3. MAIN 3D WORKBENCH & MULTI-VESSEL SPATIAL HEATING ENGINE
  // ==========================================================================
  function init3DLabWorkbench() {
    const THREE = window.THREE;
    if (!THREE) return;

    const canvas = document.getElementById("lab-canvas");
    const scene = new THREE.Scene();

    const headerOffset = 64;
    const camera = new THREE.PerspectiveCamera(42, window.innerWidth / Math.max(240, window.innerHeight - headerOffset), 0.15, 65);
    camera.position.set(0, 4.3, 8.2);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: window.devicePixelRatio < 2,
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, Math.max(240, window.innerHeight - headerOffset));
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.set(0, 2.0, 0);
    controls.minDistance = 2.0;
    controls.maxDistance = 16.0;
    controls.maxPolarAngle = Math.PI / 2 - 0.02;

    // Studio Lighting
    scene.add(new THREE.AmbientLight(0xdbeafe, 0.88));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.25);
    keyLight.position.set(5, 11, 7);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.55);
    rimLight.position.set(-6, 5, -5);
    scene.add(rimLight);

    const burnerLight = new THREE.PointLight(0x38bdf8, 0, 6);
    burnerLight.position.set(0, 1.35, 0);
    scene.add(burnerLight);

    const uvLight = new THREE.PointLight(0xa855f7, 0, 8);
    uvLight.position.set(0, 3.5, 1.2);
    scene.add(uvLight);

    // Materials
    const epoxyBenchMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.35, metalness: 0.15 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.22, metalness: 0.88 });
    const castIronMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.55, metalness: 0.65 });
    const ceramicMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3, metalness: 0.05 });
    const copperMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.25, metalness: 0.9 });
    const zincMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.3, metalness: 0.85 });

    const borosilicateGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0xe0f2fe,
      transparent: true,
      opacity: 0.32,
      roughness: 0.06,
      metalness: 0.05,
      reflectivity: 0.95,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    // Workbench & Grid
    const benchMesh = new THREE.Mesh(new THREE.BoxGeometry(18, 0.4, 10), epoxyBenchMat);
    benchMesh.position.y = -0.2;
    scene.add(benchMesh);

    const benchGrid = new THREE.GridHelper(18, 18, 0x1e3a5f, 0x13233a);
    benchGrid.position.y = 0.005;
    scene.add(benchGrid);

    // Movable 3D Objects Registry
    const movableGroups = [];
    const vesselEntities = []; // [{ id, label, spec, state: VesselState, group, liquidMesh, liquidUniforms, pptMesh, solidGroup, stirBar, bubbles, plumes }]
    let activeVesselIndex = 0;

    // 1. Tripod Stand & Wire Gauze (Fixed Thermal Heating Zone at X=0, Z=0, Y=1.60)
    const tripodZonePos = new THREE.Vector3(0, 1.60, 0);
    const tripodGroup = new THREE.Group();
    const retortBase = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.12, 1.7), castIronMat);
    retortBase.position.set(-1.3, 0.06, 0);
    const retortRod = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 6.2, 14), chromeMat);
    retortRod.position.set(-2.05, 3.1, 0);
    const tripodRing = new THREE.Mesh(new THREE.TorusGeometry(1.12, 0.05, 10, 28), chromeMat);
    tripodRing.rotation.x = Math.PI / 2;
    tripodRing.position.set(0, 1.56, 0);
    const wireGauze = new THREE.Mesh(new THREE.CylinderGeometry(1.08, 1.08, 0.03, 24), ceramicMat);
    wireGauze.position.set(0, 1.58, 0);
    tripodGroup.add(retortBase, retortRod, tripodRing, wireGauze);

    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI * 2) / 3;
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 1.65, 10), chromeMat);
      leg.position.set(Math.cos(a) * 1.02, 0.78, Math.sin(a) * 1.02);
      leg.rotation.z = Math.cos(a) * 0.12;
      leg.rotation.x = -Math.sin(a) * 0.12;
      tripodGroup.add(leg);
    }
    scene.add(tripodGroup);

    // 2. Movable Bunsen Burner
    const burnerGroup = new THREE.Group();
    burnerGroup.position.set(0, 0, 0);
    burnerGroup.userData = { movableType: "burner", label: "Bunsen Burner" };
    const burnerBase = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.6, 0.14, 20), chromeMat);
    burnerBase.position.y = 0.07;
    const burnerChimney = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.86, 16), chromeMat);
    burnerChimney.position.y = 0.5;
    const airCollarMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.18, 16), copperMat);
    airCollarMesh.position.y = 0.24;
    burnerGroup.add(burnerBase, burnerChimney, airCollarMesh);

    const flameUniforms = {
      uTime: { value: 0 },
      uOuterColor: { value: new THREE.Color("#2563EB") },
      uInnerColor: { value: new THREE.Color("#38BDF8") },
      uAirRatio: { value: 1.0 }
    };

    const flameShaderMat = new THREE.ShaderMaterial({
      vertexShader: FLAME_VERTEX_SHADER,
      fragmentShader: FLAME_FRAGMENT_SHADER,
      uniforms: flameUniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const flameGeo = new THREE.ConeGeometry(0.26, 0.85, 18);
    flameGeo.translate(0, 0.425, 0);
    const flameMesh = new THREE.Mesh(flameGeo, flameShaderMat);
    flameMesh.position.y = 0.92;
    flameMesh.visible = false;
    burnerGroup.add(flameMesh);
    scene.add(burnerGroup);
    movableGroups.push(burnerGroup);

    // Platinum Wire Flame Test Loop
    const flameLoopGroup = new THREE.Group();
    const rodHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.3, 8), castIronMat);
    rodHandle.rotation.z = Math.PI / 2;
    rodHandle.position.x = 1.05;
    const ptWire = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.7, 8), chromeMat);
    ptWire.rotation.z = Math.PI / 2;
    ptWire.position.x = 0.35;
    const ptLoop = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 8, 16), chromeMat);
    flameLoopGroup.add(rodHandle, ptWire, ptLoop);
    flameLoopGroup.position.set(2.2, 1.25, 0);
    flameLoopGroup.visible = false;
    scene.add(flameLoopGroup);

    // 3. 50mL Graduated Burette
    const buretteGroup = new THREE.Group();
    buretteGroup.position.set(0, 4.18, 0);
    const clampBar = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.08, 0.12), castIronMat);
    clampBar.position.set(-1.02, 0.2, 0);
    const buretteGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 2.25, 20, 1, true), borosilicateGlassMat);
    buretteGlass.position.y = 0.35;
    const buretteLiqMat = new THREE.MeshPhongMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.75 });
    const buretteLiqMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 1.85, 16), buretteLiqMat);
    buretteLiqMesh.position.y = 0.3;
    const buretteTip = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.32, 16), borosilicateGlassMat);
    buretteTip.rotation.x = Math.PI;
    buretteTip.position.y = -0.92;
    const stopcockValve = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.07, 0.09), new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.3 }));
    stopcockValve.position.y = -0.82;
    buretteGroup.add(clampBar, buretteGlass, buretteLiqMesh, buretteTip, stopcockValve);
    scene.add(buretteGroup);

    const dropletMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe });
    const dropletMesh = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 10), dropletMat);
    dropletMesh.visible = false;
    scene.add(dropletMesh);

    // 4. Distillation & Analytical Stations
    const distillationGroup = new THREE.Group();
    distillationGroup.position.set(-3.8, 0, -0.6);
    distillationGroup.userData = { movableType: "rig", label: "Liebig Distillation Rig" };
    const rbfFlask = new THREE.Mesh(new THREE.SphereGeometry(0.62, 20, 20), borosilicateGlassMat);
    rbfFlask.position.set(0, 1.1, 0);
    const condenserJacket = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 2.1, 16, 1, true), borosilicateGlassMat);
    condenserJacket.position.set(0.85, 1.9, 0);
    condenserJacket.rotation.z = Math.PI / 3;
    const receiverFlask = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.52, 1.0, 18, 1, true), borosilicateGlassMat);
    receiverFlask.position.set(1.8, 0.5, 0);
    distillationGroup.add(rbfFlask, condenserJacket, receiverFlask);
    scene.add(distillationGroup);
    movableGroups.push(distillationGroup);

    const analyticalStation = new THREE.Group();
    analyticalStation.position.set(3.8, 0, -0.5);
    analyticalStation.userData = { movableType: "rig", label: "Analytical Balance & Electro-Cell" };
    const balanceBase = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.24, 1.4), castIronMat);
    balanceBase.position.y = 0.12;
    const balancePan = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.04, 18), chromeMat);
    balancePan.position.y = 0.26;
    const cellBeaker = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 1.15, 18, 1, true), borosilicateGlassMat);
    cellBeaker.position.set(0, 0.58, 1.55);
    const cuElectrode = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.3, 0.04), copperMat);
    cuElectrode.position.set(-0.22, 0.72, 1.55);
    const znElectrode = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.3, 0.04), zincMat);
    znElectrode.position.set(0.22, 0.72, 1.55);
    analyticalStation.add(balanceBase, balancePan, cellBeaker, cuElectrode, znElectrode);
    scene.add(analyticalStation);
    movableGroups.push(analyticalStation);

    // Pouring Stream
    const streamMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.8 });
    const streamMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.2, 8), streamMat);
    streamMesh.visible = false;
    scene.add(streamMesh);

    // ========================================================================
    // MULTI-VESSEL FACTORY (Create Movable Pots, Beakers & Conical Flasks)
    // ========================================================================
    function create3DVesselEntity(spec, label, posX, posY, posZ) {
      const idx = vesselEntities.length;
      const group = new THREE.Group();
      group.position.set(posX, posY, posZ);
      group.userData = { movableType: "vessel", vesselIndex: idx, label };

      const r = spec.radius || 0.88;
      const h = spec.height || 2.0;
      const pts = getVesselLatheProfile(THREE, spec.type || "beaker", r, h);
      const latheGeo = new THREE.LatheGeometry(pts, 28);
      const gradTex = createGraduationTexture(THREE, spec.capacityMl || 250);

      const customGlassMat = borosilicateGlassMat.clone();
      customGlassMat.map = gradTex;

      const glassMesh = new THREE.Mesh(latheGeo, customGlassMat);
      glassMesh.userData.isGlass = true;
      group.add(glassMesh);

      // Selection Ring Indicator at Vessel Base
      const selRing = new THREE.Mesh(
        new THREE.RingGeometry(r * 0.92, r * 1.06, 28),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
      );
      selRing.rotation.x = -Math.PI / 2;
      selRing.position.y = 0.01;
      selRing.visible = idx === 0;
      group.add(selRing);

      // Magnetic Stirrer Pill
      const stirBar = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.38, 10), ceramicMat);
      stirBar.rotation.z = Math.PI / 2;
      stirBar.position.y = 0.07;
      group.add(stirBar);

      // GLSL Liquid Shader Mesh
      const liquidUniforms = {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color("#E0F7FA") },
        uOpacity: { value: 0.18 },
        uTurbidity: { value: 0.0 },
        uSloshAmp: { value: 0.004 },
        uVortexDepth: { value: 0.0 },
        uMeniscus: { value: 0.055 }
      };

      const liquidShaderMat = new THREE.ShaderMaterial({
        vertexShader: LIQUID_VERTEX_SHADER,
        fragmentShader: LIQUID_FRAGMENT_SHADER,
        uniforms: liquidUniforms,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false
      });

      const unitLiquidGeo = new THREE.CylinderGeometry(1, 1, 1, 26, 6);
      unitLiquidGeo.translate(0, 0.5, 0);
      const liquidMesh = new THREE.Mesh(unitLiquidGeo, liquidShaderMat);
      liquidMesh.position.y = 0.03;
      liquidMesh.visible = false;
      group.add(liquidMesh);

      // Precipitate Layer
      const pptMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85 });
      const pptMesh = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.84, r * 0.84, 0.08, 22), pptMat);
      pptMesh.position.y = 0.045;
      pptMesh.visible = false;
      group.add(pptMesh);

      // Solid Chunks
      const solidGroup = new THREE.Group();
      group.add(solidGroup);

      // Pre-allocated Bubbles & Gas Plumes
      const bubbles = [];
      const bubbleGeo = new THREE.SphereGeometry(0.036, 7, 7);
      const bubbleMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
      for (let i = 0; i < 18; i++) {
        const b = new THREE.Mesh(bubbleGeo, bubbleMat);
        b.visible = false;
        group.add(b);
        bubbles.push({ mesh: b, vy: 0.018 + Math.random() * 0.02 });
      }

      const plumes = [];
      const plumeGeo = new THREE.SphereGeometry(0.18, 7, 7);
      const plumeMat = new THREE.MeshBasicMaterial({ color: 0xf1f5f9, transparent: true, opacity: 0.32 });
      for (let i = 0; i < 10; i++) {
        const p = new THREE.Mesh(plumeGeo, plumeMat);
        p.visible = false;
        group.add(p);
        plumes.push({ mesh: p, vy: 0.014 + Math.random() * 0.015 });
      }

      scene.add(group);
      movableGroups.push(group);

      const entity = {
        id: `vessel_${idx + 1}`,
        label,
        spec,
        state: new CV.VesselState(`vessel_${idx + 1}`, label, spec.type || "beaker", spec.capacityMl || 250, 25.0),
        group,
        selRing,
        glassMesh,
        liquidMesh,
        liquidUniforms,
        targetColor: new THREE.Color("#E0F7FA"),
        pptMesh,
        pptMat,
        solidGroup,
        stirBar,
        bubbles,
        plumes,
        plumeMat
      };

      vesselEntities.push(entity);
      selectActiveVessel(idx);
      return entity;
    }

    function selectActiveVessel(idx) {
      if (!vesselEntities[idx]) return;
      activeVesselIndex = idx;
      vesselEntities.forEach((v, i) => {
        v.selRing.visible = i === idx;
      });
      updateTopHUDAndAnalytics();
    }

    function getActiveVessel() {
      return vesselEntities[activeVesselIndex] || vesselEntities[0];
    }

    function rebuildVesselGlassware(entity, newSpec) {
      entity.spec = newSpec;
      entity.state.vesselType = newSpec.type || "beaker";
      entity.state.maxCapacityMl = newSpec.capacityMl || 250;

      if (entity.glassMesh) {
        entity.glassMesh.geometry.dispose();
        entity.group.remove(entity.glassMesh);
      }

      const r = newSpec.radius || 0.88;
      const h = newSpec.height || 2.0;
      const pts = getVesselLatheProfile(THREE, newSpec.type || "beaker", r, h);
      const latheGeo = new THREE.LatheGeometry(pts, 28);
      const gradTex = createGraduationTexture(THREE, newSpec.capacityMl || 250);
      const mat = borosilicateGlassMat.clone();
      mat.map = gradTex;

      entity.glassMesh = new THREE.Mesh(latheGeo, mat);
      entity.glassMesh.userData.isGlass = true;
      entity.group.add(entity.glassMesh);
      syncEntityVisuals(entity);
    }

    function syncEntityVisuals(entity) {
      const st = entity.state;
      const spec = entity.spec;
      const r = spec.radius || 0.88;
      const hMax = spec.height || 2.0;
      const fillRatio = Math.min(1.0, st.volumeMl / st.maxCapacityMl);

      if (fillRatio <= 0.002) {
        entity.liquidMesh.visible = false;
      } else {
        entity.liquidMesh.visible = true;
        const h = Math.max(0.06, fillRatio * (hMax * 0.86));
        let rad = r * 0.94;
        if (spec.type === "erlenmeyer") {
          rad = Math.max(0.34, r * (0.94 - fillRatio * 0.45));
        } else if (spec.type === "volumetric") {
          rad = fillRatio < 0.35 ? r * 0.88 : Math.max(0.24, r * 0.35);
        }
        entity.liquidMesh.scale.set(rad, h, rad);
      }

      entity.targetColor.set(st.liquidColorHex);
      entity.liquidUniforms.uOpacity.value = st.liquidOpacity;
      entity.liquidUniforms.uTurbidity.value = st.turbidity;
      entity.liquidUniforms.uVortexDepth.value = st.stirrerRpm > 0 ? Math.min(0.14, st.stirrerRpm / 9000) : 0.0;

      if (st.precipitates.length > 0) {
        const latest = st.precipitates[st.precipitates.length - 1];
        entity.pptMesh.visible = true;
        entity.pptMat.color.set(latest.colorHex);
      } else {
        entity.pptMesh.visible = false;
      }
    }

    // ========================================================================
    // 4. SPATIAL PROXIMITY HEATING & MULTI-VESSEL RAYCAST DRAGGING
    // ========================================================================
    let manipulationMode = "orbit"; // 'orbit' | 'move' | 'pour'
    const raycaster = new THREE.Raycaster();
    const pointerNDC = new THREE.Vector2();
    const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersectPt = new THREE.Vector3();
    let draggedGroup = null;

    document.querySelectorAll("[data-manip]").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("[data-manip]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        manipulationMode = btn.dataset.manip;
        controls.enabled = manipulationMode === "orbit";
        document.getElementById("reaction-eq-text").textContent =
          manipulationMode === "move" ? "Move 3D Mode: Drag any vessel off the burner or place another pot onto the tripod flame!"
          : manipulationMode === "pour" ? "Tilt & Pour Mode: Tap any vessel to pour its contents into the selected vessel."
          : "Orbit Mode: Drag to rotate 360°, tap any vessel to select it.";
      });
    });

    // Spawn an Additional Pot / Flask onto the Workbench
    document.getElementById("btn-add-extra-vessel")?.addEventListener("click", () => {
      const count = vesselEntities.length + 1;
      const spec = count % 2 === 0 ? CV.APPARATUS_CATALOG[2] : CV.APPARATUS_CATALOG[0]; // Alternate Erlenmeyer & Beaker
      const offsetX = count % 2 === 0 ? 1.85 : -1.85;
      const offsetZ = 1.15;
      const newEnt = create3DVesselEntity(spec, `${spec.type === "erlenmeyer" ? "Flask" : "Pot"} #${count}`, offsetX, 0, offsetZ);
      CV.labAudio.play("clink");
      document.getElementById("reaction-eq-text").textContent =
        `Placed ${newEnt.label} on the workbench. Switch to "Move 3D" and drag it over the Bunsen flame to heat it!`;
    });

    function hitTestMovable(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      pointerNDC.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointerNDC.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointerNDC, camera);

      const hits = raycaster.intersectObjects(movableGroups, true);
      if (hits.length === 0) return null;
      let obj = hits[0].object;
      while (obj.parent && !movableGroups.includes(obj)) {
        obj = obj.parent;
      }
      return movableGroups.includes(obj) ? obj : null;
    }

    canvas.addEventListener("pointerdown", e => {
      const hit = hitTestMovable(e.clientX, e.clientY);
      if (!hit) return;

      // Selecting a vessel in any mode makes it the active target
      if (hit.userData.movableType === "vessel" && typeof hit.userData.vesselIndex === "number") {
        if (manipulationMode === "pour" && hit.userData.vesselIndex !== activeVesselIndex) {
          // Pour from clicked source vessel into active target vessel!
          const sourceEnt = vesselEntities[hit.userData.vesselIndex];
          const targetEnt = getActiveVessel();
          if (sourceEnt && targetEnt && sourceEnt.state.volumeMl > 0) {
            CV.labAudio.play("pour");
            if (window.gsap) {
              window.gsap.to(sourceEnt.group.rotation, {
                z: 0.75, duration: 0.4, yoyo: true, repeat: 1,
                onComplete: () => { sourceEnt.group.rotation.z = 0; }
              });
            }
            // Transfer species proportionally
            for (const [rId, data] of sourceEnt.state.species.entries()) {
              const r = CV.LAB_REAGENTS[rId];
              if (r && rId !== "H2O") {
                dispenseReagentToVessel(rId, 15, "mL", r.defaultMolarity || 0.5);
              }
            }
            if (sourceEnt.state.species.size === 1 && sourceEnt.state.species.has("H2O")) {
              dispenseReagentToVessel("H2O", 20, "mL", 55.5);
            }
            sourceEnt.state.volumeMl = Math.max(0, sourceEnt.state.volumeMl - 20);
            syncEntityVisuals(sourceEnt);
            document.getElementById("reaction-eq-text").textContent =
              `Poured contents from ${sourceEnt.label} into ${targetEnt.label}.`;
          }
          return;
        }

        selectActiveVessel(hit.userData.vesselIndex);
      }

      if (manipulationMode === "move") {
        draggedGroup = hit;
        dragPlane.constant = -hit.position.y;
        controls.enabled = false;
      }
    });

    window.addEventListener("pointermove", e => {
      if (!draggedGroup || manipulationMode !== "move") return;
      const rect = canvas.getBoundingClientRect();
      pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointerNDC, camera);

      if (raycaster.ray.intersectPlane(dragPlane, intersectPt)) {
        const nx = Math.max(-6.5, Math.min(6.5, intersectPt.x));
        const nz = Math.max(-3.5, Math.min(3.5, intersectPt.z));
        draggedGroup.position.x = nx;
        draggedGroup.position.z = nz;

        // Spatial Tripod Snap: When a vessel is dragged over the Tripod Stand (0,0), elevate onto wire gauze (Y=1.60); otherwise rest on bench (Y=0)
        if (draggedGroup.userData.movableType === "vessel") {
          const distToTripod = Math.hypot(nx - tripodZonePos.x, nz - tripodZonePos.z);
          draggedGroup.position.y = distToTripod < 0.92 ? 1.60 : 0.0;
        }
      }
    });

    window.addEventListener("pointerup", () => {
      draggedGroup = null;
      if (manipulationMode === "orbit") controls.enabled = true;
    });

    // ========================================================================
    // 5. LAB STATE, DISPENSING, ANALYTICS & SPATIAL THERMAL COUPLING
    // ========================================================================
    const labState = {
      dispenseVolMl: 20,
      dispenseMolarity: 1.0,
      buretteReagentId: "NaOH",
      buretteTitrantAddedMl: 0,
      buretteMode: "closed",
      burnerOn: false,
      airCollarPercent: 100,
      gravityG: 1.0,
      chartMode: "titration",
      titrationCurve: [{ x: 0, y: 7.0 }],
      thermalCurve: [{ x: 0, y: 25.0 }]
    };

    function evaluateSpatialBurnerHeating() {
      const burnerPos = burnerGroup.position;
      const totalWatts = labState.burnerOn ? (220 + labState.airCollarPercent * 2.4) : 0;
      let heatedVesselName = "None (Off Flame)";

      vesselEntities.forEach(ent => {
        const vPos = ent.group.position;
        const horizontalDist = Math.hypot(vPos.x - burnerPos.x, vPos.z - burnerPos.z);
        // Any vessel positioned within 0.95 units of the Bunsen burner receives the flame's heat!
        if (horizontalDist < 0.95) {
          ent.state.heatSourceWatts = totalWatts;
          heatedVesselName = labState.burnerOn ? `${ent.label} (${totalWatts}W)` : `${ent.label} (Burner OFF)`;
        } else {
          ent.state.heatSourceWatts = 0;
        }
      });

      const heatedHud = document.getElementById("hud-heated-vessel");
      if (heatedHud) heatedHud.textContent = heatedVesselName;
    }

    function calculateConductivity(vState) {
      if (vState.volumeMl <= 0.1) return 0.05;
      let totalIonsMoles = 0;
      for (const [id, data] of vState.species.entries()) {
        const r = CV.LAB_REAGENTS[id];
        if (r && ["acid", "base", "salt", "redox"].includes(r.category)) {
          totalIonsMoles += data.moles;
        }
      }
      const ionicStrength = totalIonsMoles / (vState.volumeMl / 1000);
      return Math.min(85.0, 0.05 + ionicStrength * 14.5);
    }

    function drawAnalyticsPlot() {
      const cvs = document.getElementById("analytics-canvas");
      if (!cvs) return;
      const ctx = cvs.getContext("2d");
      const w = cvs.width, h = cvs.height;
      ctx.clearRect(0, 0, w, h);

      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 1;
      for (let i = 1; i <= 3; i++) {
        const y = (h / 4) * i;
        ctx.beginPath();
        ctx.moveTo(32, y);
        ctx.lineTo(w - 10, y);
        ctx.stroke();
      }

      ctx.fillStyle = "#94a3b8";
      ctx.font = '10px "JetBrains Mono", monospace';
      const activeSt = getActiveVessel().state;

      if (labState.chartMode === "titration") {
        ctx.fillText("pH 14", 2, 14);
        ctx.fillText("pH 7", 6, h / 2 + 3);
        ctx.fillText("pH 0", 6, h - 6);
        const pts = labState.titrationCurve;
        if (pts.length < 2) return;
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        pts.forEach((pt, idx) => {
          const x = 36 + (idx / Math.max(1, pts.length - 1)) * (w - 48);
          const y = h - 10 - (Math.max(0, Math.min(14, pt.y)) / 14) * (h - 22);
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      } else if (labState.chartMode === "thermal") {
        ctx.fillText("100°C", 2, 14);
        ctx.fillText("50°C", 5, h / 2 + 3);
        ctx.fillText("0°C", 8, h - 6);
        const pts = labState.thermalCurve;
        if (pts.length < 2) return;
        ctx.strokeStyle = "#f43f5e";
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        pts.forEach((pt, idx) => {
          const x = 36 + (idx / Math.max(1, pts.length - 1)) * (w - 48);
          const y = h - 10 - (Math.max(0, Math.min(105, pt.y)) / 105) * (h - 22);
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      } else if (labState.chartMode === "uvvis") {
        ctx.fillText("A=2.0", 2, 14);
        ctx.fillText("400nm", 36, h - 4);
        ctx.fillText("750nm", w - 45, h - 4);
        const peakNm = activeSt.species.has("KMnO4") ? 525 : activeSt.species.has("K2Cr2O7") ? 450 : 620;
        ctx.strokeStyle = "#a855f7";
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        for (let px = 36; px < w - 12; px++) {
          const nm = 380 + ((px - 36) / (w - 48)) * 400;
          const abs = Math.exp(-Math.pow(nm - peakNm, 2) / 1800) * (activeSt.volumeMl > 0 ? 0.85 : 0.05);
          const y = h - 16 - abs * (h - 30);
          if (px === 36) ctx.moveTo(px, y);
          else ctx.lineTo(px, y);
        }
        ctx.stroke();
      }
    }

    function updateTopHUDAndAnalytics() {
      const ent = getActiveVessel();
      const v = ent.state;
      const cond = calculateConductivity(v);

      document.getElementById("hud-vessel-name").textContent = `${ent.label} (${v.maxCapacityMl}mL)`;
      document.getElementById("hud-vol").textContent = `${v.volumeMl.toFixed(2)} mL`;
      document.getElementById("hud-temp").textContent = `${v.temperatureC.toFixed(1)} °C`;
      document.getElementById("hud-ph").textContent = v.pH.toFixed(2);
      document.getElementById("hud-cond").textContent = `${cond.toFixed(2)} mS`;

      const badgesEl = document.getElementById("reaction-state-badges");
      let badgesHtml = `<span class="state-pill neutral">${(v.temperatureC + 273.15).toFixed(1)} K • ${v.pressureAtm.toFixed(2)} atm • Cat: ${v.activeCatalyst}</span>`;
      if (v.heatSourceWatts > 0 && labState.burnerOn) {
        badgesHtml += `<span class="state-pill flame-coupled"><i class="fa-solid fa-fire"></i> Direct Flame Heating (${v.heatSourceWatts}W)</span>`;
      }
      if (v.precipitates.length > 0) {
        const p = v.precipitates[v.precipitates.length - 1];
        badgesHtml += `<span class="state-pill ppt">Ppt: ${p.formula} (${p.massG.toFixed(2)}g) ↓</span>`;
      }
      if (v.activeGas) badgesHtml += `<span class="state-pill gas">Gas: ${v.activeGas.formula} ↑</span>`;
      badgesEl.innerHTML = badgesHtml;

      const totalPptG = v.precipitates.reduce((s, p) => s + p.massG, 0);
      document.getElementById("an-titrant-vol").textContent = `${labState.buretteTitrantAddedMl.toFixed(2)} mL`;
      document.getElementById("an-ppt-mass").textContent = `${totalPptG.toFixed(3)} g`;
      document.getElementById("an-ionic-i").textContent = `${(cond / 14.5).toFixed(3)} M`;
      document.getElementById("an-gas-type").textContent = v.activeGas ? v.activeGas.formula : "None";

      let lambdaMax = "-- nm";
      if (v.species.has("KMnO4")) lambdaMax = "525 nm (A=1.42)";
      else if (v.species.has("CuSO4")) lambdaMax = "810 nm (A=0.68)";
      else if (v.species.has("K2Cr2O7")) lambdaMax = "450 nm (A=0.95)";
      document.getElementById("an-lambda-max").textContent = lambdaMax;

      drawAnalyticsPlot();
    }

    function dispenseReagentToVessel(reagentId, customAmount = null, customUnit = null, customMolarity = null) {
      const r = CV.LAB_REAGENTS[reagentId];
      if (!r) return;
      const ent = getActiveVessel();

      const unit = customUnit || (r.state === "solid" ? "g" : "mL");
      const amount = customAmount !== null ? customAmount : (r.category === "indicator" ? 0.5 : (unit === "g" ? 1.5 : labState.dispenseVolMl));
      const molarity = customMolarity !== null ? customMolarity : labState.dispenseMolarity;

      if (unit === "g") {
        CV.labAudio.play("clink");
        const chunkMat = new THREE.MeshStandardMaterial({ color: r.colorHex, roughness: 0.4, metalness: r.category === "metal" ? 0.85 : 0.1 });
        for (let i = 0; i < 4; i++) {
          const chunk = new THREE.Mesh(new THREE.DodecahedronGeometry(0.068), chunkMat);
          chunk.position.set((Math.random() - 0.5) * 0.45, 0.075, (Math.random() - 0.5) * 0.45);
          ent.solidGroup.add(chunk);
        }
      } else {
        CV.labAudio.play(amount <= 0.2 ? "drop" : "pour");
        if (amount > 0.2) {
          streamMat.color.set(r.colorHex);
          streamMesh.position.set(ent.group.position.x + 0.18, ent.group.position.y + 1.35, ent.group.position.z);
          streamMesh.visible = true;
          setTimeout(() => { streamMesh.visible = false; }, 260);
        }
      }

      ent.liquidUniforms.uSloshAmp.value = 0.025;
      setTimeout(() => { ent.liquidUniforms.uSloshAmp.value = 0.004; }, 500);

      const { events, warnings } = ent.state.addReagent(reagentId, amount, unit, molarity);

      if (warnings && warnings.length > 0) {
        showGHSWarningPopup(warnings, () => cleanActiveVessel());
      }

      if (events && events.length > 0) {
        const rxn = events[0];
        document.getElementById("reaction-eq-text").textContent = `[${ent.label}] ${rxn.name}: ${rxn.equation}`;
        document.getElementById("reaction-dh-badge").textContent = `ΔT = ${rxn.deltaTempC >= 0 ? "+" : ""}${rxn.deltaTempC} °C`;
        if (ent.state.activeGas) CV.labAudio.play("fizz");
      } else {
        document.getElementById("reaction-eq-text").textContent = `Dispensed ${amount} ${unit} of ${r.label} into ${ent.label}.`;
      }

      labState.titrationCurve.push({ x: labState.buretteTitrantAddedMl, y: ent.state.pH });
      if (labState.titrationCurve.length > 65) labState.titrationCurve.shift();

      syncEntityVisuals(ent);
      updateTopHUDAndAnalytics();
    }

    function loadBuretteTitrant(reagentId) {
      const r = CV.LAB_REAGENTS[reagentId];
      if (!r) return;
      labState.buretteReagentId = reagentId;
      buretteLiqMat.color.set(r.colorHex);
      dropletMat.color.set(r.colorHex);
      document.getElementById("reaction-eq-text").textContent = `Loaded 50.0 mL of ${r.label} into the 50 mL Graduated Burette.`;
    }

    function dispenseBuretteDrop(volMl = 0.05) {
      labState.buretteTitrantAddedMl += volMl;
      dropletMesh.position.set(0, 3.18, 0);
      dropletMesh.visible = true;
      setTimeout(() => { dropletMesh.visible = false; }, 160);
      dispenseReagentToVessel(labState.buretteReagentId, volMl, "mL", labState.dispenseMolarity);
      if (Math.abs(getActiveVessel().state.pH - 7.0) < 0.6) {
        document.getElementById("an-equiv-pt").textContent = `${labState.buretteTitrantAddedMl.toFixed(2)} mL`;
      }
    }

    let buretteInterval = null;
    function cycleBuretteValve() {
      const modes = ["closed", "dropwise", "stream"];
      labState.buretteMode = modes[(modes.indexOf(labState.buretteMode) + 1) % modes.length];
      clearInterval(buretteInterval);

      const btn = document.getElementById("btn-burette-valve");
      const lbl = document.getElementById("lbl-burette-valve");

      if (labState.buretteMode === "closed") {
        stopcockValve.rotation.z = 0;
        btn.classList.remove("active");
        lbl.textContent = "Closed";
      } else if (labState.buretteMode === "dropwise") {
        stopcockValve.rotation.z = Math.PI / 4;
        btn.classList.add("active");
        lbl.textContent = "Dropwise";
        buretteInterval = setInterval(() => dispenseBuretteDrop(0.25), 420);
      } else {
        stopcockValve.rotation.z = Math.PI / 2;
        btn.classList.add("active");
        lbl.textContent = "Stream";
        buretteInterval = setInterval(() => dispenseBuretteDrop(1.0), 180);
      }
    }

    function toggleBurnerState() {
      labState.burnerOn = !labState.burnerOn;
      flameMesh.visible = labState.burnerOn;
      burnerLight.intensity = labState.burnerOn ? 2.2 : 0;
      const btn = document.getElementById("btn-burner-toggle");
      const lbl = document.getElementById("lbl-burner-state");
      btn.classList.toggle("flame-active", labState.burnerOn);
      lbl.textContent = labState.burnerOn ? "Flame ON" : "Heat OFF";
      CV.labAudio.play("pour");
      evaluateSpatialBurnerHeating();
    }

    function animateCameraToPreset(preset) {
      const entPos = getActiveVessel().group.position;
      const targets = {
        bench:   { pos: [0, 4.3, 8.2], look: [0, 2.0, 0] },
        vessel:  { pos: [entPos.x, entPos.y + 1.2, entPos.z + 4.1], look: [entPos.x, entPos.y + 0.6, entPos.z] },
        burette: { pos: [1.1, 4.4, 4.2], look: [0, 3.6, 0] },
        burner:  { pos: [burnerGroup.position.x, 1.55, burnerGroup.position.z + 3.4], look: [burnerGroup.position.x, 1.15, burnerGroup.position.z] },
        distill: { pos: [-3.2, 2.6, 4.2], look: [-3.2, 1.3, -0.6] },
        electro: { pos: [3.8, 2.3, 4.6], look: [3.8, 0.8, 0.4] }
      };
      const cfg = targets[preset] || targets.bench;
      if (window.gsap) {
        window.gsap.to(camera.position, { x: cfg.pos[0], y: cfg.pos[1], z: cfg.pos[2], duration: 0.65, ease: "power2.out" });
        window.gsap.to(controls.target, { x: cfg.look[0], y: cfg.look[1], z: cfg.look[2], duration: 0.65, ease: "power2.out" });
      } else {
        camera.position.set(...cfg.pos);
        controls.target.set(...cfg.look);
      }
    }

    function runPlatinumFlameTest() {
      if (!labState.burnerOn) toggleBurnerState();
      animateCameraToPreset("burner");
      flameLoopGroup.visible = true;
      flameLoopGroup.position.set(burnerGroup.position.x + 1.45, 1.25, burnerGroup.position.z);

      let spectrum = CV.FLAME_TEST_SPECTRA.Na;
      const sp = getActiveVessel().state.species;
      if (sp.has("LiCl")) spectrum = CV.FLAME_TEST_SPECTRA.Li;
      else if (sp.has("SrCl2")) spectrum = CV.FLAME_TEST_SPECTRA.Sr;
      else if (sp.has("BaCl2")) spectrum = CV.FLAME_TEST_SPECTRA.Ba;
      else if (sp.has("CaCl2") || sp.has("CaOH2")) spectrum = CV.FLAME_TEST_SPECTRA.Ca;
      else if (sp.has("CuSO4") || sp.has("Cu_turnings")) spectrum = CV.FLAME_TEST_SPECTRA.Cu;
      else if (sp.has("KOH") || sp.has("KI") || sp.has("KSCN") || sp.has("KMnO4")) spectrum = CV.FLAME_TEST_SPECTRA.K;
      else if (sp.has("PbNO3_2")) spectrum = CV.FLAME_TEST_SPECTRA.Pb;

      let step = 0;
      const timer = setInterval(() => {
        step++;
        flameLoopGroup.position.x = Math.max(burnerGroup.position.x + 0.04, burnerGroup.position.x + 1.45 - step * 0.12);
        if (step === 11) {
          flameUniforms.uOuterColor.value.set(spectrum.hex);
          flameUniforms.uInnerColor.value.set(spectrum.innerHex);
          burnerLight.color.set(spectrum.hex);
          document.getElementById("reaction-eq-text").textContent =
            `Atomic Emission Flame Test: ${spectrum.ion} → ${spectrum.name} (${spectrum.wavelengthNm} nm)`;
        }
        if (step > 36) {
          clearInterval(timer);
          flameLoopGroup.visible = false;
          flameUniforms.uOuterColor.value.set("#2563EB");
          flameUniforms.uInnerColor.value.set("#38BDF8");
          burnerLight.color.set("#38BDF8");
        }
      }, 45);
    }

    function cleanActiveVessel() {
      clearInterval(buretteInterval);
      labState.buretteMode = "closed";
      stopcockValve.rotation.z = 0;
      document.getElementById("btn-burette-valve")?.classList.remove("active");
      document.getElementById("lbl-burette-valve").textContent = "Closed";

      const ent = getActiveVessel();
      ent.state = new CV.VesselState(ent.id, ent.label, ent.spec.type, ent.spec.capacityMl, ent.state.ambientTempC);
      labState.buretteTitrantAddedMl = 0;
      labState.titrationCurve = [{ x: 0, y: 7.0 }];
      while (ent.solidGroup.children.length > 0) ent.solidGroup.remove(ent.solidGroup.children[0]);

      syncEntityVisuals(ent);
      updateTopHUDAndAnalytics();
      document.getElementById("reaction-eq-text").textContent = `${ent.label} emptied, rinsed with deionized H₂O, and dried.`;
      document.getElementById("reaction-dh-badge").textContent = "ΔH° = 0.0 kJ/mol";
    }

    function executeGuidedPractical(practicalId) {
      const prac = CV.GUIDED_PRACTICALS.find(p => p.id === practicalId);
      if (!prac) return;
      cleanActiveVessel();

      prac.steps.forEach((step, idx) => {
        setTimeout(() => {
          if (step.action === "vessel") {
            const spec = CV.APPARATUS_CATALOG.find(a => a.id === step.value);
            if (spec) rebuildVesselGlassware(getActiveVessel(), spec);
          } else if (step.action === "add") {
            dispenseReagentToVessel(step.reagentId, step.amount, step.unit || "mL", step.molarity || 0.1);
          } else if (step.action === "burette") {
            loadBuretteTitrant(step.reagentId);
          } else if (step.action === "stir") {
            getActiveVessel().state.stirrerRpm = step.rpm;
            document.getElementById("lbl-stir-rpm").textContent = `${step.rpm} RPM`;
            document.getElementById("btn-magnetic-stir").classList.add("active");
            syncEntityVisuals(getActiveVessel());
          }
        }, idx * 280);
      });
    }

    // ========================================================================
    // 6. WORKBENCH SHELF RENDERER & UI CONTROLS WIRING
    // ========================================================================
    let activeShelfTab = "apparatus";
    function renderWorkbenchShelf(searchQuery = "") {
      const grid = document.getElementById("shelf-items-grid");
      if (!grid) return;
      grid.innerHTML = "";
      const q = searchQuery.trim().toLowerCase();

      if (activeShelfTab === "apparatus") {
        const list = q
          ? CV.INSTRUMENTS_CATALOG.filter(i => i.label.toLowerCase().includes(q) || i.sub.toLowerCase().includes(q)).slice(0, 48)
          : CV.INSTRUMENTS_CATALOG.slice(0, 36);

        list.forEach(item => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "reagent-card card-apparatus";
          btn.innerHTML = `<div class="rc-top"><span><i class="fa-solid fa-flask"></i> ${item.label}</span></div><div class="rc-sub">${item.sub}</div>`;
          btn.addEventListener("click", () => {
            if (item.type === "burette_load") loadBuretteTitrant(item.reagentId);
            else {
              rebuildVesselGlassware(getActiveVessel(), item);
              updateTopHUDAndAnalytics();
            }
          });
          grid.appendChild(btn);
        });
        return;
      }

      if (activeShelfTab === "guided_labs" && !q) {
        CV.GUIDED_PRACTICALS.forEach(prac => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "reagent-card card-preset";
          btn.innerHTML = `<div class="rc-top"><span><i class="fa-solid fa-bolt"></i> ${prac.label}</span></div><div class="rc-sub">${prac.sub}</div>`;
          btn.addEventListener("click", () => executeGuidedPractical(prac.id));
          grid.appendChild(btn);
        });
        return;
      }

      if (activeShelfTab === "metals_elements" && !q) {
        CV.PERIODIC_TABLE_118.slice(0, 48).forEach(el => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "reagent-card card-salt";
          btn.innerHTML = `<div class="rc-top"><span>${el.atomicNumber}. ${el.symbol}</span><span class="rc-swatch" style="background:${el.cpkColor}"></span></div><div class="rc-sub">${el.name} (${el.phaseSTP})</div>`;
          btn.addEventListener("click", () => {
            const dynId = `el_${el.symbol}`;
            if (!CV.LAB_REAGENTS[dynId]) {
              CV.LAB_REAGENTS[dynId] = {
                id: dynId, formula: el.symbol, label: `Pure ${el.name} (${el.symbol})`,
                category: "metal", state: el.phaseSTP === "liquid" ? "liquid" : "solid",
                molarMass: el.atomicMass, density: el.density || 2.5, colorHex: el.cpkColor, opacity: 0.95, ghs: []
              };
            }
            dispenseReagentToVessel(dynId, 1.5, el.phaseSTP === "liquid" ? "mL" : "g");
          });
          grid.appendChild(btn);
        });
        return;
      }

      const tabCategoryMap = {
        acids_bases: ["acid", "base", "solvent"],
        salts_redox: ["salt", "redox"],
        organic_reagents: ["organic"],
        indicators_catalysts: ["indicator", "catalyst"]
      };
      const allowedCats = tabCategoryMap[activeShelfTab] || Object.keys(CV.LAB_REAGENTS);

      Object.values(CV.LAB_REAGENTS).forEach(r => {
        const matchesSearch = q
          ? (r.label.toLowerCase().includes(q) || r.formula.toLowerCase().includes(q))
          : allowedCats.includes(r.category);
        if (!matchesSearch) return;

        const cardClass = r.category === "acid" ? "card-acid"
          : r.category === "base" ? "card-base"
          : r.category === "indicator" ? "card-indicator" : "card-salt";

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `reagent-card ${cardClass}`;
        btn.innerHTML = `<div class="rc-top"><span>${r.formula}</span><span class="rc-swatch" style="background:${r.colorHex}"></span></div><div class="rc-sub">${r.label}</div>`;
        btn.addEventListener("click", () => dispenseReagentToVessel(r.id));
        grid.appendChild(btn);
      });
    }

    // Wire UI Events
    document.getElementById("btn-mobile-menu")?.addEventListener("click", () => {
      document.getElementById("site-nav")?.classList.toggle("open");
    });

    document.getElementById("btn-toggle-workbench")?.addEventListener("click", () => {
      const sheet = document.getElementById("bottom-workbench");
      const isMin = sheet.classList.toggle("minimized");
      document.body.classList.toggle("shelf-minimized", isMin);
      document.getElementById("lbl-sheet-state").textContent = isMin ? "Expand Lab Shelf" : "Hide Shelf (85% 3D View)";
    });

    document.getElementById("btn-collapse-toast")?.addEventListener("click", () => {
      document.getElementById("reaction-toast").classList.toggle("collapsed");
    });

    document.querySelectorAll("[data-dose]").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("[data-dose]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        labState.dispenseVolMl = parseFloat(btn.dataset.dose);
      });
    });

    document.querySelectorAll("[data-molarity]").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("[data-molarity]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        labState.dispenseMolarity = parseFloat(btn.dataset.molarity);
      });
    });

    document.querySelectorAll(".shelf-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        document.querySelectorAll(".shelf-tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        activeShelfTab = tab.dataset.tab;
        renderWorkbenchShelf(document.getElementById("shelf-search-input")?.value || "");
      });
    });

    document.getElementById("shelf-search-input")?.addEventListener("input", e => renderWorkbenchShelf(e.target.value));

    document.querySelectorAll(".cam-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".cam-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        animateCameraToPreset(btn.dataset.cam);
      });
    });

    document.getElementById("btn-burette-micro")?.addEventListener("click", () => dispenseBuretteDrop(0.05));
    document.getElementById("btn-burette-valve")?.addEventListener("click", cycleBuretteValve);
    document.getElementById("btn-burner-toggle")?.addEventListener("click", toggleBurnerState);

    document.getElementById("btn-air-collar")?.addEventListener("click", () => {
      const steps = [0, 50, 100];
      labState.airCollarPercent = steps[(steps.indexOf(labState.airCollarPercent) + 1) % steps.length];
      flameUniforms.uAirRatio.value = labState.airCollarPercent / 100;
      document.getElementById("lbl-air-collar").textContent = `Air ${labState.airCollarPercent}%`;
      evaluateSpatialBurnerHeating();
    });

    document.getElementById("btn-magnetic-stir")?.addEventListener("click", () => {
      const rpms = [0, 600, 1200];
      const ent = getActiveVessel();
      const next = rpms[(rpms.indexOf(ent.state.stirrerRpm) + 1) % rpms.length];
      ent.state.stirrerRpm = next;
      document.getElementById("lbl-stir-rpm").textContent = next === 0 ? "Stir OFF" : `${next} RPM`;
      document.getElementById("btn-magnetic-stir").classList.toggle("active", next > 0);
      syncEntityVisuals(ent);
    });

    document.getElementById("btn-uv-lamp")?.addEventListener("click", e => {
      const ent = getActiveVessel();
      ent.state.uvLightActive = !ent.state.uvLightActive;
      uvLight.intensity = ent.state.uvLightActive ? 2.5 : 0;
      e.currentTarget.classList.toggle("active", ent.state.uvLightActive);
      document.getElementById("lbl-uv-state").textContent = ent.state.uvLightActive ? "UV ON" : "UV OFF";
      updateTopHUDAndAnalytics();
    });

    document.getElementById("btn-flame-test")?.addEventListener("click", runPlatinumFlameTest);
    document.getElementById("btn-clean-vessel")?.addEventListener("click", cleanActiveVessel);

    document.getElementById("btn-open-conditions")?.addEventListener("click", () => document.getElementById("drawer-conditions").classList.toggle("hidden"));
    document.getElementById("btn-open-analytics")?.addEventListener("click", () => {
      document.getElementById("drawer-analytics").classList.toggle("hidden");
      drawAnalyticsPlot();
    });
    document.getElementById("btn-open-customizer")?.addEventListener("click", () => document.getElementById("drawer-customizer").classList.toggle("hidden"));
    document.getElementById("btn-open-ai")?.addEventListener("click", () => document.getElementById("drawer-ai").classList.toggle("hidden"));

    document.querySelectorAll("[data-cond-mode]").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("[data-cond-mode]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const tempMap = { room: 25, ice: 2, warm: 60, reflux: 100, fusion: 350 };
        const ent = getActiveVessel();
        ent.state.ambientTempC = tempMap[btn.dataset.condMode] ?? 25;
        ent.state.temperatureC = ent.state.ambientTempC;
        updateTopHUDAndAnalytics();
      });
    });

    document.getElementById("select-active-catalyst")?.addEventListener("change", e => {
      const ent = getActiveVessel();
      ent.state.activeCatalyst = e.target.value;
      ent.state.evaluateReactions();
      syncEntityVisuals(ent);
      updateTopHUDAndAnalytics();
    });

    document.getElementById("slider-electro-volt")?.addEventListener("input", e => {
      const v = parseFloat(e.target.value);
      getActiveVessel().state.electrolysisVoltage = v;
      document.getElementById("val-electro-volt").textContent = `${v.toFixed(1)} V`;
      updateTopHUDAndAnalytics();
    });

    document.getElementById("btn-toggle-sfx")?.addEventListener("click", () => {
      CV.labAudio.enabled = !CV.labAudio.enabled;
      const icon = document.getElementById("sfx-icon");
      if (icon) icon.className = CV.labAudio.enabled ? "fa-solid fa-volume-high" : "fa-solid fa-volume-xmark";
    });

    document.querySelectorAll("[data-close]").forEach(btn => {
      btn.addEventListener("click", () => document.getElementById(btn.dataset.close)?.classList.add("hidden"));
    });

    document.querySelectorAll("[data-chart]").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("[data-chart]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        labState.chartMode = btn.dataset.chart;
        drawAnalyticsPlot();
      });
    });

    document.getElementById("btn-clear-graph")?.addEventListener("click", () => {
      const st = getActiveVessel().state;
      labState.titrationCurve = [{ x: labState.buretteTitrantAddedMl, y: st.pH }];
      labState.thermalCurve = [{ x: 0, y: st.temperatureC }];
      drawAnalyticsPlot();
    });

    document.getElementById("btn-export-csv")?.addEventListener("click", () => {
      const st = getActiveVessel().state;
      const rows = ["Titrant_mL,pH,Temp_C"];
      labState.titrationCurve.forEach(pt => rows.push(`${pt.x.toFixed(2)},${pt.y.toFixed(2)},${st.temperatureC.toFixed(1)}`));
      const blob = new Blob([rows.join("\n")], { type: "text/csv" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "chemverse_lab_telemetry.csv";
      a.click();
    });

    document.querySelectorAll("[data-uiscale]").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("[data-uiscale]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        document.documentElement.style.setProperty("--touch-unit", btn.dataset.uiscale);
      });
    });

    document.getElementById("slider-ambient-temp")?.addEventListener("input", e => {
      const c = parseFloat(e.target.value);
      getActiveVessel().state.ambientTempC = c;
      document.getElementById("val-ambient-temp").textContent = `${c.toFixed(1)} °C (${(c + 273.15).toFixed(2)} K)`;
    });

    document.getElementById("slider-pressure")?.addEventListener("input", e => {
      const p = parseFloat(e.target.value);
      getActiveVessel().state.pressureAtm = p;
      document.getElementById("val-pressure").textContent = `${p.toFixed(2)} atm`;
      updateTopHUDAndAnalytics();
    });

    document.getElementById("slider-gravity")?.addEventListener("input", e => {
      labState.gravityG = parseFloat(e.target.value);
      document.getElementById("val-gravity").textContent = `${labState.gravityG.toFixed(2)} g`;
      updateTopHUDAndAnalytics();
    });

    document.querySelectorAll("[data-envtheme]").forEach(btn => {
      btn.addEventListener("click", async () => {
        document.querySelectorAll("[data-envtheme]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const theme = btn.dataset.envtheme;
        document.documentElement.dataset.theme = theme;
        const video = document.getElementById("ar-camera-feed");
        if (theme === "ar-camera" && navigator.mediaDevices?.getUserMedia) {
          try {
            video.srcObject = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
          } catch (_) {}
        } else if (video?.srcObject) {
          video.srcObject.getTracks().forEach(t => t.stop());
          video.srcObject = null;
        }
      });
    });

    document.getElementById("btn-save-custom-rxn")?.addEventListener("click", () => {
      const rule = CV.registerCustomReaction({
        reactantA: document.getElementById("cust-rxn-a")?.value,
        reactantB: document.getElementById("cust-rxn-b")?.value,
        equation: document.getElementById("cust-rxn-eq")?.value,
        colorHex: document.getElementById("cust-rxn-color")?.value,
        deltaH: document.getElementById("cust-rxn-dh")?.value,
        hasPpt: document.getElementById("cust-rxn-ppt")?.checked,
        hasGas: document.getElementById("cust-rxn-gas")?.checked
      });
      if (rule) {
        document.getElementById("drawer-customizer").classList.add("hidden");
        const keys = Object.keys(rule.reactants);
        keys.forEach((k, idx) => setTimeout(() => dispenseReagentToVessel(k, 20, "mL", 0.5), idx * 250));
      }
    });

    // ========================================================================
    // 7. ZERO-SECRET AI CO-SCIENTIST CLIENT (/api/gemini-proxy + Local Engine)
    // ========================================================================
    let ttsEnabled = false;

    function buildTelemetrySnapshot() {
      return {
        selectedVessel: getActiveVessel().state.toTelemetryJSON(),
        allVessels: vesselEntities.map(v => ({
          label: v.label,
          position: { x: Number(v.group.position.x.toFixed(2)), z: Number(v.group.position.z.toFixed(2)) },
          temperatureC: Number(v.state.temperatureC.toFixed(1)),
          heatSourceWatts: v.state.heatSourceWatts
        })),
        burnerOn: labState.burnerOn
      };
    }

    function executeLocalAIReactionSynthesis(promptText) {
      const q = promptText.toLowerCase();
      const matched = CV.REACTIONS_ENCYCLOPEDIA.find(
        r => q.includes(r.name.toLowerCase()) ||
             (q.includes("sandmeyer") && r.id === "organic_sandmeyer") ||
             ((q.includes("tollens") || q.includes("silver mirror")) && r.id === "organic_tollens_mirror") ||
             (q.includes("fehling") && r.id === "organic_fehling_test") ||
             (q.includes("iodoform") && r.id === "organic_iodoform") ||
             (q.includes("azo") && r.id === "organic_azo_coupling") ||
             (q.includes("aldol") && r.id === "organic_aldol") ||
             (q.includes("cannizzaro") && r.id === "organic_cannizzaro") ||
             ((q.includes("phenol") && q.includes("br")) && r.id === "organic_phenol_bromine") ||
             ((q.includes("golden rain") || q.includes("pbi2")) && r.id === "precip_pbi2_golden_rain") ||
             ((q.includes("kmno4") || q.includes("oxalic")) && r.id === "redox_kmno4_oxalic")
      );

      if (matched) {
        cleanActiveVessel();
        Object.keys(matched.reactants || {}).forEach((rId, idx) => {
          setTimeout(() => {
            const r = CV.LAB_REAGENTS[rId];
            dispenseReagentToVessel(rId, r?.state === "solid" ? 2.0 : 25, r?.state === "solid" ? "g" : "mL", 0.5);
          }, idx * 280);
        });
        return `**AI Co-Scientist:** Synthesizing **${matched.name}** in ${getActiveVessel().label}.\n• **Equation:** \`${matched.equation}\`\n• **Conditions:** ${matched.conditions || "298 K, 1 atm"}\n• **Enthalpy (ΔH°):** ${matched.deltaH_kJ_mol} kJ/mol`;
      }

      if (q.includes("inspect") || q.includes("analyze") || q.includes("vessel") || q.includes("heated")) {
        const snap = buildTelemetrySnapshot();
        const sel = snap.selectedVessel;
        return `**Live Multi-Vessel Telemetry (${sel.label}):**\n• **Volume & Temp:** ${sel.volumeMl} mL at **${sel.temperatureC} °C** (Flame Input: ${sel.heatSourceWatts} W)\n• **Digital pH:** ${sel.pH}\n• **Active Gas:** ${sel.activeGas || "None"}`;
      }

      const cleaned = promptText.replace(/^(react|mix|combine|synthesize|make|simulate)\s+/i, "").trim();
      const parts = cleaned.split(/\s*(?:\+|with|and|vs)\s*/i);
      const rA = (parts[0] || "Reactant_A").trim().replace(/\s+/g, "_");
      const rB = (parts[1] || "Reagent_B").trim().replace(/\s+/g, "_");
      const hasGas = /gas|co2|h2|no2|fume|bubble/i.test(promptText);
      const hasPpt = /ppt|precipitat|solid|crystal|yellow|white|blue|red/i.test(promptText);

      const rule = CV.registerCustomReaction({
        reactantA: rA, reactantB: rB,
        equation: `${rA} + ${rB} → Synthesized Product`,
        colorHex: "#10B981", deltaH: -48.0, hasPpt, hasGas
      });
      if (rule) {
        dispenseReagentToVessel(rA, 20, "mL", 0.5);
        setTimeout(() => dispenseReagentToVessel(rB, 20, "mL", 0.5), 250);
      }
      return `**On-Demand Reaction Synthesized:** \`${rA} + ${rB} → Products\` (ΔH° = -48.0 kJ/mol) dispensed into ${getActiveVessel().label}.`;
    }

    function appendAIChat(role, rawText) {
      const stream = document.getElementById("ai-chat-stream");
      if (!stream) return;

      let cleanText = rawText;
      const cmdMatch = rawText.match(/<LAB_CMD>([\s\S]*?)<\/LAB_CMD>/);
      if (cmdMatch && cmdMatch[1]) {
        cleanText = rawText.replace(cmdMatch[0], "").trim();
        try {
          const cmd = JSON.parse(cmdMatch[1].trim());
          if (cmd.action === "SYNTHESIZE_REACTION") {
            const rule = CV.registerCustomReaction(cmd);
            if (rule) {
              Object.keys(rule.reactants).forEach((k, idx) => setTimeout(() => dispenseReagentToVessel(k, 20, "mL", 0.5), idx * 250));
            }
          }
        } catch (_) {}
      }

      const div = document.createElement("div");
      div.className = `ai-msg ${role}`;
      const formatted = cleanText.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br>");
      div.innerHTML = role === "user"
        ? `<strong><i class="fa-solid fa-user"></i> You:</strong> ${formatted}`
        : `<strong><i class="fa-solid fa-robot"></i> Co-Scientist:</strong> ${formatted}`;
      stream.appendChild(div);
      stream.scrollTop = stream.scrollHeight;

      if (role === "assistant" && ttsEnabled && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(cleanText.replace(/[*#$\\`]/g, "")));
      }
    }

    async function sendToSecureAIProxy(promptText) {
      const text = (promptText || "").trim();
      if (!text) return;
      appendAIChat("user", text);

      try {
        // Calls your server-side proxy so secret keys are never exposed in browser code
        const res = await fetch("/api/gemini-proxy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: text, telemetry: buildTelemetrySnapshot() })
        });
        if (!res.ok) throw new Error("Proxy unavailable");
        const data = await res.json();
        appendAIChat("assistant", data.reply || executeLocalAIReactionSynthesis(text));
      } catch (_) {
        // Seamless computational fallback when hosted on static servers without Node backend
        appendAIChat("assistant", executeLocalAIReactionSynthesis(text));
      }
    }

    document.getElementById("btn-ai-synthesize-rxn")?.addEventListener("click", () => {
      const input = document.getElementById("ai-ondemand-rxn-input");
      if (!input || !input.value.trim()) return;
      const val = input.value;
      input.value = "";
      sendToSecureAIProxy(`Synthesize reaction on demand: ${val}`);
    });

    document.getElementById("ai-chat-form")?.addEventListener("submit", e => {
      e.preventDefault();
      const input = document.getElementById("ai-chat-input");
      if (!input || !input.value.trim()) return;
      const val = input.value;
      input.value = "";
      sendToSecureAIProxy(val);
    });

    document.querySelectorAll(".ai-prompt-chip").forEach(chip => {
      chip.addEventListener("click", () => sendToSecureAIProxy(chip.dataset.prompt));
    });

    document.getElementById("btn-ai-tts")?.addEventListener("click", e => {
      ttsEnabled = !ttsEnabled;
      e.currentTarget.classList.toggle("active", ttsEnabled);
      if (!ttsEnabled && "speechSynthesis" in window) window.speechSynthesis.cancel();
    });

    document.getElementById("btn-ai-mic")?.addEventListener("click", e => {
      const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRec) return;
      const rec = new SpeechRec();
      rec.lang = "en-IN";
      const btn = e.currentTarget;
      btn.classList.add("active");
      rec.onresult = ev => {
        const t = ev.results?.[0]?.[0]?.transcript || "";
        if (t) sendToSecureAIProxy(t);
      };
      rec.onend = () => btn.classList.remove("active");
      rec.start();
    });

    // ========================================================================
    // 8. BOOT DEFAULT VESSELS & HANDLE URL QUERY LAUNCH PARAMETERS
    // ========================================================================
    // Vessel #1 starts on the Tripod over the Bunsen Burner (X=0, Y=1.60, Z=0)
    create3DVesselEntity(CV.APPARATUS_CATALOG[0], "Beaker #1", 0, 1.60, 0);
    // Vessel #2 starts on the adjacent workbench (X=2.1, Y=0, Z=0.8) ready to be dragged onto the flame!
    create3DVesselEntity(CV.APPARATUS_CATALOG[2], "Conical Flask #2", 2.1, 0, 0.8);
    selectActiveVessel(0);

    renderWorkbenchShelf();

    // Parse URL Parameters from other pages (encyclopedia.html, instruments.html, periodic-molecules.html)
    const params = new URLSearchParams(window.location.search);
    if (params.get("preset")) {
      setTimeout(() => executeGuidedPractical(params.get("preset")), 300);
    } else if (params.get("rxn")) {
      const rule = CV.REACTIONS_ENCYCLOPEDIA.find(r => r.id === params.get("rxn"));
      if (rule) {
        setTimeout(() => {
          Object.keys(rule.reactants || {}).forEach((rId, idx) => {
            setTimeout(() => {
              const r = CV.LAB_REAGENTS[rId];
              dispenseReagentToVessel(rId, r?.state === "solid" ? 2.0 : 25, r?.state === "solid" ? "g" : "mL", 0.5);
            }, idx * 280);
          });
        }, 300);
      }
    } else if (params.get("customA") && params.get("customB")) {
      const rA = params.get("customA"), rB = params.get("customB");
      CV.registerCustomReaction({ reactantA: rA, reactantB: rB, equation: `${rA} + ${rB} → Custom Product`, colorHex: "#38BDF8", deltaH: -45, hasPpt: false, hasGas: true });
      setTimeout(() => {
        dispenseReagentToVessel(rA, 20, "mL", 0.5);
        setTimeout(() => dispenseReagentToVessel(rB, 20, "mL", 0.5), 250);
      }, 300);
    } else if (params.get("spawn")) {
      const inst = CV.INSTRUMENTS_CATALOG.find(i => i.id === params.get("spawn"));
      if (inst && inst.type !== "burette_load") rebuildVesselGlassware(getActiveVessel(), inst);
    } else if (params.get("spawnElement")) {
      const sym = params.get("spawnElement");
      const el = CV.ELEMENT_BY_SYMBOL[sym];
      if (el) {
        const dynId = `el_${sym}`;
        CV.LAB_REAGENTS[dynId] = {
          id: dynId, formula: sym, label: `Pure ${el.name} (${sym})`, category: "metal",
          state: el.phaseSTP === "liquid" ? "liquid" : "solid", molarMass: el.atomicMass,
          density: el.density || 2.5, colorHex: el.cpkColor, opacity: 0.95, ghs: []
        };
        setTimeout(() => dispenseReagentToVessel(dynId, 2.0, el.phaseSTP === "liquid" ? "mL" : "g"), 300);
      }
    } else if (params.get("spawnCompound")) {
      const title = params.get("spawnCompound");
      const formula = params.get("formula") || title;
      const mw = parseFloat(params.get("mw")) || 120;
      const dynId = formula.replace(/[^a-zA-Z0-9]/g, "") || "CustomComp";
      CV.LAB_REAGENTS[dynId] = {
        id: dynId, formula, label: `${title} (${formula})`, category: "organic",
        state: "liquid", molarMass: mw, defaultMolarity: 0.5, density: 1.02, colorHex: "#38BDF8", opacity: 0.45, ghs: []
      };
      setTimeout(() => dispenseReagentToVessel(dynId, 20, "mL", 0.5), 300);
    }

    window.addEventListener("resize", () => {
      const h = Math.max(240, window.innerHeight - headerOffset);
      camera.aspect = window.innerWidth / h;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, h);
    });

    // ========================================================================
    // 9. 60-FPS REAL-TIME SPATIAL THERMODYNAMICS & RENDER LOOP
    // ========================================================================
    let lastTime = performance.now();
    let fpsFrames = 0;
    let fpsLastCheck = performance.now();
    const fpsValEl = document.getElementById("fps-val");

    function animateLoop(now) {
      requestAnimationFrame(animateLoop);
      const dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      fpsFrames++;
      if (now - fpsLastCheck >= 1000) {
        const currentFps = Math.round((fpsFrames * 1000) / (now - fpsLastCheck));
        if (fpsValEl) fpsValEl.textContent = currentFps;
        if (currentFps < 42 && renderer.getPixelRatio() > 1.0) renderer.setPixelRatio(1.0);
        fpsFrames = 0;
        fpsLastCheck = now;
      }

      controls.update();
      const elapsedSec = now * 0.001;
      flameUniforms.uTime.value = elapsedSec;

      // Evaluate Spatial Distance between Bunsen Burner and ALL Vessels every frame
      evaluateSpatialBurnerHeating();

      // Step Physics & Particles for every Vessel on the Workbench
      for (let idx = 0; idx < vesselEntities.length; idx++) {
        const ent = vesselEntities[idx];
        ent.liquidUniforms.uTime.value = elapsedSec;
        ent.liquidUniforms.uColor.value.lerp(ent.targetColor, 0.08);

        if (ent.state.stirrerRpm > 0) {
          ent.stirBar.rotation.y += (ent.state.stirrerRpm / 60) * dt * 2.5;
        }

        ent.state.stepThermalAndPhysics(dt);

        const hasGas = Boolean(ent.state.activeGas) && ent.state.volumeMl > 0;
        const maxBubbleY = 0.05 + (ent.state.volumeMl / ent.state.maxCapacityMl) * ((ent.spec.height || 2.0) * 0.85);
        const rad = (ent.spec.radius || 0.88) * 0.65;

        for (let i = 0; i < ent.bubbles.length; i++) {
          const b = ent.bubbles[i];
          if (hasGas) {
            b.mesh.visible = true;
            b.mesh.position.y += b.vy * Math.max(0.25, labState.gravityG);
            if (b.mesh.position.y > maxBubbleY) {
              b.mesh.position.y = 0.06;
              b.mesh.position.x = (Math.random() - 0.5) * rad;
              b.mesh.position.z = (Math.random() - 0.5) * rad;
            }
          } else {
            b.mesh.visible = false;
          }
        }

        for (let i = 0; i < ent.plumes.length; i++) {
          const p = ent.plumes[i];
          if (hasGas) {
            ent.plumeMat.color.set(ent.state.activeGas.colorHex || "#F1F5F9");
            p.mesh.visible = true;
            p.mesh.position.y += p.vy;
            if (p.mesh.position.y > (ent.spec.height || 2.0) + 1.1) {
              p.mesh.position.y = (ent.spec.height || 2.0) * 0.9;
              p.mesh.position.x = (Math.random() - 0.5) * 0.4;
              p.mesh.position.z = (Math.random() - 0.5) * 0.4;
            }
          } else {
            p.mesh.visible = false;
          }
        }
      }

      if (fpsFrames % 15 === 0) {
        const activeSt = getActiveVessel().state;
        labState.thermalCurve.push({ x: elapsedSec, y: activeSt.temperatureC });
        if (labState.thermalCurve.length > 60) labState.thermalCurve.shift();
        updateTopHUDAndAnalytics();
      }

      renderer.render(scene, camera);
    }

    requestAnimationFrame(animateLoop);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init3DLabWorkbench);
  } else {
    init3DLabWorkbench();
  }
})();
