import BannerSection from "@/components/Dashboard/energy-projection/BannerSection";
import TotalPotentialGraph from "@/components/Dashboard/energy-projection/TotalPotentialGraph";
import React from "react";

const page = () => {
  return (
    <div>
      <BannerSection />
      <TotalPotentialGraph />
    </div>
  );
};

export default page;
