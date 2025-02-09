interface Props {
  isSystemProgram: boolean;
  parsedOwner: string;
}

export default function MoreInfo({ isSystemProgram, parsedOwner }: Props) {
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">More info</h2>
      <div className="space-y-4">
        <div>
          <div className="text-sm text-neutral-400">Owner</div>
          <div className="text-sm font-mono">
            {isSystemProgram ? 'System Program' : parsedOwner}
            {isSystemProgram && (
              <span className="ml-2 inline-block">
                <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </span>
            )}
          </div>
        </div>

        <div>
          <div className="text-sm text-neutral-400">isOnCurve</div>
          <div className="bg-neutral-900 text-xs font-mono px-2 py-1 rounded inline-block">
            TRUE
          </div>
        </div>

        <div>
          <div className="text-sm text-neutral-400">Stake</div>
          <div>0 SOL</div>
        </div>
      </div>
    </div>
  );
}
