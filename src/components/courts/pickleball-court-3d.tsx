"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls, RoundedBox, Text } from "@react-three/drei";
import type { Group, Mesh } from "three";
import type { CourtPlayerInfo } from "./types";

const COURT_W = 4.4;
const COURT_D = 8.8;
const KITCHEN = 1.4;

function Grass() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
      <planeGeometry args={[14, 16]} />
      <meshStandardMaterial color="#b8e8c8" roughness={0.92} />
    </mesh>
  );
}

function CourtSurface() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[COURT_W, COURT_D]} />
        <meshStandardMaterial color="#8ecae6" roughness={0.45} metalness={0.08} />
      </mesh>
      <CourtLines />
    </group>
  );
}

function CourtLines() {
  const lineMat = { color: "#ffffff", transparent: true, opacity: 0.95 };
  const y = 0.02;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]}>
        <planeGeometry args={[COURT_W, 0.06]} />
        <meshBasicMaterial {...lineMat} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, COURT_D / 2 - 0.03]}>
        <planeGeometry args={[COURT_W, 0.06]} />
        <meshBasicMaterial {...lineMat} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, -COURT_D / 2 + 0.03]}>
        <planeGeometry args={[COURT_W, 0.06]} />
        <meshBasicMaterial {...lineMat} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, KITCHEN / 2]}>
        <planeGeometry args={[COURT_W, 0.04]} />
        <meshBasicMaterial {...lineMat} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, -KITCHEN / 2]}>
        <planeGeometry args={[COURT_W, 0.04]} />
        <meshBasicMaterial {...lineMat} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]}>
        <planeGeometry args={[0.04, COURT_D]} />
        <meshBasicMaterial {...lineMat} />
      </mesh>
    </group>
  );
}

function Net() {
  return (
    <group position={[0, 0.45, 0]}>
      <mesh>
        <boxGeometry args={[COURT_W + 0.2, 0.9, 0.06]} />
        <meshStandardMaterial color="#ff85a2" roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[COURT_W + 0.2, 0.04, 0.08]} />
        <meshStandardMaterial color="#fff" />
      </mesh>
    </group>
  );
}

function FencePost({ x, z }: { x: number; z: number }) {
  return (
    <mesh position={[x, 0.55, z]} castShadow>
      <cylinderGeometry args={[0.04, 0.04, 1.1, 8]} />
      <meshStandardMaterial color="#e9d5ff" metalness={0.2} roughness={0.5} />
    </mesh>
  );
}

function Fence() {
  const posts: [number, number][] = [
    [-2.4, -4.8],
    [2.4, -4.8],
    [-2.4, 4.8],
    [2.4, 4.8],
    [-2.4, 0],
    [2.4, 0],
  ];
  return (
    <group>
      {posts.map(([x, z]) => (
        <FencePost key={`${x}-${z}`} x={x} z={z} />
      ))}
    </group>
  );
}

function BlossomTree({ x, z, scale = 1 }: { x: number; z: number; scale?: number }) {
  return (
    <group position={[x, 0, z]} scale={scale}>
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.14, 0.65, 8]} />
        <meshStandardMaterial color="#c4a484" />
      </mesh>
      <mesh position={[0, 1.05, 0]} castShadow>
        <sphereGeometry args={[0.5, 12, 12]} />
        <meshStandardMaterial color="#ffb7d5" roughness={0.75} />
      </mesh>
      <mesh position={[-0.35, 0.95, 0.1]} castShadow>
        <sphereGeometry args={[0.32, 10, 10]} />
        <meshStandardMaterial color="#ffc8dd" />
      </mesh>
      <mesh position={[0.3, 1.0, -0.1]} castShadow>
        <sphereGeometry args={[0.28, 10, 10]} />
        <meshStandardMaterial color="#ffafcc" />
      </mesh>
    </group>
  );
}

function FemaleCharacter({
  color,
  hairColor,
}: {
  color: string;
  hairColor: string;
}) {
  return (
    <group>
      <mesh position={[0, 0.28, 0]} castShadow>
        <cylinderGeometry args={[0.26, 0.34, 0.55, 12]} />
        <meshStandardMaterial color={color} roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.64, 0]} castShadow>
        <sphereGeometry args={[0.21, 16, 16]} />
        <meshStandardMaterial color="#ffe4d0" roughness={0.65} />
      </mesh>
      <mesh position={[0, 0.72, -0.08]} castShadow>
        <sphereGeometry args={[0.24, 16, 16]} />
        <meshStandardMaterial color={hairColor} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.62, -0.22]} rotation={[0.4, 0, 0]} castShadow>
        <capsuleGeometry args={[0.07, 0.35, 4, 8]} />
        <meshStandardMaterial color={hairColor} />
      </mesh>
      <mesh position={[0, 0.78, 0.06]} castShadow>
        <boxGeometry args={[0.14, 0.06, 0.04]} />
        <meshStandardMaterial color="#ff85a2" />
      </mesh>
      <RoundedBox
        args={[0.32, 0.48, 0.06]}
        radius={0.02}
        position={[0.3, 0.4, 0.14]}
        rotation={[0.3, 0.4, -0.5]}
        castShadow
      >
        <meshStandardMaterial color="#ffe066" metalness={0.15} roughness={0.35} />
      </RoundedBox>
    </group>
  );
}

function MaleCharacter({ color }: { color: string }) {
  return (
    <group>
      <mesh position={[0, 0.22, 0]} castShadow>
        <capsuleGeometry args={[0.22, 0.5, 6, 12]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.62, 0]} castShadow>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#fcd9b6" roughness={0.7} />
      </mesh>
      <RoundedBox
        args={[0.35, 0.5, 0.06]}
        radius={0.02}
        position={[0.32, 0.38, 0.12]}
        rotation={[0.3, 0.4, -0.5]}
        castShadow
      >
        <meshStandardMaterial color="#f5d76e" />
      </RoundedBox>
    </group>
  );
}

function PlayerCharacter({
  position,
  team,
  player,
  faceZ,
}: {
  position: [number, number, number];
  team: "A" | "B";
  player: CourtPlayerInfo;
  faceZ: number;
}) {
  const group = useRef<Group>(null);
  const dressColor = team === "A" ? "#ff85a2" : "#a78bfa";
  const hairColors = ["#5c3d2e", "#2d1b14", "#8b5a3c", "#c9956b"];
  const hairColor =
    hairColors[Math.abs(player.name.charCodeAt(0)) % hairColors.length];
  const isFemale = player.gender !== "male";

  useFrame(({ clock }) => {
    if (!group.current) return;
    group.current.position.y =
      position[1] + Math.sin(clock.elapsedTime * 3 + position[0]) * 0.04;
  });

  return (
    <group ref={group} position={position} rotation={[0, faceZ > 0 ? Math.PI : 0, 0]}>
      {isFemale ? (
        <FemaleCharacter color={dressColor} hairColor={hairColor} />
      ) : (
        <MaleCharacter color={dressColor} />
      )}
      <Html
        position={[0, 1.15, 0]}
        center
        distanceFactor={9}
        style={{ pointerEvents: "none" }}
      >
        <div className="whitespace-nowrap rounded-full border border-pink-200 bg-white/95 px-2.5 py-0.5 text-[10px] font-bold text-pink-600 shadow-sm">
          {player.name.split(" ")[0]} ♡
        </div>
      </Html>
    </group>
  );
}

function Ball({ isPlaying, sidesSwapped }: { isPlaying: boolean; sidesSwapped: boolean }) {
  const ref = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    if (!ref.current || !isPlaying) return;
    const t = clock.elapsedTime * 1.4;
    const dir = sidesSwapped ? -1 : 1;
    ref.current.position.x = Math.sin(t) * 1.2 * dir;
    ref.current.position.y = 0.55 + Math.abs(Math.sin(t * 2)) * 0.5;
    ref.current.position.z = Math.cos(t) * 1.8;
  });

  if (!isPlaying) return null;

  return (
    <mesh ref={ref} position={[0, 0.55, 0]} castShadow>
      <sphereGeometry args={[0.1, 16, 16]} />
      <meshStandardMaterial color="#ffe066" emissive="#fbbf24" emissiveIntensity={0.35} />
    </mesh>
  );
}

function CourtScene({
  teamA,
  teamB,
  sidesSwapped,
  isPlaying,
}: {
  teamA: [CourtPlayerInfo, CourtPlayerInfo];
  teamB: [CourtPlayerInfo, CourtPlayerInfo];
  sidesSwapped: boolean;
  isPlaying: boolean;
}) {
  const left = sidesSwapped ? teamB : teamA;
  const right = sidesSwapped ? teamA : teamB;
  const leftTeam = (sidesSwapped ? "B" : "A") as "A" | "B";
  const rightTeam = (sidesSwapped ? "A" : "B") as "A" | "B";

  const lz = -2.2;
  const rz = 2.2;

  return (
    <>
      <ambientLight intensity={0.65} />
      <directionalLight
        position={[6, 12, 4]}
        intensity={1.1}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-4, 6, -6]} intensity={0.4} color="#ffe4f0" />
      <pointLight position={[0, 4, 0]} intensity={0.3} color="#ffb7d5" />

      <Grass />
      <CourtSurface />
      <Net />
      <Fence />
      <BlossomTree x={-5.5} z={-3} />
      <BlossomTree x={5.5} z={3} scale={0.85} />
      <BlossomTree x={5.8} z={-2.5} scale={0.7} />

      <PlayerCharacter
        position={[-0.9, 0, lz]}
        team={leftTeam}
        player={left[0]}
        faceZ={1}
      />
      <PlayerCharacter
        position={[0.9, 0, lz]}
        team={leftTeam}
        player={left[1]}
        faceZ={1}
      />
      <PlayerCharacter
        position={[-0.9, 0, rz]}
        team={rightTeam}
        player={right[0]}
        faceZ={-1}
      />
      <PlayerCharacter
        position={[0.9, 0, rz]}
        team={rightTeam}
        player={right[1]}
        faceZ={-1}
      />

      <Ball isPlaying={isPlaying} sidesSwapped={sidesSwapped} />

      <Text
        position={[0, 0.05, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.32}
        color="#ffb7d5"
        anchorX="center"
        anchorY="middle"
        fillOpacity={0.35}
      >
        SisClub
      </Text>
    </>
  );
}

function EmptyCourtScene3D() {
  return (
    <>
      <ambientLight intensity={0.65} />
      <directionalLight position={[6, 12, 4]} intensity={1.1} castShadow />
      <pointLight position={[0, 4, 0]} intensity={0.25} color="#ffb7d5" />
      <Grass />
      <CourtSurface />
      <Net />
      <Fence />
      <BlossomTree x={-5.5} z={-3} />
      <BlossomTree x={5.5} z={3} />
      <Text
        position={[0, 1.2, 0]}
        fontSize={0.28}
        color="#e85d82"
        anchorX="center"
        anchorY="middle"
      >
        Court Ready ♡
      </Text>
    </>
  );
}

export function PickleballCourt3D({
  teamA,
  teamB,
  sidesSwapped = false,
  isPlaying = false,
  className,
}: {
  teamA: [CourtPlayerInfo, CourtPlayerInfo];
  teamB: [CourtPlayerInfo, CourtPlayerInfo];
  sidesSwapped?: boolean;
  isPlaying?: boolean;
  className?: string;
}) {
  const hasPlayers =
    teamA[0].name !== "—" &&
    teamA[1].name !== "—" &&
    teamB[0].name !== "—" &&
    teamB[1].name !== "—";

  return (
    <div className={className} style={{ width: "100%", height: "100%" }}>
      <Canvas
        shadows
        camera={{ position: [0, 9, 10], fov: 38, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: true }}
        style={{
          background: "linear-gradient(180deg, #fff5f8 0%, #f3e8ff 50%, #ecfdf5 100%)",
        }}
      >
        <OrbitControls
          enablePan={false}
          minPolarAngle={Math.PI / 5}
          maxPolarAngle={Math.PI / 2.1}
          minDistance={9}
          maxDistance={18}
          target={[0, 0, 0]}
        />
        {hasPlayers ? (
          <CourtScene
            teamA={teamA}
            teamB={teamB}
            sidesSwapped={sidesSwapped}
            isPlaying={isPlaying}
          />
        ) : (
          <EmptyCourtScene3D />
        )}
      </Canvas>
    </div>
  );
}
