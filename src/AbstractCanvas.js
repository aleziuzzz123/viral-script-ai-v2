import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
// We might use GLTFLoader later, but it's removed for now to fix the build error.
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'; 

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
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const directionalLight1 = new THREE.DirectionalLight(0xffaaff, 2);
        directionalLight1.position.set(10, 10, 10);
        scene.add(directionalLight1);
        
        const directionalLight2 = new THREE.DirectionalLight(0xaaffff, 2);
        directionalLight2.position.set(-10, -10, 5);
        scene.add(directionalLight2);

        // --- Texture Loading ---
        const textureLoader = new THREE.TextureLoader();
        const objects = [];
        const texturePaths = [
            '/images/abstract 2.png',
            '/images/abtract 3.png',
            // Add more of your abstract shape image paths here
        ];

        texturePaths.forEach(path => {
            textureLoader.load(path, (texture) => {
                // Use a simple Plane geometry to display the 2D texture in 3D space
                const material = new THREE.MeshBasicMaterial({ 
                    map: texture, 
                    transparent: true,
                    alphaTest: 0.5, // Helps with clean edges on transparent PNGs
                });
                const geometry = new THREE.PlaneGeometry(3, 3); // Adjust size as needed
                const plane = new THREE.Mesh(geometry, material);

                // Position objects randomly
                plane.position.x = (Math.random() - 0.5) * 15;
                plane.position.y = (Math.random() - 0.5) * 15;
                plane.position.z = (Math.random() - 0.5) * 10 - 5;

                // Store random movement vectors and rotation speeds
                plane.userData.velocity = new THREE.Vector3(
                    (Math.random() - 0.5) * 0.005,
                    (Math.random() - 0.5) * 0.005,
                    0
                );
                 plane.userData.rotationSpeed = (Math.random() - 0.5) * 0.002;

                scene.add(plane);
                objects.push(plane);
            });
        });

        camera.position.z = 10;

        // --- Mouse Interaction ---
        const mouse = new THREE.Vector2();
        const onMouseMove = (event) => {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        };
        window.addEventListener('mousemove', onMouseMove);

        // --- Animation Loop ---
        const clock = new THREE.Clock();
        const animate = () => {
            requestAnimationFrame(animate);
            const elapsedTime = clock.getElapsedTime();

            // Animate objects
            objects.forEach(obj => {
                // Move objects based on their velocity
                obj.position.add(obj.userData.velocity);
                
                // Add a slow, sine-wave based bobbing motion
                obj.position.y += Math.sin(elapsedTime + obj.position.x) * 0.001;

                // Rotate them
                obj.rotation.z += obj.userData.rotationSpeed;

                // Boundary check to keep them on screen
                if (obj.position.x > 10 || obj.position.x < -10) obj.userData.velocity.x *= -1;
                if (obj.position.y > 10 || obj.position.y < -10) obj.userData.velocity.y *= -1;
            });
            
            // Subtle camera parallax effect
            camera.position.x += (mouse.x * 0.5 - camera.position.x) * 0.02;
            camera.position.y += (mouse.y * 0.5 - camera.position.y) * 0.02;
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
            if (currentMount && renderer.domElement) {
                currentMount.removeChild(renderer.domElement);
            }
        };
    }, []);

    return <div ref={mountRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }} />;
};

export default AbstractCanvas;

