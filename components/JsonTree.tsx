'use client';

import React, { useState } from 'react';

interface JsonTreeProps {
  data: any;
  level?: number;
  expandAll?: boolean;
}

const JsonTree: React.FC<JsonTreeProps> = ({ data, level = 0, expandAll = false }) => {
  const [isExpanded, setIsExpanded] = useState(expandAll);
  const indent = level * 20;

  const getDataType = (value: any): string => {
    if (Array.isArray(value)) return 'array';
    if (value === null) return 'null';
    return typeof value;
  };

  const renderValue = (value: any): React.ReactElement => {
    const type = getDataType(value);

    switch (type) {
      case 'string':
        return <span className="text-green-400">"{value}"</span>;
      case 'number':
        return <span className="text-blue-400">{value}</span>;
      case 'boolean':
        return <span className="text-yellow-400">{value.toString()}</span>;
      case 'null':
        return <span className="text-red-400">null</span>;
      case 'object':
      case 'array':
        return (
          <JsonTree
            data={value}
            level={level + 1}
            expandAll={expandAll}
          />
        );
      default:
        return <span>{String(value)}</span>;
    }
  };

  if (typeof data !== 'object' || data === null) {
    return renderValue(data);
  }

  const isArray = Array.isArray(data);
  const isEmpty = Object.keys(data).length === 0;

  if (isEmpty) {
    return <span>{isArray ? '[]' : '{}'}</span>;
  }

  return (
    <div style={{ marginLeft: indent }}>
      <span
        className="cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? '▼' : '▶'} {isArray ? '[' : '{'}
      </span>
      
      {isExpanded && (
        <div className="ml-4">
          {Object.entries(data).map(([key, value], index) => (
            <div key={key} className="my-1">
              <span className="text-neutral-400">{isArray ? '' : `"${key}": `}</span>
              {renderValue(value)}
              {index < Object.keys(data).length - 1 && <span>,</span>}
            </div>
          ))}
        </div>
      )}
      
      <div style={{ marginLeft: isExpanded ? 0 : 8 }} className="inline-block">
        {isExpanded && (isArray ? ']' : '}')}
      </div>
    </div>
  );
};

export default JsonTree;