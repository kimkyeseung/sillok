'use client';

import { useEffect } from 'react';

const spaceSimulatorHtml = String.raw`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Solar System</title>
  <style>
    * { box-sizing: border-box; }
    html, body {
      width: 100%;
      height: 100%;
      margin: 0;
      overflow: hidden;
      background: #02040a;
      color: #f8fafc;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    #app {
      position: fixed;
      inset: 0;
      background:
        radial-gradient(circle at 50% 48%, rgba(14, 165, 233, 0.22), transparent 38%),
        radial-gradient(circle at 50% 50%, rgba(251, 191, 36, 0.16), transparent 28%),
        radial-gradient(circle at 20% 20%, rgba(45, 212, 191, 0.08), transparent 32%),
        #040814;
    }
    canvas {
      display: block;
      width: 100%;
      height: 100%;
      touch-action: none;
    }
    .topbar {
      position: fixed;
      left: 16px;
      right: 16px;
      top: 16px;
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      border: 1px solid rgba(148, 163, 184, 0.18);
      border-radius: 16px;
      background: rgba(2, 6, 23, 0.58);
      box-shadow: 0 24px 80px rgba(0, 0, 0, 0.28);
      padding: 12px 14px;
      backdrop-filter: blur(18px);
    }
    .title {
      min-width: 150px;
    }
    .eyebrow {
      margin: 0 0 2px;
      color: #67e8f9;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.22em;
      text-transform: uppercase;
    }
    h1 {
      margin: 0;
      font-size: 22px;
      line-height: 1;
      letter-spacing: 0;
    }
    .controls {
      display: flex;
      align-items: center;
      gap: 14px;
      min-width: 0;
    }
    .speed {
      display: grid;
      gap: 5px;
      min-width: 220px;
    }
    .speed span {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      color: #cbd5e1;
      font-size: 12px;
      font-weight: 700;
    }
    input[type="range"] {
      width: 100%;
      accent-color: #22d3ee;
    }
    button {
      border: 1px solid rgba(103, 232, 249, 0.42);
      border-radius: 12px;
      background: rgba(8, 47, 73, 0.48);
      color: #ecfeff;
      cursor: pointer;
      font: inherit;
      font-size: 13px;
      font-weight: 800;
      padding: 10px 12px;
      transition: border-color 160ms ease, background 160ms ease, transform 160ms ease;
    }
    button:hover {
      border-color: rgba(103, 232, 249, 0.85);
      background: rgba(14, 116, 144, 0.56);
      transform: translateY(-1px);
    }
    .hint {
      position: fixed;
      left: 18px;
      bottom: 18px;
      z-index: 9;
      max-width: 340px;
      border: 1px solid rgba(148, 163, 184, 0.16);
      border-radius: 14px;
      background: rgba(2, 6, 23, 0.48);
      color: rgba(226, 232, 240, 0.84);
      padding: 12px 14px;
      backdrop-filter: blur(16px);
      font-size: 13px;
      line-height: 1.5;
    }
    .label {
      position: fixed;
      z-index: 20;
      display: none;
      pointer-events: none;
      transform: translate(14px, -36px);
      border: 1px solid rgba(103, 232, 249, 0.38);
      border-radius: 999px;
      background: rgba(8, 13, 28, 0.82);
      box-shadow: 0 14px 46px rgba(0, 0, 0, 0.38);
      color: white;
      padding: 7px 11px;
      backdrop-filter: blur(12px);
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0;
      white-space: nowrap;
    }
    .panel {
      position: fixed;
      right: 16px;
      top: 92px;
      z-index: 11;
      width: min(340px, calc(100vw - 32px));
      max-height: calc(100vh - 112px);
      overflow: auto;
      border: 1px solid rgba(148, 163, 184, 0.18);
      border-radius: 20px;
      background: rgba(2, 6, 23, 0.64);
      box-shadow: 0 28px 90px rgba(0, 0, 0, 0.42);
      padding: 20px;
      backdrop-filter: blur(22px);
      transform: translateX(calc(100% + 28px));
      opacity: 0;
      transition: transform 260ms ease, opacity 260ms ease;
    }
    .panel.open {
      transform: translateX(0);
      opacity: 1;
    }
    .panel h2 {
      margin: 0;
      color: white;
      font-size: 34px;
      line-height: 1;
      letter-spacing: 0;
    }
    .panel .type {
      margin: 8px 0 0;
      color: #67e8f9;
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    .panel .description {
      margin: 18px 0 0;
      color: #cbd5e1;
      font-size: 14px;
      line-height: 1.65;
    }
    .stats {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-top: 20px;
    }
    .stat {
      min-height: 82px;
      border: 1px solid rgba(148, 163, 184, 0.16);
      border-radius: 14px;
      background: rgba(15, 23, 42, 0.72);
      padding: 12px;
    }
    .stat .key {
      color: #94a3b8;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.16em;
      text-transform: uppercase;
    }
    .stat .value {
      margin-top: 8px;
      color: white;
      font-size: 14px;
      font-weight: 800;
      line-height: 1.35;
    }
    .empty-state {
      color: #94a3b8;
      font-size: 14px;
      line-height: 1.6;
    }
    @media (max-width: 720px) {
      .topbar {
        align-items: stretch;
        flex-direction: column;
      }
      .controls {
        align-items: stretch;
        flex-direction: column;
      }
      .speed {
        min-width: 0;
      }
      .panel {
        left: 16px;
        right: 16px;
        top: auto;
        bottom: 16px;
        width: auto;
        max-height: 42vh;
      }
      .hint {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div id="app"></div>
  <div class="topbar">
    <div class="title">
      <p class="eyebrow">Stellar engine</p>
      <h1>Solar System</h1>
    </div>
    <div class="controls">
      <label class="speed">
        <span><span>Simulation speed</span><strong id="speedValue">1.0x</strong></span>
        <input id="speed" type="range" min="0" max="10" step="0.1" value="1" />
      </label>
      <button id="toggleRings" type="button">Hide rings</button>
    </div>
  </div>
  <div id="hoverLabel" class="label"></div>
  <aside id="infoPanel" class="panel" aria-live="polite">
    <div class="empty-state">Click a planet to inspect its orbit, scale, and physical profile.</div>
  </aside>
  <div class="hint">Drag to orbit, pinch or scroll to zoom, click a planet to fly toward it, or click empty space to return to the wide solar view.</div>

  <script type="importmap">
    {
      "imports": {
        "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
        "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
      }
    }
  </script>
  <script type="module">
    import * as THREE from 'three';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

    const container = document.getElementById('app');
    const speedInput = document.getElementById('speed');
    const speedValue = document.getElementById('speedValue');
    const toggleRingsButton = document.getElementById('toggleRings');
    const hoverLabel = document.getElementById('hoverLabel');
    const infoPanel = document.getElementById('infoPanel');

    const defaultCamera = new THREE.Vector3(0, 105, 230);
    const defaultTarget = new THREE.Vector3(0, 0, 0);
    const clock = new THREE.Clock();
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const planetObjects = [];
    const interactiveMeshes = [];
    const orbitRings = [];
    const textureCache = new Map();
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = 'anonymous';

    let speedMultiplier = 1;
    let simulationTime = 0;
    let orbitRingsVisible = true;
    let selectedPlanet = null;
    let focusCamera = null;
    let focusTarget = null;
    let cameraFlightActive = false;
    let pointerDownPosition = null;
    let pointerWasDragged = false;

    const textureBase = 'https://www.solarsystemscope.com/textures/download/2k_';
    const planets = [
      {
        name: 'Mercury',
        type: 'Rocky planet',
        radius: 0.383,
        distance: 0.39,
        orbitalPeriod: 88,
        color: 0xb7a58d,
        texturePath: textureBase + 'mercury.jpg',
        tilt: 0.03,
        moons: 0,
        diameter: '4,879 km',
        distanceLabel: '57.9 million km',
        periodLabel: '88 Earth days',
        description: 'Mercury is the innermost planet and a cratered rocky world. Its surface bakes in sunlight, then freezes during long nights.'
      },
      {
        name: 'Venus',
        type: 'Greenhouse planet',
        radius: 0.949,
        distance: 0.72,
        orbitalPeriod: 225,
        color: 0xd9a15f,
        texturePath: textureBase + 'venus_surface.jpg',
        tilt: 177.4,
        moons: 0,
        diameter: '12,104 km',
        distanceLabel: '108.2 million km',
        periodLabel: '225 Earth days',
        description: 'Venus is similar to Earth in size but wrapped in a crushing carbon dioxide atmosphere. Its runaway greenhouse effect makes it the hottest planet.'
      },
      {
        name: 'Earth',
        type: 'Ocean planet',
        radius: 1,
        distance: 1,
        orbitalPeriod: 365.25,
        color: 0x2f7ee6,
        texturePath: textureBase + 'earth_daymap.jpg',
        tilt: 23.44,
        moons: 1,
        diameter: '12,742 km',
        distanceLabel: '149.6 million km',
        periodLabel: '365.25 days',
        description: 'Earth is the only known world with stable surface oceans and a living biosphere. Its Moon stabilizes axial tilt and drives tides.'
      },
      {
        name: 'Mars',
        type: 'Dust planet',
        radius: 0.532,
        distance: 1.52,
        orbitalPeriod: 687,
        color: 0xc45f3d,
        texturePath: textureBase + 'mars.jpg',
        tilt: 25.19,
        moons: 2,
        diameter: '6,779 km',
        distanceLabel: '227.9 million km',
        periodLabel: '687 Earth days',
        description: 'Mars is a cold desert world with polar caps, extinct volcanoes, and signs of ancient flowing water. Its rusty color comes from iron-rich dust.'
      },
      {
        name: 'Jupiter',
        type: 'Gas giant',
        radius: 11.21,
        distance: 5.2,
        orbitalPeriod: 4333,
        color: 0xd9b27c,
        texturePath: textureBase + 'jupiter.jpg',
        tilt: 3.13,
        moons: 95,
        diameter: '139,820 km',
        distanceLabel: '778.5 million km',
        periodLabel: '11.9 Earth years',
        description: 'Jupiter dominates the outer solar system with enormous gravity and banded cloud layers. The Great Red Spot is a storm larger than Earth.'
      },
      {
        name: 'Saturn',
        type: 'Ringed gas giant',
        radius: 9.45,
        distance: 9.58,
        orbitalPeriod: 10759,
        color: 0xe2c47b,
        texturePath: textureBase + 'saturn.jpg',
        ringTexturePath: textureBase + 'saturn_ring_alpha.png',
        tilt: 26.73,
        moons: 146,
        diameter: '116,460 km',
        distanceLabel: '1.43 billion km',
        periodLabel: '29.5 Earth years',
        description: 'Saturn is encircled by broad rings of icy fragments and dust. Its low density means it would float in a large enough ocean.'
      },
      {
        name: 'Uranus',
        type: 'Ice giant',
        radius: 4.01,
        distance: 19.2,
        orbitalPeriod: 30687,
        color: 0x87d8e8,
        texturePath: textureBase + 'uranus.jpg',
        tilt: 97.77,
        moons: 28,
        diameter: '50,724 km',
        distanceLabel: '2.87 billion km',
        periodLabel: '84 Earth years',
        description: 'Uranus rolls around the Sun on its side, creating extreme seasons. Methane in its atmosphere gives the planet a pale cyan color.'
      },
      {
        name: 'Neptune',
        type: 'Ice giant',
        radius: 3.88,
        distance: 30.05,
        orbitalPeriod: 60190,
        color: 0x315fd9,
        texturePath: textureBase + 'neptune.jpg',
        tilt: 28.32,
        moons: 16,
        diameter: '49,244 km',
        distanceLabel: '4.50 billion km',
        periodLabel: '165 Earth years',
        description: 'Neptune is a distant blue world with supersonic winds and dark storm systems. Its largest moon, Triton, orbits backward.'
      }
    ];

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x040814, 0.00145);

    const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 2200);
    camera.position.copy(defaultCamera);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.58;
    renderer.setClearColor(0x040814, 1);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.065;
    controls.target.copy(defaultTarget);
    controls.minDistance = 18;
    controls.maxDistance = 620;
    controls.maxPolarAngle = Math.PI * 0.78;

    const ambient = new THREE.AmbientLight(0xb8c7e6, 0.58);
    scene.add(ambient);

    const sunlight = new THREE.PointLight(0xffd28a, 9.2, 980, 1.15);
    sunlight.position.set(0, 0, 0);
    scene.add(sunlight);

    const fillLight = new THREE.HemisphereLight(0x67e8f9, 0x172554, 0.62);
    scene.add(fillLight);

    const cameraFill = new THREE.PointLight(0x9bdcff, 2.2, 760, 1.7);
    camera.add(cameraFill);
    scene.add(camera);

    function startCameraFlight(cameraPosition, targetPosition) {
      focusCamera = cameraPosition.clone();
      focusTarget = targetPosition.clone();
      cameraFlightActive = true;
    }

    function stopCameraFlight() {
      cameraFlightActive = false;
      focusCamera = null;
      focusTarget = null;
    }

    // Texture and sprite helpers
    function makeRadialTexture(inner, outer, size) {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      gradient.addColorStop(0, inner);
      gradient.addColorStop(0.42, inner);
      gradient.addColorStop(1, outer);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      return texture;
    }

    function makeRingTexture() {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      const gradient = ctx.createLinearGradient(0, 0, 512, 0);
      gradient.addColorStop(0.0, 'rgba(255,255,255,0)');
      gradient.addColorStop(0.16, 'rgba(242,220,160,0.38)');
      gradient.addColorStop(0.34, 'rgba(255,241,188,0.82)');
      gradient.addColorStop(0.48, 'rgba(255,255,255,0.18)');
      gradient.addColorStop(0.64, 'rgba(222,188,119,0.7)');
      gradient.addColorStop(0.86, 'rgba(242,220,160,0.26)');
      gradient.addColorStop(1.0, 'rgba(255,255,255,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 512, 64);
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      return texture;
    }

    async function canUseImageTexture(url) {
      if (!url) return false;
      if (textureCache.has(url)) return textureCache.get(url);
      if (url.includes('solarsystemscope.com/textures/download/')) {
        textureCache.set(url, false);
        return false;
      }
      try {
        const response = await fetch(url, { method: 'HEAD', mode: 'cors' });
        const contentType = response.headers.get('content-type') || '';
        const ok = response.ok && contentType.startsWith('image/');
        textureCache.set(url, ok);
        return ok;
      } catch (error) {
        textureCache.set(url, false);
        return false;
      }
    }

    async function applyExternalTexture(url, material, options) {
      const canUse = await canUseImageTexture(url);
      if (!canUse) return;
      loader.load(
        url,
        function(texture) {
          texture.colorSpace = THREE.SRGBColorSpace;
          if (options && options.repeat) texture.wrapS = THREE.RepeatWrapping;
          material.map = texture;
          material.needsUpdate = true;
        },
        undefined,
        function() {
          textureCache.set(url, false);
        }
      );
    }

    function makePlanetTexture(data) {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      const base = new THREE.Color(data.color);
      ctx.fillStyle = '#' + base.getHexString();
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let y = 0; y < canvas.height; y += 1) {
        const wave = Math.sin(y * 0.07 + data.distance) * 0.08;
        const shade = 0.82 + (y / canvas.height) * 0.28 + wave;
        ctx.fillStyle = 'rgba(' +
          Math.min(255, Math.floor(base.r * 255 * shade)) + ',' +
          Math.min(255, Math.floor(base.g * 255 * shade)) + ',' +
          Math.min(255, Math.floor(base.b * 255 * shade)) + ',0.42)';
        ctx.fillRect(0, y, canvas.width, 1);
      }

      const bands = data.radius > 3 ? 26 : 10;
      for (let i = 0; i < bands; i += 1) {
        const y = Math.random() * canvas.height;
        const height = data.radius > 3 ? 3 + Math.random() * 12 : 1 + Math.random() * 5;
        const alpha = data.radius > 3 ? 0.1 + Math.random() * 0.18 : 0.05 + Math.random() * 0.12;
        ctx.fillStyle = i % 2 === 0
          ? 'rgba(255,255,255,' + alpha + ')'
          : 'rgba(0,0,0,' + alpha + ')';
        ctx.fillRect(0, y, canvas.width, height);
      }

      if (data.name === 'Earth') {
        ctx.fillStyle = 'rgba(34,197,94,0.82)';
        for (let i = 0; i < 10; i += 1) {
          ctx.beginPath();
          ctx.ellipse(Math.random() * canvas.width, Math.random() * canvas.height, 18 + Math.random() * 52, 8 + Math.random() * 28, Math.random() * Math.PI, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = 'rgba(255,255,255,0.32)';
        for (let i = 0; i < 18; i += 1) {
          ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 18 + Math.random() * 70, 1 + Math.random() * 3);
        }
      }

      if (data.name === 'Mars') {
        ctx.fillStyle = 'rgba(80,22,16,0.22)';
        for (let i = 0; i < 32; i += 1) {
          ctx.beginPath();
          ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 3 + Math.random() * 12, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      return texture;
    }

    function makeGlowSprite(color, size, opacity) {
      const material = new THREE.SpriteMaterial({
        map: makeRadialTexture(color, 'rgba(0,0,0,0)', 256),
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
        opacity
      });
      const sprite = new THREE.Sprite(material);
      sprite.scale.set(size, size, 1);
      return sprite;
    }

    // Dense star field using points, no texture background
    function createStars() {
      const count = 5800;
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      for (let i = 0; i < count; i += 1) {
        const radius = 420 + Math.random() * 1180;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.cos(phi);
        const z = radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
        const warmth = Math.random();
        colors[i * 3] = 0.65 + warmth * 0.35;
        colors[i * 3 + 1] = 0.78 + warmth * 0.22;
        colors[i * 3 + 2] = 0.95 + Math.random() * 0.05;
      }
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      const material = new THREE.PointsMaterial({
        size: 1.35,
        sizeAttenuation: true,
        vertexColors: true,
        transparent: true,
        opacity: 0.96,
        depthWrite: false
      });
      const stars = new THREE.Points(geometry, material);
      scene.add(stars);
      return stars;
    }

    createStars();

    // Sun with layered additive glow for a bloom-like center
    const sunGroup = new THREE.Group();
    const sunMesh = new THREE.Mesh(
      new THREE.SphereGeometry(9.5, 64, 32),
      new THREE.MeshBasicMaterial({ color: 0xffb13d })
    );
    sunGroup.add(sunMesh);
    sunGroup.add(makeGlowSprite('rgba(255,214,120,0.98)', 40, 0.86));
    sunGroup.add(makeGlowSprite('rgba(255,158,64,0.54)', 86, 0.62));
    sunGroup.add(makeGlowSprite('rgba(34,211,238,0.22)', 150, 0.34));
    scene.add(sunGroup);

    // Planet factory
    function scaledRadius(realRadius) {
      return 1.8 + Math.log(realRadius + 1) * 5.2;
    }

    function scaledDistance(realDistance) {
      return 22 + Math.pow(realDistance, 0.62) * 33;
    }

    function createOrbitRing(distance) {
      const points = [];
      const segments = 240;
      for (let i = 0; i <= segments; i += 1) {
        const angle = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(angle) * distance, 0, Math.sin(angle) * distance));
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: 0x7dd3fc,
        transparent: true,
        opacity: 0.18,
        blending: THREE.AdditiveBlending
      });
      const ring = new THREE.Line(geometry, material);
      scene.add(ring);
      orbitRings.push(ring);
      return ring;
    }

    function createPlanet(data) {
      const group = new THREE.Group();
      const radius = scaledRadius(data.radius);
      const distance = scaledDistance(data.distance);
      const orbitRing = createOrbitRing(distance);

      const material = new THREE.MeshStandardMaterial({
        color: data.color,
        map: makePlanetTexture(data),
        roughness: 0.68,
        metalness: 0.01,
        emissive: data.color,
        emissiveIntensity: data.radius > 3 ? 0.18 : 0.12
      });

      applyExternalTexture(data.texturePath, material, { repeat: true });

      const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 24), material);
      mesh.rotation.z = THREE.MathUtils.degToRad(data.tilt);
      mesh.userData.planet = data;
      mesh.userData.parentGroup = group;
      group.add(mesh);

      const hitMesh = new THREE.Mesh(
        new THREE.SphereGeometry(Math.max(radius * 1.9, radius + 4), 24, 12),
        new THREE.MeshBasicMaterial({
          transparent: true,
          opacity: 0,
          depthWrite: false
        })
      );
      hitMesh.userData.planet = data;
      hitMesh.userData.parentGroup = group;
      group.add(hitMesh);

      const atmosphere = makeGlowSprite('rgba(103,232,249,0.56)', radius * 4.4, 0.32);
      group.add(atmosphere);

      if (data.name === 'Saturn') {
        const ringGeometry = new THREE.RingGeometry(radius * 1.45, radius * 2.55, 96);
        const ringMaterial = new THREE.MeshBasicMaterial({
          map: makeRingTexture(),
          color: 0xf6df9f,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.84,
          depthWrite: false
        });
        applyExternalTexture(data.ringTexturePath, ringMaterial);
        const rings = new THREE.Mesh(ringGeometry, ringMaterial);
        rings.rotation.x = Math.PI / 2;
        rings.rotation.z = THREE.MathUtils.degToRad(8);
        group.add(rings);
      }

      if (data.name === 'Earth') {
        const moonPivot = new THREE.Group();
        const moon = new THREE.Mesh(
          new THREE.SphereGeometry(0.95, 24, 12),
          new THREE.MeshStandardMaterial({ color: 0xdbeafe, roughness: 0.85, emissive: 0x94a3b8, emissiveIntensity: 0.16 })
        );
        moon.position.set(radius + 5.6, 0, 0);
        moonPivot.add(moon);
        group.add(moonPivot);
        group.userData.moonPivot = moonPivot;
      }

      scene.add(group);
      interactiveMeshes.push(hitMesh);

      const planetObject = {
        data,
        group,
        mesh,
        radius,
        distance,
        orbitRing,
        angle: Math.random() * Math.PI * 2,
        angularSpeed: 0.95 / Math.sqrt(Math.pow(data.distance, 3))
      };
      planetObjects.push(planetObject);
      return group;
    }

    planets.forEach(createPlanet);

    // UI logic
    function setPointer(event) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    function findPlanetFromEvent(event) {
      setPointer(event);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(interactiveMeshes, false);
      if (hits.length) return hits[0].object.userData.planet;

      const rect = renderer.domElement.getBoundingClientRect();
      let nearest = null;
      let nearestDistance = Infinity;
      planetObjects.forEach(function(item) {
        const projected = item.group.position.clone().project(camera);
        const x = (projected.x * 0.5 + 0.5) * rect.width + rect.left;
        const y = (-projected.y * 0.5 + 0.5) * rect.height + rect.top;
        const distance = Math.hypot(event.clientX - x, event.clientY - y);
        const threshold = Math.max(26, item.radius * 3.4);
        if (distance < threshold && distance < nearestDistance) {
          nearest = item.data;
          nearestDistance = distance;
        }
      });
      return nearest;
    }

    function showInfo(planet) {
      infoPanel.classList.add('open');
      infoPanel.innerHTML =
        '<p class="eyebrow">Selected body</p>' +
        '<h2>' + planet.name + '</h2>' +
        '<p class="type">' + planet.type + '</p>' +
        '<p class="description">' + planet.description + '</p>' +
        '<div class="stats">' +
          '<div class="stat"><div class="key">Diameter</div><div class="value">' + planet.diameter + '</div></div>' +
          '<div class="stat"><div class="key">Distance</div><div class="value">' + planet.distanceLabel + '</div></div>' +
          '<div class="stat"><div class="key">Orbit</div><div class="value">' + planet.periodLabel + '</div></div>' +
          '<div class="stat"><div class="key">Moons</div><div class="value">' + planet.moons + '</div></div>' +
        '</div>';
    }

    function clearSelection() {
      selectedPlanet = null;
      startCameraFlight(defaultCamera, defaultTarget);
      infoPanel.classList.remove('open');
      hoverLabel.style.display = 'none';
    }

    function focusPlanet(planet) {
      const targetObject = planetObjects.find(function(item) { return item.data.name === planet.name; });
      if (!targetObject) return;
      selectedPlanet = targetObject;
      hoverLabel.style.display = 'none';
      const planetPosition = targetObject.group.position.clone();
      const direction = planetPosition.clone().normalize();
      if (direction.lengthSq() < 0.01) direction.set(1, 0.35, 1).normalize();
      const nextCamera = planetPosition.clone()
        .add(direction.multiplyScalar(targetObject.radius * 6 + 18))
        .add(new THREE.Vector3(0, targetObject.radius * 2.1 + 7, 0));
      startCameraFlight(nextCamera, planetPosition);
      showInfo(planet);
    }

    function updateHover(event) {
      if (infoPanel.matches(':hover')) {
        hoverLabel.style.display = 'none';
        return;
      }
      const planet = findPlanetFromEvent(event);
      if (planet) {
        hoverLabel.textContent = planet.name;
        hoverLabel.style.left = event.clientX + 'px';
        hoverLabel.style.top = event.clientY + 'px';
        hoverLabel.style.display = 'block';
        renderer.domElement.style.cursor = 'pointer';
      } else {
        hoverLabel.style.display = 'none';
        renderer.domElement.style.cursor = 'grab';
      }
    }

    renderer.domElement.addEventListener('pointerdown', function(event) {
      pointerDownPosition = { x: event.clientX, y: event.clientY };
      pointerWasDragged = false;
    });
    renderer.domElement.addEventListener('pointermove', function(event) {
      if (pointerDownPosition) {
        const dragDistance = Math.hypot(event.clientX - pointerDownPosition.x, event.clientY - pointerDownPosition.y);
        if (dragDistance > 6) pointerWasDragged = true;
      }
      updateHover(event);
    });
    renderer.domElement.addEventListener('pointerup', function() {
      pointerDownPosition = null;
    });
    renderer.domElement.addEventListener('click', function(event) {
      if (pointerWasDragged) {
        pointerWasDragged = false;
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      const planet = findPlanetFromEvent(event);
      if (planet) {
        focusPlanet(planet);
      } else {
        clearSelection();
      }
    });
    renderer.domElement.addEventListener('dblclick', function(event) {
      const planet = findPlanetFromEvent(event);
      if (planet) focusPlanet(planet);
    });
    controls.addEventListener('start', stopCameraFlight);

    speedInput.addEventListener('input', function(event) {
      speedMultiplier = Number(event.target.value);
      speedValue.textContent = speedMultiplier.toFixed(1) + 'x';
    });

    toggleRingsButton.addEventListener('click', function() {
      orbitRingsVisible = !orbitRingsVisible;
      orbitRings.forEach(function(ring) { ring.visible = orbitRingsVisible; });
      toggleRingsButton.textContent = orbitRingsVisible ? 'Hide rings' : 'Show rings';
    });

    // Resize handling
    window.addEventListener('resize', function() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Animation loop
    function animate() {
      const delta = clock.getDelta();
      simulationTime += delta * speedMultiplier;

      sunMesh.rotation.y += delta * 0.08;

      planetObjects.forEach(function(item) {
        const angle = item.angle + simulationTime * item.angularSpeed;
        item.group.position.set(
          Math.cos(angle) * item.distance,
          0,
          Math.sin(angle) * item.distance
        );
        item.mesh.rotation.y += delta * speedMultiplier * 0.18;
        if (item.group.userData.moonPivot) {
          item.group.userData.moonPivot.rotation.y = simulationTime * 2.1;
        }
      });

      if (cameraFlightActive && selectedPlanet && focusTarget) {
        focusTarget.copy(selectedPlanet.group.position);
        const direction = selectedPlanet.group.position.clone().normalize();
        if (direction.lengthSq() < 0.01) direction.set(1, 0.35, 1).normalize();
        focusCamera = selectedPlanet.group.position.clone()
          .add(direction.multiplyScalar(selectedPlanet.radius * 6 + 18))
          .add(new THREE.Vector3(0, selectedPlanet.radius * 2.1 + 7, 0));
      }

      if (cameraFlightActive && focusCamera && focusTarget) {
        camera.position.lerp(focusCamera, 0.045);
        controls.target.lerp(focusTarget, 0.06);
        if (camera.position.distanceTo(focusCamera) < 0.18 && controls.target.distanceTo(focusTarget) < 0.18) {
          stopCameraFlight();
        }
      }

      controls.update();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }

    animate();
  </script>
</body>
</html>`;

export default function SpaceSimulator() {
  useEffect(() => {
    const chrome = Array.from(document.querySelectorAll<HTMLElement>('header, footer'));
    const previous = chrome.map((element) => ({
      element,
      ariaHidden: element.getAttribute('aria-hidden'),
      inert: element.inert,
    }));
    const previousOverflow = document.body.style.overflow;

    chrome.forEach((element) => {
      element.setAttribute('aria-hidden', 'true');
      element.inert = true;
    });
    document.body.style.overflow = 'hidden';

    return () => {
      previous.forEach(({ element, ariaHidden, inert }) => {
        if (ariaHidden === null) {
          element.removeAttribute('aria-hidden');
        } else {
          element.setAttribute('aria-hidden', ariaHidden);
        }
        element.inert = inert;
      });
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div
      aria-label="Solar System simulator"
      className="bg-black"
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: '#02040a' }}
    >
      <iframe
        title="Solar System"
        srcDoc={spaceSimulatorHtml}
        style={{ display: 'block', width: '100%', height: '100%', border: 0 }}
      />
    </div>
  );
}
