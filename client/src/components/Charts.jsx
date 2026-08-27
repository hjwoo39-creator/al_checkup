import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { getLevelColor, getScoreColor } from '../utils/scoreColors';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);
ChartJS.defaults.font.family = "'NanumSquare Neo', 'Malgun Gothic', sans-serif";

const CHART_COLORS = ['#0878f9', '#00a3ff', '#0057b8', '#42b8ff', '#0046d5', '#73c9ff'];

export function StatBarChart({ title, data }) {
  const labels = Object.keys(data || {});
  const values = Object.values(data || {});

  if (labels.length === 0) {
    return (
      <div className="chart-container">
        <h3 style={{ marginBottom: 12, fontSize: '1rem' }}>{title}</h3>
        <p style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>데이터 없음</p>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <h3 style={{ marginBottom: 12, fontSize: '1rem' }}>{title}</h3>
      <Bar
        data={{
          labels,
          datasets: [{
            label: '응답 수',
            data: values,
            backgroundColor: CHART_COLORS.slice(0, labels.length),
            borderRadius: 6,
          }],
        }}
        options={{
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
        }}
      />
    </div>
  );
}

export function LevelDoughnut({ title, data }) {
  const labels = Object.keys(data || {}).filter((k) => data[k] > 0);
  const values = labels.map((k) => data[k]);

  if (labels.length === 0) {
    return (
      <div className="chart-container">
        <h3 style={{ marginBottom: 12, fontSize: '1rem' }}>{title}</h3>
        <p style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>데이터 없음</p>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <h3 style={{ marginBottom: 12, fontSize: '1rem' }}>{title}</h3>
      <div style={{ maxWidth: 280, margin: '0 auto' }}>
        <Doughnut
          data={{
            labels,
            datasets: [{
              data: values,
              backgroundColor: labels.map(getLevelColor),
            }],
          }}
          options={{
            responsive: true,
            plugins: { legend: { position: 'bottom' } },
          }}
        />
      </div>
    </div>
  );
}

export function AverageBarChart({ averages }) {
  const factors = [
    { key: 'guilt', label: '죄책감' },
    { key: 'overconfidence', label: '운전능력 과신' },
    { key: 'miscalculation', label: '잘못된 손익계산' },
    { key: 'internal_attr', label: '내부귀인' },
    { key: 'external_attr', label: '외부귀인' },
    { key: 'self_control', label: '자기통제력' },
    { key: 'impulsiveness', label: '충동성' },
    { key: 'sensation_seeking', label: '감각추구' },
    { key: 'morality', label: '도덕성' },
  ];

  const values = factors.map(f => averages?.[f.key] || 0);
  const labels = factors.map(f => f.label);
  const colors = factors.map(f => getScoreColor(f.key, averages?.[f.key] || 0));

  return (
    <div className="chart-container">
      <h3 style={{ marginBottom: 12, fontSize: '1rem' }}>음주성향 요인별 평균 점수</h3>
      <Bar
        data={{
          labels,
          datasets: [{
            label: '평균 점수',
            data: values,
            backgroundColor: colors,
            borderRadius: 6,
          }],
        }}
        options={{
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } },
        }}
      />
    </div>
  );
}
