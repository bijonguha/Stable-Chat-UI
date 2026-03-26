import { Bar, Line, Pie, Doughnut, Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  ArcElement, Title, Tooltip, Legend, Filler
);

const CHART_MAP: Record<string, React.ComponentType<any>> = {
  line: Line,
  bar: Bar,
  pie: Pie,
  doughnut: Doughnut,
  scatter: Scatter,
};

const CARTESIAN_TYPES = new Set(['line', 'bar', 'scatter']);

// Vibrant palette that pops on dark backgrounds
const PALETTE = [
  '#6366f1', // indigo
  '#22d3ee', // cyan
  '#f59e0b', // amber
  '#10b981', // emerald
  '#f43f5e', // rose
  '#a855f7', // purple
  '#fb923c', // orange
  '#84cc16', // lime
];

const PALETTE_ALPHA = PALETTE.map(c => c + '33'); // ~20% opacity fill

function colorizeDatasets(datasets: any[], chartType: string): any[] {
  const isArc = chartType === 'pie' || chartType === 'doughnut';
  return datasets.map((ds, i) => {
    if (isArc) {
      // Assign a color per data point
      const count = Array.isArray(ds.data) ? ds.data.length : 0;
      return {
        ...ds,
        backgroundColor: ds.backgroundColor ?? Array.from({ length: count }, (_, j) => PALETTE[j % PALETTE.length]),
        borderColor: ds.borderColor ?? '#1a1a2e',
        borderWidth: ds.borderWidth ?? 2,
      };
    }
    const color = PALETTE[i % PALETTE.length];
    return {
      ...ds,
      borderColor: ds.borderColor ?? color,
      backgroundColor: ds.backgroundColor ?? (chartType === 'line' ? PALETTE_ALPHA[i % PALETTE.length] : color),
      pointBackgroundColor: ds.pointBackgroundColor ?? color,
      pointBorderColor: ds.pointBorderColor ?? '#fff',
      pointRadius: ds.pointRadius ?? 4,
      borderWidth: ds.borderWidth ?? 2,
      tension: ds.tension ?? (chartType === 'line' ? 0.3 : undefined),
    };
  });
}

export function ChartBlock({ rawJson }: { rawJson: string }) {
  let parsed: any;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    // JSON is incomplete — still streaming. Show a placeholder instead of an error.
    return (
      <div className="my-3 rounded-xl border border-white/10 bg-white/5 p-4 flex items-center gap-3" style={{ height: '64px' }}>
        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse flex-shrink-0" />
        <span className="text-xs text-dark-300">Rendering chart…</span>
      </div>
    );
  }

  const { type: chartType, title, xLabel, yLabel, data } = parsed;
  const Component = CHART_MAP[(chartType ?? '').toLowerCase()];

  if (!Component) {
    return (
      <div className="my-2 rounded-lg border border-dark-400/30 px-4 py-3 text-sm text-dark-300">
        Missing or unsupported chart type:{' '}
        <code className="text-amber-400">{chartType}</code>. Add{' '}
        <code className="text-amber-400">"type": "line|bar|pie|doughnut|scatter"</code> to the JSON.
      </div>
    );
  }

  const type = chartType.toLowerCase();
  const coloredData = {
    ...data,
    datasets: colorizeDatasets(data?.datasets ?? [], type),
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#ccc', font: { size: 12 } },
      },
      title: {
        display: !!title,
        text: title ?? '',
        color: '#e2e8f0',
        font: { size: 14, weight: 'bold' },
        padding: { bottom: 12 },
      },
      tooltip: {
        backgroundColor: '#1e1e2e',
        titleColor: '#e2e8f0',
        bodyColor: '#a0aec0',
        borderColor: '#4a5568',
        borderWidth: 1,
      },
    },
  };

  if (CARTESIAN_TYPES.has(type)) {
    options.scales = {
      x: {
        ticks: { color: '#94a3b8', font: { size: 11 } },
        grid: { color: '#ffffff10' },
        border: { color: '#ffffff20' },
        title: xLabel ? { display: true, text: xLabel, color: '#94a3b8', font: { size: 12 } } : undefined,
      },
      y: {
        ticks: { color: '#94a3b8', font: { size: 11 } },
        grid: { color: '#ffffff10' },
        border: { color: '#ffffff20' },
        title: yLabel ? { display: true, text: yLabel, color: '#94a3b8', font: { size: 12 } } : undefined,
      },
    };
  }

  return (
    <div
      className="my-3 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
      style={{ height: '320px' }}
    >
      <Component data={coloredData} options={options} />
    </div>
  );
}
