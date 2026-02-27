import React, { useEffect, useRef } from 'react';
import { cn } from '../../utils/cn';

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }[];
}

interface ThemedChartProps {
  type: 'line' | 'bar' | 'doughnut' | 'pie';
  data: ChartData;
  options?: any;
  width?: number;
  height?: number;
  className?: string;
}

export const ThemedChart: React.FC<ThemedChartProps> = ({
  type,
  data,
  options = {},
  width = 400,
  height = 300,
  className
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<any>(null);
  
  // Mock chart implementation - in a real app you'd use Chart.js or similar
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Get theme-aware colors
    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#f3f4f6' : '#374151';
    const gridColor = isDark ? '#4b5563' : '#e5e7eb';
    const primaryColor = isDark ? '#60a5fa' : '#3b82f6';
    
    // Draw mock chart based on type
    if (type === 'bar') {
      drawBarChart(ctx, data, { textColor, gridColor, primaryColor }, width, height);
    } else if (type === 'line') {
      drawLineChart(ctx, data, { textColor, gridColor, primaryColor }, width, height);
    } else if (type === 'pie' || type === 'doughnut') {
      drawPieChart(ctx, data, { textColor, primaryColor }, width, height, type === 'doughnut');
    }
  }, [data, type, width, height]);
  
  const drawBarChart = (ctx: CanvasRenderingContext2D, chartData: ChartData, colors: any, w: number, h: number) => {
    const padding = 40;
    const chartWidth = w - padding * 2;
    const chartHeight = h - padding * 2;
    const barWidth = chartWidth / chartData.labels.length * 0.6;
    const maxValue = Math.max(...chartData.datasets[0].data);
    
    // Draw axes
    ctx.strokeStyle = colors.gridColor;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, h - padding);
    ctx.lineTo(w - padding, h - padding);
    ctx.stroke();
    
    // Draw bars
    ctx.fillStyle = colors.primaryColor;
    chartData.datasets[0].data.forEach((value, index) => {
      const barHeight = (value / maxValue) * chartHeight;
      const x = padding + (index * chartWidth / chartData.labels.length) + (chartWidth / chartData.labels.length - barWidth) / 2;
      const y = h - padding - barHeight;
      ctx.fillRect(x, y, barWidth, barHeight);
    });
    
    // Draw labels
    ctx.fillStyle = colors.textColor;
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    chartData.labels.forEach((label, index) => {
      const x = padding + (index + 0.5) * chartWidth / chartData.labels.length;
      ctx.fillText(label, x, h - padding + 20);
    });
  };
  
  const drawLineChart = (ctx: CanvasRenderingContext2D, chartData: ChartData, colors: any, w: number, h: number) => {
    const padding = 40;
    const chartWidth = w - padding * 2;
    const chartHeight = h - padding * 2;
    const maxValue = Math.max(...chartData.datasets[0].data);
    
    // Draw grid
    ctx.strokeStyle = colors.gridColor;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (i / 5) * chartHeight;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(w - padding, y);
      ctx.stroke();
    }
    
    // Draw line
    ctx.strokeStyle = colors.primaryColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    chartData.datasets[0].data.forEach((value, index) => {
      const x = padding + (index / (chartData.datasets[0].data.length - 1)) * chartWidth;
      const y = h - padding - (value / maxValue) * chartHeight;
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
    
    // Draw points
    ctx.fillStyle = colors.primaryColor;
    chartData.datasets[0].data.forEach((value, index) => {
      const x = padding + (index / (chartData.datasets[0].data.length - 1)) * chartWidth;
      const y = h - padding - (value / maxValue) * chartHeight;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
    });
  };
  
  const drawPieChart = (ctx: CanvasRenderingContext2D, chartData: ChartData, colors: any, w: number, h: number, isDonut: boolean) => {
    const centerX = w / 2;
    const centerY = h / 2;
    const radius = Math.min(w, h) / 2 - 40;
    const total = chartData.datasets[0].data.reduce((sum, value) => sum + value, 0);
    
    let currentAngle = -Math.PI / 2;
    const colorPalette = [colors.primaryColor, '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    
    chartData.datasets[0].data.forEach((value, index) => {
      const sliceAngle = (value / total) * 2 * Math.PI;
      
      ctx.fillStyle = colorPalette[index % colorPalette.length];
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fill();
      
      currentAngle += sliceAngle;
    });
    
    // Draw donut hole
    if (isDonut) {
      ctx.fillStyle = document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.6, 0, 2 * Math.PI);
      ctx.fill();
    }
  };
  
  return (
    <div className={cn('inline-block', className)}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border border-gray-200 dark:border-gray-600 rounded-lg"
      />
    </div>
  );
};