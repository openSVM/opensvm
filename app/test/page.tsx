"use client";

import { VTableWrapper } from '@/components/vtable';
import { useState } from 'react';

const testData = [
  { id: 1, name: 'John Doe', age: 30, city: 'New York' },
  { id: 2, name: 'Jane Smith', age: 25, city: 'Los Angeles' },
  { id: 3, name: 'Bob Johnson', age: 35, city: 'Chicago' },
  { id: 4, name: 'Alice Brown', age: 28, city: 'Houston' },
  { id: 5, name: 'Charlie Wilson', age: 32, city: 'Phoenix' },
];

const columns = [
  { field: 'id', title: 'ID', width: 80, sortable: true },
  { field: 'name', title: 'Name', width: 200, sortable: true },
  { field: 'age', title: 'Age', width: 100, sortable: true },
  { field: 'city', title: 'City', width: 150, sortable: true },
];

export default function TestPage() {
  const [data, setData] = useState(testData);

  const handleSort = (field: string, order: 'asc' | 'desc' | null) => {
    if (!order) {
      setData(testData);
      return;
    }

    const sortedData = [...data].sort((a, b) => {
      const aValue = a[field as keyof typeof a];
      const bValue = b[field as keyof typeof b];
      
      if (aValue === bValue) return 0;
      
      const modifier = order === 'asc' ? 1 : -1;
      return aValue > bValue ? modifier : -modifier;
    });

    setData(sortedData);
  };

  const handleSelectionChange = (selection: any) => {
    console.log('Selection:', selection);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">VTable Test</h1>
      <div className="border border-neutral-800 rounded-lg overflow-hidden">
        <VTableWrapper
          columns={columns}
          data={data}
          onSort={handleSort}
          onSelectionChange={handleSelectionChange}
        />
      </div>
    </div>
  );
}
