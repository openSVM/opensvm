import { createPlot } from 'lib/deepscatter/src/deepscatter.js';
import { useEffect, useRef } from 'react';

interface BinaryVisualizerProps {
  data: number[];
  selectedInstruction?: number | null;
  onInstructionSelect?: (offset: number | null) => void;
}

export default function BinaryVisualizer({
  data,
  selectedInstruction,
  onInstructionSelect
}: BinaryVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const plotRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize DeepScatter plot
    const plot = createPlot({
      canvas: containerRef.current,
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    });

    plotRef.current = plot;

    // Convert binary data to points
    const points = data.map((byte, offset) => ({
      x: offset % 256,
      y: Math.floor(offset / 256),
      value: byte,
      offset
    }));

    plot.update(points);

    return () => {
      plot.destroy();
    };
  }, [data]);

  useEffect(() => {
    if (!plotRef.current || selectedInstruction === null || selectedInstruction === undefined) return;

    // Highlight selected instruction
    plotRef.current.highlight((d: any) => d.offset === selectedInstruction);
  }, [selectedInstruction]);

  return (
    <div 
      ref={containerRef}
      style={{ width: '100%', height: '100%' }}
    />
  );
}
