import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LinearScale,
  LineElement,
  BarElement,
  ArcElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, LineElement, BarElement, ArcElement, PointElement, Filler, Tooltip);

const BLUE = '#2563eb';
const SLATE = '#94a3b8';
const GRID = '#f1f5f9';
const AXIS_TEXT = { family: 'inherit', size: 11 };

const STATUS_COLORS = {
  approved: '#22c55e',
  rented: '#6366f1',
  pending: '#fbbf24',
  rejected: '#ef4444',
};

function formatAxisDate(dateStr) {
  const [, month, day] = dateStr.split('-');
  return `${day}/${month}`;
}

function formatCompactNumber(value) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}tr`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
  return String(value);
}

// Scriptable option: builds a canvas gradient once the chart area is known
// (Chart.js calls this on every render pass, chartArea is null on the very first).
function verticalFade(hex, alphaTop) {
  return (context) => {
    const { ctx, chartArea } = context.chart;
    if (!chartArea) return `${hex}00`;
    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    gradient.addColorStop(0, hexToRgba(hex, alphaTop));
    gradient.addColorStop(1, hexToRgba(hex, 0));
    return gradient;
  };
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const tooltipBase = {
  backgroundColor: '#fff',
  titleColor: '#111827',
  bodyColor: '#4b5563',
  borderColor: '#e5e7eb',
  borderWidth: 1,
  padding: 10,
  cornerRadius: 10,
  displayColors: false,
  titleFont: { weight: '600', size: 12 },
  bodyFont: { size: 12 },
};

function ChartCard({ title, desc, total, children }) {
  return (
    <div className="surface min-w-0 p-5">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-gray-900">{title}</h3>
          <p className="truncate text-sm text-gray-500">{desc}</p>
        </div>
        {total != null && (
          <p className="flex-shrink-0 text-xl font-bold tabular-nums text-gray-900">{total}</p>
        )}
      </div>
      {children}
    </div>
  );
}

export function TrendBarChart({ title, desc, data, valueLabel }) {
  const total = data.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const chartData = {
    labels: data.map((p) => p.date),
    datasets: [
      {
        data: data.map((p) => p.amount),
        backgroundColor: BLUE,
        borderRadius: 6,
        maxBarThickness: 18,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        ...tooltipBase,
        callbacks: {
          title: (items) => formatAxisDate(items[0].label),
          label: (item) => `${valueLabel}: ${new Intl.NumberFormat('vi-VN').format(item.raw)} đ`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { ...AXIS_TEXT, color: '#898781', maxRotation: 0, autoSkipPadding: 16, callback: (v, i) => formatAxisDate(data[i]?.date ?? '') },
      },
      y: {
        beginAtZero: true,
        grid: { color: GRID },
        border: { display: false },
        ticks: { ...AXIS_TEXT, color: '#898781', callback: (v) => formatCompactNumber(v) },
      },
    },
  };

  return (
    <ChartCard title={title} desc={desc} total={formatCompactNumber(total)}>
      <div style={{ height: 224 }}>
        <Bar data={chartData} options={options} />
      </div>
    </ChartCard>
  );
}

export function DualTrendAreaChart({ title, desc, seriesA, seriesB, labelA, labelB, data }) {
  const totalA = data.reduce((sum, p) => sum + p[seriesA], 0);
  const totalB = data.reduce((sum, p) => sum + p[seriesB], 0);

  const chartData = {
    labels: data.map((p) => p.date),
    datasets: [
      {
        label: labelA,
        data: data.map((p) => p[seriesA]),
        borderColor: BLUE,
        backgroundColor: verticalFade(BLUE, 0.28),
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: BLUE,
        pointHoverBorderWidth: 0,
        borderWidth: 2,
        tension: 0.4,
        fill: true,
      },
      {
        label: labelB,
        data: data.map((p) => p[seriesB]),
        borderColor: SLATE,
        backgroundColor: verticalFade(SLATE, 0.22),
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: SLATE,
        pointHoverBorderWidth: 0,
        borderWidth: 2,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        ...tooltipBase,
        callbacks: { title: (items) => formatAxisDate(items[0].label) },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { ...AXIS_TEXT, color: '#898781', maxRotation: 0, autoSkipPadding: 16, callback: (v, i) => formatAxisDate(data[i]?.date ?? '') },
      },
      y: {
        beginAtZero: true,
        grid: { color: GRID },
        border: { display: false },
        ticks: { ...AXIS_TEXT, color: '#898781' },
      },
    },
  };

  return (
    <ChartCard title={title} desc={desc}>
      <div className="mb-1 flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: BLUE }} />
          {labelA} <span className="font-semibold text-gray-900">{totalA}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: SLATE }} />
          {labelB} <span className="font-semibold text-gray-900">{totalB}</span>
        </span>
      </div>
      <div style={{ height: 190 }}>
        <Line data={chartData} options={options} />
      </div>
    </ChartCard>
  );
}

export function ListingStatusBreakdown({ approved, rented = 0, pending, rejected }) {
  const total = approved + rented + pending + rejected;
  // Rented listings passed approval too - they just aren't visible any more.
  const approvedPct = total > 0 ? Math.round(((approved + rented) / total) * 100) : 0;
  const segments = [
    { key: 'approved', label: 'Đang hiển thị', value: approved, color: STATUS_COLORS.approved },
    { key: 'rented', label: 'Đã cho thuê', value: rented, color: STATUS_COLORS.rented },
    { key: 'pending', label: 'Chờ duyệt', value: pending, color: STATUS_COLORS.pending },
    { key: 'rejected', label: 'Bị từ chối', value: rejected, color: STATUS_COLORS.rejected },
  ];

  const chartData = {
    labels: segments.map((s) => s.label),
    datasets: [
      {
        data: segments.map((s) => s.value),
        backgroundColor: segments.map((s) => s.color),
        borderColor: '#fff',
        borderWidth: 3,
        spacing: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: { display: false },
      tooltip: {
        ...tooltipBase,
        callbacks: { label: (item) => `${item.label}: ${item.raw}` },
      },
    },
  };

  return (
    <div className="surface min-w-0 p-5">
      <div className="mb-4">
        <h3 className="font-semibold text-gray-900">Trạng thái tin đăng</h3>
        <p className="truncate text-sm text-gray-500">{total} tin đăng tổng cộng</p>
      </div>

      {total === 0 ? (
        <p className="py-14 text-center text-sm text-gray-500">Chưa có tin đăng nào.</p>
      ) : (
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-10">
          <div className="relative h-36 w-36 flex-shrink-0">
            <Doughnut data={chartData} options={options} />
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-2xl font-bold tabular-nums text-gray-900">{approvedPct}%</p>
              <p className="text-[11px] text-gray-500">đã duyệt</p>
            </div>
          </div>

          <div className="w-full space-y-2.5 sm:max-w-xs">
            {segments.map((s) => (
              <div key={s.key} className="flex items-center justify-between gap-2 text-sm">
                <span className="flex min-w-0 items-center gap-2 text-gray-600">
                  <span
                    className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="truncate">{s.label}</span>
                </span>
                <span className="flex-shrink-0 font-semibold tabular-nums text-gray-900">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
