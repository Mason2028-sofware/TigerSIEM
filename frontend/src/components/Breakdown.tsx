export default function Breakdown({ items, total }: { items: [string, number][]; total: number }) {
  return (
    <ul className="breakdown">
      {items.map(([name, count]) => (
        <li key={name}>
          <span className="bd-name" title={name}>{name}</span>
          <span className="bd-track"><span style={{ width: `${(count / Math.max(1, total)) * 100}%` }} /></span>
          <span className="bd-count">{count}</span>
        </li>
      ))}
    </ul>
  );
}
