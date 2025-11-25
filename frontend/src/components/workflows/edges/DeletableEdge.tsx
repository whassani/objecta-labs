'use client';

import { memo } from 'react';
import { EdgeProps, getBezierPath, BaseEdge } from 'reactflow';
import { Trash2 } from 'lucide-react';

const DeletableEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
}: EdgeProps) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    const event = new CustomEvent('deleteEdge', { detail: { edgeId: id } });
    window.dispatchEvent(event);
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      {selected && (
        <g transform={`translate(${labelX}, ${labelY})`}>
          <foreignObject
            width={28}
            height={28}
            x={-14}
            y={-14}
            className="overflow-visible"
          >
            <button
              onClick={handleDelete}
              className="w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-lg cursor-pointer border-2 border-white"
              title="Delete connection"
            >
              <Trash2 size={14} />
            </button>
          </foreignObject>
        </g>
      )}
    </>
  );
};

export default memo(DeletableEdge);
