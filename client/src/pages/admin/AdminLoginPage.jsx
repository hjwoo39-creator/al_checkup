import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import Layout from '../../components/Layout';
import { api } from '../../api';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [adminName, setAdminName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [adminList, setAdminList] = useState([]);

  useEffect(() => {
    api.getAdminList()
      .then((data) => {
        setAdminList(data);
        if (data.length > 0) {
          setAdminName(data[0]);
        }
      })
      .catch(() => {
        setError('교육장 목록을 가져올 수 없습니다.');
      });
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { token, admin } = await api.adminLogin(adminName, password);
      localStorage.setItem('admin_token', token);
      localStorage.setItem('admin_info', JSON.stringify(admin));
      navigate('/admin/dashboard');
    } catch {
      setError('관리자명 또는 비밀번호가 올바르지 않습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header subtitle="관리자 로그인" />
      <Layout>
        <div className="card">
          <h2 className="card-title">관리자 로그인</h2>
          <p className="card-desc">
            등록된 교육장명과 비밀번호를 입력해 주세요.
            <br />
            최고관리자는 관리자페이지에서 교육장을 등록할 수 있습니다.
          </p>
          {error && <div className="alert alert-warning">{error}</div>}
          <form className="login-form" onSubmit={handleLogin}>
            <div className="form-group" style={{ marginBottom: '16px', width: '100%' }}>
              <select
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '1rem',
                  backgroundColor: 'white'
                }}
              >
                {adminList.length === 0 && <option value="">교육장 로딩 중...</option>}
                {adminList.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <input
              type="password"
              placeholder="비밀번호 입력"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>
        </div>
      </Layout>
    </>
  );
}
