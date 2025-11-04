"use client";

import FrameGroup from "@/src/components/compounds/FrameGroup";
import SortableLayerItem from "@/src/components/compounds/SortableLayerItem";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { Layer, Stage, Transformer } from "react-konva";
import { v4 as uuidv4 } from "uuid";
import ScalingWrapper from "../atoms/ScalingWrapper";

export type FrameType = "square" | "circle";

export interface Frame {
  id: string;
  shapeType: FrameType;
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
  imageSrc: string;
  imageWidth?: number;
  imageHeight?: number;
  crop: { x: number; y: number; scale: number };
}

const transformerRefGlobal = React.createRef<any>();

export default function HomePage() {
  const [frames, setFrames] = useState<Frame[]>([]);
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);
  const [editingFrameId, setEditingFrameId] = useState<string | null>(null);
  const [tempCrop, setTempCrop] = useState<{
    [key: string]: { x: number; y: number; scale: number };
  }>({});

  const stageRef = useRef<any>(null);
  const transformerRef = transformerRefGlobal;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const sensors = useSensors(useSensor(PointerSensor));
  const [scale, setScale] = useState<number>(0.5);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      const zoomIntensity = 0.1;
      const delta = e.deltaY < 0 ? 1 : -1;
      setScale((prev) => {
        const newScale = Math.min(
          2,
          Math.max(0.2, prev + delta * zoomIntensity)
        );
        return Number(newScale.toFixed(2));
      });
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, []);

  const addFrame = (shapeType: "circle" | "square") => {
    const newFrame: Frame = {
      id: uuidv4(),
      shapeType,
      x: 1000 + frames.length * 80,
      y: 1000 + frames.length * 80,
      width: 220,
      height: 220,
      scale: 1,
      imageSrc: "/placeholder.png",
      imageWidth: 0,
      imageHeight: 0,
      crop: { x: 0, y: 0, scale: 1 },
    };
    setFrames((prev) => [...prev, newFrame]);
    setSelectedFrameId(newFrame.id);
  };

  const updateFrame = (id: string, updates: Partial<Frame>) => {
    setFrames((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  };

  const handleImageUpload = (id: string, file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      updateFrame(id, { imageSrc: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleUploadClick = () => {
    if (!selectedFrameId) return alert("Select a frame first!");
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedFrameId) handleImageUpload(selectedFrameId, file);
  };

  const handleStageMouseDown = (e: any) => {
    if (e.target === e.target.getStage()) {
      setSelectedFrameId(null);
      setEditingFrameId(null);
    }
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Delete" && selectedFrameId) {
        setFrames((prev) => prev.filter((f) => f.id !== selectedFrameId));
        setSelectedFrameId(null);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedFrameId]);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = frames.findIndex((f) => f.id === active.id);
    const newIndex = frames.findIndex((f) => f.id === over.id);
    setFrames((items) => arrayMove(items, oldIndex, newIndex));
  };

  const handleSaveCrop = () => {
    if (editingFrameId && tempCrop[editingFrameId]) {
      updateFrame(editingFrameId, { crop: tempCrop[editingFrameId] });
    }
    setEditingFrameId(null);
  };

  const handleCancelCrop = () => {
    setEditingFrameId(null);
    setTempCrop((prev) => {
      const copy = { ...prev };
      delete copy[editingFrameId!];
      return copy;
    });
  };

  const selectedFrame = frames.find((f) => f.id === selectedFrameId);
  const reversedFrames = [...frames].reverse();

  return (
    <div className="flex h-screen bg-gray-100" ref={containerRef}>
      <div className="w-1/6 border-r bg-white p-4 flex flex-col space-y-4">
        <div className="flex flex-col space-y-4">
          <h2 className="font-semibold text-gray-700">Add Frame</h2>
          <button
            onClick={() => addFrame("square")}
            className="border p-2 rounded hover:bg-gray-200 flex items-center gap-2"
          >
            <Plus />
            Add Square
          </button>
          <button
            onClick={() => addFrame("circle")}
            className="border p-2 rounded hover:bg-gray-200 flex items-center gap-2"
          >
            <Plus />
            Add Circle
          </button>
          <button
            disabled={!selectedFrameId}
            onClick={handleUploadClick}
            className="border p-2 rounded bg-teal-500 text-white hover:bg-teal-600 disabled:bg-gray-200 disabled:text-black"
          >
            Upload Image
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleFileChange}
          />
        </div>

        <div className="border-t bg-white p-4 overflow-y-auto">
          <h2 className="font-semibold text-gray-700 mb-2">Layers</h2>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={reversedFrames.map((f) => f.id)}
              strategy={verticalListSortingStrategy}
            >
              {reversedFrames.map((frame) => (
                <SortableLayerItem
                  key={frame.id}
                  frame={frame}
                  selectedId={selectedFrameId}
                  onSelect={setSelectedFrameId}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      </div>

      <div className="relative flex-1 flex justify-center items-center">
        <ScalingWrapper scale={scale}>
          <Stage
            ref={stageRef}
            width={2048}
            height={2048}
            className="border bg-white shadow-md rounded"
            onMouseDown={handleStageMouseDown}
          >
            <Layer>
              {frames.map((frame) => (
                <FrameGroup
                  key={frame.id}
                  frame={frame}
                  isSelected={
                    selectedFrameId === frame.id && editingFrameId !== frame.id
                  }
                  isEditing={editingFrameId === frame.id}
                  onSelect={() => {
                    if (!editingFrameId) setSelectedFrameId(frame.id);
                  }}
                  onTransform={(updated) => updateFrame(frame.id, updated)}
                  transformerRef={transformerRef}
                />
              ))}
              <Transformer
                ref={transformerRef}
                rotateEnabled={false}
                enabledAnchors={[
                  "top-left",
                  "top-right",
                  "bottom-left",
                  "bottom-right",
                ]}
              />
            </Layer>
          </Stage>
        </ScalingWrapper>

        {selectedFrame && (
          <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-white rounded shadow-md px-3 py-1 flex gap-2 z-10">
            {editingFrameId !== selectedFrame.id ? (
              <>
                <button
                  onClick={() => setEditingFrameId(selectedFrame.id)}
                  className="bg-yellow-500 text-white px-3 py-1 rounded"
                >
                  Edit Frame Image
                </button>
                <button
                  onClick={handleUploadClick}
                  className="bg-blue-500 text-white px-3 py-1 rounded"
                >
                  Update Image
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSaveCrop}
                  className="bg-green-500 text-white px-3 py-1 rounded"
                >
                  Save Crop
                </button>
                <button
                  onClick={handleCancelCrop}
                  className="bg-gray-500 text-white px-3 py-1 rounded"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        )}

        <div className="absolute bottom-6 right-6 bg-white shadow rounded px-3 py-1 text-sm text-gray-600">
          Zoom: {(scale * 100).toFixed(0)}%
        </div>
      </div>
    </div>
  );
}
