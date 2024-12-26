import { Card, CardHeader, CardContent, Text, Stack } from 'rinlab';

interface FlowData {
  inflow: number;
  outflow: number;
  timestamp: string;
}

interface TransactionFlowChartProps {
  data: FlowData[];
}

export default function TransactionFlowChart({ data }: TransactionFlowChartProps) {
  // Find max value for scaling
  const maxValue = Math.max(
    ...data.flatMap(d => [d.inflow, d.outflow])
  );

  return (
    <Card>
      <CardHeader>
        <Text variant="heading">Transaction Flow</Text>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <div className="flex h-full">
            {data.map((flow, index) => (
              <div key={index} className="flex flex-col justify-center flex-1">
                {/* Inflow bar */}
                <div className="flex flex-col items-center mb-1">
                  <div 
                    className="w-4 bg-green-400 rounded-t"
                    style={{ 
                      height: `${(flow.inflow / maxValue) * 100}%`,
                      minHeight: flow.inflow > 0 ? '2px' : '0'
                    }}
                  />
                </div>
                
                {/* Time label */}
                <Text variant="label" className="text-xs text-center mb-1">
                  {flow.timestamp}
                </Text>
                
                {/* Outflow bar */}
                <div className="flex flex-col items-center mt-1">
                  <div 
                    className="w-4 bg-red-400 rounded-b"
                    style={{ 
                      height: `${(flow.outflow / maxValue) * 100}%`,
                      minHeight: flow.outflow > 0 ? '2px' : '0'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex justify-between mt-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded bg-green-400 mr-2" />
            <Text variant="label">Inflow</Text>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded bg-red-400 mr-2" />
            <Text variant="label">Outflow</Text>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 