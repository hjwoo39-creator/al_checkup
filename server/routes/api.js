import os from 'os';
import { getLocalIpAddress } from '../services/scoring.js';
import {
  getSetting,
  getActiveSession,
  getActiveSessionByAdmin,
  getSessionById,
  getAdminById,
  getAdminByName,
  getAdminByToken,
  getAllAdmins,
  createAdmin,
  updateAdminPassword,
  updateAdminName,
  deleteAdmin,
  setAdminToken,
  getSessionsByAdmin,
  createSessionForAdmin,
  updateSession,
  deleteSession,
  getResponseByDevice,
  getResponseById,
  deleteResponse,
  deleteTodayResponsesBySession,
  createResponse,
  updateResponse,
  getResponsesBySession,
  getTodayResponsesBySession,
  getCompletedResponses,
  getTodayCompletedResponses,
  upsertConnection,
  getDashboardStats,
  backupDatabase,
  isPostgres,
} from '../db.js';
import { SECTIONS, ALL_QUESTIONS, LIKERT_SCALE, BASIC_INFO_OPTIONS } from '../data/questions.js';
import { RESULT_RULES } from '../data/resultRules.js';
import { computeScores } from '../services/scoring.js';
import ExcelJS from 'exceljs';
import QRCode from 'qrcode';
import { generatePdfReport } from '../services/pdfReport.js';

async function checkAdmin(req, res, next) {
  const token = req.headers['x-admin-token'];
  const admin = await getAdminByToken(token);
  if (!admin) {
    return res.status(401).json({ error: '관리자 인증이 필요합니다.' });
  }
  req.admin = admin;
  next();
}

function checkSuperAdmin(req, res, next) {
  if (req.admin?.role !== 'super') {
    return res.status(403).json({ error: '최고관리자만 사용할 수 있습니다.' });
  }
  next();
}

function getBaseUrl(req, port) {
  if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL.replace(/\/$/, '');
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.get('host');
  if (host) return `${protocol}://${host}`;
  return `http://${getLocalIpAddress()}:${port}`;
}

function getAdminId(req) {
  return Number(req.query.admin || req.body?.adminId || req.headers['x-admin-id'] || 1);
}

function buildUrls(req, port, adminId = 1) {
  const base = getBaseUrl(req, port);
  const admin = encodeURIComponent(adminId);
  return {
    ip: getLocalIpAddress(),
    port,
    learnerUrl: `${base}/?admin=${admin}`,
    adminUrl: `${base}/admin`,
    shareUrl: `${base}/share?admin=${admin}`,
  };
}

export function registerRoutes(app, port) {
  app.get('/api/server-info', async (req, res) => {
    const urls = buildUrls(req, port, getAdminId(req));
    let qrCode = '';
    try {
      qrCode = await QRCode.toDataURL(urls.learnerUrl, { width: 280, margin: 2 });
    } catch {
      qrCode = '';
    }
    res.json({ ...urls, qrCode });
  });

  app.get('/api/questions', (req, res) => {
    res.json({ sections: SECTIONS, likertScale: LIKERT_SCALE, basicInfo: BASIC_INFO_OPTIONS });
  });

  app.get('/api/admin/list', async (req, res) => {
    try {
      const admins = await getAllAdmins();
      res.json(admins.map((a) => a.name));
    } catch {
      res.status(500).json({ error: '교육장 목록을 가져올 수 없습니다.' });
    }
  });

  app.get('/api/result-rules', (req, res) => {
    res.json(RESULT_RULES);
  });

  app.get('/api/session/active', async (req, res) => {
    const session = await getActiveSessionByAdmin(getAdminId(req)) || await getActiveSession();
    if (!session) return res.status(404).json({ error: '활성 교육 회차가 없습니다.' });
    res.json({
      id: session.id,
      name: session.name,
      status: session.status,
      resultsVisible: !!session.results_visible,
    });
  });

  app.post('/api/presence', async (req, res) => {
    const { connectionId, sessionId, page, adminId } = req.body;
    if (!connectionId) return res.status(400).json({ error: 'connectionId 필요' });
    const session = sessionId ? await getSessionById(sessionId) : await getActiveSessionByAdmin(Number(adminId || 1));
    await upsertConnection(connectionId, session?.id || null, page || 'unknown');
    res.json({ ok: true });
  });

  app.post('/api/responses/start', async (req, res) => {
    const { deviceId, adminId } = req.body;
    if (!deviceId) return res.status(400).json({ error: 'deviceId 필요' });

    const session = await getActiveSessionByAdmin(Number(adminId || 1));
    if (!session) return res.status(400).json({ error: '활성 교육 회차가 없습니다.' });
    if (session.status === 'closed') {
      return res.status(403).json({ error: '현재 응답이 종료되었습니다.' });
    }

    let response = await getResponseByDevice(session.id, deviceId);
    if (response) {
      if (response.status === 'completed') {
        return res.status(409).json({
          error: 'already_completed',
          message: '이미 응답이 완료되었습니다.',
          response: formatResponse(response),
        });
      }
      return res.json({ response: formatResponse(response), sessionId: session.id });
    }

    response = await createResponse(session.id, deviceId);
    res.json({ response: formatResponse(response), sessionId: session.id });
  });

  app.get('/api/responses/check/:deviceId', async (req, res) => {
    const session = await getActiveSessionByAdmin(getAdminId(req));
    if (!session) return res.json({ exists: false });
    const response = await getResponseByDevice(session.id, req.params.deviceId);
    if (!response) return res.json({ exists: false });
    if (response.status === 'completed') {
      return res.json({
        exists: true,
        completed: true,
        message: '이미 응답이 완료되었습니다.',
        response: formatResponse(response),
      });
    }
    res.json({ exists: true, completed: false, response: formatResponse(response) });
  });

  app.patch('/api/responses/:id', async (req, res) => {
    const response = await getResponseById(req.params.id);
    if (!response) return res.status(404).json({ error: '응답을 찾을 수 없습니다.' });
    if (response.status === 'completed') {
      return res.status(409).json({ error: 'already_completed', message: '이미 응답이 완료되었습니다.' });
    }

    const session = await getSessionById(response.session_id);
    if (session?.status === 'closed') {
      return res.status(403).json({ error: '현재 응답이 종료되었습니다.' });
    }

    const { basicInfo, answers, complete } = req.body;
    const updateData = {};

    if (basicInfo) {
      updateData.gender = basicInfo.gender;
      updateData.age_group = basicInfo.ageGroup;
      updateData.driving_experience = basicInfo.drivingExperience;
      updateData.vehicle_type = basicInfo.vehicleType;
    }

    if (answers) {
      const merged = { ...JSON.parse(response.answers_json || '{}'), ...answers };
      updateData.answers_json = JSON.stringify(merged);

      if (complete) {
        const scores = computeScores(merged);
        updateData.impatience_score = scores.impatienceScore;
        updateData.conformity_score = scores.conformityScore;
        updateData.risk_score = scores.riskScore;
        updateData.result_type = scores.resultType;
        updateData.result_json = JSON.stringify(scores.results);
        updateData.status = 'completed';
        updateData.completed_at = new Date().toISOString();
      }
    }

    const updated = await updateResponse(response.id, updateData);
    res.json({ response: formatResponse(updated) });
  });

  app.get('/api/responses/:id/result', async (req, res) => {
    const response = await getResponseById(req.params.id);
    if (!response) return res.status(404).json({ error: '응답을 찾을 수 없습니다.' });
    const session = await getSessionById(response.session_id);
    const results = JSON.parse(response.result_json || '{}');
    res.json({
      response: formatResponse(response),
      results,
      resultsVisible: !!session?.results_visible,
      sessionStatus: session?.status,
    });
  });

  // Admin auth
  app.post('/api/admin/login', async (req, res) => {
    const { adminName, password } = req.body;
    const name = String(adminName || '').trim();
    if (!name) {
      return res.status(400).json({ error: '교육장명을 입력해 주세요.' });
    }
    const admin = await getAdminByName(name);
    if (!admin || password !== admin.password) {
      return res.status(401).json({ error: '관리자명 또는 비밀번호가 올바르지 않습니다.' });
    }
    const token = Buffer.from(`${Date.now()}-${Math.random()}`).toString('base64');
    await setAdminToken(admin.id, token);
    res.json({ token, admin: formatAdmin(admin) });
  });

  app.post('/api/admin/change-password', checkAdmin, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (currentPassword !== req.admin.password) {
      return res.status(401).json({ error: '현재 비밀번호가 올바르지 않습니다.' });
    }
    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ error: '새 비밀번호는 4자 이상이어야 합니다.' });
    }
    await updateAdminPassword(req.admin.id, newPassword);
    res.json({ ok: true });
  });

  app.get('/api/admin/accounts', checkAdmin, checkSuperAdmin, async (req, res) => {
    const list = await getAllAdmins();
    res.json(list.map(formatAdmin));
  });

  app.post('/api/admin/accounts', checkAdmin, checkSuperAdmin, async (req, res) => {
    const { adminName, password } = req.body;
    const name = String(adminName || '').trim();
    if (!name) return res.status(400).json({ error: '교육장명을 입력해 주세요.' });
    if (!password || password.length < 4) {
      return res.status(400).json({ error: '비밀번호는 4자 이상이어야 합니다.' });
    }
    if (await getAdminByName(name)) {
      return res.status(409).json({ error: '이미 등록된 교육장명입니다.' });
    }
    const admin = await createAdmin(name, password);
    res.json(formatAdmin(admin));
  });

  app.patch('/api/admin/accounts/:id', checkAdmin, checkSuperAdmin, async (req, res) => {
    const target = await getAdminById(req.params.id);
    if (!target) return res.status(404).json({ error: '교육장을 찾을 수 없습니다.' });

    const { adminName, password } = req.body;
    const name = String(adminName || '').trim();
    if (name) {
      const duplicate = await getAdminByName(name);
      if (duplicate && duplicate.id !== target.id) {
        return res.status(409).json({ error: '이미 등록된 교육장명입니다.' });
      }
      await updateAdminName(target.id, name);
    }

    if (password !== undefined) {
      if (!password || password.length < 4) {
        return res.status(400).json({ error: '비밀번호는 4자 이상이어야 합니다.' });
      }
      await updateAdminPassword(target.id, password);
    }

    const updated = await getAdminById(target.id);
    res.json(formatAdmin(updated));
  });

  app.delete('/api/admin/accounts/:id', checkAdmin, checkSuperAdmin, async (req, res) => {
    const target = await getAdminById(req.params.id);
    if (!target) return res.status(404).json({ error: '교육장을 찾을 수 없습니다.' });
    if (target.role === 'super') {
      return res.status(400).json({ error: '최고관리자 계정은 삭제할 수 없습니다.' });
    }
    await deleteAdmin(target.id);
    res.json({ ok: true, deleted: formatAdmin(target) });
  });

  app.get('/api/admin/dashboard', checkAdmin, async (req, res) => {
    const session = await getActiveSessionByAdmin(req.admin.id);
    if (!session) return res.status(404).json({ error: '활성 회차 없음' });
    const stats = await getDashboardStats(session.id);
    const urls = buildUrls(req, port, req.admin.id);
    let qrCode = '';
    try {
      qrCode = await QRCode.toDataURL(urls.learnerUrl, {
        width: 420,
        margin: 3,
        errorCorrectionLevel: 'H',
      });
    } catch {
      qrCode = '';
    }
    res.json({ admin: formatAdmin(req.admin), session: formatSession(session), stats, urls: { ...urls, qrCode } });
  });

  app.get('/api/admin/responses', checkAdmin, async (req, res) => {
    const session = await getActiveSessionByAdmin(req.admin.id);
    if (!session) return res.json([]);
    const responses = await getTodayResponsesBySession(session.id);
    res.json(responses.map(formatResponse));
  });

  app.delete('/api/admin/responses/:id', checkAdmin, async (req, res) => {
    const response = await getResponseById(req.params.id);
    if (!response) {
      return res.status(404).json({ error: '삭제할 응답을 찾을 수 없습니다.' });
    }

    const session = await getActiveSessionByAdmin(req.admin.id);
    if (!session || response.session_id !== session.id) {
      return res.status(409).json({ error: '현재 회차의 응답만 삭제할 수 있습니다.' });
    }

    await deleteResponse(response.id);
    res.json({ ok: true, deletedResponseId: response.id });
  });

  app.delete('/api/admin/today-responses', checkAdmin, async (req, res) => {
    const session = await getActiveSessionByAdmin(req.admin.id);
    if (!session) return res.status(404).json({ error: '활성 회차 없음' });
    const deletedCount = await deleteTodayResponsesBySession(session.id);
    res.json({ ok: true, deletedCount });
  });

  app.get('/api/admin/statistics', checkAdmin, async (req, res) => {
    const session = await getActiveSessionByAdmin(req.admin.id);
    if (!session) return res.json({});
    const responses = await getTodayCompletedResponses(session.id);
    res.json(buildStatistics(responses));
  });

  app.get('/api/admin/export/excel', checkAdmin, async (req, res) => {
    const session = await getActiveSessionByAdmin(req.admin.id);
    const responses = session ? await getTodayCompletedResponses(session.id) : [];

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('응답결과');

    const baseColumns = [
      { header: '응답시간', key: 'completed_at', width: 20 },
      { header: '성별', key: 'gender', width: 10 },
      { header: '연령대', key: 'age_group', width: 12 },
      { header: '운전경력', key: 'driving_experience', width: 12 },
      { header: '차종', key: 'vehicle_type', width: 12 },
      { header: '죄책감점수', key: 'guilt_score', width: 12 },
      { header: '운전능력과신점수', key: 'overconfidence_score', width: 15 },
      { header: '잘못된손익계산점수', key: 'miscalculation_score', width: 15 },
      { header: '내부귀인점수', key: 'internal_attr_score', width: 12 },
      { header: '외부귀인점수', key: 'external_attr_score', width: 12 },
      { header: '자기통제력점수', key: 'self_control_score', width: 12 },
      { header: '충동성점수', key: 'impulsiveness_score', width: 12 },
      { header: '감각추구성향점수', key: 'sensation_seeking_score', width: 15 },
      { header: '도덕성점수', key: 'morality_score', width: 12 },
      { header: '결과유형', key: 'result_type', width: 25 },
    ];

    const questionColumns = ALL_QUESTIONS.map((q) => ({
      header: `Q${q.number}`,
      key: q.id,
      width: 8,
    }));

    sheet.columns = [...baseColumns, ...questionColumns];

    for (const r of responses) {
      const answers = JSON.parse(r.answers_json || '{}');
      const results = r.result_json ? JSON.parse(r.result_json) : {};
      const row = {
        completed_at: r.completed_at,
        gender: r.gender,
        age_group: r.age_group,
        driving_experience: r.driving_experience,
        vehicle_type: r.vehicle_type,
        guilt_score: results.guilt?.score ?? '',
        overconfidence_score: results.overconfidence?.score ?? '',
        miscalculation_score: results.miscalculation?.score ?? '',
        internal_attr_score: results.internal_attr?.score ?? '',
        external_attr_score: results.external_attr?.score ?? '',
        self_control_score: results.self_control?.score ?? '',
        impulsiveness_score: results.impulsiveness?.score ?? '',
        sensation_seeking_score: results.sensation_seeking?.score ?? '',
        morality_score: results.morality?.score ?? '',
        result_type: r.result_type,
      };
      for (const q of ALL_QUESTIONS) {
        row[q.id] = answers[q.id] ?? '';
      }
      sheet.addRow(row);
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=drinking_survey_results.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  });

  // Session management (Phase 2)
  app.get('/api/admin/sessions', checkAdmin, async (req, res) => {
    const list = await getSessionsByAdmin(req.admin.id);
    res.json(list.map(formatSession));
  });

  app.post('/api/admin/sessions', checkAdmin, async (req, res) => {
    const session = await createSessionForAdmin(req.admin.id, req.body.name);
    res.json(formatSession(session));
  });

  app.patch('/api/admin/sessions/:id', checkAdmin, async (req, res) => {
    const { status, resultsVisible, name } = req.body;
    const updates = {};
    if (status) {
      updates.status = status;
      if (status === 'closed') updates.closed_at = new Date().toISOString();
      if (status === 'open') updates.started_at = new Date().toISOString();
    }
    if (resultsVisible !== undefined) updates.results_visible = resultsVisible ? 1 : 0;
    if (name) updates.name = name;
    const target = await getSessionById(req.params.id);
    if (!target || target.admin_id !== req.admin.id) {
      return res.status(404).json({ error: '교육 회차를 찾을 수 없습니다.' });
    }
    const session = await updateSession(req.params.id, updates);
    res.json(formatSession(session));
  });

  app.delete('/api/admin/sessions/:id', checkAdmin, async (req, res) => {
    const session = await getSessionById(req.params.id);
    if (!session) {
      return res.status(404).json({ error: '삭제할 교육 회차를 찾을 수 없습니다.' });
    }

    if (session.admin_id !== req.admin.id) {
      return res.status(404).json({ error: '삭제할 교육 회차를 찾을 수 없습니다.' });
    }

    const activeSession = await getActiveSessionByAdmin(req.admin.id);
    if (activeSession?.id === session.id) {
      return res.status(409).json({ error: '현재 회차는 삭제할 수 없습니다. 새 회차를 만든 후 삭제해 주세요.' });
    }

    const deleted = await deleteSession(session.id);
    res.json({
      ok: true,
      deletedSession: formatSession(deleted.session),
      deletedResponseCount: deleted.responseCount,
    });
  });

  app.post('/api/admin/backup', checkAdmin, async (req, res) => {
    const backupPath = await backupDatabase();
    res.json({ ok: true, path: backupPath });
  });

  app.get('/api/admin/export/pdf', checkAdmin, async (req, res) => {
    const session = await getActiveSessionByAdmin(req.admin.id);
    const responses = session ? await getTodayCompletedResponses(session.id) : [];
    const stats = await buildStatistics(responses);

    try {
      const pdfBuffer = await generatePdfReport(session, stats, responses);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=drinking_survey_report.pdf');
      res.send(pdfBuffer);
    } catch (err) {
      console.error('PDF generation error:', err);
      res.status(500).json({ error: 'PDF 생성 중 오류가 발생했습니다.' });
    }
  });

  // Share page API
  app.get('/api/share/statistics', async (req, res) => {
    const session = await getActiveSessionByAdmin(getAdminId(req));
    if (!session) return res.status(404).json({ error: '활성 회차 없음' });
    if (!session.results_visible) {
      return res.status(403).json({ error: '결과가 아직 공개되지 않았습니다.' });
    }
    const responses = await getTodayCompletedResponses(session.id);
    const stats = await getDashboardStats(session.id);
    res.json({
      session: formatSession(session),
      statistics: buildStatistics(responses),
      stats,
      updatedAt: new Date().toISOString(),
    });
  });
}

function formatAdmin(admin) {
  return {
    id: admin.id,
    name: admin.name,
    role: admin.role,
    createdAt: admin.created_at,
  };
}

function formatSession(s) {
  return {
    id: s.id,
    name: s.name,
    status: s.status,
    resultsVisible: !!s.results_visible,
    createdAt: s.created_at,
    startedAt: s.started_at,
    closedAt: s.closed_at,
  };
}

function formatResponse(r) {
  return {
    id: r.id,
    sessionId: r.session_id,
    deviceId: r.device_id,
    status: r.status,
    gender: r.gender,
    ageGroup: r.age_group,
    drivingExperience: r.driving_experience,
    vehicleType: r.vehicle_type,
    impatienceScore: r.impatience_score,
    conformityScore: r.conformity_score,
    riskScore: r.risk_score,
    resultType: r.result_type,
    results: r.result_json ? JSON.parse(r.result_json) : null,
    answers: r.answers_json ? JSON.parse(r.answers_json) : {},
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    completedAt: r.completed_at,
  };
}

function buildStatistics(responses) {
  const countBy = (field) => {
    const map = {};
    for (const r of responses) {
      const val = r[field] || '미입력';
      map[val] = (map[val] || 0) + 1;
    }
    return map;
  };

  const avgFactor = (factorKey) => {
    if (responses.length === 0) return 0;
    const sum = responses.reduce((s, r) => {
      const results = r.result_json ? JSON.parse(r.result_json) : null;
      return s + (results?.[factorKey]?.score || 0);
    }, 0);
    return Math.round((sum / responses.length) * 10) / 10;
  };

  const levelCountFactor = (factorKey) => {
    const map = { 양호: 0, 주의: 0 };
    for (const r of responses) {
      const results = r.result_json ? JSON.parse(r.result_json) : null;
      const level = results?.[factorKey]?.level || '양호';
      map[level] = (map[level] || 0) + 1;
    }
    return map;
  };

  const typeCount = {
    '1가형': 0, '1나형': 0,
    '2가형': 0, '2나형': 0,
    '3가형': 0, '3나형': 0,
    '4가형': 0, '4나형': 0,
    '판정불가': 0
  };
  for (const r of responses) {
    const type = r.result_type || '';
    const match = type.match(/^[1-4][가나]형/);
    if (match) {
      typeCount[match[0]]++;
    } else {
      typeCount['판정불가']++;
    }
  }

  return {
    total: responses.length,
    gender: countBy('gender'),
    ageGroup: countBy('age_group'),
    drivingExperience: countBy('driving_experience'),
    vehicleType: countBy('vehicle_type'),
    typeDistribution: typeCount,
    averages: {
      guilt: avgFactor('guilt'),
      overconfidence: avgFactor('overconfidence'),
      miscalculation: avgFactor('miscalculation'),
      internal_attr: avgFactor('internal_attr'),
      external_attr: avgFactor('external_attr'),
      self_control: avgFactor('self_control'),
      impulsiveness: avgFactor('impulsiveness'),
      sensation_seeking: avgFactor('sensation_seeking'),
      morality: avgFactor('morality'),
    },
    levelDistribution: {
      guilt: levelCountFactor('guilt'),
      overconfidence: levelCountFactor('overconfidence'),
      miscalculation: levelCountFactor('miscalculation'),
      internal_attr: levelCountFactor('internal_attr'),
      external_attr: levelCountFactor('external_attr'),
      self_control: levelCountFactor('self_control'),
      impulsiveness: levelCountFactor('impulsiveness'),
      sensation_seeking: levelCountFactor('sensation_seeking'),
      morality: levelCountFactor('morality'),
    },
  };
}
