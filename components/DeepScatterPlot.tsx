import { useEffect, useRef } from 'react';
import { DeepScatter } from 'deepscatter/src/DeepScatter';
import * as arrow from 'apache-arrow';

interface DeepScatterPlotProps {
  data: arrow.Table;
  width?: number;
  height?: number;
  onReady?: (plot: DeepScatter) => void;
}

export function DeepScatterPlot({
  data,
  width = 800,
  height = 600,
  onReady,
}: DeepScatterPlotProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const plotRef = useRef<DeepScatter | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const plot = new DeepScatter(canvasRef.current);
    plotRef.current = plot;

    plot.plot(data).then(() => {
      onReady?.(plot);
    });

    return () => {
      plot.destroy();
      plotRef.current = null;
    };
  }, [data, onReady]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ width: '100%', height: '100%' }}
    />
  );
}
