"use client";

import { VTableWrapper } from '@/components/vtable';

export default function PlaceholderTab() {
  const columns = [
    { key: 'id', header: 'ID', width: 80, sortable: true },
    { key: 'name', header: 'Name', width: 200, sortable: true },
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
