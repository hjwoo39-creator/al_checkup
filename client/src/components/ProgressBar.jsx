export default function ProgressBar({ current, total, label }) {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="progress-bar-wrap">
      <div className="progress-label">
        <span>{label || '진행률'}</span>
        <span>{current} / {total} ({percent}%)</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
