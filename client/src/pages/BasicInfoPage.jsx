import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Layout from '../components/Layout';
import { api } from '../api';
import {
  getCurrentAdminId,
  getDeviceId,
  hasCompletedResponse,
  markResponseCompleted,
  saveResponseId,
} from '../utils/device';

function OptionGroup({ label, options, value, onChange }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div className="option-grid">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            className={`option-btn ${value === opt ? 'selected' : ''}`}
            onClick={() => onChange(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function BasicInfoPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [basicInfo, setBasicInfo] = useState({
    gender: '',
    ageGroup: '',
    drivingExperience: '',
    vehicleType: '',
  });
  const [options, setOptions] = useState(null);
  const [responseId, setResponseId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function init() {
      try {
        const deviceId = getDeviceId();
        const adminId = getCurrentAdminId();
        if (hasCompletedResponse(adminId)) {
          navigate('/completed', { replace: true });
          return;
        }

        const check = await api.checkResponse(deviceId, adminId);
        if (check.completed) {
          if (check.response?.id) markResponseCompleted(check.response.id, adminId);
          navigate('/completed', { replace: true });
          return;
        }

        const { basicInfo: infoOpts } = await api.getQuestions();
        setOptions(infoOpts);

        const { response } = await api.startResponse(deviceId, adminId);
        setResponseId(response.id);
        saveResponseId(response.id);

        if (response.gender) {
          setBasicInfo({
            gender: response.gender || '',
            ageGroup: response.ageGroup || '',
            drivingExperience: response.drivingExperience || '',
            vehicleType: response.vehicleType || '',
          });
        }
      } catch (err) {
        if (err.data?.error === 'already_completed') {
          if (err.data?.response?.id) {
            markResponseCompleted(err.data.response.id, getCurrentAdminId());
          }
          navigate('/completed', { replace: true });
          return;
        }
        setError(err.message || '오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [navigate]);

  const isValid =
    basicInfo.gender &&
    basicInfo.ageGroup &&
    basicInfo.drivingExperience &&
    basicInfo.vehicleType;

  const handleNext = async () => {
    if (!isValid || !responseId) return;
    setSaving(true);
    try {
      await api.updateResponse(responseId, { basicInfo });
      navigate('/checklist/0');
    } catch (err) {
      setError(err.message || '저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">불러오는 중...</div>;

  return (
    <>
      <Header subtitle="기본정보 입력" />
      <Layout>
        {error && <div className="alert alert-warning">{error}</div>}
        <div className="card">
          <h2 className="card-title">기본정보를 입력해 주세요</h2>
          <p className="card-desc">모든 항목은 필수입니다.</p>

          <OptionGroup
            label="성별"
            options={options?.gender || []}
            value={basicInfo.gender}
            onChange={(v) => setBasicInfo({ ...basicInfo, gender: v })}
          />
          <OptionGroup
            label="연령대"
            options={options?.ageGroup || []}
            value={basicInfo.ageGroup}
            onChange={(v) => setBasicInfo({ ...basicInfo, ageGroup: v })}
          />
          <OptionGroup
            label="운전경력"
            options={options?.drivingExperience || []}
            value={basicInfo.drivingExperience}
            onChange={(v) => setBasicInfo({ ...basicInfo, drivingExperience: v })}
          />
          <OptionGroup
            label="주로 운행하는 차종"
            options={options?.vehicleType || []}
            value={basicInfo.vehicleType}
            onChange={(v) => setBasicInfo({ ...basicInfo, vehicleType: v })}
          />

          <div className="btn-group">
            <button
              className="btn btn-primary"
              disabled={!isValid || saving}
              onClick={handleNext}
            >
              {saving ? '저장 중...' : '다음 (음주운전 성향 진단)'}
            </button>
          </div>
        </div>
      </Layout>
    </>
  );
}
