"use client";

import React, { useEffect, useState, useRef } from "react";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import TWEEN from "@tweenjs/tween.js";
import InputSelection from "../Dashboard/input-slider/page";

import axios from "axios";;

const ModelViewer = ({
    shadowOpacity = 0.9,
    shadowResolution = 4096,
    lightIntensity = 1,
    modelScale = 10,
    modelPath = "/models/",
    objFile = "eeshu.obj",
    mtlFile = "eeshu.mtl",
    geoJsonPath = "/models/eeshu_geo.geojson",
  }) => {
    const mountRef = useRef(null);
    const [timeOfDay, setTimeOfDay] = useState(5.5);
    const [datetime, setDatetime] = useState("2024-10-26T11:28");
    const [sunPosition, setSunPosition] = useState({ x: 180, y: 180, z:90 });
    const [ghi, setGhi] = useState("");
    const [needleRotation, setNeedleRotation] = useState(0);
    const compassRef = useRef(null);
    const [selectedShadowViewer,setSelectedShadowViewer] = useState(new Date())

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
    const updateCompassRotation = () => {
    };
    // Track changes in camera orientation and update compass needle
    controls.addEventListener("change", () => {
      // Calculate compass needle rotation (Y-axis rotation of the camera)
      const rotationY = Math.atan2(camera.position.x, camera.position.z);
      setNeedleRotation(-rotationY * (180 / Math.PI)); // Convert radians to degrees
      updateCompassRotation() // calling the compass
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
   ;
    const arrowHelper = new THREE.ArrowHelper(
      lightDirection,
      directionalLight.position,
      100,
      0xc4a948 // Red color
    );
    scene.add(arrowHelper);
    

    const groundSize =750;
    // Load grass texture
    const textureLoader = new THREE.TextureLoader();
    const grassTexture = textureLoader.load("/try.webp");
    grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
    grassTexture.repeat.set(50, 50); // Adjust the repeat to fit the ground size

    // const groundMaterial = new THREE.MeshStandardMaterial({ color: 0xf0e170 });
    const groundMaterial = new THREE.MeshStandardMaterial({
      map: grassTexture,
    });
    const groundGeometry = new THREE.PlaneGeometry(groundSize, 1300);
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    scene.add(ground);
    const mtlLoader = new MTLLoader();
    mtlLoader.setPath(modelPath);
    mtlLoader.load(mtlFile, (materials) => {
      materials.preload();
      // Load GeoJSON data
      const loader = new THREE.FileLoader();
      loader.load(geoJsonPath, (geoJsonData) => {
        const geoJson = JSON.parse(geoJsonData);
        console.log( geoJson.features);
        const objLoader = new OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.setPath(modelPath);
        objLoader.load(
          objFile,
          (object) => {
            let buildingId = 0;
            object.children.forEach((child) => {
              if (child.isMesh) {
                child.material = child.material.clone();
                const color = getColorByHeight(
                  geoJson.features[buildingId].properties.height
                );
                // console.log(color);
                child.material.color.set(0xffffff);
                child.userData.isBuilding = true;
                child.userData.buildingId = buildingId;
                child.castShadow = true;
                child.receiveShadow = true;
                child.userData.latitude =
                  geoJson.features[buildingId].properties.latitude;
                child.userData.height =
                  geoJson.features[buildingId].properties.height;
                child.userData.longitude =
                  geoJson.features[buildingId++].properties.longitude;

                const buildingScaleFactor = 0.25;
                child.scale.set(
                  buildingScaleFactor,
                  buildingScaleFactor,
                  buildingScaleFactor
                );

                scene.add(child);
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

    camera.position.set(0, 100, 200);
    const getColorByHeight = (height) => {
    };
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const updateSunPosition = () => {
    };

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      updateSunPosition();
      renderer.render(scene, camera);
    };
    animate();
    const handleMouseClick = async (event) => {
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
    //   mountRef.current.removeChild(renderer.domElement);
      window.removeEventListener("resize", handleResize);
    };
  }, [timeOfDay, shadowOpacity, shadowResolution, lightIntensity, modelScale,sunPosition]);
  const handleDatetimeSubmit = async () => {
    try {
      const formattedDatetime = `${datetime}:00`;
      console.log("datetime",formattedDatetime.replace("T", " "))
      const response = await fetch(
        "https://solaris-vd5p.onrender.com/api/sun_position/",
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
    <div className="flex flex-col ">
      <div
        ref={mountRef}
        style={{
          width: "100%",
          overflow: "auto",
          height: "500px",
        }}
      />
      <div>
        <input
          type="range"
          min="0"
          max="24"
          value={timeOfDay}
          onChange={(e) => setTimeOfDay(Number(e.target.value))}
          style={{ width: "100%" }}
        />
        <p>Time of Day: {timeOfDay}</p>
      </div>
      <div>
        <label>
          Select Date and Time:
          <input
            type="datetime-local"
            value={datetime}
            onChange={(e) => setDatetime(e.target.value)}
          />
        </label>
        <button onClick={handleDatetimeSubmit}>Submit</button>
      </div>
    </div>
  );
};

export default ModelViewer;