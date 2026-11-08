export default function Stat({ label, value, note, small }: { label: string; value: string | number; note?: string; small?: boolean }) {
  return (
    <div className="stat">
      <div className={`stat-value${small ? " small" : ""}`}>{value}</div>
      <div className="stat-label">{label}</div>
      {note && <div className="stat-note">{note}</div>}
    </div>
  );
}