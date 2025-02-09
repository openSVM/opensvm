export default function Announcements() {
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Announcements</h2>
      <div className="space-y-4">
        <div className="flex items-start gap-2">
          <span className="text-xs text-red-500 mt-1">•</span>
          <p className="text-sm">
            Insider: <span className="text-red-500">$PIX404</span> launching pad404.com next week! MPL404-fy your favourite memecoin and revive the community!
          </p>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-xs text-neutral-400 mt-1">•</span>
          <p className="text-sm">
            New utility for <span className="text-white">$SVMAI</span>: create paid announcements on opensvm.com with ease, pay with $SVMAI via UI or our on-chain program, soon available for humans, agents and fully on-chain entities!
          </p>
        </div>
      </div>
    </div>
  );
}
