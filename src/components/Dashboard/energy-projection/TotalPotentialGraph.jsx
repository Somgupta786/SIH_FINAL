"use client";
import BarChart from "@/components/Charts/BarChart";
import InfoBanner from "./InfoBanner";

const TotalPotentialGraph = () => {
  const chartData = {
    labels: ["January", "February", "March", "April", "May", "June", "July"],
    datasets: [
      {
        label: "Rooftop PV",
        data: [65, 59, 80, 81, 56, 55, 40],
        backgroundColor: "#FFD682",
        borderColor: "#FFD682",
        borderWidth: 1,
      },
      {
        label: "BIPV",
        data: [45, 70, 50, 90, 65, 35, 55],
        backgroundColor: "#52736E",
        borderColor: "#52736E",
        borderWidth: 1,
      },
    ],
  };

  return (
    <>
      <InfoBanner>
        BIPV systems perform 30% better in summer compared to monsoon due to
        cloud cover
      </InfoBanner>

      <BarChart
        name="Contribution of each type to the total potential"
        data={chartData}
        title="Proportion (%) or Absolute value (GWh or KWh)"
      />
    </>
  );
};

export default TotalPotentialGraph;
