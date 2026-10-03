import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const COLORS = {
  amber: 0xf2a84b,
  gold: 0xd98a32,
  mint: 0x8be0c0,
  cyan: 0x70d7e8,
  cream: 0xf1ede4,
  steel: 0x53675d,
  steelLight: 0x8d9b91,
  concrete: 0x26342c,
  deep: 0x0a0d0b,
  panel: 0x101914,
  rose: 0xfb7185,
};

const STORY_STEPS = [
  { label: 'FIELD INPUTS', detail: 'Fragmented site data enters the twin.', target: 'field-inputs' },
  { label: 'AI INGESTION', detail: 'Reports and schedule exports become structured signals.', target: 'ai' },
  { label: 'FUZZY MATCHING', detail: 'Different field language is reconciled.', target: 'smart-link' },
  { label: 'L5/L6 LINK', detail: 'The update maps to an executable activity.', target: 'schedule' },
  { label: 'SCHEDULE UPDATE', detail: 'Validated actuals flow back to PMIS.', target: 'pmis' },
  { label: 'VERIFIED PROGRESS', detail: 'The physical workfront reflects the update.', target: 'pipeline' },
  { label: 'RISK ANALYTICS', detail: 'Progress becomes a forward-looking signal.', target: 'risk' },
  { label: 'PROJECT KNOWLEDGE', detail: 'Execution memory strengthens future projects.', target: 'knowledge' },
];

function makeMaterial(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.48,
    metalness: 0.55,
    ...options,
  });
}

function makeBox(width, height, depth, material, position = [0, 0, 0]) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function makeCylinderBetween(start, end, radius, material, segments = 12) {
  const from = new THREE.Vector3(...start);
  const to = new THREE.Vector3(...end);
  const direction = to.clone().sub(from);
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, direction.length(), segments),
    material,
  );
  mesh.position.copy(from).add(to).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.normalize(),
  );
  mesh.castShadow = true;
  return mesh;
}

function addTextSprite(scene, lines, position, color = '#F1EDE4', scale = 1) {
  const textLines = Array.isArray(lines) ? lines : [lines];
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = Math.max(80, textLines.length * 48 + 24);
  const context = canvas.getContext('2d');
  if (!context) return null;

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.font = '700 28px "JetBrains Mono", monospace';
  context.textBaseline = 'middle';
  context.fillStyle = color;
  textLines.forEach((line, index) => {
    context.fillText(line, 18, 34 + index * 44);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    }),
  );
  sprite.position.set(...position);
  sprite.scale.set((canvas.width / canvas.height) * 2.8 * scale, 2.8 * scale, 1);
  sprite.userData.disposeTexture = () => {
    texture.dispose();
    sprite.material.dispose();
  };
  scene.add(sprite);
  return sprite;
}

function addPanel(scene, position, size, accent = COLORS.gold, options = {}) {
  const group = new THREE.Group();
  group.position.set(...position);
  const panel = makeBox(
    size[0],
    size[1],
    size[2],
    new THREE.MeshStandardMaterial({
      color: COLORS.panel,
      emissive: accent,
      emissiveIntensity: options.emissiveIntensity ?? 0.06,
      roughness: 0.32,
      metalness: 0.52,
      transparent: true,
      opacity: options.opacity ?? 0.92,
    }),
  );
  group.add(panel);
  const edge = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(...size)),
    new THREE.LineBasicMaterial({
      color: accent,
      transparent: true,
      opacity: options.edgeOpacity ?? 0.68,
    }),
  );
  group.add(edge);
  scene.add(group);
  return group;
}

function addFlow(scene, points, color, speed, flowParticles) {
  const curve = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point)));
  const tube = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 32, 0.025, 6, false),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.52,
      blending: THREE.AdditiveBlending,
    }),
  );
  scene.add(tube);

  for (let index = 0; index < 3; index += 1) {
    const particle = new THREE.Mesh(
      new THREE.SphereGeometry(0.105, 8, 8),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
      }),
    );
    scene.add(particle);
    flowParticles.push({ curve, particle, offset: index / 3, speed });
  }
}

function addLeaderLine(scene, start, end, color) {
  const geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(...start),
    new THREE.Vector3(...end),
  ]);
  const line = new THREE.Line(
    geometry,
    new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.32,
    }),
  );
  line.userData.baseOpacity = 0.32;
  scene.add(line);
  return line;
}

function addInteractive(interactiveRoots, root, node) {
  root.userData.siteflowNode = node;
  interactiveRoots.push(root);
  return root;
}

function makeWorker(materials, position, accent = COLORS.amber) {
  const group = new THREE.Group();
  group.position.set(...position);
  const legs = makeCylinderBetween([0, 0, 0], [0, 0.55, 0], 0.12, materials.concrete, 8);
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.15, 0.7, 8),
    makeMaterial(accent, { roughness: 0.58, metalness: 0.28 }),
  );
  body.position.y = 0.82;
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 10, 10),
    makeMaterial(0xc98766, { roughness: 0.8, metalness: 0.05 }),
  );
  head.position.y = 1.35;
  const helmet = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2),
    makeMaterial(COLORS.amber, { roughness: 0.38, metalness: 0.38 }),
  );
  helmet.position.y = 1.44;
  group.add(legs, body, head, helmet);
  return group;
}

function makeTank(materials, position, scale = 1) {
  const group = new THREE.Group();
  group.position.set(...position);
  group.scale.setScalar(scale);
  group.add(new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 2.7, 16), materials.steelLight));
  const top = new THREE.Mesh(new THREE.SphereGeometry(0.95, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), materials.steel);
  top.position.y = 1.35;
  group.add(top);
  group.add(makeCylinderBetween([0, -1.35, 0], [0, -1.75, 0], 0.1, materials.glowCyan, 8));
  [-0.72, 0.72].forEach((x) => {
    group.add(makeCylinderBetween([x, -1.35, -0.72], [x, 1.5, -0.72], 0.045, materials.amber, 6));
  });
  group.add(makeBox(2.35, 0.08, 0.08, materials.amber, [0, 0.55, -0.98]));
  return group;
}

function makeTruck(materials, position, accent = COLORS.cyan) {
  const group = new THREE.Group();
  group.position.set(...position);
  group.add(makeBox(1.8, 0.5, 0.9, materials.steel, [0, 0.55, 0]));
  group.add(makeBox(0.72, 0.62, 0.82, makeMaterial(accent, { roughness: 0.42, metalness: 0.4 }), [0.62, 0.92, 0]));
  [-0.62, 0.62].forEach((x) => {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.12, 10), materials.dark);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, 0.27, 0.48);
    group.add(wheel);
    const rearWheel = wheel.clone();
    rearWheel.position.z = -0.48;
    group.add(rearWheel);
  });
  return group;
}

function makeIndustrialBuilding(materials, position, options = {}) {
  const {
    width = 7,
    height = 6,
    depth = 5,
    floors = 3,
    accent = materials.steelLight,
    openFrame = false,
  } = options;
  const group = new THREE.Group();
  group.position.set(...position);
  const glass = materials.glass;
  const floorHeight = height / floors;

  group.add(makeBox(width + 0.5, 0.28, depth + 0.5, materials.concrete, [0, 0.14, 0]));
  for (let floor = 0; floor <= floors; floor += 1) {
    const y = floor * floorHeight;
    group.add(makeBox(width + 0.2, 0.16, depth + 0.2, materials.steel, [0, y, 0]));
  }
  [-width / 2 + 0.24, width / 2 - 0.24].forEach((x) => {
    [-depth / 2 + 0.24, depth / 2 - 0.24].forEach((z) => {
      group.add(makeBox(0.22, height, 0.22, materials.steel, [x, height / 2, z]));
    });
  });

  if (!openFrame) {
    for (let floor = 0; floor < floors; floor += 1) {
      const y = floor * floorHeight + floorHeight * 0.54;
      [-depth / 2 - 0.015, depth / 2 + 0.015].forEach((z) => {
        group.add(makeBox(width - 0.75, floorHeight * 0.42, 0.04, glass, [0, y, z]));
      });
    }
  } else {
    for (let floor = 1; floor < floors; floor += 1) {
      const y = floor * floorHeight;
      group.add(makeBox(width - 0.5, 0.12, depth - 0.5, materials.steelLight, [0, y, 0]));
    }
  }

  group.add(makeBox(width + 0.7, 0.24, depth + 0.7, accent, [0, height + 0.12, 0]));
  group.add(makeBox(width * 0.36, 0.7, 0.08, materials.dark, [0, 0.55, depth / 2 + 0.04]));
  return group;
}

function makeWarehouse(materials, position) {
  const group = makeIndustrialBuilding(materials, position, {
    width: 8.5,
    height: 4.8,
    depth: 6.2,
    floors: 2,
    accent: materials.steelLight,
  });
  group.add(makeBox(2.5, 2.2, 0.08, materials.dark, [0, 1.2, 3.14]));
  [-2.5, 0, 2.5].forEach((x) => {
    group.add(makeBox(0.12, 0.16, 6.6, materials.amber, [x, 4.95, 0]));
  });
  return group;
}

function makeCar(materials, position, accent = COLORS.cyan) {
  const group = new THREE.Group();
  group.position.set(...position);
  group.add(makeBox(1.7, 0.38, 0.88, makeMaterial(accent, { roughness: 0.42, metalness: 0.45 }), [0, 0.48, 0]));
  group.add(makeBox(0.85, 0.42, 0.72, materials.glass, [-0.05, 0.82, 0]));
  group.add(makeBox(0.24, 0.18, 0.04, materials.glowAmber, [0.86, 0.52, 0.2]));
  group.add(makeBox(0.24, 0.18, 0.04, materials.glowAmber, [0.86, 0.52, -0.2]));
  [-0.58, 0.58].forEach((x) => {
    [-0.43, 0.43].forEach((z) => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.12, 10), materials.dark);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.22, z);
      group.add(wheel);
    });
  });
  return group;
}

function makeExcavator(materials, position) {
  const group = new THREE.Group();
  group.position.set(...position);
  group.add(makeBox(2.2, 0.35, 1.25, materials.dark, [0, 0.3, 0]));
  group.add(makeBox(1.25, 0.8, 1.05, materials.glowAmber, [-0.25, 0.82, 0]));
  const arm = new THREE.Group();
  arm.position.set(0.55, 1.15, 0);
  arm.rotation.z = -0.42;
  arm.add(makeBox(2.2, 0.2, 0.22, materials.amber, [0.95, 0, 0]));
  arm.add(makeBox(1.2, 0.18, 0.2, materials.amber, [2.1, -0.65, 0]));
  arm.add(makeBox(0.65, 0.16, 0.42, materials.steel, [2.55, -1.15, 0]));
  group.add(arm);
  return group;
}

function makeBulldozer(materials, position) {
  const group = new THREE.Group();
  group.position.set(...position);
  group.add(makeBox(1.8, 0.58, 1.2, materials.amber, [0, 0.55, 0]));
  group.add(makeBox(0.85, 0.64, 0.92, materials.glass, [-0.2, 1.02, 0]));
  group.add(makeBox(0.16, 0.95, 1.75, materials.steelLight, [1.15, 0.22, 0]));
  [-0.58, 0.58].forEach((z) => {
    group.add(makeBox(2.2, 0.25, 0.2, materials.dark, [0, 0.25, z]));
  });
  return group;
}

function makeForklift(materials, position) {
  const group = new THREE.Group();
  group.position.set(...position);
  group.add(makeBox(0.9, 0.5, 0.72, materials.amber, [0, 0.45, 0]));
  group.add(makeBox(0.12, 1.8, 0.12, materials.steelLight, [0.52, 1.1, 0]));
  group.add(makeBox(0.9, 0.08, 0.08, materials.steelLight, [0.92, 0.32, 0]));
  [-0.3, 0.3].forEach((x) => {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.1, 8), materials.dark);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, 0.2, 0.38);
    group.add(wheel);
    const rearWheel = wheel.clone();
    rearWheel.position.z = -0.38;
    group.add(rearWheel);
  });
  return group;
}

function makeTankerTruck(materials, position) {
  const group = makeTruck(materials, position, COLORS.cyan);
  group.add(new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 1.7, 14), materials.steelLight));
  const tank = group.children[group.children.length - 1];
  tank.rotation.z = Math.PI / 2;
  tank.position.set(-0.3, 1.05, 0);
  return group;
}

function makeDumpTruck(materials, position) {
  const group = makeTruck(materials, position, COLORS.amber);
  group.add(makeBox(1.55, 0.55, 0.9, materials.amber, [-0.45, 1.05, 0]));
  const bed = group.children[group.children.length - 1];
  bed.rotation.z = -0.12;
  return group;
}

function makeConcreteMixer(materials, position) {
  const group = makeTruck(materials, position, COLORS.mint);
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 1.2, 12), materials.concreteLight);
  drum.rotation.z = Math.PI / 2;
  drum.position.set(-0.35, 1.15, 0);
  group.add(drum);
  return group;
}

function makeTree(materials, position, scale = 1) {
  const group = new THREE.Group();
  group.position.set(...position);
  group.scale.setScalar(scale);
  group.add(makeCylinderBetween([0, 0, 0], [0, 1.2, 0], 0.12, materials.amber, 8));
  group.add(new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.9, 8), materials.vegetation));
  return group;
}

export function ConstructionTwin3D({
  highlightedTarget = null,
  onNodeHover = () => {},
  isReducedMotion = false,
}) {
  const mountRef = useRef(null);
  const highlightedTargetRef = useRef(highlightedTarget);
  const reducedMotionRef = useRef(isReducedMotion);
  const [isLoaded, setIsLoaded] = useState(false);
  const [has3dError, setHas3dError] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [storyStep, setStoryStep] = useState(0);
  const storyStepRef = useRef(0);

  useEffect(() => {
    highlightedTargetRef.current = highlightedTarget;
  }, [highlightedTarget]);

  useEffect(() => {
    reducedMotionRef.current = isReducedMotion;
  }, [isReducedMotion]);

  useEffect(() => {
    storyStepRef.current = storyStep;
  }, [storyStep]);

  useEffect(() => {
    const updateStoryStep = () => {
      const scrollRange = Math.max(window.innerHeight * 1.15, 1);
      const progress = Math.min(1, Math.max(0, window.scrollY / scrollRange));
      const nextStep = Math.round(progress * (STORY_STEPS.length - 1));
      setStoryStep((currentStep) => currentStep === nextStep ? currentStep : nextStep);
    };

    updateStoryStep();
    window.addEventListener('scroll', updateStoryStep, { passive: true });
    window.addEventListener('resize', updateStoryStep);
    return () => {
      window.removeEventListener('scroll', updateStoryStep);
      window.removeEventListener('resize', updateStoryStep);
    };
  }, []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return undefined;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;
    const isCompact = width < 640;
    const capabilityCanvas = document.createElement('canvas');
    const webglContext =
      capabilityCanvas.getContext('webgl2') || capabilityCanvas.getContext('webgl');
    if (!webglContext) {
      setHas3dError(true);
      setIsLoaded(true);
      return undefined;
    }

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0d0b, 0.018);
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 180);
    camera.position.set(24, 15, 29);
    camera.lookAt(0, 4.3, 0);

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setHas3dError(true);
      setIsLoaded(true);
      return undefined;
    }
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isCompact ? 1.2 : 1.7));
    renderer.shadowMap.enabled = !isCompact;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enablePan = !isCompact;
    controls.panSpeed = 0.35;
    controls.rotateSpeed = 0.38;
    controls.zoomSpeed = 0.55;
    controls.minDistance = 19;
    controls.maxDistance = 42;
    controls.minPolarAngle = Math.PI * 0.2;
    controls.maxPolarAngle = Math.PI * 0.48;
    controls.target.set(0, 4.2, 0);

    const ambient = new THREE.HemisphereLight(0x9acfc2, 0x07100b, 1.8);
    scene.add(ambient);
    const keyLight = new THREE.DirectionalLight(COLORS.amber, 3.2);
    keyLight.position.set(12, 26, 20);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    scene.add(keyLight);
    const cyanLight = new THREE.PointLight(COLORS.cyan, 2.4, 34);
    cyanLight.position.set(-5, 8, 4);
    scene.add(cyanLight);
    const mintLight = new THREE.PointLight(COLORS.mint, 1.7, 28);
    mintLight.position.set(10, 5, -9);
    scene.add(mintLight);
    const rimLight = new THREE.DirectionalLight(COLORS.cyan, 0.85);
    rimLight.position.set(-18, 12, -20);
    scene.add(rimLight);

    const materials = {
      concrete: makeMaterial(COLORS.concrete, { roughness: 0.9, metalness: 0.1 }),
      concreteLight: makeMaterial(0x3b4d42, { roughness: 0.78, metalness: 0.16 }),
      steel: makeMaterial(COLORS.steel, { roughness: 0.38, metalness: 0.85 }),
      steelLight: makeMaterial(COLORS.steelLight, { roughness: 0.32, metalness: 0.7 }),
      amber: makeMaterial(COLORS.gold, { roughness: 0.38, metalness: 0.72 }),
      glowAmber: makeMaterial(COLORS.amber, {
        emissive: COLORS.gold,
        emissiveIntensity: 1.1,
        roughness: 0.22,
        metalness: 0.42,
      }),
      glowMint: makeMaterial(COLORS.mint, {
        emissive: COLORS.mint,
        emissiveIntensity: 1.15,
        roughness: 0.2,
        metalness: 0.32,
      }),
      glowCyan: makeMaterial(COLORS.cyan, {
        emissive: COLORS.cyan,
        emissiveIntensity: 1.2,
        roughness: 0.22,
        metalness: 0.3,
      }),
      dark: makeMaterial(COLORS.deep, { roughness: 1, metalness: 0 }),
      asphalt: makeMaterial(0x161f1b, { roughness: 0.96, metalness: 0.04 }),
      dirt: makeMaterial(0x3a3125, { roughness: 1, metalness: 0 }),
      glass: makeMaterial(0x7fa9a2, {
        emissive: 0x17372f,
        emissiveIntensity: 0.18,
        roughness: 0.18,
        metalness: 0.28,
        transparent: true,
        opacity: 0.46,
      }),
      vegetation: makeMaterial(0x2c5944, { roughness: 0.94, metalness: 0.02 }),
    };

    const interactiveRoots = [];
    const flowParticles = [];
    const animatedObjects = [];
    const disciplineLines = new Map();
    const parallaxTarget = { x: 0, y: 0 };
    const parallaxCurrent = { x: 0, y: 0 };
    const linkedHighlightIds = {
      schedule: ['schedule', 'pipeline'],
      pipeline: ['pipeline', 'schedule', 'smart-link'],
      'smart-link': ['smart-link', 'pipeline'],
      pmis: ['pmis', 'pipeline'],
    };
    const sceneGroup = new THREE.Group();
    scene.add(sceneGroup);

    const ground = makeBox(40, 0.28, 25, materials.dark, [0, -0.3, 0]);
    ground.receiveShadow = true;
    sceneGroup.add(ground);
    const grid = new THREE.GridHelper(40, 40, COLORS.gold, 0x16382a);
    grid.position.y = -0.13;
    grid.material.transparent = true;
    grid.material.opacity = 0.48;
    sceneGroup.add(grid);

    // Grounded campus environment: roads, buildings, boundaries, and surrounding depth.
    const accessRoad = makeBox(42, 0.08, 3.5, materials.asphalt, [0, -0.12, 8.2]);
    const internalRoad = makeBox(3.5, 0.08, 23, materials.asphalt, [-11, -0.12, -1.2]);
    const parkingArea = makeBox(7.5, 0.06, 5.2, materials.asphalt, [-7.6, -0.1, 7.2]);
    sceneGroup.add(accessRoad, internalRoad, parkingArea);
    for (let x = -18; x <= 18; x += 3) {
      sceneGroup.add(makeBox(1.25, 0.025, 0.08, materials.concreteLight, [x, -0.06, 8.2]));
    }
    for (let z = 5.5; z <= 9; z += 1.15) {
      sceneGroup.add(makeBox(0.08, 0.025, 0.72, materials.concreteLight, [-11, -0.05, z]));
    }
    [-10.2, -8.8, -7.4, -6].forEach((x) => {
      sceneGroup.add(makeBox(0.08, 0.025, 4.5, materials.concreteLight, [x, -0.05, 7.2]));
    });
    sceneGroup.add(makeBox(42, 0.05, 0.08, materials.amber, [0, -0.04, -10.8]));
    sceneGroup.add(makeBox(42, 0.05, 0.08, materials.amber, [0, -0.04, 11.1]));

    const processBuilding = makeIndustrialBuilding(materials, [-1.6, 0, -8.2], {
      width: 8.4,
      height: 8.2,
      depth: 5.8,
      floors: 4,
      openFrame: true,
      accent: materials.glowAmber,
    });
    const warehouse = makeWarehouse(materials, [10.6, 0, -8.5]);
    const officeBuilding = makeIndustrialBuilding(materials, [-10.8, 0, -7.2], {
      width: 5.8,
      height: 5.2,
      depth: 4.6,
      floors: 3,
      accent: materials.steelLight,
    });
    const utilityBuilding = makeIndustrialBuilding(materials, [17.4, 0, -5.7], {
      width: 3.6,
      height: 3.2,
      depth: 3.2,
      floors: 2,
      accent: materials.amber,
    });
    sceneGroup.add(processBuilding, warehouse, officeBuilding, utilityBuilding);
    sceneGroup.add(
      makeCylinderBetween([0.2, 2.1, -4.8], [0.2, 2.1, -6.8], 0.18, materials.steel, 12),
      makeCylinderBetween([0.2, 2.1, -6.8], [1.2, 2.1, -8.2], 0.18, materials.steel, 12),
    );

    [-18, -14.5, 14.5, 18].forEach((x, index) => {
      sceneGroup.add(makeTree(materials, [x, 0, index % 2 ? -8.5 : 9.6], index % 2 ? 0.8 : 1.1));
    });
    [-17, -13.5, 13.5, 17].forEach((x) => {
      sceneGroup.add(makeBox(0.08, 2.2, 0.08, materials.steelLight, [x, 1.1, 10.7]));
    });
    sceneGroup.add(makeBox(34, 0.08, 0.08, materials.steelLight, [0, 2.05, 10.7]));

    const corridor = makeBox(37, 0.12, 1.8, materials.concrete, [0, -0.08, 1.3]);
    sceneGroup.add(corridor);
    addTextSprite(scene, 'EXECUTION CORRIDOR 04', [-1.8, 0.25, 2.45], '#9B9B91', 0.48);

    // Fragmented field inputs.
    const inputDefinitions = [
      ['DAILY REPORT', 'FIELD INPUT', COLORS.amber, 8.4],
      ['SPREADSHEET', 'QUANTITIES', COLORS.cyan, 6.2],
      ['SITE DIARY', 'SUPERVISOR NOTE', COLORS.mint, 4.0],
      ['PDF / SCAN', 'DOCUMENT OCR', COLORS.amber, 1.8],
      ['PRIMAVERA', 'BASELINE PLAN', COLORS.cyan, -0.4],
    ];
    const inputGroups = [];
    inputDefinitions.forEach(([title, subtitle, color, y], index) => {
      const group = addPanel(scene, [-13.4, y, -1.8], [3.55, 1.15, 0.12], color);
      group.userData.basePosition = group.position.clone();
      group.add(
        makeBox(0.1, 0.56, 0.15, makeMaterial(color, {
          emissive: color,
          emissiveIntensity: 0.8,
          metalness: 0.25,
        }), [-1.56, 0, 0.1]),
      );
      addTextSprite(scene, [title, subtitle], [-14.85, y, -1.68], index % 2 ? '#70D7E8' : '#F2A84B', 0.34);
      inputGroups.push(group);
    });
    const fieldInputNode = new THREE.Group();
    inputGroups.forEach((group) => fieldInputNode.add(group));
    addInteractive(interactiveRoots, fieldInputNode, {
      id: 'field-inputs',
      title: 'Fragmented field inputs',
      summary: 'Reports, spreadsheets, diaries, scans, and schedule baselines enter one intelligence layer.',
      metrics: ['5 input types', 'OCR + extraction', 'Single project context'],
    });
    sceneGroup.add(fieldInputNode);

    // SiteFlow AI core.
    const aiGroup = new THREE.Group();
    aiGroup.position.set(-4.5, 5.4, -0.4);
    const aiCore = new THREE.Mesh(new THREE.IcosahedronGeometry(1.45, 2), materials.glowCyan);
    aiCore.scale.set(1, 1.18, 1);
    aiGroup.add(aiCore);
    const aiWire = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.75, 1),
      new THREE.MeshBasicMaterial({
        color: COLORS.cyan,
        wireframe: true,
        transparent: true,
        opacity: 0.7,
      }),
    );
    aiGroup.add(aiWire);
    [1.95, 2.35, 2.7].forEach((radius, index) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.025, 6, 48),
        new THREE.MeshBasicMaterial({
          color: index === 1 ? COLORS.amber : COLORS.mint,
          transparent: true,
          opacity: 0.6,
        }),
      );
      ring.rotation.x = index * 0.5;
      ring.rotation.z = index * 0.65;
      aiGroup.add(ring);
      animatedObjects.push({ object: ring, axis: index % 2 ? 'z' : 'y', speed: 0.35 + index * 0.12 });
    });
    aiGroup.add(new THREE.PointLight(COLORS.cyan, 3.5, 9));
    addTextSprite(scene, ['SITEFLOW AI', 'INGESTION  →  MATCH  →  VALIDATE'], [-6.3, 8.5, -0.4], '#70D7E8', 0.4);
    addInteractive(interactiveRoots, aiGroup, {
      id: 'ai',
      title: 'SiteFlow AI',
      summary: 'The intelligence core extracts meaning, reconciles terminology, matches L5/L6 work, and routes uncertain updates for validation.',
      metrics: ['Ingestion', 'Fuzzy matching', 'Validation'],
    });
    sceneGroup.add(aiGroup);

    // Time Agent supervisor and unstructured-to-structured transformation.
    const agentGroup = new THREE.Group();
    agentGroup.position.set(-1.2, 1.05, -5.7);
    agentGroup.add(makeWorker(materials, [0, 0, 0], COLORS.cyan));
    const phone = makeBox(0.3, 0.6, 0.12, materials.glowCyan, [0.38, 0.95, 0.08]);
    agentGroup.add(phone);
    addPanel(scene, [-1.2, 3.15, -5.7], [4.1, 1.1, 0.1], COLORS.cyan);
    addTextSprite(scene, ['TIME AGENT', '"Pipe spool erected at 3 PM"'], [-2.92, 3.15, -5.62], '#F1EDE4', 0.31);
    addTextSprite(scene, ['→  L6 ERECT LINE 24', '09:00 — 15:00  ·  92%'], [0.75, 3.18, -5.62], '#8BE0C0', 0.3);
    addInteractive(interactiveRoots, agentGroup, {
      id: 'time-agent',
      title: 'Time Agent',
      summary: 'A supervisor voice or phone update becomes a schedule-linked activity with structured start, finish, and confidence.',
      metrics: ['Activity: Erect Line 24', 'Actual: 09:00 → 15:00', 'Confidence: 92%'],
    });
    sceneGroup.add(agentGroup);

    // Hierarchical schedule layers above the physical site.
    const scheduleGroup = new THREE.Group();
    scheduleGroup.position.set(1.2, 0, -1.4);
    const scheduleLayers = [
      ['L1', 'MACRO MILESTONES', 0x5e8072],
      ['L2', 'MAJOR PACKAGES', 0x668d7f],
      ['L3', 'WORK PACKAGES', 0x76a694],
      ['L4', 'SUB PACKAGES', 0x85bda4],
      ['L5/L6', 'EXECUTABLE ACTIVITIES', COLORS.amber],
    ];
    scheduleLayers.forEach(([level, label, color], index) => {
      const y = 7.2 + index * 0.72;
      const layer = addPanel(
        scene,
        [0, y, 0],
        [11.4 - index * 0.8, 0.42, 0.08],
        color,
        {
          opacity: 0.3 + index * 0.07,
          edgeOpacity: 0.42 + index * 0.07,
          emissiveIntensity: 0.035 + index * 0.015,
        },
      );
      layer.add(makeBox(0.08, 0.2, 0.12, makeMaterial(color, {
        emissive: color,
        emissiveIntensity: 0.8,
      }), [-(5.2 - index * 0.35), 0, 0.08]));
      addTextSprite(scene, [`${level}  ${label}`], [-4.7 + index * 0.35, y, -1.3], index === 4 ? '#F2A84B' : '#9B9B91', 0.27);
      scheduleGroup.add(layer);
    });
    const activityBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 12), materials.glowAmber);
    activityBeacon.position.set(5.6, 10.3, 0);
    scheduleGroup.add(activityBeacon);
    addTextSprite(scene, ['L6 — ERECT LINE 24', 'LINKED TO PIPE SPOOL'], [5.7, 11.15, -1.3], '#F2A84B', 0.3);
    disciplineLines.set('schedule', addLeaderLine(scene, [5.6, 10.05, -0.05], [9.6, 2.05, 2.8], COLORS.amber));
    addInteractive(interactiveRoots, scheduleGroup, {
      id: 'schedule',
      title: 'L1–L6 schedule layers',
      summary: 'The baseline descends from project milestones to executable L5/L6 work and links directly to physical construction.',
      metrics: ['L1 macro plan', 'L5/L6 field activity', 'Live activity beacon'],
    });
    sceneGroup.add(scheduleGroup);

    // Construction site with six discipline zones.
    const siteGroup = new THREE.Group();
    sceneGroup.add(siteGroup);

    const civilGroup = new THREE.Group();
    civilGroup.position.set(5.2, 0, -3.2);
    civilGroup.add(makeBox(6.2, 0.42, 4.1, materials.concrete, [0, 0.2, 0]));
    [-2.3, 0, 2.3].forEach((x) => {
      [-1.35, 1.35].forEach((z) => {
        civilGroup.add(makeBox(0.35, 3.2, 0.35, materials.concreteLight, [x, 1.8, z]));
      });
    });
    civilGroup.add(makeBox(5.2, 0.3, 0.3, materials.steel, [0, 3.35, -1.35]));
    civilGroup.add(makeBox(5.2, 0.3, 0.3, materials.steel, [0, 3.35, 1.35]));
    [-1.8, 1.8].forEach((x) => {
      civilGroup.add(makeCylinderBetween([x, 0.45, -1.8], [x, 3.2, -1.8], 0.045, materials.steelLight, 6));
      civilGroup.add(makeCylinderBetween([x - 0.75, 1.35, -1.8], [x + 0.75, 1.35, -1.8], 0.04, materials.steelLight, 6));
      civilGroup.add(makeCylinderBetween([x - 0.75, 2.35, -1.8], [x + 0.75, 2.35, -1.8], 0.04, materials.steelLight, 6));
    });
    addTextSprite(scene, 'CIVIL', [4.1, 4.25, -3.2], '#9B9B91', 0.35);
    disciplineLines.set('civil', addLeaderLine(scene, [5.2, 3.25, -3.2], [4.1, 4.05, -3.2], COLORS.steelLight));
    addInteractive(interactiveRoots, civilGroup, {
      id: 'civil',
      title: 'Civil work zone',
      summary: 'Foundations, structural columns, slabs, and access infrastructure form the physical project baseline.',
      metrics: ['Foundations', 'Structure', 'Access'],
    });
    siteGroup.add(civilGroup);

    const pipingGroup = new THREE.Group();
    pipingGroup.position.set(8.2, 0, 2.8);
    pipingGroup.add(makeBox(8.2, 0.35, 3.1, materials.concrete, [0, 0.18, 0]));
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 8.2, 20), materials.steel);
    pipe.rotation.z = Math.PI / 2;
    pipe.position.y = 1.12;
    pipingGroup.add(pipe);
    const weld = new THREE.Mesh(new THREE.CylinderGeometry(0.53, 0.53, 0.78, 20), materials.glowAmber);
    weld.rotation.z = Math.PI / 2;
    weld.position.set(1.4, 1.12, 0);
    pipingGroup.add(weld);
    [-2.8, 0, 2.8].forEach((x) => {
      const flange = new THREE.Mesh(new THREE.CylinderGeometry(0.64, 0.64, 0.22, 20), materials.amber);
      flange.rotation.z = Math.PI / 2;
      flange.position.set(x, 1.12, 0);
      pipingGroup.add(flange);
    });
    pipingGroup.add(makeCylinderBetween([3.35, 1.1, 0], [3.35, 4.2, 0], 0.44, materials.steel, 20));
    [-3, 0, 3].forEach((x) => {
      pipingGroup.add(makeCylinderBetween([x, 0.35, -1.1], [x, 2.9, -1.1], 0.08, materials.steelLight, 8));
      pipingGroup.add(makeCylinderBetween([x, 0.35, 1.1], [x, 2.9, 1.1], 0.08, materials.steelLight, 8));
    });
    pipingGroup.add(makeCylinderBetween([-3.4, 2.9, -1.1], [3.4, 2.9, -1.1], 0.08, materials.steelLight, 8));
    pipingGroup.add(makeCylinderBetween([-3.4, 2.9, 1.1], [3.4, 2.9, 1.1], 0.08, materials.steelLight, 8));
    addTextSprite(scene, ['PIPING', 'L6  ERECT LINE 24'], [8.3, 4.8, 2.8], '#F2A84B', 0.35);
    disciplineLines.set('pipeline', addLeaderLine(scene, [8.2, 1.25, 2.8], [8.3, 4.62, 2.8], COLORS.amber));
    addInteractive(interactiveRoots, pipingGroup, {
      id: 'pipeline',
      title: 'Piping execution zone',
      summary: 'The highlighted spool is the physical twin for L6 Erect Line 24 and the linked field update.',
      metrics: ['Planned: 80%', 'Actual: 60%', 'Variance: -20%'],
    });
    siteGroup.add(pipingGroup);

    const equipmentGroup = new THREE.Group();
    equipmentGroup.position.set(1.8, 0, 2.5);
    equipmentGroup.add(makeBox(2.8, 0.5, 1.5, materials.steel, [0, 0.35, 0]));
    equipmentGroup.add(makeBox(1.6, 0.8, 1.25, materials.amber, [-0.25, 1, 0]));
    equipmentGroup.add(makeBox(2.1, 0.25, 0.25, materials.amber, [1.55, 1.42, 0]));
    equipmentGroup.children[2].rotation.z = -0.42;
    equipmentGroup.add(makeBox(0.5, 0.75, 0.95, materials.glowAmber, [1.95, 0.95, 0]));
    equipmentGroup.add(makeTank(materials, [-1.15, 2.0, 0], 0.9));
    addTextSprite(scene, 'EQUIPMENT', [1.75, 2.75, 2.5], '#F2A84B', 0.31);
    disciplineLines.set('equipment', addLeaderLine(scene, [1.8, 1.45, 2.5], [1.75, 2.58, 2.5], COLORS.amber));
    addInteractive(interactiveRoots, equipmentGroup, {
      id: 'equipment',
      title: 'Equipment zone',
      summary: 'Mobile equipment activity is represented alongside the schedule-linked workfront.',
      metrics: ['Excavator', 'Material handling', 'Workfront active'],
    });
    siteGroup.add(equipmentGroup);

    const craneGroup = new THREE.Group();
    craneGroup.position.set(1.3, 0, -0.7);
    craneGroup.add(makeBox(0.65, 10, 0.65, materials.amber, [0, 5, 0]));
    const jib = new THREE.Group();
    jib.position.y = 10;
    jib.add(makeBox(11, 0.32, 0.32, materials.amber, [4.5, 0, 0]));
    jib.add(makeBox(2.4, 0.32, 0.32, materials.amber, [-1.2, 0, 0]));
    jib.add(makeBox(1.1, 0.95, 1, materials.concreteLight, [0.25, -0.45, 0]));
    jib.add(makeCylinderBetween([8.6, 0, 0], [8.6, -3.6, 0], 0.025, materials.amber, 6));
    const suspended = makeCylinderBetween([7.6, -3.6, 0], [9.6, -3.6, 0], 0.22, materials.steel, 12);
    jib.add(suspended);
    craneGroup.add(jib);
    addTextSprite(scene, 'HSE / LIFT PLAN', [0.8, 11.2, -0.7], '#8BE0C0', 0.3);
    addInteractive(interactiveRoots, craneGroup, {
      id: 'crane',
      title: 'HSE-controlled lifting zone',
      summary: 'Crane activity and worker presence show how execution context is observed alongside progress.',
      metrics: ['Lift plan', 'Worker proximity', 'Safety signal'],
    });
    siteGroup.add(craneGroup);
    animatedObjects.push({ object: jib, axis: 'y', speed: 0.2 });

    siteGroup.add(makeTruck(materials, [4.5, 0, 4.8], COLORS.cyan));
    siteGroup.add(makeTruck(materials, [10.6, 0, 2.9], COLORS.amber));
    siteGroup.add(makeCar(materials, [-7.2, 0, 8.2], COLORS.cyan));
    siteGroup.add(makeCar(materials, [15.2, 0, 8.2], COLORS.mint));
    siteGroup.add(makeDumpTruck(materials, [1.4, 0, 8.2]));
    siteGroup.add(makeTankerTruck(materials, [6.3, 0, 8.2]));
    siteGroup.add(makeConcreteMixer(materials, [-2.8, 0, 8.2]));
    siteGroup.add(makeForklift(materials, [8.8, 0, 5.4]));
    siteGroup.add(makeExcavator(materials, [5.2, 0, 5.0]));
    siteGroup.add(makeBulldozer(materials, [13.4, 0, 5.6]));
    [[13.5, 0.35, 7.4], [14.3, 0.35, 7.4], [15.1, 0.35, 7.4]].forEach(([x, y, z]) => {
      siteGroup.add(makeBox(0.55, 0.7, 0.55, materials.concreteLight, [x, y, z]));
    });
    [11.4, 12.4, 13.4].forEach((x) => {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.55, 8), materials.glowAmber);
      cone.position.set(x, 0.24, 7.2);
      siteGroup.add(cone);
    });
    sceneGroup.add(
      makeCylinderBetween([0.65, 2.0, 2.5], [3.7, 1.45, 2.5], 0.13, materials.steel, 10),
      makeCylinderBetween([3.7, 1.45, 2.5], [5.2, 1.45, 2.8], 0.13, materials.steel, 10),
      makeCylinderBetween([0.65, 2.0, 2.5], [0.2, 2.0, -4.8], 0.13, materials.steel, 10),
    );

    const electricalGroup = new THREE.Group();
    electricalGroup.position.set(11.7, 0, -3.1);
    electricalGroup.add(makeBox(0.26, 4.2, 0.26, materials.steelLight, [0, 2.1, 0]));
    electricalGroup.add(makeBox(3.4, 0.18, 0.18, materials.steelLight, [0, 3.55, 0]));
    electricalGroup.add(makeCylinderBetween([-1.4, 3.55, 0], [-2.1, 2.6, 0], 0.025, materials.glowCyan, 6));
    electricalGroup.add(makeCylinderBetween([1.4, 3.55, 0], [2.1, 2.6, 0], 0.025, materials.glowCyan, 6));
    [-0.8, 0, 0.8].forEach((offset) => {
      electricalGroup.add(makeBox(2.7, 0.08, 0.34, materials.steel, [0, 1.15 + offset, 0.36]));
      electricalGroup.add(makeBox(0.08, 1.9, 0.08, materials.steelLight, [-1.15, 0.9 + offset, 0.36]));
      electricalGroup.add(makeBox(0.08, 1.9, 0.08, materials.steelLight, [1.15, 0.9 + offset, 0.36]));
    });
    addTextSprite(scene, 'ELECTRICAL', [11.9, 4.7, -3.1], '#70D7E8', 0.31);
    disciplineLines.set('electrical', addLeaderLine(scene, [11.7, 3.45, -3.1], [11.9, 4.52, -3.1], COLORS.cyan));
    addInteractive(interactiveRoots, electricalGroup, {
      id: 'electrical',
      title: 'Electrical systems',
      summary: 'Power distribution and connected infrastructure are tracked as distinct discipline workfronts.',
      metrics: ['Power routing', 'Commissioning', 'Connected asset'],
    });
    siteGroup.add(electricalGroup);

    const instrumentationGroup = new THREE.Group();
    instrumentationGroup.position.set(8.3, 0, -0.1);
    instrumentationGroup.add(makeBox(1.9, 0.22, 1.9, materials.steel, [0, 0.12, 0]));
    [0, 0.8, 1.6].forEach((y, index) => {
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), index === 1 ? materials.glowCyan : materials.glowMint);
      beacon.position.set(0, 0.55 + y, 0);
      instrumentationGroup.add(beacon);
    });
    addTextSprite(scene, 'INSTRUMENTATION', [8.3, 3.1, -0.1], '#8BE0C0', 0.29);
    disciplineLines.set('instrumentation', addLeaderLine(scene, [8.3, 1.85, -0.1], [8.3, 2.94, -0.1], COLORS.mint));
    addInteractive(interactiveRoots, instrumentationGroup, {
      id: 'instrumentation',
      title: 'Instrumentation',
      summary: 'Sensors and field signals add context to the schedule and risk picture.',
      metrics: ['Telemetry', 'Inspection points', 'Live signal'],
    });
    siteGroup.add(instrumentationGroup);

    const hseGroup = new THREE.Group();
    [
      [4.2, 0, 4.2],
      [7.1, 0, 4.1],
      [10.8, 0, 1.6],
      [5.1, 0, -1.2],
      [1.5, 0, 5.1],
      [9.4, 0, 4.8],
      [-2.4, 0, 1.8],
      [12.4, 0, 0.5],
    ].forEach((position, index) => hseGroup.add(makeWorker(materials, position, index % 2 ? COLORS.cyan : COLORS.amber)));
    [[3.3, 0.2, 4.7], [4.8, 0.2, 4.7], [6.3, 0.2, 4.7]].forEach(([x, y, z], index, barriers) => {
      hseGroup.add(makeCylinderBetween([x, y, z], [x, y + 0.95, z], 0.045, materials.glowAmber, 6));
      if (index < barriers.length - 1) {
        hseGroup.add(makeCylinderBetween([x, y + 0.65, z], [barriers[index + 1][0], y + 0.65, z], 0.035, materials.glowAmber, 6));
      }
    });
    addTextSprite(scene, 'HSE', [6.5, 1.85, 4.6], '#F2A84B', 0.33);
    disciplineLines.set('hse', addLeaderLine(scene, [7.1, 1.15, 4.1], [6.5, 1.7, 4.6], COLORS.amber));
    addInteractive(interactiveRoots, hseGroup, {
      id: 'hse',
      title: 'HSE field context',
      summary: 'Worker locations and safety signals remain part of the execution picture rather than a separate afterthought.',
      metrics: ['People on site', 'Safety context', 'Field awareness'],
    });
    siteGroup.add(hseGroup);

    // Smart linking and schedule/PMIS transformation.
    const smartLinkGroup = addPanel(scene, [1.8, 4.6, 5.2], [4.6, 2.15, 0.14], COLORS.mint);
    addTextSprite(scene, ['SMART LINKING', 'Spool erected', '↓  L6 — Erect Line 24', 'CONFIDENCE  92%'], [-0.25, 4.7, 5.1], '#8BE0C0', 0.31);
    addInteractive(interactiveRoots, smartLinkGroup, {
      id: 'smart-link',
      title: 'Smart Linking',
      summary: 'Terminology differences and granularity mismatches are reconciled before an update reaches the schedule.',
      metrics: ['Spool erected', 'Matched to L6', 'Confidence: 92%'],
    });
    sceneGroup.add(smartLinkGroup);

    const pmisGroup = addPanel(scene, [12.4, 6.0, 1.5], [4.2, 2.1, 0.14], COLORS.amber);
    addTextSprite(scene, ['SCHEDULE / PMIS', 'PLANNED  80%   ACTUAL  60%', 'VARIANCE  -20%', 'AUTO UPDATE  ●'], [10.85, 6.1, 1.42], '#F2A84B', 0.28);
    const progressBar = makeBox(2.8, 0.12, 0.08, materials.glowMint, [-0.2, -0.55, -0.08]);
    pmisGroup.add(progressBar);
    addInteractive(interactiveRoots, pmisGroup, {
      id: 'pmis',
      title: 'Schedule / PMIS update',
      summary: 'Validated execution updates move back into the project baseline and expose the current variance.',
      metrics: ['Planned: 80%', 'Actual: 60%', 'Variance: -20%'],
    });
    sceneGroup.add(pmisGroup);

    const riskGroup = addPanel(scene, [12.8, 9.1, 1.6], [4.4, 1.75, 0.14], COLORS.rose);
    addTextSprite(scene, ['RISK ANALYSIS', 'PROGRESS   DELAY RISK   ANOMALY', 'FORECAST  14.7 DAYS'], [11.25, 9.18, 1.52], '#F1EDE4', 0.27);
    [0.35, 0.58, 0.82].forEach((height, index) => {
      const bar = makeBox(0.2, height, 0.12, index === 2 ? materials.glowAmber : materials.glowMint, [-1.1 + index * 0.75, -0.72 + height / 2, -0.08]);
      riskGroup.add(bar);
    });
    addInteractive(interactiveRoots, riskGroup, {
      id: 'risk',
      title: 'Risk and analytics',
      summary: 'The updated schedule becomes a forward-looking signal for delay, anomalies, and forecast completion.',
      metrics: ['Delay risk: MEDIUM', 'Anomaly: REVIEW', 'Forecast: 14.7 days'],
    });
    sceneGroup.add(riskGroup);

    // Institutional memory repository and future-project handoff.
    const knowledgeGroup = new THREE.Group();
    knowledgeGroup.position.set(16.3, 3.1, -3.2);
    for (let index = 0; index < 4; index += 1) {
      const box = makeBox(3.2 - index * 0.18, 0.38, 2.2 - index * 0.12, index % 2 ? materials.steel : materials.concreteLight, [0, index * 0.45, 0]);
      box.rotation.y = index % 2 ? 0.06 : -0.04;
      knowledgeGroup.add(box);
    }
    addTextSprite(scene, ['PROJECT KNOWLEDGE', 'DURATIONS · DELAYS', 'PRODUCTIVITY · BOTTLENECKS'], [14.8, 5.35, -3.1], '#8BE0C0', 0.3);
    const futureBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 16), materials.glowMint);
    futureBeacon.position.set(2.8, 1.8, 0);
    knowledgeGroup.add(futureBeacon);
    addTextSprite(scene, 'FUTURE PROJECTS', [18.6, 4.95, -3.1], '#8BE0C0', 0.3);
    addInteractive(interactiveRoots, knowledgeGroup, {
      id: 'knowledge',
      title: 'Project Knowledge',
      summary: 'Actual durations, delay causes, productivity, bottlenecks, and discipline patterns become reusable institutional memory.',
      metrics: ['Execution history', 'Reusable patterns', 'Future projects'],
    });
    sceneGroup.add(knowledgeGroup);

    // Animated data flow: input, AI, activity, schedule, risk, and memory.
    inputDefinitions.forEach(([, , color, y], index) => {
      addFlow(
        scene,
        [
          [-11.5, y, -1.8],
          [-8.4, y - 0.4, -1.4],
          [-6.2, 5.3, -0.6],
        ],
        color,
        0.12 + index * 0.01,
        flowParticles,
      );
    });
    addFlow(scene, [[-3.1, 5.3, -0.4], [0.3, 7.2, -0.5], [5.6, 10.1, -0.1]], COLORS.cyan, 0.19, flowParticles);
    addFlow(scene, [[-3.1, 5.1, 0], [1.2, 4.6, 3.7], [5.3, 2.8, 2.8]], COLORS.mint, 0.16, flowParticles);
    addFlow(scene, [[9.7, 2.8, 2.8], [11.2, 4.2, 1.6], [12.4, 5.1, 1.5]], COLORS.amber, 0.15, flowParticles);
    addFlow(scene, [[14.2, 6.2, 1.5], [14.8, 7.7, 1.6], [15.5, 8.9, -1.5]], COLORS.rose, 0.13, flowParticles);
    addFlow(scene, [[14.4, 5.4, -0.3], [15.1, 4.1, -2.7], [16.2, 3.2, -3.2]], COLORS.mint, 0.12, flowParticles);
    addFlow(scene, [[17.8, 3.3, -3.2], [19.3, 3.5, -3.2]], COLORS.mint, 0.1, flowParticles);

    let currentHoverId = null;
    let pointerDown = null;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    function findNode(object) {
      let current = object;
      while (current) {
        if (current.userData?.siteflowNode) return current.userData.siteflowNode;
        current = current.parent;
      }
      return null;
    }

    function setPointer(event) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
    }

    const handlePointerMove = (event) => {
      const bounds = renderer.domElement.getBoundingClientRect();
      parallaxTarget.x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
      parallaxTarget.y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
      setPointer(event);
      const intersections = raycaster.intersectObjects(interactiveRoots, true);
      const node = intersections.length ? findNode(intersections[0].object) : null;
      if (node?.id !== currentHoverId) {
        currentHoverId = node?.id || null;
        setHoveredNode(node);
        onNodeHover(node?.id || null);
      }
    };

    const handlePointerDown = (event) => {
      pointerDown = { x: event.clientX, y: event.clientY };
    };

    const handlePointerUp = (event) => {
      if (!pointerDown) return;
      const moved = Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y);
      pointerDown = null;
      if (moved > 7) return;
      setPointer(event);
      const intersections = raycaster.intersectObjects(interactiveRoots, true);
      const node = intersections.length ? findNode(intersections[0].object) : null;
      if (node) setSelectedNode(node);
    };

    const handlePointerLeave = () => {
      parallaxTarget.x = 0;
      parallaxTarget.y = 0;
      currentHoverId = null;
      setHoveredNode(null);
      onNodeHover(null);
    };

    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    renderer.domElement.addEventListener('pointerup', handlePointerUp);
    renderer.domElement.addEventListener('pointerleave', handlePointerLeave);

    setIsLoaded(true);
    let animationFrameId;
    let animationRunning = false;
    let isVisible = true;
    const startTime = performance.now();
    const animate = () => {
      if (!isVisible) {
        animationRunning = false;
        return;
      }
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = (performance.now() - startTime) / 1000;
      const animateScene = !reducedMotionRef.current;

      controls.update();
      if (animateScene) {
        parallaxCurrent.x += (parallaxTarget.x - parallaxCurrent.x) * 0.035;
        parallaxCurrent.y += (parallaxTarget.y - parallaxCurrent.y) * 0.035;
        scene.rotation.y = parallaxCurrent.x * 0.018;
        scene.rotation.x = parallaxCurrent.y * 0.009;
        aiCore.rotation.y = elapsed * 0.28;
        aiCore.rotation.x = Math.sin(elapsed * 0.4) * 0.12;
        aiWire.rotation.y = -elapsed * 0.18;
        animatedObjects.forEach(({ object, axis, speed }) => {
          object.rotation[axis] += speed * 0.01;
        });
        const activeStoryTarget = STORY_STEPS[storyStepRef.current]?.target;
        const pipingIsFocused = activeStoryTarget === 'pipeline' || activeStoryTarget === 'schedule';
        const pmisIsFocused = activeStoryTarget === 'pmis' || activeStoryTarget === 'pipeline';
        weld.material.emissiveIntensity = 0.72 + Math.sin(elapsed * 3.2) * (pipingIsFocused ? 0.62 : 0.28);
        futureBeacon.scale.setScalar(1 + Math.sin(elapsed * 2.4) * 0.12);
        activityBeacon.scale.setScalar(1 + Math.sin(elapsed * 3.1) * (pipingIsFocused ? 0.24 : 0.1));
        progressBar.scale.x += (((pmisIsFocused ? 0.78 : 0.6) - progressBar.scale.x) * 0.04);
        flowParticles.forEach(({ curve, particle, offset, speed }) => {
          const progress = (elapsed * speed * 0.22 + offset) % 1;
          particle.position.copy(curve.getPointAt(progress));
          particle.scale.setScalar(0.75 + Math.sin(elapsed * 5 + offset * 8) * 0.18);
        });
      }

      const storyTarget = STORY_STEPS[storyStepRef.current]?.target;
      const targetId = highlightedTargetRef.current || currentHoverId || storyTarget;
      const activeHighlightIds = new Set([
        ...(targetId ? [targetId] : []),
        ...(targetId ? linkedHighlightIds[targetId] || [] : []),
      ]);
      interactiveRoots.forEach((root) => {
        const id = root.userData.siteflowNode.id;
        const targetScale = activeHighlightIds.has(id) ? 1.055 : 1;
        root.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.12);
      });
      disciplineLines.forEach((line, id) => {
        line.material.opacity = activeHighlightIds.has(id) ? 0.92 : line.userData.baseOpacity;
      });

      renderer.render(scene, camera);
    };
    const startAnimation = () => {
      if (animationRunning) return;
      animationRunning = true;
      animate();
    };
    const visibilityObserver = typeof IntersectionObserver === 'undefined'
      ? null
      : new IntersectionObserver(([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible) {
          startAnimation();
        } else {
          cancelAnimationFrame(animationFrameId);
          animationRunning = false;
        }
      }, { threshold: 0.05 });
    visibilityObserver?.observe(container);
    startAnimation();

    const handleResize = () => {
      const nextWidth = container.clientWidth || width;
      const nextHeight = container.clientHeight || height;
      camera.aspect = nextWidth / nextHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(nextWidth, nextHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      visibilityObserver?.disconnect();
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener('pointerup', handlePointerUp);
      renderer.domElement.removeEventListener('pointerleave', handlePointerLeave);
      controls.dispose();
      renderer.dispose();
      scene.traverse((object) => {
        if (object.userData?.disposeTexture) object.userData.disposeTexture();
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          const materialsToDispose = Array.isArray(object.material) ? object.material : [object.material];
          materialsToDispose.forEach((material) => {
            if (material.map) material.map.dispose();
            material.dispose();
          });
        }
      });
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-[520px] lg:min-h-[660px] flex items-center justify-center">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing touch-none" />

      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0A0D0B]/60 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2 text-xs font-mono text-siteflow-amber">
            <span className="w-2 h-2 rounded-full bg-siteflow-amber animate-ping" />
            <span>INITIALIZING DIGITAL TWIN...</span>
          </div>
        </div>
      )}

      {has3dError && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0A0D0B]/75 backdrop-blur-sm z-10">
          <div className="max-w-xs text-center font-mono text-xs text-siteflow-muted">
            <div className="mb-2 text-siteflow-amber">DIGITAL TWIN PAUSED</div>
            <p>WebGL is unavailable in this browser preview. The rest of SiteFlow remains operational.</p>
          </div>
        </div>
      )}

      <div className="absolute top-4 left-4 z-10 pointer-events-none hidden sm:block">
        <div className="rounded-lg border border-siteflow-border/40 bg-[#0E1310]/80 px-3 py-2 backdrop-blur-md">
          <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-siteflow-amber">
            <span className="h-1.5 w-1.5 rounded-full bg-siteflow-mint animate-pulse" />
            DIGITAL TWIN / LIVE PIPELINE
          </div>
          <div className="mt-1 text-[9px] font-mono text-siteflow-muted">
            DRAG TO ROTATE  ·  SCROLL TO ZOOM  ·  CLICK A NODE
          </div>
        </div>
      </div>

      {hoveredNode && !selectedNode && (
        <div className="absolute left-4 bottom-4 z-10 max-w-[230px] rounded-lg border border-siteflow-mint/40 bg-[#0E1310]/90 px-3 py-2 backdrop-blur-md pointer-events-none">
          <div className="text-[10px] font-mono font-bold text-siteflow-mint uppercase">{hoveredNode.title}</div>
          <div className="mt-1 text-[10px] leading-relaxed text-siteflow-cream">{hoveredNode.summary}</div>
        </div>
      )}

      {selectedNode && (
        <div className="absolute right-4 bottom-4 z-20 w-[min(280px,calc(100%-2rem))] rounded-xl border border-siteflow-amber/50 bg-[#0E1310]/95 p-4 shadow-2xl backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-siteflow-amber">
                {selectedNode.id.replaceAll('-', ' ')}
              </div>
              <h3 className="mt-1 text-sm font-bold text-siteflow-cream">{selectedNode.title}</h3>
            </div>
            <button
              type="button"
              onClick={() => setSelectedNode(null)}
              aria-label="Close visualization detail"
              className="text-siteflow-muted hover:text-siteflow-cream text-lg leading-none"
            >
              ×
            </button>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-siteflow-muted">{selectedNode.summary}</p>
          <div className="mt-3 space-y-1.5 border-t border-siteflow-border/30 pt-3">
            {selectedNode.metrics.map((metric) => (
              <div key={metric} className="flex items-center gap-2 text-[10px] font-mono text-siteflow-cream">
                <span className="h-1.5 w-1.5 rounded-full bg-siteflow-mint" />
                {metric}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="absolute top-4 right-6 text-[10px] font-mono text-siteflow-muted/80 bg-[#0E1310]/80 border border-siteflow-border/40 px-3 py-1.5 rounded-md backdrop-blur-md hidden sm:flex items-center gap-3 pointer-events-none">
        <div>SECTOR: <strong className="text-siteflow-cream">CORRIDOR 04</strong></div>
        <div>TWIN ENGINE: <strong className="text-siteflow-amber">ACTIVE</strong></div>
      </div>

      {!hoveredNode && !selectedNode && (
        <div className="absolute bottom-4 left-4 z-10 max-w-[250px] rounded-lg border border-siteflow-cyan/35 bg-[#0E1310]/88 px-3 py-2 backdrop-blur-md pointer-events-none">
          <div className="flex items-center justify-between gap-4 text-[9px] font-mono text-siteflow-muted">
            <span>SCROLL STORY {String(storyStep + 1).padStart(2, '0')} / {String(STORY_STEPS.length).padStart(2, '0')}</span>
            <span className="text-siteflow-cyan">{STORY_STEPS[storyStep].label}</span>
          </div>
          <div className="mt-1 text-[10px] leading-relaxed text-siteflow-cream">{STORY_STEPS[storyStep].detail}</div>
        </div>
      )}
    </div>
  );
}