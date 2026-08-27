export function getDeviceId() {
  const KEY = 'driving_checklist_device_id';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = `dev_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem(KEY, id);
  }
  return id;
}

export function getConnectionId() {
  const KEY = 'driving_checklist_connection_id';
  let id = sessionStorage.getItem(KEY);
  if (!id) {
    id = `conn_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    sessionStorage.setItem(KEY, id);
  }
  return id;
}

function getAdminScopedKey(prefix, adminId = getCurrentAdminId()) {
  return `${prefix}_${adminId || '1'}`;
}

export function saveResponseId(id, adminId = getCurrentAdminId()) {
  localStorage.setItem('driving_checklist_response_id', String(id));
  localStorage.setItem(getAdminScopedKey('driving_checklist_response_id', adminId), String(id));
}

export function getSavedResponseId(adminId = getCurrentAdminId()) {
  return (
    localStorage.getItem(getAdminScopedKey('driving_checklist_response_id', adminId)) ||
    localStorage.getItem('driving_checklist_response_id')
  );
}

export function markResponseCompleted(responseId, adminId = getCurrentAdminId()) {
  localStorage.setItem(getAdminScopedKey('driving_checklist_completed_response_id', adminId), String(responseId));
  saveResponseId(responseId, adminId);
}

export function getCompletedResponseId(adminId = getCurrentAdminId()) {
  return localStorage.getItem(getAdminScopedKey('driving_checklist_completed_response_id', adminId));
}

export function hasCompletedResponse(adminId = getCurrentAdminId()) {
  return !!getCompletedResponseId(adminId);
}

export function setCurrentAdminId(adminId) {
  if (adminId) {
    localStorage.setItem('driving_checklist_admin_id', String(adminId));
  }
}

export function getCurrentAdminId() {
  return localStorage.getItem('driving_checklist_admin_id') || '1';
}

export function captureAdminIdFromSearch(search) {
  const adminId = new URLSearchParams(search).get('admin');
  if (adminId) setCurrentAdminId(adminId);
  return getCurrentAdminId();
}
