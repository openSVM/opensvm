'use client';

import { DetailedTransactionInfo, InstructionWithAccounts } from '@/lib/solana';
import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface EnhancedTransactionVisualizerProps {
  tx: DetailedTransactionInfo;
}

interface Node {
  id: string;
  type: 'instruction' | 'program' | 'account' | 'signer';
  data?: any;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface Link {
  source: string | Node;
  target: string | Node;
  type: 'execution' | 'interaction';
}

export default function EnhancedTransactionVisualizer({ tx }: EnhancedTransactionVisualizerProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !tx.details) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    // Prepare data structures
    const nodes: Node[] = [];
    const links: Link[] = [];

    // Add instruction nodes
    tx.details.instructions.forEach((ix: InstructionWithAccounts, index: number) => {
      const instructionId = `instruction-${index}`;
      nodes.push({
        id: instructionId,
        type: 'instruction',
        data: ix
      });

      // Link instruction to program
      links.push({
        source: instructionId,
        target: 'parsed' in ix ? ix.program : ix.programId.toString(),
        type: 'execution'
      });

      // Link instruction to accounts
      ix.accounts.forEach((accountIndex: number) => {
        links.push({
          source: instructionId,
          target: tx.details.accounts[accountIndex].pubkey.toString(),
          type: 'interaction'
        });
      });
    });

    // Add program nodes
    const programs = new Set(tx.details.instructions.map(ix => 
      'parsed' in ix ? ix.program : ix.programId.toString()
    ));
    programs.forEach(programId => {
      nodes.push({
        id: programId,
        type: 'program'
      });
    });

    // Add account nodes
    tx.details.accounts.forEach(account => {
      nodes.push({
        id: account.pubkey.toString(),
        type: account.signer ? 'signer' : 'account',
        data: account
      });
    });

    // Setup SVG
    const width = 800;
    const height = 600;
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [-width / 2, -height / 2, width, height]);

    // Define arrow marker
    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#666');

    // Create force simulation
    const simulation = d3.forceSimulation<Node>(nodes)
      .force('link', d3.forceLink<Node, Link>(links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('x', d3.forceX())
      .force('y', d3.forceY());

    // Draw links
    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', d => d.type === 'execution' ? '#4CAF50' : '#666')
      .attr('stroke-width', d => d.type === 'execution' ? 2 : 1)
      .attr('marker-end', 'url(#arrowhead)');

    // Draw nodes
    const node = svg.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .call(d3.drag<SVGGElement, Node>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any);

    // Add circles to nodes
    node.append('circle')
      .attr('r', d => getNodeRadius(d))
      .attr('fill', d => getNodeColor(d));

    // Add labels to nodes
    node.append('text')
      .attr('x', 0)
      .attr('y', d => getNodeRadius(d) + 12)
      .attr('text-anchor', 'middle')
      .attr('fill', '#9E9E9E')
      .attr('font-size', '10px')
      .text(d => getNodeLabel(d));

    // Add tooltips
    node.append('title')
      .text(d => getNodeTooltip(d));

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => (d.source as Node).x || 0)
        .attr('y1', (d: any) => (d.source as Node).y || 0)
        .attr('x2', (d: any) => (d.target as Node).x || 0)
        .attr('y2', (d: any) => (d.target as Node).y || 0);

      node
        .attr('transform', (d: any) => `translate(${d.x || 0},${d.y || 0})`);
    });

    // Drag functions
    function dragstarted(event: d3.D3DragEvent<SVGGElement, Node, Node>) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: d3.D3DragEvent<SVGGElement, Node, Node>) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: d3.D3DragEvent<SVGGElement, Node, Node>) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    // Helper functions
    function getNodeRadius(node: Node): number {
      switch (node.type) {
        case 'instruction': return 15;
        case 'program': return 12;
        case 'signer': return 10;
        default: return 8;
      }
    }

    function getNodeColor(node: Node): string {
      switch (node.type) {
        case 'instruction': return '#FF9800';
        case 'program': return '#2196F3';
        case 'signer': return '#4CAF50';
        default: return '#9E9E9E';
      }
    }

    function getNodeLabel(node: Node): string {
      if (node.type === 'instruction') {
        return `IX ${node.id.split('-')[1]}`;
      }
      return `${node.id.slice(0, 4)}...`;
    }

    function getNodeTooltip(node: Node): string {
      switch (node.type) {
        case 'instruction': {
          const ix = node.data as InstructionWithAccounts;
          return `Instruction ${node.id.split('-')[1]}\nProgram: ${
            'parsed' in ix ? ix.program : ix.programId.toString()
          }`;
        }
        case 'program':
          return `Program: ${node.id}`;
        case 'signer':
          return `Signer: ${node.id}`;
        default:
          return `Account: ${node.id}`;
      }
    }

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [tx]);

  return (
    <div className="w-full h-[600px] bg-neutral-900 rounded-lg overflow-hidden">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
}
