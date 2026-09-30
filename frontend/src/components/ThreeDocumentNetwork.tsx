import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeDocumentNetworkProps {
  height?: string;
  interactive?: boolean;
}

const ThreeDocumentNetwork: React.FC<ThreeDocumentNetworkProps> = ({
  height = '280px',
  interactive = true
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    const width = currentMount.clientWidth;
    const h = currentMount.clientHeight || 280;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / h, 0.1, 1000);
    camera.position.z = 25;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    currentMount.appendChild(renderer.domElement);

    // Group for nodes and connections
    const group = new THREE.Group();
    scene.add(group);

    // Create Document & Chunk Nodes
    const nodeCount = 38;
    const geometry = new THREE.SphereGeometry(0.35, 16, 16);
    
    const colors = [0x3b82f6, 0x8b5cf6, 0x06b6d4, 0x10b981];
    const nodes: THREE.Mesh[] = [];
    const positions: THREE.Vector3[] = [];

    for (let i = 0; i < nodeCount; i++) {
      const color = colors[i % colors.length];
      const material = new THREE.MeshBasicMaterial({
        color,
        wireframe: i % 4 === 0,
      });

      const mesh = new THREE.Mesh(geometry, material);
      const pos = new THREE.Vector3(
        (Math.random() - 0.5) * 32,
        (Math.random() - 0.5) * 18,
        (Math.random() - 0.5) * 16
      );

      mesh.position.copy(pos);
      group.add(mesh);
      nodes.push(mesh);
      positions.push(pos);
    }

    // Connect close nodes with lines (Semantic Chunking Graph)
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.25
    });

    const lineGeometry = new THREE.BufferGeometry();
    const linePositions: number[] = [];

    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        const dist = positions[i].distanceTo(positions[j]);
        if (dist < 8.5) {
          linePositions.push(positions[i].x, positions[i].y, positions[i].z);
          linePositions.push(positions[j].x, positions[j].y, positions[j].z);
        }
      }
    }

    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    const linesMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
    group.add(linesMesh);

    // Mouse Interaction
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      if (!interactive) return;
      const rect = currentMount.getBoundingClientRect();
      mouseX = ((event.clientX - rect.left) / width - 0.5) * 2;
      mouseY = -((event.clientY - rect.top) / h - 0.5) * 2;
    };

    if (interactive) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      group.rotation.y += 0.003;
      group.rotation.x += 0.001;

      if (interactive) {
        camera.position.x += (mouseX * 4 - camera.position.x) * 0.05;
        camera.position.y += (mouseY * 4 - camera.position.y) * 0.05;
        camera.lookAt(scene.position);
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!currentMount) return;
      const w = currentMount.clientWidth;
      const newH = currentMount.clientHeight || 280;
      camera.aspect = w / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(w, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (interactive) {
        window.removeEventListener('mousemove', handleMouseMove);
      }
      cancelAnimationFrame(animationFrameId);
      if (currentMount.contains(renderer.domElement)) {
        currentMount.removeChild(renderer.domElement);
      }
      geometry.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      renderer.dispose();
    };
  }, [height, interactive]);

  return (
    <div
      ref={mountRef}
      style={{
        width: '100%',
        height,
        borderRadius: '16px',
        overflow: 'hidden',
        background: 'radial-gradient(ellipse at center, rgba(15, 23, 42, 0.8) 0%, rgba(6, 10, 19, 0.95) 100%)',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        boxShadow: 'inset 0 0 30px rgba(59, 130, 246, 0.1)',
        position: 'relative',
      }}
    >
      <div style={{
        position: 'absolute',
        top: '12px',
        left: '16px',
        fontSize: '11px',
        fontWeight: '600',
        color: '#60a5fa',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        pointerEvents: 'none'
      }}>
        <span className="status-dot" />
        3D Semantic Knowledge Graph & Embedding Topology
      </div>
    </div>
  );
};

export default ThreeDocumentNetwork;
