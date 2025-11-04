import React, { useEffect, useRef, useState } from "react";
import { Group, Rect, Circle, Image, Transformer } from "react-konva";
import useImage from "use-image";
import { Frame } from "../pages/HomePage";

interface FrameGroupProps {
  frame: Frame;
  isSelected: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onTransform: (updated: Partial<Frame>) => void;
  transformerRef: React.RefObject<any>;
  onTempCropChange?: (
    id: string,
    crop: { x: number; y: number; scale: number }
  ) => void;
}

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

const FrameGroup: React.FC<FrameGroupProps> = ({
  frame,
  isSelected,
  isEditing,
  onSelect,
  onTransform,
  transformerRef,
  onTempCropChange,
}) => {
  const groupRef = useRef<any>(null);
  const imageEditRef = useRef<any>(null);
  const [image] = useImage(frame.imageSrc, "anonymous");
  const [tempCrop, setTempCrop] = useState(frame.crop);

  useEffect(() => {
    if (isEditing) {
      setTempCrop(frame.crop);
    }
  }, [isEditing, frame.crop]);

  useEffect(() => {
    if (isEditing && onTempCropChange) {
      onTempCropChange(frame.id, tempCrop);
    }
  }, [tempCrop]);

  useEffect(() => {
    if (
      image &&
      (frame.imageWidth !== image.width || frame.imageHeight !== image.height)
    ) {
      onTransform({ imageWidth: image.width, imageHeight: image.height });
    }
  }, [image]);

  useEffect(() => {
    const transformer = transformerRef.current;
    const group = groupRef.current;

    if (!transformer) return;

    if (isSelected && !isEditing && group) {
      transformer.nodes([group]);
    } else {
      transformer.nodes([]);
    }

    transformer.getLayer()?.batchDraw();
  }, [isSelected, isEditing, transformerRef, groupRef]);

  const imgW = image?.width ?? 0;
  const imgH = image?.height ?? 0;
  const s = tempCrop.scale > 0 ? tempCrop.scale : 1;

  const cropW = imgW / s;
  const cropH = imgH / s;

  const panXRange = Math.max(frame.width * s - frame.width, 0);
  const panYRange = Math.max(frame.height * s - frame.height, 0);

  const offX = tempCrop.x * frame.width;
  const offY = tempCrop.y * frame.height;

  const panXNorm = panXRange > 0 ? clamp(offX / panXRange, 0, 1) : 0;
  const panYNorm = panYRange > 0 ? clamp(offY / panYRange, 0, 1) : 0;

  const cropX = clamp(panXNorm * (imgW - cropW), 0, Math.max(imgW - cropW, 0));
  const cropY = clamp(panYNorm * (imgH - cropH), 0, Math.max(imgH - cropH, 0));

  const handleFrameTransformEnd = () => {
    const node = groupRef.current;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    const newWidth = Math.max(10, frame.width * scaleX);
    const newHeight = Math.max(10, frame.height * scaleY);

    node.scale({ x: 1, y: 1 });

    onTransform({
      id: frame.id,
      x: node.x(),
      y: node.y(),
      width: newWidth,
      height: newHeight,
    });

    const transformer = transformerRef.current;
    if (transformer) {
      transformer.nodes([node]);
      transformer.forceUpdate();
      transformer.getLayer()?.batchDraw();
    }
  };

  useEffect(() => {
    const transformer = transformerRef.current;
    const group = groupRef.current;

    if (!transformer || !group) return;

    if (isSelected && !isEditing) {
      transformer.nodes([group]);
      transformer.forceUpdate();
      transformer.getLayer()?.batchDraw();
    }
  }, [frame.width, frame.height, isSelected, isEditing]);

  const handleFrameDragEnd = (e: any) =>
    onTransform({ x: e.target.x(), y: e.target.y() });

  const dragBoundFunc = (pos: { x: number; y: number }) => {
    const minX = frame.x - panXRange;
    const maxX = frame.x;
    const minY = frame.y - panYRange;
    const maxY = frame.y;
    return {
      x: clamp(pos.x, minX, maxX),
      y: clamp(pos.y, minY, maxY),
    };
  };

  const overlayX = frame.x - panXNorm * panXRange;
  const overlayY = frame.y - panYNorm * panYRange;
  const overlayW = frame.width * s;
  const overlayH = frame.height * s;

  return (
    <>
      <Group
        ref={groupRef}
        x={frame.x}
        y={frame.y}
        draggable={!isEditing}
        onClick={onSelect}
        onTap={onSelect}
        onTransformEnd={handleFrameTransformEnd}
        onDragEnd={handleFrameDragEnd}
        clipFunc={(ctx) => {
          if (frame.shapeType === "circle") {
            ctx.arc(
              frame.width / 2,
              frame.height / 2,
              frame.width / 2,
              0,
              Math.PI * 2
            );
          } else {
            ctx.rect(0, 0, frame.width, frame.height);
          }
        }}
      >
        {image && (
          <Image
            image={image}
            x={0}
            y={0}
            width={frame.width}
            height={frame.height}
            crop={{
              x: cropX,
              y: cropY,
              width: cropW,
              height: cropH,
            }}
            clipFunc={(ctx: any) => {
              if (frame.shapeType === "circle") {
                ctx.arc(
                  frame.width / 2,
                  frame.height / 2,
                  frame.width / 2,
                  0,
                  Math.PI * 2
                );
              } else {
                ctx.rect(0, 0, frame.width, frame.height);
              }
            }}
          />
        )}

        {frame.shapeType === "circle" ? (
          <Circle
            x={frame.width / 2}
            y={frame.height / 2}
            radius={frame.width / 2}
            stroke={isSelected ? "blue" : "black"}
            strokeWidth={2}
          />
        ) : (
          <Rect
            width={frame.width}
            height={frame.height}
            stroke={isSelected ? "blue" : "black"}
            strokeWidth={2}
          />
        )}
      </Group>

      {isEditing && image && (
        <>
          <Image
            ref={imageEditRef}
            image={image}
            x={overlayX}
            y={overlayY}
            width={overlayW}
            height={overlayH}
            draggable
            dragBoundFunc={dragBoundFunc}
            opacity={0.8}
            clipFunc={(ctx: any) => {
              const localClipX = frame.x - overlayX;
              const localClipY = frame.y - overlayY;
              ctx.save();
              ctx.translate(
                localClipX + frame.width / 2,
                localClipY + frame.height / 2
              );
              if (frame.shapeType === "circle") {
                ctx.arc(0, 0, frame.width / 2, 0, Math.PI * 2);
              } else {
                ctx.rect(
                  -frame.width / 2,
                  -frame.height / 2,
                  frame.width,
                  frame.height
                );
              }
              ctx.restore();
            }}
            onDragMove={(e) => {
              const node = e.target;
              const nx = clamp((frame.x - node.x()) / (panXRange || 1), 0, 1);
              const ny = clamp((frame.y - node.y()) / (panYRange || 1), 0, 1);
              const newPercentX = (nx * panXRange) / frame.width;
              const newPercentY = (ny * panYRange) / frame.height;
              setTempCrop({ ...tempCrop, x: newPercentX, y: newPercentY });
            }}
            onTransformEnd={(e) => {
              const node = e.target;
              const sx = node.scaleX();
              const newScale = s * sx;
              node.scale({ x: 1, y: 1 });
              const newPanXRange = Math.max(
                frame.width * newScale - frame.width,
                0
              );
              const newPanYRange = Math.max(
                frame.height * newScale - frame.height,
                0
              );
              setTempCrop((prev) => ({
                ...prev,
                scale: newScale,
                x: (panXNorm * newPanXRange) / frame.width,
                y: (panYNorm * newPanYRange) / frame.height,
              }));
            }}
          />
          <Transformer
            ref={(tr) => {
              if (tr && imageEditRef.current) {
                tr.nodes([imageEditRef.current]);
                tr.getLayer()?.batchDraw();
              }
            }}
            keepRatio
            rotateEnabled={false}
            enabledAnchors={[
              "top-left",
              "top-right",
              "bottom-left",
              "bottom-right",
            ]}
          />
        </>
      )}
    </>
  );
};

export default FrameGroup;
