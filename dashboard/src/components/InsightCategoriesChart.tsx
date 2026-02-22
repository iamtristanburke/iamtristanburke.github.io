import { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import type { Insight } from '../types/colt-agent';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface InsightCategoriesChartProps {
  insights: Insight[];
}

export default function InsightCategoriesChart({ insights }: InsightCategoriesChartProps) {
  const chartData = useMemo(() => {
    const categoryCounts: Record<string, number> = {};
    
    insights.forEach(insight => {
      const category = insight.category;
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    const categories = Object.keys(categoryCounts);
    const counts = categories.map(cat => categoryCounts[cat]);

    const colors = [
      'rgba(33, 150, 243, 0.8)',   // market - blue
      'rgba(156, 39, 176, 0.8)',   // sector - purple
      'rgba(255, 152, 0, 0.8)',    // stock - orange
      'rgba(76, 175, 80, 0.8)',    // macro - green
      'rgba(244, 67, 54, 0.8)',    // technical - red
      'rgba(0, 188, 212, 0.8)',    // fundamental - cyan
    ];

    return {
      labels: categories.map(cat => cat.charAt(0).toUpperCase() + cat.slice(1)),
      datasets: [
        {
          label: 'Insights by Category',
          data: counts,
          backgroundColor: categories.map((_, i) => colors[i % colors.length]),
          borderColor: categories.map((_, i) => colors[i % colors.length].replace('0.8', '1')),
          borderWidth: 2,
        },
      ],
    };
  }, [insights]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#b0b0b0',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      y: {
        ticks: {
          color: '#b0b0b0',
          stepSize: 1,
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
    },
  };

  if (insights.length === 0) {
    return (
      <div className="colt-agent-empty">
        <div className="colt-agent-empty-icon">💡</div>
        <p>No insights to display.</p>
      </div>
    );
  }

  return (
    <div style={{ height: '300px', position: 'relative' }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}

