"use client";

import { useRive, useStateMachineInput, Layout, Fit, Alignment } from "@rive-app/react-canvas";
import { useEffect } from "react";

export default function GlassLoadingAnimation() {
  const { rive, RiveComponent } = useRive({
    src: "/glassloading.riv",
    stateMachines: "State Machine 1", // Assuming default state machine name
    autoplay: true,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center,
    }),
  });

  const hoverInput = useStateMachineInput(rive, "State Machine 1", "hover");
  const pressInput = useStateMachineInput(rive, "State Machine 1", "press");

  const handleMouseEnter = () => {
    if (hoverInput) hoverInput.value = true;
  };

  const handleMouseLeave = () => {
    if (hoverInput) hoverInput.value = false;
    if (pressInput) pressInput.value = false;
  };

  const handleMouseDown = () => {
    if (pressInput) pressInput.value = true;
  };

  const handleMouseUp = () => {
    if (pressInput) pressInput.value = false;
  };

  return (
    <div 
      className="w-full h-full flex flex-col items-center justify-center min-h-[400px]"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <div className="w-48 h-48">
        <RiveComponent />
      </div>
      <p className="mt-4 text-purple-600 font-medium animate-pulse">Loading content...</p>
    </div>
  );
}
