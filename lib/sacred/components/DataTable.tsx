'use client';

import * as React from 'react';
import { Stack } from 'rinlab';

interface TableProps {
  data: string[][];
}

const DataTable: React.FC<TableProps> = ({ data }) => {
  const [prevData, setPrevData] = React.useState<string[][]>(data);

  React.useEffect(() => {
    setPrevData(data);
  }, [data]);

  return (
    <Stack gap={2}>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(100px,1fr))] gap-2">
        {data[0]?.map((header, index) => (
          <div key={index} className="font-semibold text-sm">
            {header}
          </div>
        ))}
      </div>
      {data.slice(1).map((row, rowIndex) => (
        <div 
          key={rowIndex} 
          className="grid grid-cols-[repeat(auto-fit,minmax(100px,1fr))] gap-2 hover:bg-gray-50 cursor-pointer"
        >
          {row.map((cell, cellIndex) => (
            <div 
              key={cellIndex}
              className={`text-sm ${prevData[rowIndex + 1]?.[cellIndex] !== cell ? 'text-blue-600' : ''}`}
            >
              {cell}
            </div>
          ))}
        </div>
      ))}
    </Stack>
  );
};

export default DataTable;
