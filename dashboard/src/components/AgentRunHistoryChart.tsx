import { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import type { AgentRun } from '../types/colt-agent';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface AgentRunHistoryChartProps {
  runs: AgentRun[];
}

export default function AgentRunHistoryChart({ runs }: AgentRunHistoryChartProps) {
  const chartData = useMemo(() => {
    const completedRuns = runs.filter(r => r.status === 'completed').slice(0, 30).reverse();
    
    const labels = completedRuns.map(run => {
      try {
        const date = new Date(run.timestamp);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } catch {
        return run.timestamp.slice(0, 10);
      }
    });

    const tokensData = completedRuns.map(run => run.tokensUsed || 0);

    return {
      labels,
      datasets: [
        {
          label: 'Tokens Used',
          data: tokensData,
          borderColor: 'rgba(76, 175, 80, 0.8)',
          backgroundColor: 'rgba(76, 175, 80, 0.2)',
          tension: 0.4,
          fill: true,
        },
      ],
    };
  }, [runs]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: '#e0e0e0',
        },
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
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
    },
  };

  if (runs.length === 0) {
    return (
      <div className="colt-agent-empty">
        <div className="colt-agent-empty-icon">📊</div>
        <p>No run history available yet.</p>
      </div>
    );
  }

  return (
    <div style={{ height: '300px', position: 'relative' }}>
      <Line data={chartData} options={options} />
    </div>
  );
}

