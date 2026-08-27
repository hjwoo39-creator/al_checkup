import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import Layout from '../components/Layout';
import ProgressBar from '../components/ProgressBar';
import LikertQuestion from '../components/LikertQuestion';
import { api } from '../api';
import { getCurrentAdminId, getSavedResponseId, markResponseCompleted } from '../utils/device';

export default function ChecklistPage() {
  const { sectionIndex } = useParams();
  const navigate = useNavigate();
  const idx = parseInt(sectionIndex, 10);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sections, setSections] = useState([]);
  const [answers, setAnswers] = useState({});
  const [responseId, setResponseId] = useState(null);
  const [error, setError] = useState('');

  const section = sections[idx];
  const totalQuestions = sections.reduce((s, sec) => s + sec.questions.length, 0);
  const answeredBefore = sections
    .slice(0, idx)
    .reduce((s, sec) => s + sec.questions.length, 0);
  const answeredInSection = section
    ? section.questions.filter((q) => answers[q.id]).length
    : 0;
  const currentProgress = answeredBefore + answeredInSection;

  useEffect(() => {
    async function load() {
      try {
        const id = getSavedResponseId();
        if (!id) {
          navigate('/basic-info', { replace: true });
          return;
        }
        const { sections: secs } = await api.getQuestions();
        setSections(secs);
        setResponseId(id);

        const result = await api.getResult(id);
        if (result.response.status === 'completed') {
          navigate('/completed', { replace: true });
          return;
        }
        setAnswers(result.response.answers || {});
      } catch {
        navigate('/basic-info', { replace: true });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [navigate]);

  const saveAnswer = useCallback(
    async (questionId, score) => {
      const newAnswers = { ...answers, [questionId]: score };
      setAnswers(newAnswers);
      try {
        await api.updateResponse(responseId, { answers: { [questionId]: score } });
      } catch (err) {
        setError('자동 저장 실패. 네트워크를 확인해 주세요.');
      }
    },
    [answers, responseId]
  );

  const allAnswered = section?.questions.every((q) => answers[q.id]);

  const handleNext = async () => {
    if (!allAnswered) {
      setError('모든 문항에 응답해 주세요.');
      return;
    }
    setError('');
    if (idx < sections.length - 1) {
      navigate(`/checklist/${idx + 1}`);
      window.scrollTo(0, 0);
      return;
    }

    setSaving(true);
    try {
      await api.updateResponse(responseId, { answers, complete: true });
      markResponseCompleted(responseId, getCurrentAdminId());
      navigate('/result');
    } catch (err) {
      setError(err.message || '제출 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !section) return <div className="loading">불러오는 중...</div>;

  const sectionNames = ['1부', '2부'];
  const nextLabel =
    idx < sections.length - 1
      ? `다음 (${sectionNames[idx + 1]})`
      : '결과 확인';

  return (
    <>
      <Header subtitle={`${section.title} (${idx + 1}/${sections.length})`} />
      <Layout>
        <ProgressBar
          current={currentProgress}
          total={totalQuestions}
          label="전체 진행률"
        />

        {error && <div className="alert alert-warning">{error}</div>}

        <div className="card">
          <div className="section-header">
            <h2>{section.title}</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
              {section.description}
            </p>
          </div>

          {section.questions.map((q) => (
            <LikertQuestion
              key={q.id}
              question={q}
              value={answers[q.id]}
              onChange={(score) => saveAnswer(q.id, score)}
            />
          ))}

          <div className="btn-group">
            {idx > 0 && (
              <button
                className="btn btn-ghost"
                onClick={() => navigate(`/checklist/${idx - 1}`)}
              >
                이전
              </button>
            )}
            <button
              className="btn btn-primary"
              disabled={!allAnswered || saving}
              onClick={handleNext}
            >
              {saving ? '제출 중...' : nextLabel}
            </button>
          </div>
        </div>
      </Layout>
    </>
  );
}
