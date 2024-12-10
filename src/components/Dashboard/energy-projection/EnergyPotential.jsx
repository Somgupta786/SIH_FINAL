"use client";
import React, { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

const EnergyPotential = () => {
  const chartRef = useRef(null);

  useEffect(() => {
    const ctx = chartRef.current.getContext("2d");

    // Updated dataset with only BIPV data
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
          barPercentage: 0.5,
          barThickness: 20,
          maxBarThickness: 21,
          minBarLength: 2,
          label: "Energy potential (in GWh or KWh",
          data: [4, 7.0, 5.0, 8.5, 6.5, 3.5, 5.5], // Example data in GWh for BIPV
          backgroundColor: "#FFD682", // Background color for BIPV
          borderColor: "#FFD682", // Border color for BIPV (optional, same as bg color)
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
            title: {
              display: true,
              text: "Energy Potential (GWh)", // Updated y-axis label
            },
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
    <div className="w-[60%] h-full grow">
      <div className="relative flex flex-col p-5 pl-12 gap-3 my-5 justify-center items-center border border-backgroundGreen rounded-lg ">
        <p className="font-medium">
           Solar energy potential for each month
        </p>
        <div className="flex w-full ">
          <canvas className="" ref={chartRef} />
        </div>
      </div>
    </div>
  );
};

export default EnergyPotential;
