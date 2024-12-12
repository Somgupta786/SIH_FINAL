"use client";

import React, { useEffect, useState, useRef } from "react";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import TWEEN from "@tweenjs/tween.js";
import InputSelection from "../Dashboard/input-slider/page";
import SlideInComponent from "../Common/SlideInComponent";
import axios from "axios";
import DropDown3dViewer from "../Dashboard/3dViewer/DropDown";
import toast from "react-hot-toast";

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
  const [sunPosition, setSunPosition] = useState({ x: 180, y: 90, z: 360 });
  const [ghi, setGhi] = useState(5);
  const [needleRotation, setNeedleRotation] = useState(0);

  const [selectedDate3d, setSelectedDate3d] = useState(new Date());
  const [labelData3d, setLabelData3d] = useState([]);
  const [completeData, setCompleteData] = useState(null);

  const [dropdownVisible3d, setDropdownVisible3d] = useState(1);
  const [selectedDropdown3d, setSelectedDropdown3d] = useState(1);
  const [isVisible, setisVisible] = useState(false);

  const [selectedBuilding, setSelectedBuilding] = useState(null);

  const [rgbColor, setRgbColor] = useState({});
  const compassRef = useRef(null);

  const [shadowData ,setShadowData] = useState({})

  // const [ avg]

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
      const vector = new THREE.Vector3(0, 0, -1);
      vector.applyQuaternion(camera.quaternion); // Rotate vector based on camera orientation
      const angle = Math.atan2(vector.x, vector.z); // Calculate rotation angle
      const degree = (angle * (180 / Math.PI) + 360) % 360; // Convert to degrees

      // Rotate the compass
      if (compassRef.current) {
        compassRef.current.style.transform = `rotate(${degree}deg)`;
      }
    };
    // Track changes in camera orientation and update compass needle
    controls.addEventListener("change", () => {
      // Calculate compass needle rotation (Y-axis rotation of the camera)
      const rotationY = Math.atan2(camera.position.x, camera.position.z);
      setNeedleRotation(-rotationY * (180 / Math.PI)); // Convert radians to degrees
      updateCompassRotation();
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
      100,
      0xc4a948 // Red color
    );
    scene.add(arrowHelper);
    const arrowHelper2 = new THREE.ArrowHelper(
      lightDirection,
      directionalLight.position,
      100,
      0xc4a948 // Red color
    );
    scene.add(arrowHelper2);

    const groundSize = 750;
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
    camera.position.set(0, 100, 200);
    const mtlLoader = new MTLLoader();
    mtlLoader.setPath(modelPath);
    mtlLoader.load(mtlFile, (materials) => {
      materials.preload();
      // Load GeoJSON data
      const loader = new THREE.FileLoader();
      loader.load(geoJsonPath, (geoJsonData) => {
        const geoJson = JSON.parse(geoJsonData);
        // console.log(geoJson.features);
        const objLoader = new OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.setPath(modelPath);
        objLoader.load(
          objFile,
          (object) => {
            let buildingId = 0;
            object.children.forEach((child) => {
              if (child.isMesh) {
                // console.log(child)
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
          // console.log("Clicked building:", clickedMesh);
          setSelectedBuilding(clickedMesh.userData);

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
          clickedMesh.userData.length = length;
          clickedMesh.userData.breadth = width;
          const formattedDatetime = selectedDate3d.toISOString().split("T")[0];
          const payload = {
            height: clickedMesh.userData.height.toString(),
            length: length.toString(),
            breadth: width.toString(),
            date: formattedDatetime,
            latitude: clickedMesh.userData.latitude.toString(),
            longitude: clickedMesh.userData.longitude.toString(),
            solar_irradiance: ghi * 50,
          };
          // console.log("payload", payload);
          try {
            const response = await axios.post(
              "https://solaris-1.onrender.com/api/face_potential/",
              payload,
              {
                headers: {
                  "Content-Type": "application/json",
                },
              }
            );
            setisVisible(true);
            // console.log("API Responsecvwsfv:", response.data);
            setLabelData3d(response.data.hourly_potential);
            setCompleteData(response.data);
            // console.log("CompleteData", response.data);
          } catch (error) {
            console.error("Error calling API:", error);
          }
          try {
            const result = await axios.post(
              "https://solaris-1.onrender.com/api/face_colors/",
              payload,
              {
                headers: {
                  "Content-Type": "application/json",
                },
              }
            );
            // console.log("result heat", result.data.face1_colors.flat()[0]); selectedDropdown3d face1_colors.flat();
            const color = result.data;
            // console.log(color);
            setRgbColor(color);
          } catch (err) {}
          try{
            const final = await axios.post(
              "https://solaris-1.onrender.com/api/face_shadow/",
              payload,
              {
                headers: {
                  "Content-Type": "application/json",
                },
              }
            );
            toast.success("Success")
            console.log("final",final.data)

          }
          catch(err){
            toast.error("error")
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
      if (mountRef.current) {
        // mountRef.current.removeChild(renderer.domElement);

        window.removeEventListener("resize", handleResize);
      }
    };
  }, [
    timeOfDay,
    shadowOpacity,
    shadowResolution,
    lightIntensity,
    modelScale,
    sunPosition,
  ]);

  // const handleDatetimeSubmit = async () => {
  //   try {
  //     const formattedDatetime = `${datetime}:00`;
  //     console.log("datetime", formattedDatetime.replace("T", " "));
  //     const response = await fetch(
  //       "https://solaris-1.onrender.com/api/sun_position/",
  //       {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //         body: JSON.stringify({
  //           datetime: formattedDatetime.replace("T", " "), // Convert to required format
  //         }),
  //       }
  //     );

  //     if (!response.ok) {
  //       throw new Error(`Error: ${response.status} ${response.statusText}`);
  //     }

  //     const data = await response.json();
  //     setSunPosition(data); // Update the sun position
  //   } catch (error) {
  //     console.error("Error fetching sun position:", error);
  //   }
  // };
  const handleDatetimeSubmit = () => {};

  const scaleFactor = 30;
  return (
    <>
      <div className="flex bg-gray-200 h-screen overflow-hidden">
        {/* Add the legend image */}
        <img
          src="/bipv1.png" // Update the path to your image
          alt="Building Height Legend"
          className="absolute top-10 left-[265px] z-10 w-24 h-36 bg-white border-2 border-black   rounded shadow-md"
        />
        <div
          ref={compassRef} // Compass reference
          style={{
            position: "absolute",
            right: "30px",
            top: "25px",
            width: "150px",
            height: "150px",
            background: 'url("/compass.png") no-repeat center center',
            backgroundSize: "contain",
            transformOrigin: "center", // Rotate from center
            zIndex: "100",
          }}
        ></div>

        <div
          ref={mountRef}
          className="flex-1 border-2 border-gray-300 rounded-md shadow-md"
          style={{ overflow: "auto", height: "90vh", width: "100%" }}
        />

        <div className=" absolute right-10 top-40">
          <InputSelection
            selectedDate={selectedDate3d}
            setSelectedDate={setSelectedDate3d}
            setGhi={setGhi}
            ghi={ghi}
          />
        </div>

        {/* Drop Down */}
        {labelData3d && (
          <div className="absolute bottom-0 w-[80%]">
            <SlideInComponent isOpen={isVisible} setIsOpen={setisVisible}>
              <div className="flex flex-row-reverse">
                <div className="w-full">
                  <div className="flex flex-col gap-2 w-full items-center text-cente mt-2 pr-40">
                    <p className="text-xl w-fit border bg-backgroundGreen text-white px-4 py-2 rounded-lg font-medium mt-2  mx-auto">
                      Face {selectedDropdown3d} 🧭 {selectedDropdown3d === 1 && "East"}
                      {selectedDropdown3d === 2 && "South"}
                      {selectedDropdown3d === 3 && "West"}
                      {selectedDropdown3d === 4 && "North"}
                    </p>

                    {ghi && (
                      <p>
                        GHI: {ghi} kW/m <sup>2</sup>{" "}
                      </p>
                    )}
                  </div>
                  <DropDown3dViewer
                    selectedDropdown3d={selectedDropdown3d}
                    setSelectedDropdown3d={setSelectedDropdown3d}
                    labelData3d={labelData3d}
                    dropdownVisible3d={dropdownVisible3d}
                    setDropdownVisible3d={setDropdownVisible3d}
                  />
                  <div className="flex justify-around w-full text-lg font-medium mb-2">
                    <p className="">
                      Average Potential :{" "}
                      {
                        completeData?.average_potential[
                          `face${selectedDropdown3d}`
                        ]
                      }{" "}
                      kwh
                    </p>

                    <div>
                      {completeData?.non_zero_periods[
                        `face${selectedDropdown3d}`
                      ]?.map((period, index) => (
                        <p key={index}>
                          Start: {period.start}, End: {period.end}
                        </p>
                      )) || <p>No periods available</p>}
                    </div>
                  </div>
                </div>
                {selectedBuilding && (
                  <div className="flex flex-col justify-center items-center">
                    <div
                      className={`
                  grid grid-rows-20 grid-cols-20 m-2
                  h-72 
                  w-72`}
                    >
                      {rgbColor[`face${selectedDropdown3d}_colors`] ? (
                        rgbColor[`face${selectedDropdown3d}_colors`]
                          .flat()
                          .map((color, colIndex) => (
                            <div
                              key={colIndex}
                              style={{
                                backgroundColor: color || "transparent",
                              }}
                              className="min-w-1 min-h-1"
                            />
                          ))
                      ) : (
                        <p>Loading heatmap...</p>
                      )}
                    </div>
                    <div className="border flex justify-center items-center flex-col">
                      <p>Face {selectedDropdown3d}</p>
                      <p>Building Id: {selectedBuilding.buildingId}</p>
                      <p>Height: {Math.round(selectedBuilding.height)}</p>
                      <p>Breadth: {Math.round(selectedBuilding.breadth)}</p>
                    </div>
                  </div>
                )}
              </div>
              {/* Grid For Heat Map */}
            </SlideInComponent>
          </div>
        )}
      </div>
    </>
  );
};

export default ModelViewer;
