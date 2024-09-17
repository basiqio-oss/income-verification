// components/BarChart.tsx
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface BarChartProps {
  labels: string[];
  values: number[];
  width?: number;
  height?: number;
}

const BarChart: React.FC<BarChartProps> = ({ labels, values, width = 400, height = 300 }) => {
  const data = {
    labels,
    datasets: [
      {
        label: 'Metrics Analysis',
        data: values,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
  };

  return <Bar data={data} options={options} width={width} height={height} />;
};

export default BarChart;
