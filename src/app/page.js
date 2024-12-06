
"use client";

import React, { useEffect, useState, useRef } from "react";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const ModelViewer = ({
  shadowOpacity = 0.5,
  shadowResolution = 2048,
  lightIntensity = 1,
  modelScale = 10,
  modelPath = "/models/",
  objFile = "eeshu.obj",
  mtlFile = "eeshu.mtl",
  geoJsonPath = "/models/eeshu_geo.geojson",
  groundTexture = "/textures.jpg",
}) => {
  const mountRef = useRef(null);
  const [timeOfDay, setTimeOfDay] = useState(5.5);
  const [datetime, setDatetime] = useState("2024-10-26T11:28");
  const [sunPosition, setSunPosition] = useState({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(
      mountRef.current.clientWidth,
      mountRef.current.clientHeight
    );
    renderer.setClearColor(0xeeeeee);
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

    // ArrowHelper for light source visualization
    const lightDirection = new THREE.Vector3(-1, -1, 0).normalize();
    const arrowHelper = new THREE.ArrowHelper(
      lightDirection,
      directionalLight.position,
      50,
      0xff0000 // Red color
    );
    scene.add(arrowHelper);

    const groundSize = 300;

    const groundGeometry = new THREE.PlaneGeometry(groundSize + 20, 520);

    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0xf0e170 });
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
                child.material.color.set(0xffffff);
                child.userData.isBuilding = true;
                child.userData.buildingId = buildingId;
                child.castShadow = true;
                child.userData.latitude = geoJson.features[buildingId].properties.latitude;
                child.userData.longitude = geoJson.features[buildingId++].properties.longitude;
                const buildingScaleFactor = 0.1;
                child.scale.set(
                  buildingScaleFactor,
                  buildingScaleFactor,
                  buildingScaleFactor
                );
console.log(child)
                scene.add(child);
                // Calculate the height of the building by getting its bounding box
                const boundingBox = new THREE.Box3().setFromObject(child);
                const height = boundingBox.max.y - boundingBox.min.y;
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
      arrowHelper.setDirection(
        // ❌new THREE.Vector3(-sunX, -sunY, -sunZ).normalize()
        new THREE.Vector3(-sunPosition.x, -sunPosition.y, -sunPosition.z).normalize()
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
    const handleMouseClick = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // Cast a ray
      raycaster.setFromCamera(mouse, camera);

      // Intersect with all objects
      const intersects = raycaster.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
        // Get the exact clicked object
        const clickedMesh = intersects.find(
          (intersect) => intersect.object.userData.isBuilding
        )?.object;

        if (clickedMesh) {
          console.log("Clicked building:", clickedMesh);

          // Highlight the clicked building
          clickedMesh.material.color.set(0xff0000); // Set to red
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
    <div className="flex bg-gray-200">
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
          Select Date and Time
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
