"use client";

import React from "react";

interface ScalingWrapperProps {
  scale: number;
  width?: number;
  height?: number;
  children: React.ReactNode;
}

const ScalingWrapper: React.FC<ScalingWrapperProps> = ({
  scale,
  width = 2048,
  height = 2048,
  children,
}) => {
  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden relative">
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={
          {
            transform: `scale(var(--scale))`,
            transformOrigin: "center",
            width: `${width}px`,
            height: `${height}px`,
            "--scale": scale,
          } as React.CSSProperties
        }
      >
        {children}
      </div>
    </div>
  );
};

export default ScalingWrapper;
