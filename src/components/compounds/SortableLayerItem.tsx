"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import React from "react";
import { Frame } from "../pages/HomePage";

const SortableLayerItem: React.FC<{
  frame: Frame;
  selectedId: string | null;
  onSelect: (id: string) => void;
}> = ({ frame, selectedId, onSelect }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: frame.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => onSelect(frame.id)}
      style={style}
      className={`p-2 mb-2 rounded border flex items-center space-x-2 cursor-pointer ${
        selectedId === frame.id
          ? "border-blue-500 bg-blue-50"
          : "border-gray-300"
      }`}
    >
      <div className="w-8 h-8 bg-gray-200 flex items-center justify-center rounded">
        <img
          src={frame.imageSrc || "/placeholder.png"}
          alt=""
          className="w-8 h-8 object-cover rounded"
        />
      </div>
      <span className="text-sm text-gray-700">
        {frame.shapeType.charAt(0).toUpperCase() + frame.shapeType.slice(1)}
      </span>
    </div>
  );
};

export default SortableLayerItem;
