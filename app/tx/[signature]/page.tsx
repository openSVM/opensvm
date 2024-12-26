'use client';

import { Card, CardHeader, CardContent, Text } from 'rinlab';
import { useParams } from 'next/navigation';

export default function TransactionPage() {
  const params = useParams();
  const signature = params.signature as string;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card>
        <CardHeader>
          <Text variant="heading">Transaction Details</Text>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Text variant="label" className="text-sm text-gray-500">Signature</Text>
              <Text variant="default" className="font-mono break-all">{signature}</Text>
            </div>
            {/* More transaction details will be added here */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 