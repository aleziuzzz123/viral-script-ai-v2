import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

// This component creates a dynamic, animated 3D abstract background using Three.js.
const AbstractCanvas = () => {
    const mountRef = useRef(null);

    useEffect(() => {
        // --- Basic Scene Setup ---
        const currentMount = mountRef.current;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        
        renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        currentMount.appendChild(renderer.domElement);

        // --- Lighting ---
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 7.5);
        scene.add(directionalLight);
        
        const pointLight = new THREE.PointLight(0xff88ff, 1.5, 100);
        pointLight.position.set(-5, -5, 5);
        scene.add(pointLight);

        // --- Geometry and Material ---
        // Using Icosahedron for a more complex shape than a simple sphere
        const geometry = new THREE.IcosahedronGeometry(1, 0); 
        const material = new THREE.MeshStandardMaterial({
            color: 0x8A2BE2, // A nice purple
            emissive: 0xaa00aa,
            emissiveIntensity: 0.1,
            metalness: 0.8,
            roughness: 0.2,
            wireframe: true, // Gives it a cool, techy look
        });

        // --- Create and position multiple objects ---
        const objects = [];
        const numberOfObjects = 30;

        for (let i = 0; i < numberOfObjects; i++) {
            const mesh = new THREE.Mesh(geometry, material);
            
            // Position objects randomly in a larger volume
            mesh.position.x = (Math.random() - 0.5) * 20;
            mesh.position.y = (Math.random() - 0.5) * 20;
            mesh.position.z = (Math.random() - 0.5) * 20;
            
            // Random rotation
            mesh.rotation.x = Math.random() * 2 * Math.PI;
            mesh.rotation.y = Math.random() * 2 * Math.PI;

            // Store a random rotation speed for each object
            mesh.userData.rotationSpeed = {
                x: (Math.random() - 0.5) * 0.01,
                y: (Math.random() - 0.5) * 0.01,
            };

            scene.add(mesh);
            objects.push(mesh);
        }

        camera.position.z = 5;

        // --- Mouse Interaction ---
        const mouse = new THREE.Vector2();
        const onMouseMove = (event) => {
            // Normalize mouse position from -1 to +1
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        };
        window.addEventListener('mousemove', onMouseMove);

        // --- Animation Loop ---
        const animate = () => {
            requestAnimationFrame(animate);

            // Animate objects
            objects.forEach(obj => {
                obj.rotation.x += obj.userData.rotationSpeed.x;
                obj.rotation.y += obj.userData.rotationSpeed.y;
            });
            
            // Animate camera based on mouse position for a subtle parallax effect
            camera.position.x += (mouse.x * 2 - camera.position.x) * 0.02;
            camera.position.y += (mouse.y * 2 - camera.position.y) * 0.02;
            camera.lookAt(scene.position);

            renderer.render(scene, camera);
        };
        animate();

        // --- Handle window resize ---
        const onWindowResize = () => {
            camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
        };
        window.addEventListener('resize', onWindowResize);

        // --- Cleanup function ---
        return () => {
            window.removeEventListener('resize', onWindowResize);
            window.removeEventListener('mousemove', onMouseMove);
            currentMount.removeChild(renderer.domElement);
        };
    }, []);

    return <div ref={mountRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }} />;
};

export default AbstractCanvas;

