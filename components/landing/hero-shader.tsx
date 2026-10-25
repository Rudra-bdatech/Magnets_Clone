"use client";

import { useEffect, useRef } from "react";
import { Renderer, Program, Mesh, Triangle } from "ogl";

export default function HeroShader() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check reduced motion preference
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let renderer: Renderer | null = null;
    let gl: Renderer["gl"] | null = null;
    let canvas: HTMLCanvasElement | null = null;
    let mesh: Mesh | null = null;
    let animId = 0;
    let isVisible = true;

    try {
      renderer = new Renderer({
        webgl: 2,
        alpha: true,
        antialias: false,
        dpr: Math.min(window.devicePixelRatio, 1.5),
        powerPreference: "high-performance",
      });
      gl = renderer.gl;
      canvas = gl.canvas as HTMLCanvasElement;
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      canvas.style.display = "block";
      container.appendChild(canvas);
    } catch {
      return;
    }

    const geometry = new Triangle(gl);

    const vertex = `
      attribute vec2 position;
      attribute vec2 uv;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fragment = `
      precision highp float;
      uniform float uTime;
      uniform vec2 uResolution;
      uniform vec2 uMouse;
      uniform float uDark;
      varying vec2 vUv;

      // Simplex 2D noise
      vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
      float snoise(vec2 v){
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                           -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod(i, 289.0);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
        + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
          dot(x12.zw,x12.zw)), 0.0);
        m = m*m ;
        m = m*m ;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      void main() {
        vec2 st = gl_FragCoord.xy / uResolution.xy;
        st.x *= uResolution.x / uResolution.y;

        vec2 mouse = uMouse * vec2(uResolution.x / uResolution.y, 1.0);
        float mouseDist = distance(st, mouse);
        float mouseWave = sin(mouseDist * 12.0 - uTime * 2.5) * exp(-mouseDist * 2.2);

        // Fluid multi-octave domain warping
        vec2 q = vec2(0.0);
        q.x = snoise(st + 0.07 * uTime);
        q.y = snoise(st + vec2(1.0) + 0.08 * uTime);

        vec2 r = vec2(0.0);
        r.x = snoise(st + 1.2 * q + vec2(1.7, 9.2) + 0.12 * uTime + mouseWave * 0.18);
        r.y = snoise(st + 1.2 * q + vec2(8.3, 2.8) + 0.10 * uTime);

        float f = snoise(st + 1.4 * r);
        float intensity = clamp((f * f * 2.2 + 0.5 * f), 0.0, 1.0);

        // Palette blending
        // Light Mode: Ethereal cyan to sky blue to clean white
        vec3 lightC1 = vec3(0.94, 0.97, 1.0);    // #F0F7FF
        vec3 lightC2 = vec3(0.55, 0.82, 1.0);    // Soft Azure
        vec3 lightC3 = vec3(0.0, 0.40, 0.70);    // #0066B2 LeadMagnets Blue

        // Dark Mode: Deep Electric Cyan & Midnight Blue
        vec3 darkC1 = vec3(0.04, 0.04, 0.06);    // Deep obsidian
        vec3 darkC2 = vec3(0.0, 0.22, 0.45);     // Deep sapphire
        vec3 darkC3 = vec3(0.22, 0.74, 0.97);    // #38BDF8 Cyan

        vec3 colorA = mix(lightC1, lightC2, intensity);
        colorA = mix(colorA, lightC3, pow(intensity, 2.8) * 0.75);

        vec3 colorB = mix(darkC1, darkC2, intensity);
        colorB = mix(colorB, darkC3, pow(intensity, 2.5) * 0.85);

        vec3 finalColor = mix(colorA, colorB, uDark);

        // Soft radial vignette so text remains razor sharp in center
        vec2 centerSt = vUv - vec2(0.5, 0.45);
        float vignette = smoothstep(0.9, 0.2, length(centerSt));
        float alpha = mix(0.35, 0.55, uDark) * vignette * (0.6 + intensity * 0.4);

        gl_FragColor = vec4(finalColor, alpha);
      }
    `;

    const isDarkMode = document.documentElement.classList.contains("dark");

    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: [gl.canvas.width, gl.canvas.height] },
        uMouse: { value: [0.5, 0.5] },
        uDark: { value: isDarkMode ? 1.0 : 0.0 },
      },
      transparent: true,
      depthTest: false,
    });

    mesh = new Mesh(gl, { geometry, program });

    // Smooth mouse coordinates with lowpass filter
    let mouseX = 0.5;
    let mouseY = 0.5;
    let targetMouseX = 0.5;
    let targetMouseY = 0.5;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX / window.innerWidth;
      targetMouseY = 1.0 - e.clientY / window.innerHeight;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // Resize handling
    const resize = () => {
      if (!renderer || !container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      renderer.setSize(width, height);
      program.uniforms.uResolution.value = [gl.canvas.width, gl.canvas.height];
    };

    window.addEventListener("resize", resize);
    resize();

    // Check dark mode changes
    const observer = new MutationObserver(() => {
      const dark = document.documentElement.classList.contains("dark");
      program.uniforms.uDark.value = dark ? 1.0 : 0.0;
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    // Pause WebGL rendering when hero is out of viewport (0% CPU/GPU waste)
    const io = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    });
    io.observe(container);

    let lastTime = performance.now();
    const update = (now: number) => {
      animId = requestAnimationFrame(update);
      if (!isVisible) return;

      const delta = Math.min((now - lastTime) * 0.001, 0.1);
      lastTime = now;

      // Smooth mouse lerp
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      program.uniforms.uTime.value += delta * 0.6;
      program.uniforms.uMouse.value = [mouseX, mouseY];

      renderer.render({ scene: mesh });
    };

    animId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", resize);
      observer.disconnect();
      io.disconnect();
      if (canvas && canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 h-[38rem] w-full overflow-hidden opacity-60 dark:opacity-85 transition-opacity duration-700"
    />
  );
}
