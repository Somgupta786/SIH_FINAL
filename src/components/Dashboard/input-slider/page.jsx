"use client";
import React, { useEffect, useState } from "react";
import { MdArrowDropDown } from "react-icons/md";

const InputSelection = () => {
  const [dropdownVisible, setDropdownVisible] = useState(false);
  

  return (
    <div className="relative">
      {/* Main Dropdown Toggle */}
      <div
        className="w-60 bg-backgroundYellow float-right p-3 -m-8 mt-2 rounded-l-xl font-semibold text-xl flex justify-between items-center cursor-pointer"
        onClick={() => setDropdownVisible(!dropdownVisible)}
      >
        <MdArrowDropDown
          className={`text-gray-800 text-3xl transform duration-500 transition-transform ${
            dropdownVisible ? "rotate-0" : "-rotate-90"
          }`}
        />
        <p className="font-medium">Input selection panel</p>
      </div>

      {/* Main Dropdown Content */}
      <div
        className={`absolute bg-white rounded-l-xl p-3 border border-black/80 shadow-2xl w-[22.5rem] mx-auto top-16 -right-8 z-10 transition-all duration-700 overflow-hidden ${
          dropdownVisible ? "max-h-[45rem] opacity-100" : "max-h-0 opacity-0"
        }`}
      >Inside</div>
      {/* Submit Button */}
    </div>
  );
};

export default InputSelection;
