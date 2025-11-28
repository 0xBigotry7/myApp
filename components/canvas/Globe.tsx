"use client";

import { useRef, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Line, Stars, useTexture, Html } from "@react-three/drei";
import * as THREE from "three";

interface GlobeProps {
  destinations?: Array<{
    latitude: number;
    longitude: number;
    city: string;
    country: string;
  }>;
}

const EARTH_RADIUS = 3.0;

function latLonToVector3(lat: number, lon: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = (radius * Math.sin(phi) * Math.sin(theta));
  const y = (radius * Math.cos(phi));
  return new THREE.Vector3(x, y, z);
}

function Earth() {
  const [colorMap, normalMap, specularMap, cloudsMap] = useTexture([
    "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg",
    "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg",
    "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg",
    "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png",
  ]);

  const earthRef = useRef<THREE.Mesh>(null!);
  const cloudsRef = useRef<THREE.Mesh>(null!);

  useFrame((state, delta) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * 0.05; // Slightly faster rotation
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.06;
    }
  });

  return (
    <>
      <mesh ref={earthRef} scale={[EARTH_RADIUS, EARTH_RADIUS, EARTH_RADIUS]}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshPhongMaterial
          map={colorMap}
          normalMap={normalMap}
          specularMap={specularMap}
          specular={new THREE.Color(0x444444)}
          shininess={25}
          emissive={new THREE.Color(0x112244)} // Add slight blue emissive for night side/brightness
          emissiveIntensity={0.1}
        />
      </mesh>
      <mesh ref={cloudsRef} scale={[EARTH_RADIUS + 0.03, EARTH_RADIUS + 0.03, EARTH_RADIUS + 0.03]}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshLambertMaterial
          map={cloudsMap}
          transparent={true}
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </>
  );
}

function DestinationMarkers({ destinations = [] }: { destinations: GlobeProps['destinations'] }) {
    const group = useRef<THREE.Group>(null!);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    useFrame((state, delta) => {
        if (group.current) {
            group.current.rotation.y += delta * 0.05; // Match earth rotation
        }
    });

    if (!destinations || destinations.length === 0) return null;

    return (
        <group ref={group}>
            {destinations.map((dest, i) => {
                const pos = latLonToVector3(dest.latitude, dest.longitude, EARTH_RADIUS + 0.05);
                const isHovered = hoveredIndex === i;

                return (
                    <group key={i} position={pos}>
                        {/* Invisible hitbox for easier hovering */}
                        <mesh 
                            visible={false}
                            onPointerOver={(e) => { 
                                e.stopPropagation(); 
                                setHoveredIndex(i); 
                                document.body.style.cursor = 'pointer'; 
                            }} 
                            onPointerOut={(e) => { 
                                e.stopPropagation(); 
                                setHoveredIndex(null); 
                                document.body.style.cursor = 'auto'; 
                            }}
                        >
                             <sphereGeometry args={[0.15, 16, 16]} />
                        </mesh>

                        {/* Marker Pin */}
                        <mesh position={[0, 0.02, 0]}>
                            <sphereGeometry args={[0.035, 16, 16]} />
                            <meshStandardMaterial 
                                color={isHovered ? "#fbbf24" : "#ff3b30"} 
                                emissive={isHovered ? "#fbbf24" : "#ff3b30"}
                                emissiveIntensity={0.8}
                                toneMapped={false}
                            />
                        </mesh>
                        
                        {/* Glow effect */}
                        <mesh scale={isHovered ? [2.5, 2.5, 2.5] : [1.8, 1.8, 1.8]}>
                            <sphereGeometry args={[0.03, 16, 16]} />
                            <meshBasicMaterial 
                                color={isHovered ? "#fbbf24" : "#ff3b30"} 
                                transparent 
                                opacity={isHovered ? 0.6 : 0.3} 
                            />
                        </mesh>
                        
                        {/* Pin stick */}
                        <mesh position={[0, -0.02, 0]}>
                           <cylinderGeometry args={[0.008, 0.008, 0.06, 8]} />
                           <meshBasicMaterial color="#ffffff" />
                        </mesh>

                        {/* Tooltip */}
                        {isHovered && (
                            <Html position={[0, 0.2, 0]} center distanceFactor={12} zIndexRange={[100, 0]}>
                                <div className="pointer-events-none px-4 py-2 bg-black/90 backdrop-blur-xl text-white rounded-xl border border-white/20 shadow-2xl whitespace-nowrap flex flex-col items-center transform transition-all duration-200 animate-in fade-in zoom-in-95">
                                    <span className="text-base font-bold text-white drop-shadow-sm">{dest.city}</span>
                                    <span className="text-xs font-medium text-blue-200 uppercase tracking-wider">{dest.country}</span>
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black/90 rotate-45 border-b border-r border-white/20"></div>
                                </div>
                            </Html>
                        )}
                    </group>
                );
            })}
        </group>
    );
}

function FlightPaths({ destinations = [] }: { destinations: GlobeProps['destinations'] }) {
    const group = useRef<THREE.Group>(null!);

    const lines = useMemo(() => {
        const pointsToConnect = destinations && destinations.length > 1 
            ? destinations.map(d => latLonToVector3(d.latitude, d.longitude, EARTH_RADIUS))
            : [];

        const paths = [];
        const count = 12;

        if (pointsToConnect.length > 1) {
             for (let i = 0; i < Math.min(pointsToConnect.length - 1, count); i++) {
                const start = pointsToConnect[i];
                const end = pointsToConnect[(i + 1) % pointsToConnect.length];
                
                const distance = start.distanceTo(end);
                const mid = start.clone().add(end).multiplyScalar(0.5).normalize().multiplyScalar(EARTH_RADIUS + distance * 0.5);
                
                const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
                paths.push(curve.getPoints(50));
             }
        } else {
            for (let i = 0; i < count; i++) {
                const phi1 = Math.random() * Math.PI;
                const theta1 = Math.random() * 2 * Math.PI;
                const phi2 = Math.random() * Math.PI;
                const theta2 = Math.random() * 2 * Math.PI;
                
                const start = new THREE.Vector3().setFromSphericalCoords(EARTH_RADIUS, phi1, theta1);
                const end = new THREE.Vector3().setFromSphericalCoords(EARTH_RADIUS, phi2, theta2);
                
                const distance = start.distanceTo(end);
                const mid = start.clone().add(end).multiplyScalar(0.5).normalize().multiplyScalar(EARTH_RADIUS + distance * 0.5);
                
                const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
                paths.push(curve.getPoints(50));
            }
        }
        return paths;
    }, [destinations]);

    useFrame((state, delta) => {
        if (group.current) {
            group.current.rotation.y += delta * 0.05;
        }
    });

    return (
        <group ref={group}>
            {lines.map((points, i) => (
                <Line
                    key={i}
                    points={points}
                    color="#60a5fa"
                    opacity={0.5}
                    transparent
                    lineWidth={2}
                />
            ))}
        </group>
    );
}

function Atmosphere() {
  return (
    <mesh scale={[EARTH_RADIUS + 0.15, EARTH_RADIUS + 0.15, EARTH_RADIUS + 0.15]}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshPhongMaterial
        color="#60a5fa"
        transparent
        opacity={0.15}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

export default function GlobeCanvas({ destinations }: GlobeProps) {
  return (
    <div className="absolute inset-0 h-full w-full bg-[#050505]">
      <Canvas camera={{ position: [0, 0, 9], fov: 45 }} dpr={[1, 2]} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}>
        {/* Dynamic Lighting Setup */}
        <ambientLight intensity={1.5} /> 
        <directionalLight position={[10, 10, 5]} intensity={2.5} color="#ffffff" />
        <pointLight position={[-10, -10, -5]} intensity={1.0} color="#4ca6ff" />
        <pointLight position={[0, 5, 0]} intensity={0.5} color="#a5f3fc" />
        
        {/* Enhanced Starfield */}
        <Stars radius={100} depth={50} count={7000} factor={4} saturation={0} fade speed={0.5} />
        
        <Earth />
        <DestinationMarkers destinations={destinations} />
        <FlightPaths destinations={destinations} />
        <Atmosphere />
        
        <OrbitControls 
            enableZoom={true} 
            enablePan={false} 
            enableRotate={true}
            autoRotate 
            autoRotateSpeed={0.8}
            minDistance={5}
            maxDistance={20}
        />
      </Canvas>
    </div>
  );
}
