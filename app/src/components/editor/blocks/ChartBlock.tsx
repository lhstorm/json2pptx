'use client';

import { BlockComponentProps } from '@/types/blocks';
import BaseBlockWrapper from './BaseBlock';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];

export default function ChartBlock(props: BlockComponentProps) {
  const { block, isEditing, onUpdate } = props;
  const {
    chartType = 'bar',
    data = {
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      datasets: [{ name: 'Revenue', values: [100, 120, 140, 160] }],
    },
  } = block.content;

  // Transform data for recharts format
  const chartData = data.labels.map((label: string, index: number) => {
    const dataPoint: any = { name: label };
    data.datasets.forEach((dataset: any) => {
      dataPoint[dataset.name] = dataset.values[index];
    });
    return dataPoint;
  });

  const handleChartTypeChange = (newType: string) => {
    onUpdate({
      content: {
        ...block.content,
        chartType: newType,
      },
    });
  };

  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            {data.datasets.map((dataset: any, index: number) => (
              <Line
                key={dataset.name}
                type="monotone"
                dataKey={dataset.name}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
              />
            ))}
          </LineChart>
        );

      case 'pie':
        const pieData = data.labels.map((label: string, index: number) => ({
          name: label,
          value: data.datasets[0].values[index],
        }));
        return (
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry: any) => entry.name}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        );

      case 'bar':
      default:
        return (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            {data.datasets.map((dataset: any, index: number) => (
              <Bar
                key={dataset.name}
                dataKey={dataset.name}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </BarChart>
        );
    }
  };

  return (
    <BaseBlockWrapper {...props}>
      <div className="space-y-4">
        {isEditing && (
          <div className="flex gap-2">
            {['bar', 'line', 'pie'].map((type) => (
              <button
                key={type}
                onClick={() => handleChartTypeChange(type)}
                className={`px-4 py-2 rounded capitalize ${
                  chartType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        )}

        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>

        {isEditing && (
          <div className="text-xs text-gray-500 text-center">
            <button className="text-blue-600 hover:underline">
              Edit data (coming soon)
            </button>
          </div>
        )}
      </div>
    </BaseBlockWrapper>
  );
}
