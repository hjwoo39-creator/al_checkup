import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Layout from '../components/Layout';
import { getCurrentAdminId, hasCompletedResponse, setCurrentAdminId } from '../utils/device';

export default function HomePage() {
  const location = useLocation();
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const adminId = useMemo(() => {
    return new URLSearchParams(location.search).get('admin') || getCurrentAdminId();
  }, [location.search]);

  useEffect(() => {
    setCurrentAdminId(adminId);
    setAlreadyCompleted(hasCompletedResponse(adminId));
  }, [adminId]);

  return (
    <Layout>
      <Header showLogo={false} />
      <div className="card" style={{ textAlign: 'center', marginTop: 24 }}>
        <img
          className="home-logo"
          src="/images/corporation-logo.png"
          alt="공단 로고"
        />
        <h2 className="card-title" style={{ fontSize: '1.3rem' }}>
          음주진단 자가진단 체크리스트
        </h2>
        <p className="card-desc">
          본 체크리스트는 귀하의 음주운전 성향을 점검하기 위한 설문지입니다.
          <br />
          약 5~10분 정도 소요됩니다.
        </p>
        <div className="btn-group">
          <Link
            to={alreadyCompleted ? `/completed?admin=${adminId}` : `/basic-info?admin=${adminId}`}
            className="btn btn-primary"
            style={{ textDecoration: 'none' }}
          >
            {alreadyCompleted ? '응답 완료 확인' : '시작하기'}
          </Link>
        </div>
      </div>
      <img
        className="home-footer-logo"
        src="/images/koroad-main-ci.png"
        alt="한국도로교통공단 KOROAD"
      />
    </Layout>
  );
}
