/**
 * Shared Chart.js setup for admin dashboard.
 * Registers required components and exports dark-theme defaults and colours.
 */
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

/** Lime green from Tailwind (accent) — primary chart colour */
export const CHART_COLOR_PRIMARY = '#C6FF4A';
/** Secondary colours for multi-line/series */
export const CHART_COLORS = [
  CHART_COLOR_PRIMARY,
  '#2DD4BF', // teal
  '#F59E0B', // amber
  '#64748B', // slate
  '#818CF8', // indigo
  '#F472B6', // pink
];

const gridColor = 'rgba(255,255,255,0.1)';
const textColor = '#e5e5e5';
const textColorSecondary = '#a3a3a3';

export const chartDefaultOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 400,
  },
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        color: textColor,
        font: { size: 12 },
        usePointStyle: true,
      },
    },
    tooltip: {
      backgroundColor: 'rgba(26, 26, 26, 0.95)',
      titleColor: textColor,
      bodyColor: textColor,
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      padding: 10,
      cornerRadius: 8,
    },
  },
  scales: {
    x: {
      grid: { color: gridColor },
      ticks: { color: textColorSecondary, maxTicksLimit: 10 },
    },
    y: {
      grid: { color: gridColor },
      ticks: { color: textColorSecondary },
    },
  },
};

export const chartDoughnutLegend = {
  legend: {
    position: 'top' as const,
    labels: {
      color: textColor,
      font: { size: 12 },
      usePointStyle: true,
    },
  },
};
