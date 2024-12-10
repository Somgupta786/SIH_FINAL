"use client";
import React, { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

const PieChartPotential = () => {
  const chartRef = useRef(null);

  useEffect(() => {
    const ctx = chartRef.current.getContext("2d");

    // Data for the pie chart
    const data = {
      labels: ["BIPV Potential", "Rooftop PV Potential"],
      datasets: [
        {
          label: "Energy Potential (GWh)",
          data: [45, 55], // Replace with actual data for BIPV and Rooftop PV
          backgroundColor: ["#1B3431", "#FFD682"], // Colors for BIPV and Rooftop PV
          hoverOffset: 4, // Optional hover effect
        },
      ],
    };

    const config = {
      type: "pie",
      data: data,
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false, // Disable default legend
          },
          tooltip: {
            callbacks: {
              label: function (tooltipItem) {
                const value = tooltipItem.raw;
                return `${tooltipItem.label}: ${value} GWh`;
              },
            },
          },
        },
      },
    };

    // Initialize the pie chart
    const myPieChart = new Chart(ctx, config);

    // Cleanup on component unmount
    return () => myPieChart.destroy();
  }, []);

  return (
    <div className="relative flex flex-col p-5 gap-3 my-5 justify-center items-center border border-backgroundGreen rounded-lg ">
      <p className="font-medium mb-4">
        Energy Potential Distribution Between BIPV and Rooftop PV
      </p>
      <div className="flex justify-center items-center gap-4">
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4"
            style={{ backgroundColor: "#1B3431" }}
          ></div>
          <span>BIPV Potential</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4"
            style={{ backgroundColor: "#FFD682" }}
          ></div>
          <span>Rooftop PV Potential</span>
        </div>
      </div>
      <canvas className="mb-4 max-h-[15rem]" ref={chartRef} />
      {/* Custom Legend */}
      
    </div>
  );
};

export default PieChartPotential;
