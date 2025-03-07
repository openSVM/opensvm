'use client';

import cytoscape from 'cytoscape';

// Define custom layout options for dagre
interface DagreLayoutOptions extends cytoscape.LayoutOptions {
  rankDir?: string;
  ranker?: string;
  rankSep?: number;
  nodeDimensionsIncludeLabels?: boolean;
}

/**
 * Run incremental layout that preserves existing positions
 * @param cy Cytoscape instance
 * @param newElementIds Array of new element IDs to position
 */
export const runIncrementalLayout = (cy: cytoscape.Core, newElementIds: string[] = []): void => {
  // If there are specific new elements, run layout only on them and their neighborhood
  if (newElementIds.length > 0) {
    // Create a collection of the new elements
    const newElements = cy.collection();
    newElementIds.forEach(id => {
      const ele = cy.getElementById(id);
      if (ele.length > 0) {
        newElements.merge(ele);
      }
    });
    
    // Get connected elements as well
    const neighborhood = newElements.neighborhood();
    const subgraph = newElements.merge(neighborhood);
    
    // Run layout only on the subgraph but preserve existing positions
    subgraph.layout(<DagreLayoutOptions>{
      name: 'dagre' as any,
      rankDir: 'LR',
      ranker: 'tight-tree',
      rankSep: 100,
      nodeSep: 80,
      edgeSep: 50,
      nodeDimensionsIncludeLabels: true,
      padding: 50,
      spacingFactor: 2.0,
      animate: false,
      fit: true,
      animationDuration: 300,
      fit: false,
      randomize: false,
      // Only adjust positions of new nodes, preserve existing ones
      position: (node: any) => {
        const id = node.id();
        if (!newElementIds.includes(id) && node.position()) {
          return node.position();
        }
        return undefined; // Let the layout algorithm position new nodes
      }
    }).run();
  } else {
    // Default layout behavior for all elements
    cy.layout(<DagreLayoutOptions>{
      name: 'dagre' as any,
      rankDir: 'TB', // Top to bottom layout
      ranker: 'tight-tree',
      rankSep: 200,
      nodeSep: 200,
      edgeSep: 80,
      padding: 100,
      spacingFactor: 3.0,
      animate: false,
      animationDuration: 300,
      fit: false,
      randomize: false,
      boundingBox: { x1: 0, y1: 0, w: cy.width(), h: cy.height() },
      nodeDimensionsIncludeLabels: true,
      // Only position nodes that don't have a position
      position: (node: any) => node.position()
    }).run();
  }
};

/**
 * Run full graph layout
 * @param cy Cytoscape instance
 */
export const runLayout = (cy: cytoscape.Core): void => {
  cy.layout(<DagreLayoutOptions>{
    name: 'dagre' as any,
    rankDir: 'LR', // Left to right layout
    ranker: 'network-simplex',
    rankSep: 200,
    nodeSep: 200,
    edgeSep: 80,
    padding: 100,
    spacingFactor: 1.5,
    animate: false,
    animationDuration: 500,
    fit: true,
    boundingBox: { x1: 0, y1: 0, w: cy.width(), h: cy.height() }
  }).run();
};

/**
 * Create the graph style
 * @returns Array of Cytoscape style objects
 */
export const createGraphStyle = (): cytoscape.StylesheetCSS[] => [
  { 
    selector: 'node',
    style: {
      'label': 'data(label)', 
      'text-valign': 'center', 
      'text-halign': 'center',
      'font-size': '14px',
      'color': '#ffffff',
      'text-outline-width': 2,
      'text-outline-color': '#333',
      'background-color': '#4a5568',
      'border-width': 1,
      'border-color': '#555',
    }
  },
  {
    selector: 'node[status="pending"]',
    style: {
      'border-width': 2,
      'border-style': 'dashed',
      'border-color': '#cbd5e0',
      'background-color': 'rgba(160, 174, 192, 0.3)'
    }
  },
  {
    selector: 'node[status="loading"]',
    style: {
      'border-width': 2,
      'border-style': 'dotted',
      'border-color': '#cbd5e0',
      'background-color': 'rgba(160, 174, 192, 0.5)'
    }
  },
  {
    selector: 'node.account',
    style: {
      'shape': 'round-rectangle',
      'background-color': '#2c5282',
      'width': '160px',
      'height': '40px',
    }
  },
  {
    selector: 'node.transaction',
    style: {
      'shape': 'diamond',
      'background-color': '#4299e1',
      'width': '45px',
      'height': '45px',
    }
  },
  {
    selector: 'node.transaction.success',
    style: {
      'background-color': '#48bb78',
    }
  },
  {
    selector: 'node.transaction.error',
    style: {
      'background-color': '#f56565',
    }
  },
  {
    selector: 'node.highlighted',
    style: {
      'border-width': 4,
      'border-color': '#f6ad55',
      'background-color': '#f6e05e',
      'text-outline-color': '#000',
      'text-outline-width': 2,
      'z-index': 100,
      'transition-duration': '300ms'
    }
  },
  {
    selector: 'node.active',
    style: {
      'border-width': 4,
      'border-color': '#4fd1c5',
      'background-color': '#38b2ac', 
      'text-outline-color': '#000',
      'text-outline-width': 2,
      'z-index': 999
    }
  },
  {
    selector: 'edge',
    style: {
      'width': 2,
      'line-color': '#718096',
      'target-arrow-color': '#718096',
      'target-arrow-shape': 'triangle',
      'curve-style': 'bezier',
      'opacity': 0.9,
      'arrow-scale': 1.5
    }
  },
  {
    selector: 'edge.hover',
    style: {
      'width': 2
    }
  },
  {
    selector: 'edge[type="transfer"]',
    style: {
      'width': 3,
      'line-color': '#68d391',
      'target-arrow-color': '#9ae6b4',
      'label': 'data(label)',
      'font-size': '10px',
      'color': '#333',
      'text-background-color': '#fff',
      'text-background-opacity': 0.8,
      'text-background-padding': '2px',
    }
  },
  { 
    selector: 'edge.highlighted',
    style: {
      'width': 4,
      'line-color': '#f6ad55',
      'target-arrow-color': '#f6ad55', 
      'z-index': 999,
      'arrow-scale': 1.5,
      'transition-duration': '300ms'
    }
  },
  {
    selector: '.hover',
    style: { 
      'border-width': 2,
      'line-color': '#90cdf4',
      'target-arrow-color': '#90cdf4',
      'z-index': 10
    }
  },
  {
    // Add style for newly added elements that will fade in
    selector: '.fade-in',
    style: {
      'opacity': 0,
      'transition-property': 'opacity',
      'transition-duration': '500ms'
    }
  }
];

/**
 * Initialize a Cytoscape instance with default settings
 * @param container HTML element to contain the graph
 * @returns Cytoscape instance
 */
export const initializeCytoscape = (container: HTMLElement): cytoscape.Core => {
  return cytoscape({
    container: container,
    style: createGraphStyle(),
    layout: {
      name: 'dagre' as any,
      rankDir: 'LR',
      ranker: 'network-simplex',
      rankSep: 200,
      nodeSep: 200,
      edgeSep: 100,
      padding: 80,
      spacingFactor: 2.5
    },
    minZoom: 0.2,
    maxZoom: 3,
    wheelSensitivity: 1.0, // Using default value for consistent zoom behavior across different mice
  });
};