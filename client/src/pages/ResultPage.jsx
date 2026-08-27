import { useState, useEffect } from 'react';
import Header from '../components/Header';
import Layout from '../components/Layout';
import { api } from '../api';
import { getSavedResponseId } from '../utils/device';
import { getLevelColor } from '../utils/scoreColors';
import { useNavigate } from 'react-router-dom';

const FACTOR_LABELS = {
  guilt: '죄책감',
  overconfidence: '운전능력 과신',
  miscalculation: '잘못된 손익계산',
  internal_attr: '내부귀인',
  external_attr: '외부귀인',
  self_control: '자기통제력',
  impulsiveness: '충동성',
  sensation_seeking: '감각추구',
  morality: '도덕성',
};

const CORE_FACTORS = ['guilt', 'overconfidence', 'miscalculation'];
const OTHER_FACTORS = ['internal_attr', 'external_attr', 'self_control', 'impulsiveness', 'sensation_seeking', 'morality'];

export default function ResultPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    async function load() {
      const id = getSavedResponseId();
      if (!id) {
        navigate('/');
        return;
      }
      try {
        const result = await api.getResult(id);
        setData(result);
      } catch {
        navigate('/');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [navigate]);

  if (loading) return <div className="loading">결과를 불러오는 중...</div>;
  if (!data) return null;

  const { response, results } = data;
  const overall = results?.overall;

  return (
    <>
      <Header subtitle="나의 진단 결과" />
      <Layout>
        <div className="alert alert-success">
          응답이 완료되었습니다. 감사합니다!
        </div>

        <div className="card">
          <h2 className="card-title">음주성향 자가진단 결과</h2>
          <p className="card-desc" style={{ marginBottom: 12 }}>
            결과 유형: <strong style={{ fontSize: '1.25rem', color: 'var(--color-primary)' }}>{response.resultType}</strong>
          </p>

          {overall?.detail && (
            <div className="result-overall-desc" style={{
              background: '#f8fafc',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: 24,
              fontSize: '0.95rem',
              lineHeight: '1.6',
              color: 'var(--color-text)'
            }}>
              <strong>유형별 특징 설명:</strong>
              <p style={{ marginTop: 8, whiteSpace: 'pre-line' }}>{overall.detail}</p>
            </div>
          )}

          <h3 style={{ fontSize: '1rem', marginBottom: 12, color: 'var(--color-text)' }}>음주운전 유형</h3>
          <div className="result-score-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: 20 }}>
            {CORE_FACTORS.map((key) => {
              const r = results[key];
              return (
                <div key={key} className="score-item" style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  padding: '12px 8px',
                  textAlign: 'center',
                  background: 'white'
                }}>
                  <div className="label" style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>{FACTOR_LABELS[key]}</div>
                  <div className="value" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text)' }}>{r?.score ?? '-'}점</div>
                  <div className={`level level-${r?.level || ''}`} style={{
                    display: 'inline-block',
                    marginTop: 6,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background: getLevelColor(r?.level),
                    color: 'white'
                  }}>{r?.levelText}</div>
                </div>
              );
            })}
          </div>

          <h3 style={{ fontSize: '1rem', marginTop: 24, marginBottom: 12, color: 'var(--color-text)' }}>기타 성향 및 태도 분석 요인</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {OTHER_FACTORS.map((key) => {
              const r = results[key];
              return (
                <div key={key} className="score-item" style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  padding: '10px 6px',
                  textAlign: 'center',
                  background: 'white'
                }}>
                  <div className="label" style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>{FACTOR_LABELS[key]}</div>
                  <div className="value" style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text)' }}>{r?.score ?? '-'}점</div>
                  <div className={`level level-${r?.level || ''}`} style={{
                    display: 'inline-block',
                    marginTop: 6,
                    padding: '1px 6px',
                    borderRadius: '12px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    background: getLevelColor(r?.level),
                    color: 'white'
                  }}>{r?.levelText}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <p className="card-desc" style={{ textAlign: 'center', margin: 0 }}>
            강의자가 전체 결과를 공개하면 교육장 화면에서
            <br />
            전체 통계를 함께 확인할 수 있습니다.
          </p>
        </div>
      </Layout>
    </>
  );
}
