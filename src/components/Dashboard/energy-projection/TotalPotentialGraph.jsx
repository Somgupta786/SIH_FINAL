"use client";
import React, { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

const TotalPotentialGraph = () => {
  const chartRef = useRef(null);

  useEffect(() => {
    const ctx = chartRef.current.getContext("2d");

    // Your labels and dataset from the provided code
    const labels = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
    ];
    const data = {
      labels: labels,
      datasets: [
        {
          label: "Rooftop PV",
          data: [65, 59, 80, 81, 56, 55, 40], // Replace with your actual data for Rooftop PV
          backgroundColor: "#FFD682", // Background color for Rooftop PV
          borderColor: "#FFD682", // Border color for Rooftop PV (optional, same as bg color)
          borderWidth: 1, // Optional, for better visualization
        },
        {
          label: "BIPV",
          data: [45, 70, 50, 90, 65, 35, 55], // Replace with your actual data for BIPV
          backgroundColor: "#52736E", // Background color for BIPV
          borderColor: "#52736E", // Border color for BIPV (optional, same as bg color)
          borderWidth: 1, // Optional, for better visualization
        },
      ],
    };

    const config = {
      type: "bar",
      data: data,
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    };

    // Initialize Chart
    const myChart = new Chart(ctx, config);

    // Cleanup on component unmount
    return () => myChart.destroy();
  }, []);

  return (
    <div className="relative flex flex-col p-5 pl-12 gap-3 my-5 justify-center items-center border border-backgroundGreen rounded-lg ">
    <p className="font-medium">Represents the contribution of each type to the total potential</p>
    <div className="flex w-full">
    <p className="absolute -rotate-90 -left-36 bottom-52 text-gray-700" >Proportion (%) or Absolute value (GWh or KWh)</p>
    <canvas className=" max-h-[25rem]" ref={chartRef} />
    </div>
        
    </div>
  )
   
};

export default TotalPotentialGraph;
