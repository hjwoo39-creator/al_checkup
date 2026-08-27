import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import Layout from '../../components/Layout';
import { api, fetchExcel } from '../../api';

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

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('admin_token');
  const initialTab = new URLSearchParams(location.search).get('tab');
  const [tab, setTab] = useState(
    ['overview', 'statistics', 'control', 'accounts', 'settings'].includes(initialTab)
      ? initialTab
      : 'overview'
  );
  const [dashboard, setDashboard] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [responses, setResponses] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [accountForm, setAccountForm] = useState({ adminName: '', password: '' });
  const [editingAccount, setEditingAccount] = useState({ id: null, name: '' });
  const [passwordAccount, setPasswordAccount] = useState({ id: null, password: '' });
  const [pwdForm, setPwdForm] = useState({ current: '', newPwd: '' });
  const [loading, setLoading] = useState(true);
  const [deletingResponseId, setDeletingResponseId] = useState(null);

  const loadData = useCallback(async () => {
    if (!token) {
      navigate('/admin');
      return;
    }
    try {
      const [dash, stats, resp] = await Promise.all([
        api.getDashboard(token),
        api.getStatistics(token),
        api.getAdminResponses(token),
      ]);
      setDashboard(dash);
      setStatistics(stats);
      setResponses(resp);
      if (dash.admin?.role === 'super') {
        const adminAccounts = await api.getAdminAccounts(token);
        setAccounts(adminAccounts);
      } else {
        setAccounts([]);
      }
    } catch {
      localStorage.removeItem('admin_token');
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleSessionAction = async (action) => {
    if (!dashboard?.session) return;
    const id = dashboard.session.id;
    try {
      if (action === 'open') {
        await api.updateSession(token, id, { status: 'open' });
      } else if (action === 'close') {
        await api.updateSession(token, id, { status: 'closed' });
      } else if (action === 'show') {
        await api.updateSession(token, id, { resultsVisible: true });
      } else if (action === 'hide') {
        await api.updateSession(token, id, { resultsVisible: false });
      }
      loadData();
    } catch (err) {
      window.alert(err.message || '오류가 발생했습니다.');
    }
  };

  const handleDeleteResponse = async (responseToDelete) => {
    const confirmed = window.confirm(
      '이 응답을 삭제하시겠습니까?\n삭제한 응답은 통계와 결과 데이터에서 제외되며 복구할 수 없습니다.'
    );
    if (!confirmed) return;

    setDeletingResponseId(responseToDelete.id);
    try {
      await api.deleteAdminResponse(token, responseToDelete.id);
      await loadData();
    } catch (err) {
      window.alert(err.message || '응답 삭제 중 오류가 발생했습니다.');
    } finally {
      setDeletingResponseId(null);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      await api.changePassword(token, {
        currentPassword: pwdForm.current,
        newPassword: pwdForm.newPwd,
      });
      setPwdForm({ current: '', newPwd: '' });
    } catch (err) {
      window.alert(err.message || '비밀번호 변경 실패');
    }
  };

  const handleOpenShare = async () => {
    try {
      if (!session.resultsVisible) {
        await api.updateSession(token, session.id, { resultsVisible: true });
        await loadData();
      }
      const separator = urls.shareUrl.includes('?') ? '&' : '?';
      const returnTo = encodeURIComponent('/admin/dashboard?tab=statistics');
      window.location.href = `${urls.shareUrl}${separator}mode=presentation&returnTo=${returnTo}`;
    } catch (err) {
      window.alert(err.message || '공유 화면을 열 수 없습니다.');
    }
  };

  const handleClearTodayResponses = async () => {
    const confirmed = window.confirm(
      '오늘 수집된 응답을 모두 초기화하시겠습니까?\nExcel 다운로드가 필요하다면 먼저 저장해 주세요. 초기화한 응답은 복구할 수 없습니다.'
    );
    if (!confirmed) return;

    try {
      await api.clearTodayResponses(token);
      await loadData();
    } catch (err) {
      window.alert(err.message || '응답 초기화 중 오류가 발생했습니다.');
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    try {
      await api.createAdminAccount(token, accountForm);
      setAccountForm({ adminName: '', password: '' });
      await loadData();
    } catch (err) {
      window.alert(err.message || '관리자 등록 실패');
    }
  };

  const handleRenameAccount = (account) => {
    setEditingAccount({ id: account.id, name: account.name });
    setPasswordAccount({ id: null, password: '' });
  };

  const handleSaveAccountName = async (account) => {
    const name = editingAccount.name.trim();
    if (!name || name === account.name) {
      setEditingAccount({ id: null, name: '' });
      return;
    }

    try {
      await api.updateAdminAccount(token, account.id, { adminName: name });
      setEditingAccount({ id: null, name: '' });
      await loadData();
    } catch (err) {
      window.alert(err.message || '교육장명 변경 실패');
    }
  };

  const handleResetAccountPassword = async (account) => {
    setPasswordAccount({ id: account.id, password: '' });
    setEditingAccount({ id: null, name: '' });
  };

  const handleSaveAccountPassword = async (account) => {
    if (passwordAccount.password.length < 4) {
      window.alert('비밀번호는 4자 이상이어야 합니다.');
      return;
    }

    try {
      await api.updateAdminAccount(token, account.id, { password: passwordAccount.password });
      setPasswordAccount({ id: null, password: '' });
      await loadData();
    } catch (err) {
      window.alert(err.message || '비밀번호 변경 실패');
    }
  };

  const handleDeleteAccount = async (account) => {
    const confirmed = window.confirm(
      `${account.name} 교육장을 삭제하시겠습니까?\n해당 교육장의 응답, 접속정보, 회차 정보도 함께 삭제되며 복구할 수 없습니다.`
    );
    if (!confirmed) return;

    try {
      await api.deleteAdminAccount(token, account.id);
      await loadData();
    } catch (err) {
      window.alert(err.message || '교육장 삭제 실패');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_info');
    navigate('/admin');
  };

  if (loading) return <div className="loading">대시보드 로딩 중...</div>;
  if (!dashboard) return null;

  const { admin, session, stats, urls } = dashboard;

  // Demographics key-value items helper
  const renderDemographicText = (title, data) => {
    const keys = Object.keys(data || {});
    return (
      <div className="card" style={{ padding: '16px' }}>
        <h4 style={{ fontSize: '0.95rem', marginBottom: '8px', color: 'var(--color-primary)' }}>{title}</h4>
        {keys.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', margin: 0 }}>데이터 없음</p>
        ) : (
          <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '0.9rem', color: 'var(--color-text)' }}>
            {keys.map((k) => (
              <li key={k} style={{ marginBottom: '4px' }}>
                {k}: <strong>{data[k]}명</strong>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  return (
    <>
      <Header subtitle="관리자 대시보드" />
      <Layout wide>
        <div className="admin-nav">
          {[
            ['overview', '현황'],
            ['statistics', '통계'],
            ['control', '운영관리'],
            ['settings', '설정'],
            ...(admin?.role === 'super' ? [['accounts', '관리자페이지']] : []),
          ].map(([key, label]) => (
            <button
              key={key}
              className={tab === key ? 'active' : ''}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
          <button onClick={handleLogout} style={{ marginLeft: 'auto' }}>
            로그아웃
          </button>
        </div>

        {tab === 'overview' && (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="number">{stats.totalResponses}</div>
                <div className="label">총 응답자</div>
              </div>
              <div className="stat-card">
                <div className="number">{stats.onlineCount}</div>
                <div className="label">현재 접속자</div>
              </div>
              <div className="stat-card">
                <div className="number">{stats.completedCount}</div>
                <div className="label">응답 완료</div>
              </div>
              <div className="stat-card">
                <div className="number">{stats.inProgressCount}</div>
                <div className="label">응답 진행 중</div>
              </div>
            </div>

            <div className="card">
              <h3 className="card-title">학습자 접속 QR코드</h3>
              <p>
                교육장: <strong>{admin?.name}</strong>
              </p>
              <p className="card-desc">
                응답 상태:{' '}
                <span className={`badge badge-${session.status === 'open' ? 'open' : 'closed'}`}>
                  {session.status === 'open' ? '응답 중' : '종료'}
                </span>
                <span style={{ marginLeft: 12 }}>
                  공유 화면:{' '}
                  <span className={session.resultsVisible ? 'badge badge-visible' : 'badge badge-closed'}>
                    {session.resultsVisible ? '공개 중' : '숨김'}
                  </span>
                </span>
              </p>
              {urls.qrCode && (
                <div className="qr-display">
                  <img src={urls.qrCode} alt="QR 코드" />
                  <p className="qr-help-text">
                    학습자가 이 QR코드를 스캔하여 접속합니다
                  </p>
                  <div className="url-display">{urls.learnerUrl}</div>
                </div>
              )}
              {!urls.qrCode && <div className="url-display">{urls.learnerUrl}</div>}
            </div>
          </>
        )}

        {tab === 'statistics' && statistics && (
          <>
            <div className="share-stats" style={{ marginBottom: 20 }}>
              <div className="share-stats-row share-stats-status">
                <div className="stat-card">
                  <div className="number">{stats.completedCount}</div>
                  <div className="label">총 응답자 수</div>
                </div>
                <div className="stat-card">
                  <div className="number">{stats.onlineCount}</div>
                  <div className="label">현재 접속</div>
                </div>
              </div>
            </div>

            <div className="card" style={{ marginBottom: 20 }}>
              <h3 className="card-title" style={{ marginBottom: 16 }}>음주성향 요인별 평균 및 수준 분포</h3>
              <div className="data-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>분석 요인</th>
                      <th>평균 점수</th>
                      <th>낮음 인원</th>
                      <th>높음 인원</th>
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
                        <tr key={key}>
                          <td><strong>{label}</strong></td>
                          <td>{avg}점</td>
                          <td>{lowCount}명</td>
                          <td>{highCount}명</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card" style={{ marginBottom: 20 }}>
              <h3 className="card-title" style={{ marginBottom: 16 }}>음주운전 결과 유형별 통계</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                {TYPE_KEYS.map((type) => {
                  const count = statistics.typeDistribution?.[type] || 0;
                  return (
                    <div key={type} style={{
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      background: '#f8fafc',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>{type}</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)' }}>{count}명</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <h3 style={{ fontSize: '1.1rem', marginBottom: 12, marginTop: 24 }}>기본 인적사항 및 운전 정보 통계</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 20 }}>
              {renderDemographicText('성별 분포', statistics.gender)}
              {renderDemographicText('연령대 분포', statistics.ageGroup)}
              {renderDemographicText('운전경력 분포', statistics.drivingExperience)}
              {renderDemographicText('차종 분포', statistics.vehicleType)}
            </div>

            <div className="control-panel" style={{ marginTop: 20, justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary"
                style={{ minWidth: 150, minHeight: 50, fontSize: '1rem', fontWeight: 700 }}
                onClick={handleOpenShare}
              >
                발표모드
              </button>
              <button
                className="btn btn-primary"
                style={{ minWidth: 150, minHeight: 50, fontSize: '1rem', fontWeight: 700 }}
                onClick={() => fetchExcel(token)}
              >
                Excel 다운로드
              </button>
            </div>
          </>
        )}

        {tab === 'control' && (
          <>
            <div className="card">
              <h3 className="card-title">운영관리</h3>
              <p className="card-desc">
                응답 상태:{' '}
                <span className={`badge badge-${session.status === 'open' ? 'open' : 'closed'}`}>
                  {session.status === 'open' ? '응답 중' : '종료'}
                </span>
                <span style={{ marginLeft: 12 }}>
                  공유 화면:{' '}
                  <span className={session.resultsVisible ? 'badge badge-visible' : 'badge badge-closed'}>
                    {session.resultsVisible ? '공개 중' : '숨김'}
                  </span>
                </span>
              </p>
              <div className="control-panel">
                <button className="btn btn-primary" onClick={() => handleSessionAction('open')}>
                  응답 시작
                </button>
                <button className="btn btn-ghost" onClick={() => handleSessionAction('close')}>
                  응답 종료
                </button>
                <button className="btn btn-secondary" onClick={() => handleSessionAction('show')}>
                  결과 공개
                </button>
                <button className="btn btn-ghost" onClick={() => handleSessionAction('hide')}>
                  결과 숨김
                </button>
              </div>

              <div style={{ marginTop: 28, borderTop: '1px solid var(--color-border)', paddingTop: 20 }}>
                <h3 className="card-title">오늘 응답 초기화</h3>
                <p className="card-desc">
                  Excel 다운로드 후 다음 교육을 바로 진행할 때 오늘 수집된 응답만 비웁니다.
                </p>
                <button className="btn btn-danger" style={{ width: 'auto' }} onClick={handleClearTodayResponses}>
                  오늘 응답 초기화
                </button>
              </div>
            </div>

            <div className="card">
              <h3 className="card-title">응답자 목록 ({responses.filter((r) => r.status === 'completed').length}명)</h3>
              <div className="data-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>응답시간</th>
                      <th>성별</th>
                      <th>연령대</th>
                      <th>운전경력</th>
                      <th>차종</th>
                      <th>죄책감</th>
                      <th>운전능력 과신</th>
                      <th>잘못된 손익계산</th>
                      <th>상태</th>
                      <th>관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {responses.map((r) => (
                      <tr key={r.id}>
                        <td>{r.completedAt || r.createdAt || '-'}</td>
                        <td>{r.gender || '-'}</td>
                        <td>{r.ageGroup || '-'}</td>
                        <td>{r.drivingExperience || '-'}</td>
                        <td>{r.vehicleType || '-'}</td>
                        <td>{r.impatienceScore ?? '-'}</td>
                        <td>{r.conformityScore ?? '-'}</td>
                        <td>{r.riskScore ?? '-'}</td>
                        <td>{r.status === 'completed' ? '완료' : '진행중'}</td>
                        <td>
                          <button
                            className="btn btn-danger btn-table-action"
                            onClick={() => handleDeleteResponse(r)}
                            disabled={deletingResponseId === r.id}
                          >
                            {deletingResponseId === r.id ? '삭제 중' : '삭제'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {tab === 'settings' && (
          <div className="card">
            <h3 className="card-title">내 비밀번호 변경</h3>
            <form className="login-form" onSubmit={handleChangePassword}>
              <input
                type="password"
                placeholder="현재 비밀번호"
                value={pwdForm.current}
                onChange={(e) => setPwdForm({ ...pwdForm, current: e.target.value })}
              />
              <input
                type="password"
                placeholder="새 비밀번호 (4자 이상)"
                value={pwdForm.newPwd}
                onChange={(e) => setPwdForm({ ...pwdForm, newPwd: e.target.value })}
              />
              <button className="btn btn-primary" type="submit">내 비밀번호 변경</button>
            </form>
          </div>
        )}

        {tab === 'accounts' && admin?.role === 'super' && (
          <div className="card">
            <h3 className="card-title">교육장 등록</h3>
            <p className="card-desc">
              교육장명과 비밀번호만 등록하면 각 담당자가 자기 전용 QR과 결과를 사용할 수 있습니다.
            </p>
            <form className="login-form" onSubmit={handleCreateAccount}>
              <input
                type="text"
                placeholder="교육장명"
                value={accountForm.adminName}
                onChange={(e) => setAccountForm({ ...accountForm, adminName: e.target.value })}
              />
              <input
                type="password"
                placeholder="비밀번호 (4자 이상)"
                value={accountForm.password}
                onChange={(e) => setAccountForm({ ...accountForm, password: e.target.value })}
              />
              <button className="btn btn-primary" type="submit">교육장 등록</button>
            </form>

            <h4 style={{ marginTop: 24, marginBottom: 12 }}>등록된 교육장</h4>
            <div className="data-table-wrap">
              <table className="data-table accounts-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>교육장명</th>
                    <th>권한</th>
                    <th>등록일</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((account) => (
                    <tr key={account.id}>
                      <td>{account.id}</td>
                      <td>
                        {editingAccount.id === account.id ? (
                          <input
                             className="table-input"
                             type="text"
                             value={editingAccount.name}
                             onChange={(e) => setEditingAccount({ id: account.id, name: e.target.value })}
                             autoFocus
                          />
                        ) : (
                          account.name
                        )}
                      </td>
                      <td>{account.role === 'super' ? '최고관리자' : '관리자'}</td>
                      <td>{account.createdAt}</td>
                      <td>
                        {passwordAccount.id === account.id ? (
                          <div className="table-actions">
                            <input
                              className="table-input table-password-input"
                              type="password"
                              placeholder="새 비밀번호"
                              value={passwordAccount.password}
                              onChange={(e) => setPasswordAccount({ id: account.id, password: e.target.value })}
                              autoFocus
                            />
                            <button className="btn btn-primary btn-table-action" onClick={() => handleSaveAccountPassword(account)}>
                              저장
                            </button>
                            <button className="btn btn-ghost btn-table-action" onClick={() => setPasswordAccount({ id: null, password: '' })}>
                              취소
                            </button>
                          </div>
                        ) : editingAccount.id === account.id ? (
                          <div className="table-actions">
                            <button className="btn btn-primary btn-table-action" onClick={() => handleSaveAccountName(account)}>
                              저장
                            </button>
                            <button className="btn btn-ghost btn-table-action" onClick={() => setEditingAccount({ id: null, name: '' })}>
                              취소
                            </button>
                          </div>
                        ) : (
                          <div className="table-actions">
                            <button
                              className="btn btn-ghost btn-table-action"
                              onClick={() => handleRenameAccount(account)}
                            >
                              이름변경
                            </button>
                            <button
                              className="btn btn-ghost btn-table-action"
                              onClick={() => handleResetAccountPassword(account)}
                            >
                              비밀번호 변경
                            </button>
                            <button
                              className="btn btn-danger btn-table-action"
                              onClick={() => handleDeleteAccount(account)}
                              disabled={account.role === 'super'}
                            >
                              삭제
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Layout>
    </>
  );
}
