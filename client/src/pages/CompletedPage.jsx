import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Layout from '../components/Layout';
import { api } from '../api';
import { getCurrentAdminId, getCompletedResponseId, getDeviceId, markResponseCompleted } from '../utils/device';

export default function CompletedPage() {
  const navigate = useNavigate();
  const [response, setResponse] = useState(null);

  useEffect(() => {
    const adminId = getCurrentAdminId();
    api.checkResponse(getDeviceId(), adminId).then((data) => {
      if (data.response) {
        setResponse(data.response);
        if (data.completed && data.response.id) {
          markResponseCompleted(data.response.id, adminId);
        }
      }
    }).catch(() => {});
  }, []);

  return (
    <>
      <Header />
      <Layout>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>✅</div>
          <h2 className="card-title">이미 응답이 완료되었습니다.</h2>
          <p className="card-desc">
            동일 기기에서는 한 회차에 한 번만 응답할 수 있습니다.
          </p>
          {response && (
            <div className="result-score-grid" style={{ marginTop: 20 }}>
              <div className="score-item">
                <div className="label">죄책감</div>
                <div className="value">{response.impatienceScore}점</div>
              </div>
              <div className="score-item">
                <div className="label">운전능력 과신</div>
                <div className="value">{response.conformityScore}점</div>
              </div>
              <div className="score-item">
                <div className="label">잘못된 손익계산</div>
                <div className="value">{response.riskScore}점</div>
              </div>
            </div>
          )}
          {response?.results && (
            <button
              className="btn btn-outline"
              style={{ marginTop: 20 }}
              onClick={() => {
                const adminId = getCurrentAdminId();
                const completedId = getCompletedResponseId(adminId);
                if (completedId) {
                  navigate(`/result?admin=${adminId}`);
                }
              }}
            >
              내 결과 다시 확인하기
            </button>
          )}
        </div>
      </Layout>
    </>
  );
}
