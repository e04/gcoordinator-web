import { useEffect, useRef, useSyncExternalStore } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { subscribe, getGcodeSnapshot, getSelectedLineSnapshot } from "./outputStore";

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface ParsedGCodeSegment {
  points: Point3D[];
  lineIndices: number[]; // Maps each point to its original line index in the gcode
}

interface ParsedGCode {
  segments: ParsedGCodeSegment[];
}

function parseGCode(gcode: string): ParsedGCode {
  const segments: ParsedGCodeSegment[] = [];
  let currentSegment: ParsedGCodeSegment = { points: [], lineIndices: [] };

  const lines = gcode.split("\n");

  let currentX = 0;
  let currentY = 0;
  let currentZ = 0;
  let isAbsolute = true; // G90: absolute, G91: relative

  const flushSegment = () => {
    if (currentSegment.points.length > 0) {
      segments.push(currentSegment);
      currentSegment = { points: [], lineIndices: [] };
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith("G90")) {
      isAbsolute = true;
      continue;
    }

    if (trimmed.startsWith("G91")) {
      isAbsolute = false;
      continue;
    }

    const isG0 = trimmed.startsWith("G0");
    const isG1 = trimmed.startsWith("G1");
    if (!isG0 && !isG1) continue;

    const xMatch = trimmed.match(/X(-?\d+\.?\d*)/);
    const yMatch = trimmed.match(/Y(-?\d+\.?\d*)/);
    const zMatch = trimmed.match(/Z(-?\d+\.?\d*)/);
    const eMatch = trimmed.match(/E(-?\d+\.?\d*)/);

    const nextX = xMatch
      ? isAbsolute
        ? parseFloat(xMatch[1])
        : currentX + parseFloat(xMatch[1])
      : currentX;
    const nextY = yMatch
      ? isAbsolute
        ? parseFloat(yMatch[1])
        : currentY + parseFloat(yMatch[1])
      : currentY;
    const nextZ = zMatch
      ? isAbsolute
        ? parseFloat(zMatch[1])
        : currentZ + parseFloat(zMatch[1])
      : currentZ;

    const hasCoordinate = xMatch || yMatch || zMatch;

    const isExtruding = isG1 && !!eMatch;

    if (!isExtruding) {
      if (hasCoordinate) {
        currentX = nextX;
        currentY = nextY;
        currentZ = nextZ;
      }
      flushSegment();
      continue;
    }

    if (hasCoordinate) {
      if (currentSegment.points.length === 0) {
        currentSegment.points.push({ x: currentX, y: currentY, z: currentZ });
        currentSegment.lineIndices.push(i);
      }

      currentX = nextX;
      currentY = nextY;
      currentZ = nextZ;

      currentSegment.points.push({ x: currentX, y: currentY, z: currentZ });
      currentSegment.lineIndices.push(i);
    }
  }

  flushSegment();

  return { segments };
}

function createAxesHelper(size: number): THREE.Group {
  const group = new THREE.Group();

  // X axis (red)
  const xGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(size, 0, 0),
  ]);
  const xMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
  const xLine = new THREE.Line(xGeometry, xMaterial);
  group.add(xLine);

  // Y axis (green)
  const yGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, size, 0),
  ]);
  const yMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
  const yLine = new THREE.Line(yGeometry, yMaterial);
  group.add(yLine);

  // Z axis (blue)
  const zGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, size),
  ]);
  const zMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff });
  const zLine = new THREE.Line(zGeometry, zMaterial);
  group.add(zLine);

  return group;
}

function GCodeViewer() {
  const gcode = useSyncExternalStore(subscribe, getGcodeSnapshot);
  const selectedLine = useSyncExternalStore(subscribe, getSelectedLineSnapshot);
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const pathGroupRef = useRef<THREE.Group | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const parsedDataRef = useRef<ParsedGCode | null>(null);
  const prevGcodeRef = useRef<string>("");

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      10000
    );
    camera.up.set(0, 0, 1); // Z axis points up
    camera.position.set(0, -150, 150);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = true;
    controls.minDistance = 10;
    controls.maxDistance = 2000;
    controlsRef.current = controls;

    // Add axes
    const axes = createAxesHelper(50);
    scene.add(axes);

    // Add grid helper (shifted so only +X/+Y quadrants are shown)
    const gridSize = 1000;
    const gridHelper = new THREE.GridHelper(
      gridSize,
      100,
      0x444444,
      0x333333
    );
    gridHelper.rotation.x = Math.PI / 2; // Rotate to XY plane
    gridHelper.position.set(gridSize / 2, gridSize / 2, 0);
    scene.add(gridHelper);

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      controls.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  // Update parsed data when gcode changes
  useEffect(() => {
    parsedDataRef.current = parseGCode(gcode);
  }, [gcode]);

  // Update path visualization when gcode or selected line changes
  useEffect(() => {
    if (!sceneRef.current) return;

    const scene = sceneRef.current;

    // Remove existing path group
    if (pathGroupRef.current) {
      scene.remove(pathGroupRef.current);
      pathGroupRef.current.traverse((child) => {
        if (child instanceof THREE.Line) {
          child.geometry.dispose();
          if (child.material instanceof THREE.Material) {
            child.material.dispose();
          }
        }
      });
      pathGroupRef.current = null;
    }

    // Parse G-code and create new path
    const parsed = parsedDataRef.current || parseGCode(gcode);
    const { segments } = parsed;

    if (segments.length > 0) {
      const pathGroup = new THREE.Group();

      // Colors for before, at, and after selected line
      const colorBefore = 0x00ffff; // Cyan - lines before selection
      const colorSelected = 0xffff00; // Yellow - selected line
      const colorAfter = 0x666666; // Gray - lines after selection

      // Helper to render a single polyline with given points and color
      const addLine = (pts: THREE.Vector3[], color: number, width = 2) => {
        if (pts.length < 2) return;
        const geometry = new THREE.BufferGeometry().setFromPoints(pts);
        const material = new THREE.LineBasicMaterial({ color, linewidth: width });
        const line = new THREE.Line(geometry, material);
        pathGroup.add(line);
      };

      if (selectedLine === null) {
        // No selection - render all segments in cyan
        segments.forEach((segment) => {
          const threePoints = segment.points.map(
            (p) => new THREE.Vector3(p.x, p.y, p.z)
          );
          addLine(threePoints, colorBefore);
        });
      } else {
        segments.forEach((segment) => {
          const threePoints = segment.points.map(
            (p) => new THREE.Vector3(p.x, p.y, p.z)
          );
          const indices = segment.lineIndices;

          // Find selected point within this segment
          let selectedPointIndex = -1;
          for (let i = 0; i < indices.length; i++) {
            if (indices[i] === selectedLine) {
              selectedPointIndex = i;
              break;
            }
          }

          // If not exact, pick nearest previous in this segment
          if (selectedPointIndex === -1) {
            for (let i = indices.length - 1; i >= 0; i--) {
              if (indices[i] < selectedLine) {
                selectedPointIndex = i;
                break;
              }
            }
          }

          if (threePoints.length < 2) return;

          if (selectedPointIndex === -1) {
            // No relevant point in this segment; render as after/before based on first index
            const color = indices[indices.length - 1] < selectedLine ? colorBefore : colorAfter;
            addLine(threePoints, color);
            return;
          }

          // Before selection
          if (selectedPointIndex > 0) {
            const beforePts = threePoints.slice(0, selectedPointIndex + 1);
            addLine(beforePts, colorBefore);
          }

          // Selected segment (edge ending at selected point)
          if (selectedPointIndex >= 0) {
            const startIdx = Math.max(0, selectedPointIndex - 1);
            const selPts = [threePoints[startIdx], threePoints[selectedPointIndex]];
            addLine(selPts, colorSelected, 3);
          }

          // After selection
          if (selectedPointIndex < threePoints.length - 1) {
            const afterPts = threePoints.slice(selectedPointIndex);
            addLine(afterPts, colorAfter);
          }
        });
      }

      scene.add(pathGroup);
      pathGroupRef.current = pathGroup;

      // Auto-center camera on the path (only when gcode changes, not on selection change)
      const gcodeChanged = prevGcodeRef.current !== gcode;
      if (gcodeChanged && cameraRef.current && controlsRef.current) {
        // Flatten all points for bounding box calculation
        const allPoints: THREE.Vector3[] = [];
        segments.forEach((segment) => {
          segment.points.forEach((p) => allPoints.push(new THREE.Vector3(p.x, p.y, p.z)));
        });

        if (allPoints.length > 0) {
          const box = new THREE.Box3().setFromPoints(allPoints);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);

          controlsRef.current.target.copy(center);
          // Keep X axis horizontal (view along Y) and tilt slightly downward
          cameraRef.current.position.set(
            center.x,
            center.y - maxDim * 2,
            center.z + maxDim
          );
          controlsRef.current.update();
        }
      }
    }
    
    prevGcodeRef.current = gcode;
  }, [gcode, selectedLine]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ minHeight: "300px" }}
    />
  );
}

export default GCodeViewer;
