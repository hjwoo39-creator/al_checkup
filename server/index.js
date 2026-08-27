import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { registerRoutes } from './routes/api.js';
import { getLocalIpAddress } from './services/scoring.js';
import { initDatabase } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const CLIENT_DIST = path.join(__dirname, '../client/dist');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

registerRoutes(app, PORT);

if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(CLIENT_DIST, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send(`
      <html><body style="font-family:sans-serif;padding:40px;text-align:center">
        <h1>프론트엔드 빌드 필요</h1>
        <p>프로젝트 루트에서 <code>npm start</code>를 실행해 주세요.</p>
      </body></html>
    `);
  });
}

initDatabase()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      const ip = getLocalIpAddress();
      console.log('');
      console.log('========================================');
      console.log('  음주진단 자가진단 체크리스트');
      console.log('========================================');
      console.log('');
      console.log(`  학습자 접속:  http://${ip}:${PORT}`);
      console.log(`  관리자 페이지: http://${ip}:${PORT}/admin`);
      console.log(`  공유 화면:    http://${ip}:${PORT}/share`);
      console.log('');
      console.log('  같은 Wi-Fi 또는 핫스팟에 연결된');
      console.log('  기기에서 위 주소로 접속하세요.');
      console.log('');
      console.log('========================================');
    });
  })
  .catch((err) => {
    console.error('Database initialization failed:', err);
    process.exit(1);
  });

export default app;
