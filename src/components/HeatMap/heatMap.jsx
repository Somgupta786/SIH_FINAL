"use client";

import React, { useEffect, useState, useRef } from "react";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import TWEEN from "@tweenjs/tween.js";

import axios from "axios";

const ModelViewer = ({
  shadowOpacity = 0.5,
  shadowResolution = 2048,
  lightIntensity = 1,
  modelScale = 10,
  modelPath = "/models/",
  objFile = "updated.obj",
  mtlFile = "updated.mtl",
  geoJsonPath = "/models/eeshu_geo.geojson",
}) => {
  const mountRef = useRef(null);
  const [timeOfDay, setTimeOfDay] = useState(5.5);
  const [datetime, setDatetime] = useState("2024-10-26T11:28");
  const [sunPosition, setSunPosition] = useState({ x: 90, y: 90, z: 180 });
  const [ghi, setGhi] = useState("");
  const [needleRotation, setNeedleRotation] = useState(0);

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      1,
      1000
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(
      mountRef.current.clientWidth,
      mountRef.current.clientHeight
    );

    renderer.setClearColor(0xb8dff8);
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.5;
    controls.minDistance = 1;
    controls.maxDistance = 500;
    controls.minPolarAngle = 0;
    controls.maxPolarAngle = Math.PI / 2;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(
      0xffffff,
      lightIntensity
    );
    directionalLight.position.set(100, 200, 100);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = shadowResolution;
    directionalLight.shadow.mapSize.height = shadowResolution;

    // Shadow camera adjustments
    directionalLight.shadow.camera.left = -150;
    directionalLight.shadow.camera.right = 150;
    directionalLight.shadow.camera.top = 150;
    directionalLight.shadow.camera.bottom = -150;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;

    scene.add(directionalLight);
    // Track changes in camera orientation and update compass needle
    controls.addEventListener("change", () => {
      // Calculate compass needle rotation (Y-axis rotation of the camera)
      const rotationY = Math.atan2(camera.position.x, camera.position.z);
      setNeedleRotation(-rotationY * (180 / Math.PI)); // Convert radians to degrees
    });

    // 🌞 Create the Sun model
    const sunRadius = 10; // Size of the Sun
    const sunGeometry = new THREE.SphereGeometry(sunRadius, 32, 32);
    const sunMaterial = new THREE.MeshStandardMaterial({
      emissive: 0xcb8c45,
      emissiveIntensity: 1.5,
      color: 0xcb8c45,
    });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    // Update the sun mesh position to match the light source
    sun.position.copy(directionalLight.position);
    scene.add(sun);
    // ArrowHelper for light source visualization
    const lightDirection = new THREE.Vector3(-1, -1, 0).normalize();
    const arrowHelper = new THREE.ArrowHelper(
      lightDirection,
      directionalLight.position,
      50,
      0xc4a948 // Red color
    );
    scene.add(arrowHelper);
    const arrowHelper2 = new THREE.ArrowHelper(
      lightDirection,
      directionalLight.position,
      50,
      0xc4a948 // Red color
    );
    scene.add(arrowHelper2);

    const groundSize = 1000;
    // Load grass texture
    const textureLoader = new THREE.TextureLoader();
    const grassTexture = textureLoader.load("/try.webp");
    grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
    grassTexture.repeat.set(50, 50); // Adjust the repeat to fit the ground size

    // const groundMaterial = new THREE.MeshStandardMaterial({ color: 0xf0e170 });
    const groundMaterial = new THREE.MeshStandardMaterial({
      map: grassTexture,
    });
    const groundGeometry = new THREE.PlaneGeometry(groundSize, 1600);
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    scene.add(ground);
    camera.position.set(0, 100, 200);
    const mtlLoader = new MTLLoader();
    mtlLoader.setPath(modelPath);
    mtlLoader.load(mtlFile, (materials) => {
      materials.preload();
      // Load GeoJSON data
      const loader = new THREE.FileLoader();
      loader.load(geoJsonPath, (geoJsonData) => {
        const geoJson = JSON.parse(geoJsonData);
        console.log(geoJson.features);
        const objLoader = new OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.setPath(modelPath);
        objLoader.load(
          objFile,
          (object) => {
            let buildingId = 0;
            object.children.forEach((child) => {
              if (child.isMesh) {
              
               

                const buildingScaleFactor = 0.3;
                child.scale.set(
                  buildingScaleFactor,
                  buildingScaleFactor,
                  buildingScaleFactor
                );

                scene.add(child);
                // // Calculate the height of the building by getting its bounding box
                // const boundingBox = new THREE.Box3().setFromObject(child);
                // const height = boundingBox.max.y - boundingBox.min.y;
              }
            });

            object.scale.set(modelScale, modelScale, modelScale);
          },
          undefined,
          (error) => {
            console.error("Error loading OBJ:", error);
          }
        );
      });
    });

    camera.position.set(0, 50, 150);

    const getColorByHeight = (height) => {
      if (height < 5) {
        return 0xe699ab; // Hexadecimal value without quotes
      } else if (height >= 5 && height <= 10) {
        return 0x6e6100;
      } else if (height >= 11 && height <= 15) {
        return 0x5800e5;
      } else if (height >= 16 && height <= 20) {
        return 0xe5ca00;
      } else if (height >= 21 && height <= 25) {
        return 0x2be57f;
      } else if (height >= 26 && height <= 30) {
        return 0x177b44;
      } else {
        return 0x730000;
      }
    };
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const updateSunPosition = () => {
      const angle = (timeOfDay / 24) * Math.PI * 2;
      const sunX = Math.cos(angle) * 150;
      const sunY = Math.max(Math.sin(angle) * 150, 10);
      const sunZ = 0;

      //❌ directionalLight.position.set(sunX, sunY, sunZ);
      directionalLight.position.set(
        sunPosition.x,
        sunPosition.y,
        sunPosition.z
      );
      directionalLight.target.updateMatrixWorld();

      // Update ArrowHelper to point in the new direction
      arrowHelper.position.copy(directionalLight.position);
      sun.position.copy(directionalLight.position);
      arrowHelper.setDirection(
        // ❌new THREE.Vector3(-sunX, -sunY, -sunZ).normalize()
        new THREE.Vector3(
          -sunPosition.x,
          -sunPosition.y,
          -sunPosition.z
        ).normalize()
      );
      // Update ArrowHelper to point in the new direction
      arrowHelper2.position.copy(directionalLight.position);

      arrowHelper2.setDirection(
        // ❌new THREE.Vector3(-sunX, -sunY, -sunZ).normalize()
        new THREE.Vector3(
          -sunPosition.x,
          -sunPosition.y,
          -sunPosition.z + 30
        ).normalize()
      );

      // Raycasting logic
      raycaster.set(
        directionalLight.position,
        new THREE.Vector3(-sunX, -sunY, -sunZ).normalize()
      );
      const intersects = raycaster.intersectObjects(scene.children, true);

      // Highlight intersected objects
      scene.children.forEach((child) => {
        if (child.isMesh && child.userData.isBuilding) {
          child.material.emissive.setHex(0x000000); // Reset color
        }
      });

      intersects.forEach((intersect) => {
        if (intersect.object.userData.isBuilding) {
          intersect.object.material.emissive.setHex(0xff0000); // Highlight in red
        }
      });
    };

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();

      updateSunPosition();
      renderer.render(scene, camera);
    };

    animate();
    const handleMouseClick = async (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // Cast a ray
      raycaster.setFromCamera(mouse, camera);

      // Intersect with all objects
      const intersects = raycaster.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
        const clickedMesh = intersects.find(
          (intersect) => intersect.object.userData.isBuilding
        )?.object;

        if (clickedMesh) {
          console.log("Clicked building:", clickedMesh);

          // Highlight the clicked building
          clickedMesh.material.color.set(0xff0000); // Set to red

          // Add ripple effect at the click position
          const ripple = document.createElement("div");
          ripple.style.position = "absolute";
          ripple.style.width = "100px";
          ripple.style.height = "100px";
          ripple.style.borderRadius = "50%";
          ripple.style.background = "rgba(0, 128, 255, 0.5)";
          ripple.style.left = `${event.clientX - 50}px`;
          ripple.style.top = `${event.clientY - 50}px`;
          ripple.style.pointerEvents = "none";
          ripple.style.animation = "rippleEffect 1s ease-out";
          document.body.appendChild(ripple);

          // Remove ripple after animation
          ripple.addEventListener("animationend", () => {
            document.body.removeChild(ripple);
          });

          // Calculate dimensions
          const boundingBox = new THREE.Box3().setFromObject(clickedMesh);

          // API Call
          const length = boundingBox.max.x - boundingBox.min.x;
          const width = boundingBox.max.z - boundingBox.min.z;

          const formattedDatetime = `${datetime}:00`;
          const payload = {
            height: clickedMesh.userData.height.toString(),
            length: length.toString(),
            breadth: width.toString(),
            date_time: formattedDatetime.replace("T", " "),
            latitude: clickedMesh.userData.latitude.toString(),
            longitude: clickedMesh.userData.longitude.toString(),
            solar_irradiance: "0.4",
          };

          try {
            const response = await axios.post(
              "https://solaris-vd5p.onrender.com/api/solar_potential/",
              payload,
              {
                headers: {
                  "Content-Type": "application/json",
                },
              }
            );
            console.log("API Response:", response.data);
          } catch (error) {
            console.error("Error calling API:", error);
          }
        }
      }
    };

    window.addEventListener("click", handleMouseClick);

    const handleResize = () => {
      camera.aspect =
        mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(
        mountRef.current.clientWidth,
        mountRef.current.clientHeight
      );
    };
    window.addEventListener("resize", handleResize);

    return () => {
      mountRef.current.removeChild(renderer.domElement);
      window.removeEventListener("resize", handleResize);
    };
  }, [
    timeOfDay,
    shadowOpacity,
    shadowResolution,
    lightIntensity,
    modelScale,
    sunPosition,
  ]);
  const handleDatetimeSubmit = async () => {
    try {
      const formattedDatetime = `${datetime}:00`;
      console.log("datetime", formattedDatetime.replace("T", " "));
      const response = await fetch(
        "https://solaris-1.onrender.com/api/sun_position/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            datetime: formattedDatetime.replace("T", " "), // Convert to required format
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setSunPosition(data); // Update the sun position
    } catch (error) {
      console.error("Error fetching sun position:", error);
    }
  };

  return (
    <div className="flex bg-gray-200 h-screen">
      {/* Add the legend image */}
      <img
        src="/try.svg" // Update the path to your image
        alt="Building Height Legend"
        className="absolute top-4 left-4 z-10 w-20 h-auto bg-white border-2 border-black   rounded shadow-md"
      />
      <div className="absolute top-5 right-[34%] z-10 w-20 h-20 bg-white border border-gray-400 rounded-full shadow-lg flex items-center justify-center ">
        {/* Compass Labels */}
        <div className="absolute top-1 left-1/2 transform -translate-x-1/2 text-xs font-bold">
          N
        </div>
        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 text-xs font-bold">
          S
        </div>
        <div className="absolute left-1 top-1/2 transform -translate-y-1/2 text-xs font-bold">
          W
        </div>
        <div className="absolute right-1 top-1/2 transform -translate-y-1/2 text-xs font-bold">
          E
        </div>

        {/* Compass Needle */}
        <img src="/compass.png"
          className="absolute w-1 h-10 bg-black origin-bottom transform"
          style={{ transform: `rotate(${needleRotation}deg)` }}
        />
      </div>
      <div
        ref={mountRef}
        className="flex-1 border-2 border-gray-300 rounded-md shadow-md"
        style={{ overflow: "auto", height: "90vh" }}
      />
      <div className="p-4 space-y-6 w-1/3 bg-white border-l border-gray-300">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Time of Day
          </label>
          <input
            type="range"
            min="0"
            max="24"
            step="0.1"
            value={timeOfDay}
            onChange={(e) => setTimeOfDay(Number(e.target.value))}
            className="w-full"
          />
          <p className="text-sm text-gray-500">
            Selected Time: {timeOfDay} hrs
          </p>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Select Date and Time
          </label>
          <input
            type="datetime-local"
            value={datetime}
            onChange={(e) => setDatetime(e.target.value)}
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            GHI Value
          </label>
          <input
            type="number"
            value={ghi}
            onChange={(e) => setGhi(e.target.value)}
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <button
          onClick={handleDatetimeSubmit}
          className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Submit
        </button>
      </div>
    </div>
  );
};

export default ModelViewer;