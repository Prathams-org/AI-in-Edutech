"use client";

import { useRive, useStateMachineInput, Layout, Fit, Alignment } from "@rive-app/react-canvas";

export default function WalkingAnimation() {
  const { rive, RiveComponent } = useRive({
    src: "/walking.riv",
    stateMachines: "State Machine 1",
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
    <div
      className="w-full h-full min-h-screen bg-yellow-400 flex items-center justify-center"
      onClick={handleClick}
    >
      <div className="w-full h-full cursor-pointer flex items-center justify-center">
        <RiveComponent />
      </div>
    </div>
  );
}
