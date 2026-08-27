import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import Layout from '../components/Layout';
import { getCurrentAdminId } from '../utils/device';

const FACTOR_CONFIGS = [
  { key: 'guilt', label: '죄책감', isPositive: true },
  { key: 'overconfidence', label: '운전능력 과신', isPositive: false },
  { key: 'miscalculation', label: '잘못된 손익계산', isPositive: false },
  { key: 'internal_attr', label: '내부귀인', isPositive: true },
  { key: 'external_attr', label: '외부귀인', isPositive: false },
  { key: 'self_control', label: '자기통제력', isPositive: true },
  { key: 'impulsiveness', label: '충동성', isPositive: false },
  { key: 'sensation_seeking', label: '감각추구', isPositive: false },
  { key: 'morality', label: '도덕성', isPositive: true },
];

const TYPE_KEYS = ['1가형', '1나형', '2가형', '2나형', '3가형', '3나형', '4가형', '4나형'];

export default function SharePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [presentation, setPresentation] = useState(searchParams.get('mode') === 'presentation');

  const load = () => {
    api.getShareStatistics(getCurrentAdminId())
      .then(setData)
      .catch((err) => {
        setError(err.message || '결과를 불러올 수 없습니다.');
        setData(null);
      });
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, []);

  const wrapperClass = presentation ? 'presentation-mode' : '';

  const closePresentation = () => {
    const returnTo = searchParams.get('returnTo') || '/admin/dashboard?tab=statistics';
    navigate(returnTo, { replace: true });
  };

  if (error && !data) {
    return (
      <div className={wrapperClass}>
        <Header subtitle="실시간 결과 공유" />
        <Layout wide>
          <div className="alert alert-warning">{error}</div>
          <p style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
            강의자가 결과를 공개하면 이 화면에 통계가 표시됩니다.
          </p>
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <button className="btn btn-outline" style={{ width: 'auto' }} onClick={load}>
              새로고침
            </button>
          </div>
        </Layout>
      </div>
    );
  }

  if (!data) return <div className="loading">불러오는 중...</div>;

  const { session, statistics, stats, updatedAt } = data;

  // Custom inline styles for high visibility presentation mode
  const fontMultiplier = presentation ? 1.2 : 1.0;

  const containerStyle = {
    padding: presentation ? '24px 40px' : '16px',
    color: presentation ? 'white' : 'var(--color-text)',
  };

  const cardStyle = {
    background: 'white',
    borderRadius: '16px',
    padding: presentation ? '32px' : '20px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    marginBottom: '24px',
    border: presentation ? '2px solid rgba(255, 255, 255, 0.1)' : '1px solid var(--color-border)',
    color: 'var(--color-text)',
  };

  const headerStyle = {
    fontSize: `${1.4 * fontMultiplier}rem`,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: presentation ? '24px' : '16px',
    borderBottom: '3px solid var(--color-primary)',
    paddingBottom: '8px',
    display: 'inline-block',
  };

  const renderDemographicCard = (title, dist) => {
    const keys = Object.keys(dist || {});
    return (
      <div style={{
        ...cardStyle,
        flex: 1,
        minWidth: presentation ? '260px' : '220px',
        marginBottom: '0px'
      }}>
        <h4 style={{
          fontSize: `${1.05 * fontMultiplier}rem`,
          fontWeight: '700',
          color: 'var(--color-primary)',
          marginBottom: '12px',
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: '6px'
        }}>{title}</h4>
        {keys.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', margin: 0 }}>데이터 없음</p>
        ) : (
          <ul style={{ paddingLeft: '20px', margin: 0, fontSize: `${0.95 * fontMultiplier}rem`, color: '#334155', lineHeight: '1.8' }}>
            {keys.map((k) => (
              <li key={k} style={{ marginBottom: '4px' }}>
                {k}: <strong style={{ color: '#0f172a' }}>{dist[k]}명</strong>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  return (
    <div className={`${wrapperClass} share-mode`} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header subtitle={`실시간 결과 — ${session.name}`} />
      <div style={containerStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <span style={{ fontSize: `${0.85 * fontMultiplier}rem`, color: presentation ? '#94a3b8' : 'var(--color-text-muted)', fontWeight: '500' }}>
            마지막 갱신: {new Date(updatedAt).toLocaleTimeString('ko-KR')} (3초마다 자동 갱신)
          </span>
          <button
            className="btn btn-primary"
            style={{ width: 'auto', minHeight: 44, fontSize: `${0.95 * fontMultiplier}rem`, padding: '0 24px' }}
            onClick={presentation ? closePresentation : () => setPresentation(true)}
          >
            {presentation ? '발표 모드 닫기' : '발표 모드'}
          </button>
        </div>

        <div className="share-stats" style={{ marginBottom: 24 }}>
          <div className="share-stats-row share-stats-status" style={{ gap: presentation ? '24px' : '16px' }}>
            <div className="stat-card" style={{ padding: presentation ? '32px' : '20px' }}>
              <div className="number" style={{ fontSize: `${3.5 * fontMultiplier}rem`, fontWeight: '900' }}>{stats.completedCount}</div>
              <div className="label" style={{ fontSize: `${1.1 * fontMultiplier}rem`, fontWeight: '700' }}>응답 완료</div>
            </div>
            <div className="stat-card" style={{ padding: presentation ? '32px' : '20px' }}>
              <div className="number" style={{ fontSize: `${3.5 * fontMultiplier}rem`, fontWeight: '900' }}>{stats.onlineCount}</div>
              <div className="label" style={{ fontSize: `${1.1 * fontMultiplier}rem`, fontWeight: '700' }}>현재 접속</div>
            </div>
          </div>
        </div>

        {/* 9 Factor table with enhanced visibility */}
        <div style={cardStyle}>
          <h3 style={headerStyle}>음주성향 요인별 평균 및 수준 분포</h3>
          <div className="data-table-wrap" style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
            <table className="data-table" style={{ borderCollapse: 'collapse', width: '100%', margin: 0 }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  <th style={{ padding: presentation ? '18px 24px' : '12px', fontSize: `${1.05 * fontMultiplier}rem`, borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>분석 요인</th>
                  <th style={{ padding: presentation ? '18px 24px' : '12px', fontSize: `${1.05 * fontMultiplier}rem`, borderBottom: '2px solid #e2e8f0', textAlign: 'center' }}>평균 점수</th>
                  <th style={{ padding: presentation ? '18px 24px' : '12px', fontSize: `${1.05 * fontMultiplier}rem`, borderBottom: '2px solid #e2e8f0', textAlign: 'center' }}>낮음 인원</th>
                  <th style={{ padding: presentation ? '18px 24px' : '12px', fontSize: `${1.05 * fontMultiplier}rem`, borderBottom: '2px solid #e2e8f0', textAlign: 'center' }}>높음 인원</th>
                </tr>
              </thead>
              <tbody>
                {FACTOR_CONFIGS.map(({ key, label, isPositive }) => {
                  const avg = statistics.averages?.[key] || 0;
                  const levelDist = statistics.levelDistribution?.[key] || { 양호: 0, 주의: 0 };
                  let lowCount = 0;
                  let highCount = 0;
                  if (isPositive) {
                    lowCount = levelDist.주의 || 0;
                    highCount = levelDist.양호 || 0;
                  } else {
                    lowCount = levelDist.양호 || 0;
                    highCount = levelDist.주의 || 0;
                  }
                  return (
                    <tr key={key} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: presentation ? '18px 24px' : '12px', fontSize: `${1.05 * fontMultiplier}rem`, fontWeight: '700', color: '#1e293b' }}>{label}</td>
                      <td style={{ padding: presentation ? '18px 24px' : '12px', fontSize: `${1.05 * fontMultiplier}rem`, textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          backgroundColor: '#e0f2fe',
                          color: '#0369a1',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontWeight: '800'
                        }}>{avg}점</span>
                      </td>
                      <td style={{ padding: presentation ? '18px 24px' : '12px', fontSize: `${1.05 * fontMultiplier}rem`, textAlign: 'center', fontWeight: '600', color: isPositive ? '#ef4444' : '#10b981' }}>
                        {lowCount}명
                      </td>
                      <td style={{ padding: presentation ? '18px 24px' : '12px', fontSize: `${1.05 * fontMultiplier}rem`, textAlign: 'center', fontWeight: '600', color: isPositive ? '#10b981' : '#ef4444' }}>
                        {highCount}명
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 8 Types grid with enhanced visibility */}
        <div style={cardStyle}>
          <h3 style={headerStyle}>음주운전 유형별 통계</h3>
          <div style={{ display: 'grid', gridTemplateColumns: presentation ? 'repeat(8, 1fr)' : 'repeat(2, 1fr)', gap: '16px' }}>
            {TYPE_KEYS.map((type) => {
              const count = statistics.typeDistribution?.[type] || 0;
              return (
                <div key={type} style={{
                  border: '2px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: presentation ? '20px 16px' : '12px',
                  background: '#f8fafc',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}>
                  <div style={{ fontSize: `${0.95 * fontMultiplier}rem`, fontWeight: '700', color: '#475569', marginBottom: '8px' }}>{type}</div>
                  <div style={{ fontSize: `${2.0 * fontMultiplier}rem`, fontWeight: '900', color: 'var(--color-primary)' }}>{count}<span style={{ fontSize: `${1.0 * fontMultiplier}rem`, fontWeight: '500', marginLeft: '2px' }}>명</span></div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Demographics section with horizontal layout */}
        <div style={{ ...cardStyle, background: 'transparent', border: 'none', boxShadow: 'none', padding: 0 }}>
          <h3 style={{
            ...headerStyle,
            color: presentation ? 'white' : '#0f172a',
            borderBottom: presentation ? '3px solid #60a5fa' : '3px solid var(--color-primary)'
          }}>기본 인적사항 및 운전 정보 통계</h3>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '20px',
            marginTop: '8px'
          }}>
            {renderDemographicCard('성별 분포', statistics.gender)}
            {renderDemographicCard('연령대 분포', statistics.ageGroup)}
            {renderDemographicCard('운전경력 분포', statistics.drivingExperience)}
            {renderDemographicCard('차종 분포', statistics.vehicleType)}
          </div>
        </div>
      </div>
    </div>
  );
}

import { api } from '../api';
