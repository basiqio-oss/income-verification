// components/PieChart.tsx
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface PieChartProps {
  labels: string[];
  values: number[];
  width?: number;
  height?: number;
}

const PieChart: React.FC<PieChartProps> = ({ labels, values, width = 400, height = 300 }) => {
  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: ['rgba(255, 99, 132, 0.2)', 'rgba(54, 162, 235, 0.2)', 'rgba(255, 206, 86, 0.2)'],
        borderColor: ['rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)', 'rgba(255, 206, 86, 1)'],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
  };

  return <Pie data={data} options={options} width={width} height={height} />;
};

export default PieChart;
