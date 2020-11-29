import * as THREE from 'three';
import React, { Suspense, useEffect } from 'react';
import { Canvas, useThree, useLoader } from 'react-three-fiber';
import { Html, OrbitControls, useGLTF } from '@react-three/drei';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

import './styles.css';

function traverseMaterials(object, callback) {
  object.traverse((node) => {
    if (!node.isMesh) return;
    const materials = Array.isArray(node.material)
      ? node.material
      : [node.material];
    materials.forEach(callback);
  });
}

const Model = ({ modelPath }) => {
  const gltf = useGLTF(modelPath, true);
  // const gltf = useLoader(GLTFLoader, suzanne);
  console.log(gltf);

  // const encoding = THREE.sRGBEncoding; // OR LinearEncoding
  // traverseMaterials(gltf.scene, (material) => {
  //   // console.log("----ENCODING---------", material.map.encoding);
  //   // console.log("----ENCODING---------", encoding);
  //   if (material.map) {
  //     material.map.encoding = encoding;
  //     // console.log("----ENCODING---------", material.map.anisotropy);
  //     // material.map.anisotropy = 16;

  //     material.map.minFilter = THREE.LinearFilter;
  //   }
  //   if (material.emissiveMap) material.emissiveMap.encoding = encoding;
  //   if (material.map || material.emissiveMap) material.needsUpdate = true;
  // });

  // return <primitive object={gltf.scene} dispose={null}></primitive>;

  const texture = useLoader(THREE.TextureLoader, '/flakes.png');

  const materialProps = {
    clearcoat: 1.0,
    clearcoatRoughness: 0,
    metalness: 0.1,
    roughness: 0.4,
    color: 'red',
    normalMap: texture,
    normalScale: [0.3, 0.3],
    'normalMap-wrapS': THREE.RepeatWrapping,
    'normalMap-wrapT': THREE.RepeatWrapping,
    'normalMap-repeat': [30, 30],
    'normalMap-anisotropy': 16,
    envMapIntensity: 0.8,
    transmission: 0.6,
    opacity: 1,
    transparent: true,
  };

  return (
    <group>
      <mesh geometry={gltf.nodes.Suzanne.geometry}>
        <meshPhysicalMaterial {...materialProps} side={THREE.BackSide} />
      </mesh>
      <mesh geometry={gltf.nodes.Suzanne.geometry}>
        <meshPhysicalMaterial
          {...materialProps}
          transmission={0.95}
          color="white"
        />
      </mesh>
    </group>
  );
};

const useEquirectangularHDR = (url) => {
  const { gl } = useThree();

  const pmremGenerator = new THREE.PMREMGenerator(gl);
  pmremGenerator.compileEquirectangularShader();

  const hdrEquirect = useLoader(RGBELoader, url);

  // hdrEquirect.encoding = THREE.RGBM16Encoding;
  // hdrEquirect.magFilter = THREE.LinearFilter;
  // hdrEquirect.format = THREE.RGBAFormat;

  const hdrCubeRenderTarget = pmremGenerator.fromEquirectangular(hdrEquirect);
  hdrEquirect.dispose();
  pmremGenerator.dispose();

  return hdrCubeRenderTarget.texture;
};

function Environment({ background = false }) {
  const { gl, scene } = useThree();
  const envTexture = useEquirectangularHDR('/venice_sunset_1k.hdr');

  useEffect(() => {
    if (envTexture) {
      console.log('------------ENV--------');
      scene.environment = envTexture;
      gl.toneMappingExposure = 0.5;
      gl.outputEncoding = THREE.sRGBEncoding;

      // console.error("current", gl.toneMapping); // by default, filmic
      // console.error("filmic", THREE.ACESFilmicToneMapping);

      gl.toneMapping = THREE.NoToneMapping; // make color better
      // console.error(gl.capabilities.getMaxAnisotropy());
    }
  }, [envTexture, gl, scene]);

  return null;
}

const Content = () => {
  return (
    <>
      <mesh position={[0, 0, 0]}>
        <Model modelPath={'/suzanne.glb'} />
      </mesh>
    </>
  );
};

export default function App() {
  return (
    <div className="App">
      <Canvas
        // invalidateFrameloop
        colorManagement
        camera={{ position: [0, 0, 3.5], fov: 40 }}
        gl={{
          antialias: true,
          physicallyCorrectLights: false,
        }}
        pixelRatio={window.devicePixelRatio}
        shadowMap={false}
      >
        {/* <ambientLight intensity={1} /> */}
        <directionalLight position={[10, 10, 5]} intensity={2} />
        <directionalLight position={[-10, -10, -5]} intensity={1} />
        <OrbitControls
          enableDamping
          enableZoom={false}
          enablePan={false}
          dampingFactor={0.05}
          rotateSpeed={1.1}
          minPolarAngle={Math.PI / 3.5}
          maxPolarAngle={Math.PI / 1.5}
        />
        <Suspense fallback={<Html>loading..</Html>}>
          <Environment />
          <Content />
        </Suspense>
      </Canvas>
    </div>
  );
}
