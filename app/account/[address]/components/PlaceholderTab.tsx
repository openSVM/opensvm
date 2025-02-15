"use client";

import { VTableWrapper } from '@/components/vtable';

export default function PlaceholderTab() {
  const columns = [
    { field: 'id', title: 'ID', width: 80, sortable: true },
    { field: 'name', title: 'Name', width: 200, sortable: true },
  ];

  const data = [
    { id: 1, name: 'Loading...' },
    { id: 2, name: 'Please wait...' },
  ];

  return (
    <div className="w-full">
      <VTableWrapper
        columns={columns}
        data={data}
        loading={true}
      />
    </div>
  );
}
