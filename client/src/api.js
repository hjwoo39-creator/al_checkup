const API_BASE = '/api';

async function request(url, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const res = await fetch(`${API_BASE}${url}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
 // 260904 수정
 
 if (!res.ok) {
    // 404 에러(데이터 없음)가 난 경우 예외 처리
    if (res.status === 404 && url.startsWith('/responses/')) {
      alert('진행 중인 설문 정보를 찾을 수 없습니다. 메인 화면으로 이동합니다.');
      
// 관리자 로그인 토큰을 보호하기 위해 설문 관련 데이터만 선택 삭제
      localStorage.removeItem('driving_checklist_response_id');
      localStorage.removeItem('driving_checklist_response_id_5');
      localStorage.removeItem('driving_checklist_device_id');
      
      window.location.href = '/'; // 메인으로 리다이렉트
      return;
    }

    const err = new Error(data.error || data.message || '요청 실패');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}
//
export const api = {
  getServerInfo: (adminId) => request(`/server-info?admin=${encodeURIComponent(adminId || 1)}`),
  getQuestions: () => request('/questions'),
  getAdminList: () => request('/admin/list'),
  getActiveSession: (adminId) => request(`/session/active?admin=${encodeURIComponent(adminId || 1)}`),
  sendPresence: (body) => request('/presence', { method: 'POST', body: JSON.stringify(body) }),
  startResponse: (deviceId, adminId) =>
    request('/responses/start', { method: 'POST', body: JSON.stringify({ deviceId, adminId }) }),
  checkResponse: (deviceId, adminId) =>
    request(`/responses/check/${deviceId}?admin=${encodeURIComponent(adminId || 1)}`),
  updateResponse: (id, body) =>
    request(`/responses/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  getResponse: (id) => request(`/responses/${id}`), // <-- 이 줄 추가
  getResult: (id) => request(`/responses/${id}/result`),
  adminLogin: (adminName, password) =>
    request('/admin/login', { method: 'POST', body: JSON.stringify({ adminName, password }) }),
  changePassword: (token, body) =>
    request('/admin/change-password', {
      method: 'POST',
      headers: { 'X-Admin-Token': token },
      body: JSON.stringify(body),
    }),
  getDashboard: (token) =>
    request('/admin/dashboard', { headers: { 'X-Admin-Token': token } }),
  getAdminResponses: (token) =>
    request('/admin/responses', { headers: { 'X-Admin-Token': token } }),
  deleteAdminResponse: (token, id) =>
    request(`/admin/responses/${id}`, {
      method: 'DELETE',
      headers: { 'X-Admin-Token': token },
    }),
  clearTodayResponses: (token) =>
    request('/admin/today-responses', {
      method: 'DELETE',
      headers: { 'X-Admin-Token': token },
    }),
  getStatistics: (token) =>
    request('/admin/statistics', { headers: { 'X-Admin-Token': token } }),
  getSessions: (token) =>
    request('/admin/sessions', { headers: { 'X-Admin-Token': token } }),
  createSession: (token, name) =>
    request('/admin/sessions', {
      method: 'POST',
      headers: { 'X-Admin-Token': token },
      body: JSON.stringify({ name }),
    }),
  updateSession: (token, id, body) =>
    request(`/admin/sessions/${id}`, {
      method: 'PATCH',
      headers: { 'X-Admin-Token': token },
      body: JSON.stringify(body),
    }),
  deleteSession: (token, id) =>
    request(`/admin/sessions/${id}`, {
      method: 'DELETE',
      headers: { 'X-Admin-Token': token },
    }),
  backup: (token) =>
    request('/admin/backup', { method: 'POST', headers: { 'X-Admin-Token': token } }),
  getAdminAccounts: (token) =>
    request('/admin/accounts', { headers: { 'X-Admin-Token': token } }),
  createAdminAccount: (token, body) =>
    request('/admin/accounts', {
      method: 'POST',
      headers: { 'X-Admin-Token': token },
      body: JSON.stringify(body),
    }),
  updateAdminAccount: (token, id, body) =>
    request(`/admin/accounts/${id}`, {
      method: 'PATCH',
      headers: { 'X-Admin-Token': token },
      body: JSON.stringify(body),
    }),
  deleteAdminAccount: (token, id) =>
    request(`/admin/accounts/${id}`, {
      method: 'DELETE',
      headers: { 'X-Admin-Token': token },
    }),
  getShareStatistics: (adminId) =>
    request(`/share/statistics?admin=${encodeURIComponent(adminId || 1)}`),
};

export function downloadExcel(token) {
  window.open(`/api/admin/export/excel?token=${encodeURIComponent(token)}`, '_blank');
}

export function getExcelDownloadUrl(token) {
  return `/api/admin/export/excel`;
}

export async function fetchExcel(token) {
  const res = await fetch('/api/admin/export/excel', {
    headers: { 'X-Admin-Token': token },
  });
  if (!res.ok) throw new Error('Excel 다운로드 실패');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'driving_checklist_results.xlsx';
  a.click();
  URL.revokeObjectURL(url);
}

export async function fetchPdf(token) {
  const res = await fetch('/api/admin/export/pdf', {
    headers: { 'X-Admin-Token': token },
  });
  if (!res.ok) throw new Error('PDF 다운로드 실패');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'driving_checklist_report.pdf';
  a.click();
  URL.revokeObjectURL(url);
}
