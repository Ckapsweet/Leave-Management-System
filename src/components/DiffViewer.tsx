// components/DiffViewer.tsx
interface DiffViewerProps {
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}

export function DiffViewer({ before, after }: DiffViewerProps) {
  const keys = Array.from(new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]));
  if (keys.length === 0) return <p className="text-xs text-gray-400 italic">ไม่มีข้อมูล</p>;

  return (
    <div className="space-y-1">
      {keys.map((k) => {
        const b = before?.[k];
        const a = after?.[k];
        const changed = JSON.stringify(b) !== JSON.stringify(a);
        return (
          <div key={k} className={`flex items-start gap-2 text-xs rounded-lg px-2 py-1 ${changed ? "bg-amber-50" : "bg-gray-50"}`}>
            <span className="text-gray-400 w-28 flex-shrink-0 font-mono">{k}</span>
            {changed ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                {b !== undefined && (
                  <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded line-through font-mono">
                    {String(b ?? "null")}
                  </span>
                )}
                <span className="text-gray-400">→</span>
                {a !== undefined && (
                  <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded font-mono">
                    {String(a ?? "null")}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-gray-600 font-mono">{String(a ?? b ?? "null")}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
