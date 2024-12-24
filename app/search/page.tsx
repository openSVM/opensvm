"use client";

import Card from "../../../www-sacred/components/Card";
import Input from "../../../www-sacred/components/Input";
import Button from "../../../www-sacred/components/Button";
import { DataTable } from "../../../www-sacred/components/DataTable";
import "../../../www-sacred/components/Card.module.scss";
import "../../../www-sacred/components/Input.module.scss";
import "../../../www-sacred/components/Button.module.scss";
import "../../../www-sacred/components/DataTable.module.scss";
import React, { useState, ChangeEvent } from "react";

interface TableRow {
  signature: string;
  time: string;
  block: string;
  instructions: string;
}

const mockData: TableRow[] = [
  {
    signature: "5D3XS9p5WzPqXqHzfLqH3U8EuXkKhGGqy8vuyNEXoWbv",
    time: "2024-01-10 15:22:14",
    block: "234,567,890",
    instructions: "2",
  },
  {
    signature: "9fWxo3JXVHAh2qyrDMzJKPJqrwHKhGGqy8vuyNEXoWbv",
    time: "2024-01-10 15:21:55",
    block: "234,567,889",
    instructions: "1",
  },
  {
    signature: "7kNrPzWE9AhB5qyrDMzJKPJqrwHKhGGqy8vuyNEXoWbv",
    time: "2024-01-10 15:21:32",
    block: "234,567,888",
    instructions: "3",
  },
];

const columns = [
  { key: "signature", label: "Signature" },
  { key: "time", label: "Time" },
  { key: "block", label: "Block" },
  { key: "instructions", label: "Instructions" },
];

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = () => {
    // TODO: Implement actual search functionality
    console.log("Searching for:", searchQuery);
  };

  return (
    <main className="container mx-auto p-4">
      <Card title="Solana Explorer Search" mode="left">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Input
              placeholder="Search transactions, blocks, programs and tokens"
              value={searchQuery}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            />
            <Button onClick={handleSearch}>Search</Button>
          </div>
          <DataTable
            data={mockData}
            columns={columns}
            onRowClick={(row: TableRow) => console.log("Clicked row:", row)}
          />
        </div>
      </Card>
    </main>
  );
}
