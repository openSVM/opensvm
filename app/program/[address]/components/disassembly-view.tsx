interface DisassemblyViewProps {
  data: number[];
  address?: string; // Make address optional since it's not used
}

interface Instruction {
  opcode: number;
  regByte: number;
  bytes: number[];
}

export default function DisassemblyView({ data }: DisassemblyViewProps) {
  // Helper function to format bytes as hex
  const toHex = (num: number, width: number = 2): string => {
    return num.toString(16).padStart(width, '0').toLowerCase();
  };

  // Process data into instructions
  const instructions: Instruction[] = [];
  for (let i = 0; i < data.length; i += 8) {
    const bytes = Array(8).fill(0);
    for (let j = 0; j < 8 && i + j < data.length; j++) {
      bytes[j] = data[i + j] || 0;
    }
    instructions.push({
      opcode: bytes[0],
      regByte: bytes[1],
      bytes
    });
  }

  return (
    <div className="font-mono text-sm">
      <div className="space-y-1">
        {/* Header */}
        <div className="flex items-center space-x-4 text-xs text-gray-500 border-b border-white/5 pb-2 mb-4">
          <div className="w-24 shrink-0">Offset</div>
          <div className="w-48 shrink-0">Bytes</div>
          <div className="w-48 shrink-0">Components</div>
          <div className="flex-1">Instruction</div>
          <div className="w-96 shrink-0 text-right">Description</div>
        </div>

        {/* Instructions */}
        {instructions.map((instruction, index) => {
          const offset = index * 8;
          return (
            <div key={offset} className="flex items-center space-x-4 py-1 hover:bg-white/[0.02] group">
              {/* Offset */}
              <div className="w-24 shrink-0">
                <span className="text-blue-400/60">{toHex(offset, 8)}</span>
              </div>

              {/* Bytes */}
              <div className="w-48 shrink-0 text-gray-400 font-light tracking-wider">
                {instruction.bytes.map((b, idx) => (
                  <span key={idx} className={idx === 0 ? 'text-yellow-400/80' : ''}>
                    {toHex(b)}{idx < 7 ? ' ' : ''}
                  </span>
                ))}
              </div>

              {/* Components */}
              <div className="w-48 shrink-0 text-gray-400/80 font-light">
                <span className="text-yellow-400/80">op:{toHex(instruction.opcode, 2)}</span>
                <span className="text-blue-400/80"> r{instruction.regByte & 0xf}</span>
                <span className="text-gray-500">,</span>
                <span className="text-blue-400/80">r{(instruction.regByte >> 4) & 0xf}</span>
              </div>

              {/* Instruction */}
              <div className="flex-1 text-white group-hover:text-white/90 transition-colors">
                {toHex(instruction.opcode, 2)}
              </div>

              {/* Description */}
              <div className="w-96 shrink-0 text-right">
                <span className="text-gray-500 text-sm">
                  {`Instruction 0x${toHex(instruction.opcode, 2)}`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}