'use client'
import BannerSection from "@/components/Dashboard/energy-projection/BannerSection";
import EnergyPotential from "@/components/Dashboard/energy-projection/EnergyPotential";
import PieChartPotential from "@/components/Dashboard/energy-projection/PieChartPotential";
import ReportButton from "@/components/Dashboard/energy-projection/ReportButton";
import TotalPotentialGraph from "@/components/Dashboard/energy-projection/TotalPotentialGraph";
import React from "react";

const page = () => {
  return (
    <div>
      <BannerSection />
      <TotalPotentialGraph />
      <ReportButton/>
      <div className="flex gap-10 min-h-[450px] lg:flex-row flex-col">
      <EnergyPotential/>
      <PieChartPotential/>
      </div>
      
    </div>
  );
};

export default page;
