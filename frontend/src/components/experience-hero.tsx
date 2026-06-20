"use client";

import { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import Navbar from './Navbar';

const LiquidBackground = () => {
    const meshRef = useRef<THREE.Mesh>(null);
    const { viewport } = useThree();
    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
    }), []);

    useFrame((state) => {
        const { clock, mouse } = state;
        if (meshRef.current) {
            (meshRef.current.material as THREE.ShaderMaterial).uniforms.uTime.value = clock.getElapsedTime();
            (meshRef.current.material as THREE.ShaderMaterial).uniforms.uMouse.value.lerp(mouse, 0.05);
        }
    });

    return (
        <mesh ref={meshRef} scale={[viewport.width, viewport.height, 1]}>
            <planeGeometry args={[1, 1]} />
            <shaderMaterial
                transparent
                uniforms={uniforms}
                vertexShader={`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`}
                fragmentShader={`
          uniform float uTime; uniform vec2 uMouse; varying vec2 vUv;
          void main() {
            vec2 uv = vUv; float t = uTime * 0.12;
            vec2 m = uMouse * 0.08;
            float wave = (sin(uv.x * 6.0 + t + m.x * 10.0) + sin(uv.y * 5.0 - t * 0.8 + m.y * 10.0)) * 0.5 + 0.5;
            float warm = smoothstep(0.0, 1.0, wave);
            vec3 cold = vec3(0.008, 0.008, 0.012);
            vec3 warmTone = vec3(0.055, 0.038, 0.015);
            gl_FragColor = vec4(mix(cold, warmTone, warm * 0.6), 1.0);
          }
        `}
            />
        </mesh>
    );
};

const Monolith = () => {
    const meshRef = useRef<THREE.Mesh>(null);
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.18;
            meshRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.3) * 0.08;
        }
    });
    
    return (
        <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.8}>
            <mesh ref={meshRef} scale={isMobile ? 0.5 : 1}>
                <icosahedronGeometry args={[12, 1]} />
                <MeshDistortMaterial color="#0a0a0a" speed={4} distort={0.4} roughness={0.05} metalness={1.0} />
            </mesh>
        </Float>
    );
};

export const Component = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const revealRef = useRef<HTMLDivElement>(null);
    const ctaRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo(revealRef.current,
                { filter: "blur(24px)", opacity: 0, scale: 1.015 },
                { filter: "blur(0px)", opacity: 1, scale: 1, duration: 2.4, ease: "expo.out" }
            );

            gsap.from(".command-cell", {
                x: 50, opacity: 0, stagger: 0.12, duration: 1.6, ease: "power4.out", delay: 1.2, clearProps: "all"
            });

            gsap.from(".hero-label", {
                y: 12, opacity: 0, duration: 1.2, ease: "power3.out", delay: 0.6
            });

            const handleMouseMove = (e: MouseEvent) => {
                if (!ctaRef.current) return;
                const rect = ctaRef.current.getBoundingClientRect();
                const dist = Math.hypot(e.clientX - (rect.left + rect.width / 2), e.clientY - (rect.top + rect.height / 2));
                if (dist < 150) {
                    gsap.to(ctaRef.current, { x: (e.clientX - (rect.left + rect.width / 2)) * 0.35, y: (e.clientY - (rect.top + rect.height / 2)) * 0.35, duration: 0.6 });
                } else {
                    gsap.to(ctaRef.current, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.3)" });
                }
            };
            window.addEventListener("mousemove", handleMouseMove);
            return () => window.removeEventListener("mousemove", handleMouseMove);
        }, containerRef);
        return () => ctx.revert();
    }, []);

    return (
        <section ref={containerRef} className="relative min-h-screen w-full bg-[#060503] flex flex-col overflow-hidden">
            {/* Three.js Canvas */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <Canvas camera={{ position: [0, 0, 60], fov: 35 }}>
                    <ambientLight intensity={0.3} />
                    <spotLight position={[40, 60, 40]} intensity={2} color="#d6a85a" />
                    <spotLight position={[-40, -20, 30]} intensity={0.8} color="#ffffff" />
                    <LiquidBackground />
                    <Monolith />
                </Canvas>
            </div>

            {/* Navbar */}
            <Navbar />

            {/* Hero Content */}
            <div ref={revealRef} className="relative z-10 w-full flex flex-col md:flex-row px-8 md:px-14 lg:px-20 pt-28 pb-16 min-h-screen items-center md:items-stretch gap-10">

                {/* Left: Main Copy */}
                <div className="flex-1 min-w-0 flex flex-col justify-between pb-12 md:pb-8 w-full">

                    {/* Status Badge */}
                    <div className="hero-label flex items-center gap-3 mt-2 mb-6">
                        <div className="flex items-center gap-2 px-3 py-1.5 border border-amber-400/20 bg-amber-400/5">
                            <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                            <span className="font-mono-custom text-[10px] font-medium text-amber-400/80 uppercase tracking-[0.25em]">Sistema Activo — IA Clínica</span>
                        </div>
                    </div>

                    {/* Headline */}
                    <div className="max-w-4xl pr-8">
                        <h1 className="font-serif text-[clamp(3.2rem,9vw,10.5rem)] leading-[0.88] tracking-tight text-white">
                            SANA<br />
                            <span className="text-outline italic">FLOW</span>
                        </h1>
                        <div className="mt-6 flex items-start gap-6">
                            <div className="w-10 h-px bg-amber-400/40 mt-3 flex-shrink-0" />
                            <p className="font-mono-custom text-[11px] text-white/35 uppercase tracking-[0.3em] leading-relaxed max-w-xs">
                                Priorización clínica potenciada por Inteligencia Artificial y Arquitecturas Serverless.
                            </p>
                        </div>
                    </div>

                    {/* CTA */}
                    <button
                        ref={ctaRef}
                        onClick={() => document.getElementById('dashboard')?.scrollIntoView({ behavior: 'smooth' })}
                        className="w-fit flex items-center gap-5 group lg:-translate-y-16"
                    >
                        <div className="w-12 h-12 border border-white/12 flex items-center justify-center group-hover:border-amber-400/60 group-hover:bg-amber-400/10 transition-all duration-500">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="group-hover:stroke-amber-400 stroke-white/60 transition-colors duration-500">
                                <path d="M7 17L17 7M17 7H8M17 7V16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <span className="font-mono-custom text-[10px] font-medium text-white/40 group-hover:text-amber-400 uppercase tracking-[0.25em] transition-colors duration-300">
                            Cargar Notas Clínicas
                        </span>
                    </button>
                </div>

                {/* Right: Data Cards */}
                <div className="w-full md:w-72 lg:w-88 flex-shrink-0 flex flex-col gap-3 justify-center z-20">
                    {[
                        { id: "001", title: "SISTEMA", val: "En Línea", type: "progress" },
                        { id: "002", title: "PROCESAMIENTO", val: "Asíncrono", type: "data" },
                        { id: "003", title: "MODELO", val: "Llama 3 Groq", type: "text" }
                    ].map((item) => (
                        <div
                            key={item.id}
                            className="command-cell border border-white/6 bg-black/40 backdrop-blur-sm p-5 sm:p-6"
                            style={{ opacity: 1 }}
                        >
                            <span className="font-mono-custom text-[9px] text-amber-400/30 uppercase tracking-[0.3em] block mb-3">
                                {item.id} / {item.title}
                            </span>
                            {item.type === "progress" ? (
                                <div className="flex justify-between items-end mt-1">
                                    <h4 className="font-serif text-2xl text-white">{item.val}</h4>
                                    <div className="h-[1px] w-16 bg-white/6 overflow-hidden">
                                        <div className="h-full bg-amber-400/50 animate-loading" style={{ width: '60%' }} />
                                    </div>
                                </div>
                            ) : item.type === "data" ? (
                                <div className="mt-3 flex flex-col gap-2.5">
                                    <div className="flex justify-between text-[10px] font-mono-custom text-white/40">
                                        <span>Precisión IA</span>
                                        <span className="text-amber-400/60">Alta</span>
                                    </div>
                                    <div className="h-[1px] w-full bg-white/5" />
                                    <div className="flex justify-between text-[10px] font-mono-custom text-white/40">
                                        <span>Tasa de Pérdida</span>
                                        <span className="text-amber-400/60">0.0% SQS</span>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm font-light text-white/55 mt-2 leading-snug">
                                    Clasificando registros con <span className="font-medium text-white/80">velocidad ultra rápida</span>.
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom accent line */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent" />
        </section>
    );
};
