"use client";

import { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import Navbar from './Navbar';
import DashboardLayout from '../pages/DashboardLayout';
import Loader, { MobileLoader } from './box-loader';

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
            
            // Un glow moderado, punto medio para Mac y LCD
            vec3 cold = vec3(0.01, 0.01, 0.015);
            vec3 warmTone = vec3(0.05, 0.04, 0.012);
            gl_FragColor = vec4(mix(cold, warmTone, warm * 0.55), 1.0);
          }
        `}
            />
        </mesh>
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
                x: 30, opacity: 0, stagger: 0.1, duration: 1.0, ease: "power4.out", delay: 0.4, clearProps: "all"
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
                    <ambientLight intensity={0.4} />
                    <spotLight position={[50, 50, 50]} intensity={3} />
                    <LiquidBackground />
                </Canvas>
            </div>

            {/* 3D-like Dashboard Mockup Background */}
            <div className="absolute top-[5%] right-[-25%] lg:right-[-10%] w-[1200px] h-[900px] pointer-events-none z-0 hidden md:block hero-mockup-wrapper"
                style={{
                    transform: 'perspective(1200px) rotateY(-20deg) rotateX(5deg) scale(0.68)',
                    WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 80%)',
                    maskImage: 'linear-gradient(to right, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 80%)'
                }}>
                <style>{`
                    .hero-mockup-wrapper aside > div:last-child > div:last-child {
                        visibility: hidden !important;
                    }
                `}</style>
                <div className="w-full h-full rounded-2xl overflow-hidden border border-white/15 shadow-[0_0_150px_rgba(212,168,90,0.12)] bg-[#040403] relative">
                    <div className="w-full h-full pointer-events-none relative" style={{ filter: 'brightness(0.6)' }}>
                        <DashboardLayout />
                        {/* Dark overlay on right side */}
                        <div className="absolute top-0 left-56 right-0 bottom-0 bg-[#040403] opacity-60" />
                    </div>
                    {/* Fake User Overlay */}
                    <div className="absolute bottom-0 left-0 w-56 h-[68px] bg-[#060504] border-t border-white/6 z-10 flex items-center gap-3 px-5 pointer-events-none" style={{ filter: 'brightness(0.6)' }}>
                        <div className="w-7 h-7 bg-amber-400/12 border border-amber-400/18 flex items-center justify-center shrink-0">
                            <span className="text-[8px] text-amber-400 font-mono">US</span>
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-white/60 truncate" style={{ fontFamily: "'DM Sans', sans-serif" }}>User</p>
                            <p className="text-[7px] text-white/22 uppercase tracking-[0.15em]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Personal Clínico</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navbar */}
            <Navbar />

            {/* Hero Content */}
            <div ref={revealRef} className="relative z-10 w-full flex flex-col md:flex-row px-6 md:px-14 lg:px-20 pt-20 md:pt-28 pb-10 md:pb-16 min-h-screen items-center md:items-stretch gap-6 md:gap-10">

                {/* Left: Title + Loader + CTA */}
                <div className="flex-1 min-w-0 flex flex-col justify-center md:justify-between pb-4 md:pb-8">

                    {/* Status Badge */}
                    <div className="hero-label flex items-center gap-3 mt-2 md:mt-2 mb-4 md:mb-6">
                        <div className="flex items-center gap-2 px-3 py-1.5 border border-amber-400/20 bg-amber-400/5">
                            <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                            <span className="font-mono-custom text-[10px] font-medium text-amber-400/80 uppercase tracking-[0.25em]">Sistema Activo — IA Clínica</span>
                        </div>
                    </div>

                    {/* Headline */}
                    <div className="max-w-xl pr-8 relative z-10">
                        <h1 className="font-serif text-[clamp(3.2rem,9vw,10.5rem)] leading-[0.88] tracking-tight text-white">
                            SANA<br />
                            <span className="text-outline italic">FLOW</span>
                        </h1>

                        {/* Desktop Loader — hidden on mobile */}
                        <div className="hidden md:flex justify-start -mt-10 -mb-20 md:-mt-12 md:-mb-28 relative z-0 pointer-events-none">
                            <Loader />
                        </div>
                        
                        {/* Mobile Loader — hidden on desktop, entirely separated to not affect each other */}
                        <div className="flex md:hidden justify-center -mt-16 -mb-28 relative z-0 pointer-events-none">
                            <MobileLoader />
                        </div>

                        <div className="mt-6 flex items-start gap-6 relative z-10">
                            <div className="w-10 h-px bg-amber-400/40 mt-3 shrink-0" />
                            <p className="font-mono-custom text-[11px] text-white/35 uppercase tracking-[0.3em] leading-relaxed max-w-xs">
                                Priorización clínica potenciada por Inteligencia Artificial y Arquitecturas Serverless.
                            </p>
                        </div>
                    </div>

                    {/* CTA */}
                    <button
                        ref={ctaRef}
                        onClick={() => document.getElementById('dashboard')?.scrollIntoView({ behavior: 'smooth' })}
                        className="w-fit flex items-center gap-5 group mt-8 lg:-translate-y-8"
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
                <div className="w-full md:w-72 lg:w-80 shrink-0 flex flex-col gap-3 justify-center z-20">
                    {[
                        { id: "001", title: "SISTEMA", val: "En Línea", type: "progress" },
                        { id: "002", title: "PROCESAMIENTO", val: "Asíncrono", type: "data" },
                        { id: "003", title: "MODELO", val: "Llama 3 Groq", type: "text" }
                    ].map((item) => (
                        <div
                            key={item.id}
                            className="command-cell border border-white/5 bg-white/2 backdrop-blur-md p-5 sm:p-6 hover:bg-white/4 hover:border-white/10 transition-all duration-500"
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
