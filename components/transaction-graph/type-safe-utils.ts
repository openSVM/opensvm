'use client';

// Type-safe fullscreen API interface
export interface FullscreenElement extends HTMLElement {
  requestFullscreen?: () => Promise<void>;
  mozRequestFullScreen?: () => void;
  webkitRequestFullscreen?: () => void;
  msRequestFullscreen?: () => void;
}

export interface FullscreenDocument extends Document {
  exitFullscreen?: () => Promise<void>;
  mozCancelFullScreen?: () => void;
  webkitExitFullscreen?: () => void;
  msExitFullscreen?: () => void;
}

// Type-safe performance memory interface
export interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export interface ExtendedPerformance extends Performance {
  memory?: PerformanceMemory;
}

export interface ExtendedWindow extends Window {
  performance: ExtendedPerformance;
  gc?: () => void;
}

// Type-safe cytoscape graph data
export interface CytoscapeNode {
  data: {
    id: string;
    label?: string;
    type?: string;
    group?: string;
    size?: number;
    color?: string;
    [key: string]: any;
  };
  position?: { x: number; y: number };
  classes?: string;
}

export interface CytoscapeEdge {
  data: {
    id: string;
    source: string;
    target: string;
    value?: number;
    color?: string;
    type?: string;
    [key: string]: any;
  };
  classes?: string;
}

export interface CytoscapeElements {
  nodes: CytoscapeNode[];
  edges: CytoscapeEdge[];
}

// GPU graph data types
export interface GPUNode {
  id: string;
  label?: string;
  type?: string;
  group?: string;
  x?: number;
  y?: number;
  size?: number;
  color?: string;
  data?: any;
}

export interface GPULink {
  id: string;
  source: string;
  target: string;
  value?: number;
  color?: string;
  type?: string;
  data?: any;
}

export interface GPUGraphData {
  nodes: GPUNode[];
  links: GPULink[];
}

// Type guards for runtime type checking
export function isFullscreenElement(element: HTMLElement): element is FullscreenElement {
  return 'requestFullscreen' in element || 
         'mozRequestFullScreen' in element ||
         'webkitRequestFullscreen' in element ||
         'msRequestFullscreen' in element;
}

export function isFullscreenDocument(doc: Document): doc is FullscreenDocument {
  return 'exitFullscreen' in doc ||
         'mozCancelFullScreen' in doc ||
         'webkitExitFullscreen' in doc ||
         'msExitFullscreen' in doc;
}

export function hasPerformanceMemory(perf: Performance): perf is ExtendedPerformance {
  return 'memory' in perf;
}

export function hasGarbageCollector(win: Window): win is ExtendedWindow {
  return 'gc' in win;
}

// Utility functions for safe type casting
export function safeRequestFullscreen(element: HTMLElement): Promise<void> | void {
  if (!isFullscreenElement(element)) {
    console.warn('Fullscreen not supported on this element');
    return Promise.resolve();
  }

  if (element.requestFullscreen) {
    return element.requestFullscreen();
  } else if (element.mozRequestFullScreen) {
    return element.mozRequestFullScreen();
  } else if (element.webkitRequestFullscreen) {
    return element.webkitRequestFullscreen();
  } else if (element.msRequestFullscreen) {
    return element.msRequestFullscreen();
  }
}

export function safeExitFullscreen(doc: Document): Promise<void> | void {
  if (!isFullscreenDocument(doc)) {
    console.warn('Exit fullscreen not supported');
    return Promise.resolve();
  }

  if (doc.exitFullscreen) {
    return doc.exitFullscreen();
  } else if (doc.mozCancelFullScreen) {
    return doc.mozCancelFullScreen();
  } else if (doc.webkitExitFullscreen) {
    return doc.webkitExitFullscreen();
  } else if (doc.msExitFullscreen) {
    return doc.msExitFullscreen();
  }
}

export function safeGetMemoryInfo(win: Window): PerformanceMemory | null {
  if (hasPerformanceMemory(win.performance)) {
    return win.performance.memory || null;
  }
  return null;
}

export function safeCallGarbageCollector(win: Window): void {
  if (hasGarbageCollector(win)) {
    try {
      win.gc();
    } catch (error) {
      console.warn('Failed to call garbage collector:', error);
    }
  }
}