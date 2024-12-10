"use client";
import { Chart, registerables } from "chart.js";
import { useEffect, useRef } from "react";

Chart.register(...registerables);

const BarChart = ({
  name = "Default Chart Title",
  data = {
    labels: ["Default Month 1", "Default Month 2"],
    datasets: [
      {
        label: "Default Dataset",
        data: [100, 200],
        backgroundColor: "#888",
        borderColor: "#888",
        borderWidth: 1,
      },
    ],
  },
  title="",
}) => {
  const chartRef = useRef(null);

  useEffect(() => {
    const ctx = chartRef.current.getContext("2d");

    const config = {
      type: "bar", // Bar chart
      data: data,
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "top",
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: title, // Y-axis label
            },
          },
        },
      },
    };

    const myChart = new Chart(ctx, config);

    return () => myChart.destroy(); // Cleanup on component unmount
  }, [data]);

  return (
    <>
      <div className="relative flex flex-col p-5 pl-12 gap-3 my-5 justify-center items-center border border-backgroundGreen rounded-lg">
        <p className="font-medium">{name}</p>
        <div className="flex w-full">
          <canvas className="max-h-[25rem]" ref={chartRef} />
        </div>
      </div>
    </>
  );
};

export default BarChart;
