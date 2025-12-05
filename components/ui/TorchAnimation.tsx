"use client";

import { useRive, useStateMachineInput, Layout, Fit, Alignment } from "@rive-app/react-canvas";

export default function TorchAnimation() {
  const { rive, RiveComponent } = useRive({
    src: "/torch.riv",
    stateMachines: "State Machine 1",
    autoplay: true,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center,
    }),
  });

  const hoverInput = useStateMachineInput(rive, "State Machine 1", "hover");

  const handleMouseEnter = () => {
    if (hoverInput) hoverInput.value = true;
  };

  const handleMouseLeave = () => {
    if (hoverInput) hoverInput.value = false;
  };

  return (
    <div 
      className="w-full h-full flex items-center justify-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="w-full h-full">
        <RiveComponent />
      </div>
    </div>
  );
}
