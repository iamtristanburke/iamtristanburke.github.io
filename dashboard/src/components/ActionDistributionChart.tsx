import { useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import type { Action } from '../types/colt-agent';

ChartJS.register(ArcElement, Tooltip, Legend);

interface ActionDistributionChartProps {
  actions: Action[];
}

export default function ActionDistributionChart({ actions }: ActionDistributionChartProps) {
  const chartData = useMemo(() => {
    const buyCount = actions.filter(a => a.type === 'buy').length;
    const sellCount = actions.filter(a => a.type === 'sell').length;

    return {
      labels: ['Buy', 'Sell'],
      datasets: [
        {
          data: [buyCount, sellCount],
          backgroundColor: [
            'rgba(76, 175, 80, 0.8)',
            'rgba(244, 67, 54, 0.8)',
          ],
          borderColor: [
            'rgba(76, 175, 80, 1)',
            'rgba(244, 67, 54, 1)',
          ],
          borderWidth: 2,
        },
      ],
    };
  }, [actions]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#e0e0e0',
          padding: 15,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  if (actions.length === 0) {
    return (
      <div className="colt-agent-empty">
        <div className="colt-agent-empty-icon">📈</div>
        <p>No actions to display.</p>
      </div>
    );
  }

  return (
    <div style={{ height: '300px', position: 'relative' }}>
      <Doughnut data={chartData} options={options} />
    </div>
  );
}

