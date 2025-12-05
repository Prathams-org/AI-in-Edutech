"use client";

import { useRive, useStateMachineInput, Layout, Fit, Alignment } from "@rive-app/react-canvas";
import { useEffect } from "react";

export default function WalkingAnimation() {
  const { rive, RiveComponent } = useRive({
    src: "/walking.riv",
    stateMachines: "State Machine 1", // Assuming default state machine name, might need adjustment if known
    autoplay: true,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center,
    }),
  });

  const triggerInput = useStateMachineInput(rive, "State Machine 1", "trigger 1");

  const handleClick = () => {
    if (triggerInput) {
      triggerInput.fire();
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm" onClick={handleClick}>
      <div className="w-64 h-64 cursor-pointer">
        <RiveComponent />
      </div>
      <p className="mt-4 text-gray-500 font-medium animate-pulse">Loading your dashboard...</p>
    </div>
  );
}
