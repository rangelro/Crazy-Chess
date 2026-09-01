import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useEffect, useMemo, useRef, useState } from 'react';
import { squareToPosition } from '../game3d/coordinates';
import { getBoardRotation, getPlayerCamera } from '../game3d/view';
import styles from './ChessBoard3D.module.css';

const squareKey = (linha, coluna) => `${linha}-${coluna}`;
const profile = (points) => points.map(([radius, height]) => new THREE.Vector2(radius, height));

const PAWN_PROFILE = profile([
  [0, 0], [.32, 0], [.4, .055], [.41, .12], [.34, .19], [.29, .22],
  [.25, .3], [.19, .42], [.16, .57], [.2, .64], [0, .64],
]);
const ROOK_PROFILE = profile([
  [0, 0], [.34, 0], [.43, .06], [.44, .13], [.35, .2], [.29, .25],
  [.24, .38], [.23, .61], [.3, .69], [.34, .73], [0, .73],
]);
const BISHOP_PROFILE = profile([
  [0, 0], [.35, 0], [.43, .06], [.44, .13], [.35, .2], [.28, .25],
  [.22, .42], [.17, .67], [.25, .76], [.25, .81], [0, .81],
]);
const QUEEN_PROFILE = profile([
  [0, 0], [.37, 0], [.45, .065], [.46, .14], [.36, .21], [.3, .25],
  [.24, .45], [.19, .72], [.29, .82], [.31, .9], [.24, .94], [0, .94],
]);
const KING_PROFILE = profile([
  [0, 0], [.38, 0], [.46, .065], [.47, .14], [.37, .21], [.3, .26],
  [.25, .48], [.2, .79], [.29, .89], [.27, .98], [0, .98],
]);
const KNIGHT_BASE_PROFILE = profile([
  [0, 0], [.36, 0], [.44, .06], [.45, .13], [.36, .2], [.29, .25],
  [.24, .39], [0, .43],
]);

const KNIGHT_SHAPE = new THREE.Shape();
KNIGHT_SHAPE.moveTo(-.25, .38);
KNIGHT_SHAPE.bezierCurveTo(-.2, .53, -.08, .62, -.04, .72);
KNIGHT_SHAPE.lineTo(-.11, .98);
KNIGHT_SHAPE.lineTo(.02, .9);
KNIGHT_SHAPE.lineTo(.13, 1.08);
KNIGHT_SHAPE.lineTo(.19, .84);
KNIGHT_SHAPE.bezierCurveTo(.37, .76, .42, .64, .39, .53);
KNIGHT_SHAPE.lineTo(.28, .47);
KNIGHT_SHAPE.lineTo(.09, .5);
KNIGHT_SHAPE.lineTo(-.03, .39);
KNIGHT_SHAPE.closePath();

function Camera() {
  const { camera } = useThree();

  useEffect(() => {
    const { position, target } = getPlayerCamera();
    camera.position.set(...position);
    camera.lookAt(...target);
    camera.updateProjectionMatrix();
  }, [camera]);

  return null;
}

function Surface({ color, dark = false }) {
  return (
    <meshPhysicalMaterial
      color={color}
      metalness={dark ? .26 : .08}
      roughness={dark ? .3 : .34}
      clearcoat={dark ? .72 : .48}
      clearcoatRoughness={.22}
    />
  );
}

function TurnedBody({ points, color, dark }) {
  return (
    <mesh castShadow receiveShadow>
      <latheGeometry args={[points, 48]} />
      <Surface color={color} dark={dark} />
    </mesh>
  );
}

function Pawn({ color, dark }) {
  return (
    <>
      <TurnedBody points={PAWN_PROFILE} color={color} dark={dark} />
      <mesh position={[0, .78, 0]} castShadow receiveShadow>
        <sphereGeometry args={[.22, 32, 24]} />
        <Surface color={color} dark={dark} />
      </mesh>
    </>
  );
}

function Rook({ color, dark }) {
  return (
    <>
      <TurnedBody points={ROOK_PROFILE} color={color} dark={dark} />
      <mesh position={[0, .79, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[.35, .35, .18, 32]} />
        <Surface color={color} dark={dark} />
      </mesh>
      {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle) => (
        <mesh
          key={angle}
          position={[Math.sin(angle) * .25, .93, Math.cos(angle) * .25]}
          rotation={[0, angle, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[.2, .2, .16]} />
          <Surface color={color} dark={dark} />
        </mesh>
      ))}
    </>
  );
}

function Knight({ color, dark }) {
  return (
    <>
      <TurnedBody points={KNIGHT_BASE_PROFILE} color={color} dark={dark} />
      <mesh position={[0, 0, -.11]} castShadow receiveShadow>
        <extrudeGeometry args={[KNIGHT_SHAPE, { depth: .22, bevelEnabled: true, bevelSegments: 3, bevelSize: .028, bevelThickness: .028, curveSegments: 16 }]} />
        <Surface color={color} dark={dark} />
      </mesh>
      <mesh position={[.2, .73, -.145]} rotation={[Math.PI / 2, 0, 0]}>
        <sphereGeometry args={[.027, 12, 8]} />
        <meshStandardMaterial color={dark ? '#c5a66f' : '#372d21'} roughness={.4} />
      </mesh>
    </>
  );
}

function Bishop({ color, dark }) {
  return (
    <>
      <TurnedBody points={BISHOP_PROFILE} color={color} dark={dark} />
      <mesh position={[0, .98, 0]} scale={[.82, 1.15, .82]} castShadow receiveShadow>
        <sphereGeometry args={[.23, 32, 24]} />
        <Surface color={color} dark={dark} />
      </mesh>
      <mesh position={[.045, 1.015, .19]} rotation={[0, 0, -.55]}>
        <boxGeometry args={[.055, .32, .035]} />
        <meshStandardMaterial color={dark ? '#080b0e' : '#675841'} roughness={.8} />
      </mesh>
      <mesh position={[0, 1.25, 0]} castShadow receiveShadow>
        <sphereGeometry args={[.065, 18, 12]} />
        <Surface color={color} dark={dark} />
      </mesh>
    </>
  );
}

function Queen({ color, dark }) {
  return (
    <>
      <TurnedBody points={QUEEN_PROFILE} color={color} dark={dark} />
      {Array.from({ length: 8 }, (_, index) => {
        const angle = index * Math.PI / 4;
        return (
          <mesh key={angle} position={[Math.sin(angle) * .24, 1.06, Math.cos(angle) * .24]} castShadow receiveShadow>
            <sphereGeometry args={[.075, 16, 12]} />
            <Surface color={color} dark={dark} />
          </mesh>
        );
      })}
      <mesh position={[0, 1.1, 0]} castShadow receiveShadow>
        <sphereGeometry args={[.1, 20, 14]} />
        <Surface color={color} dark={dark} />
      </mesh>
    </>
  );
}

function King({ color, dark }) {
  return (
    <>
      <TurnedBody points={KING_PROFILE} color={color} dark={dark} />
      <mesh position={[0, 1.12, 0]} castShadow receiveShadow>
        <sphereGeometry args={[.13, 24, 16]} />
        <Surface color={color} dark={dark} />
      </mesh>
      <mesh position={[0, 1.37, 0]} castShadow receiveShadow>
        <boxGeometry args={[.095, .38, .105]} />
        <Surface color={color} dark={dark} />
      </mesh>
      <mesh position={[0, 1.42, 0]} castShadow receiveShadow>
        <boxGeometry args={[.32, .095, .105]} />
        <Surface color={color} dark={dark} />
      </mesh>
    </>
  );
}

function PieceShape({ tipo, color, dark }) {
  if (tipo === 'torre') return <Rook color={color} dark={dark} />;
  if (tipo === 'cavalo') return <Knight color={color} dark={dark} />;
  if (tipo === 'bispo') return <Bishop color={color} dark={dark} />;
  if (tipo === 'rainha') return <Queen color={color} dark={dark} />;
  if (tipo === 'rei') return <King color={color} dark={dark} />;
  return <Pawn color={color} dark={dark} />;
}

function Piece({ peca, linha, coluna }) {
  const ref = useRef();
  const target = squareToPosition(linha, coluna);
  const dark = peca.cor === 'preto';
  const color = dark ? '#1b2026' : '#dfcfaf';

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.position.x = THREE.MathUtils.damp(ref.current.position.x, target[0], 12, delta);
    ref.current.position.z = THREE.MathUtils.damp(ref.current.position.z, target[2], 12, delta);
  });

  return (
    <group ref={ref} position={[target[0], .1, target[2]]}>
      <group rotation={[0, dark ? Math.PI : 0, 0]} scale={.8}>
        <PieceShape tipo={peca.tipo} color={color} dark={dark} />
      </group>
    </group>
  );
}

function BoardSquare({ linha, coluna, selected, destination, disabled, onSquareClick }) {
  const [x, , z] = squareToPosition(linha, coluna);
  const color = (linha + coluna) % 2 === 0 ? '#c8b28e' : '#5b4030';

  return (
    <group position={[x, 0, z]}>
      <mesh
        receiveShadow
        onClick={(event) => {
          event.stopPropagation();
          if (!disabled) onSquareClick(linha, coluna);
        }}
      >
        <boxGeometry args={[1, .12, 1]} />
        <meshStandardMaterial color={color} roughness={.62} metalness={.02} />
      </mesh>
      {(selected || destination) && (
        <mesh position={[0, .068, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[selected ? .27 : .1, selected ? .42 : .19, 40]} />
          <meshBasicMaterial
            color={selected ? '#e2bd72' : '#79bd90'}
            transparent
            opacity={destination ? .82 : .96}
            toneMapped={false}
          />
        </mesh>
      )}
    </group>
  );
}

function Scene({ tabuleiro, jogadorCor, casaSelecionada, movimentosPermitidos, onSquareClick, disabled }) {
  const destinationSet = useMemo(
    () => new Set(movimentosPermitidos.map(({ linha, coluna }) => squareKey(linha, coluna))),
    [movimentosPermitidos],
  );
  const pieces = useMemo(() => {
    const counters = new Map();
    return tabuleiro.flatMap((linha, linhaIndex) => linha.map((peca, coluna) => {
      if (!peca) return null;
      const kind = `${peca.cor}-${peca.tipo}`;
      const ordinal = counters.get(kind) || 0;
      counters.set(kind, ordinal + 1);
      return <Piece key={`${kind}-${ordinal}`} peca={peca} linha={linhaIndex} coluna={coluna} />;
    })).filter(Boolean);
  }, [tabuleiro]);

  return (
    <>
      <mesh position={[0, -.26, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#080b0f" roughness={1} />
      </mesh>
      <group rotation={[0, getBoardRotation(jogadorCor), 0]}>
        <mesh position={[0, -.12, 0]} receiveShadow castShadow>
          <boxGeometry args={[8, .24, 8]} />
          <meshStandardMaterial color="#241b17" roughness={.42} metalness={.08} />
        </mesh>
        {Array.from({ length: 8 }, (_, linha) => Array.from({ length: 8 }, (_, coluna) => (
          <BoardSquare
            key={squareKey(linha, coluna)}
            linha={linha}
            coluna={coluna}
            selected={casaSelecionada?.linha === linha && casaSelecionada?.coluna === coluna}
            destination={destinationSet.has(squareKey(linha, coluna))}
            disabled={disabled}
            onSquareClick={onSquareClick}
          />
        )))}
        {pieces}
      </group>
    </>
  );
}

export default function ChessBoard3D(props) {
  const [unavailable, setUnavailable] = useState(() => typeof window === 'undefined' || !window.WebGLRenderingContext);

  useEffect(() => {
    if (unavailable) props.onFallback?.();
  }, [unavailable, props.onFallback]);

  if (unavailable) return null;

  return (
    <div className={styles.scene} aria-label="Tabuleiro de xadrez 3D">
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ fov: 34, near: .1, far: 60 }}
        onCreated={({ gl }) => {
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
        }}
        onError={() => setUnavailable(true)}
      >
        <color attach="background" args={['#080b0f']} />
        <hemisphereLight args={['#c8d3cb', '#11100f', .65]} />
        <directionalLight
          position={[0, 10, 1.5]}
          intensity={3.2}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-5.5}
          shadow-camera-right={5.5}
          shadow-camera-top={5.5}
          shadow-camera-bottom={-5.5}
          shadow-bias={-.0002}
        />
        <spotLight
          position={[0, 9.5, 1]}
          angle={.72}
          penumbra={.9}
          intensity={55}
          distance={26}
          color="#f0d8aa"
          castShadow
        />
        <Camera />
        <Scene {...props} />
      </Canvas>
    </div>
  );
}
