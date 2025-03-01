'use client';

import React, { useState } from 'react';

interface JsonTreeProps {
  data: any;
  level?: number;
  expanded?: boolean;
}

interface JsonNodeProps {
  value: any;
  level: number;
  expanded?: boolean;
}

function JsonNode({ value, level, expanded = true }: JsonNodeProps) {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const isObject = value !== null && typeof value === 'object';
  const isArray = Array.isArray(value);

  if (!isObject) {
    return (
      <span className={`
        ${typeof value === 'string' ? 'text-green-400' : ''}
        ${typeof value === 'number' ? 'text-blue-400' : ''}
        ${typeof value === 'boolean' ? 'text-yellow-400' : ''}
        ${value === null ? 'text-red-400' : ''}
      `}>
        {JSON.stringify(value)}
      </span>
    );
  }

  const toggleExpand = () => setIsExpanded(!isExpanded);
  const entries = Object.entries(value);

  return (
    <div className="font-mono">
      <span 
        onClick={toggleExpand}
        className="cursor-pointer hover:text-blue-400"
      >
        {isArray ? '[' : '{'}
        {!isExpanded && '...'}
        {!isExpanded && (isArray ? ']' : '}')}
      </span>
      
      {isExpanded && (
        <>
          <div style={{ marginLeft: '1rem' }}>
            {entries.map(([key, val], i) => (
              <div key={key}>
                <span className="text-gray-400">{key}: </span>
                <JsonNode value={val} level={level + 1} />
                {i < entries.length - 1 && <span className="text-gray-500">,</span>}
              </div>
            ))}
          </div>
          <div>{isArray ? ']' : '}'}</div>
        </>
      )}
    </div>
  );
}

export default function JsonTree({ data, level = 0, expanded = true }: JsonTreeProps) {
  return (
    <div className="bg-black/50 p-4 rounded-lg overflow-x-auto">
      <JsonNode value={data} level={level} expanded={expanded} />
    </div>
  );
}
