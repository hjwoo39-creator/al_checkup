export default function Header({ subtitle, showLogo = true }) {
  return (
    <header className="app-header">
      <div className="app-header-title">
        <h1>음주진단 자가진단 체크리스트</h1>
        {subtitle && <div className="subtitle">{subtitle}</div>}
      </div>
      {showLogo && (
        <div className="app-header-logo">
          <img src="/images/koroad-main-ci.png" alt="한국도로교통공단 KOROAD" />
        </div>
      )}
    </header>
  );
}
