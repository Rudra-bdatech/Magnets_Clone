"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { usePrefersReducedMotion } from "./use-in-view";

export default function Interactive3DCard() {
  const mountRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || reduced) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.z = 4.2;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      mount.appendChild(renderer.domElement);
    } catch {
      return;
    }

    // 3D Object Group
    const group = new THREE.Group();
    scene.add(group);

    // 1. Sleek 3D Floating Tablet/Book Mesh
    const boxGeo = new THREE.BoxGeometry(2.2, 1.4, 0.08);
    const boxMat = new THREE.MeshPhysicalMaterial({
      color: 0x0c1424,
      metalness: 0.85,
      roughness: 0.2,
      clearcoat: 0.8,
      clearcoatRoughness: 0.1,
    });
    const tablet = new THREE.Mesh(boxGeo, boxMat);
    group.add(tablet);

    // 2. Glowing Neon Border Frame (Cyan / Blue)
    const edgesGeo = new THREE.EdgesGeometry(boxGeo);
    const edgesMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      linewidth: 2,
      transparent: true,
      opacity: 0.85,
    });
    const edges = new THREE.LineSegments(edgesGeo, edgesMat);
    group.add(edges);

    // 3. Floating 3D Page Hologram inside
    const pageGeo = new THREE.PlaneGeometry(1.9, 1.15);
    const pageMat = new THREE.MeshBasicMaterial({
      color: 0x0066b2,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
    });
    const page = new THREE.Mesh(pageGeo, pageMat);
    page.position.z = 0.05;
    group.add(page);

    // 4. Floating Particles Orbiting the 3D Model
    const particleCount = 40;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 3.5;
      positions[i + 1] = (Math.random() - 0.5) * 2.5;
      positions[i + 2] = (Math.random() - 0.5) * 1.5;
    }
    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.035,
      transparent: true,
      opacity: 0.7,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    group.add(particles);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x38bdf8, 2.5, 10);
    pointLight.position.set(2, 2, 3);
    scene.add(pointLight);

    const blueLight = new THREE.PointLight(0x0066b2, 2.0, 10);
    blueLight.position.set(-2, -2, 2);
    scene.add(blueLight);

    // Mouse movement tracking (Spline / 3D Cursor reaction)
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = mount.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      mouseX = x * 1.2;
      mouseY = y * 1.2;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // Scroll tracking (Apple style 3D rotation with scroll scrub)
    let scrollRotation = 0;
    const handleScroll = () => {
      const scrollY = window.scrollY;
      scrollRotation = scrollY * 0.0025;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Resize
    const handleResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    // Visibility Observer: pause when off-screen for 0% CPU consumption
    let isVisible = true;
    const io = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    });
    io.observe(mount);

    // Render loop
    let animId = 0;
    const animate = (time: number) => {
      animId = requestAnimationFrame(animate);
      if (!isVisible) return;

      const t = time * 0.001;

      // Smooth lerp to mouse position
      targetRotationY = mouseX + Math.sin(t * 0.8) * 0.15 + scrollRotation;
      targetRotationX = -mouseY + Math.cos(t * 0.6) * 0.1;

      group.rotation.y += (targetRotationY - group.rotation.y) * 0.05;
      group.rotation.x += (targetRotationX - group.rotation.x) * 0.05;

      // Gentle floating page wave
      page.position.z = 0.05 + Math.sin(t * 2) * 0.02;

      // Orbit particles
      particles.rotation.y = t * 0.1;

      renderer.render(scene, camera);
    };
    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      io.disconnect();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [reduced]);

  return (
    <div
      ref={mountRef}
      className="relative h-[220px] sm:h-[260px] w-full cursor-grab active:cursor-grabbing"
      aria-label="Interactive 3D Lead Magnet Model"
    />
  );
}
