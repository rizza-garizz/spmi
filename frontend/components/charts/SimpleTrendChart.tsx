"use client";

interface DataPoint {
  period: string;
  value: number;
}

interface Props {
  data: Array<DataPoint | number>;
  target: number;
  unit: string;
}

export function SimpleTrendChart({ data, target, unit }: Props) {
  if (!data || data.length < 2) {
    return <div className="text-muted small">Data riwayat belum mencukupi untuk tren.</div>;
  }

  const normalizedData = data
    .map((entry, index) =>
      typeof entry === "number"
        ? { period: `P${index + 1}`, value: entry }
        : { period: entry.period ?? `P${index + 1}`, value: Number(entry.value ?? 0) }
    )
    .filter((entry) => Number.isFinite(entry.value));

  if (normalizedData.length < 2) {
    return <div className="text-muted small">Data riwayat belum mencukupi untuk tren.</div>;
  }

  const padding = 20;
  const width = 300;
  const height = 100;
  
  const values = normalizedData.map((d) => d.value);
  const min = 0; // Mulai dari 0 biar fair
  const max = Math.max(...values, target, 1) * 1.2; // Kasih space di atas
  
  const points = normalizedData.map((d, i) => {
    const x = padding + (i * (width - 2 * padding)) / (normalizedData.length - 1);
    const y = height - padding - ((d.value - min) * (height - 2 * padding)) / (max - min);
    return `${x},${y}`;
  }).join(" ");

  // Titik Target
  const targetY = height - padding - ((target - min) * (height - 2 * padding)) / (max - min);

  return (
    <div className="trend-chart-container" style={{ width: '100%', maxWidth: '300px' }}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-100">
        {/* Garis Target (Putus-putus) */}
        <line 
          x1={padding} y1={targetY} x2={width - padding} y2={targetY} 
          stroke="#ff9f43" strokeDasharray="4" strokeWidth="1" 
        />
        <text x={width - padding} y={targetY - 5} fontSize="8" fill="#ff9f43" textAnchor="end">
          Target: {target}
        </text>

        {/* Jalur Tren (Gradient Area) */}
        <defs>
          <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4e73df" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#4e73df" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        <polyline
          fill="none"
          stroke="#4e73df"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
        
        {/* Dot terakhir */}
        {normalizedData.length > 0 && (
          <circle 
            cx={padding + (normalizedData.length - 1) * (width - 2 * padding) / (normalizedData.length - 1)} 
            cy={height - padding - ((normalizedData[normalizedData.length-1].value - min) * (height - 2 * padding)) / (max - min)} 
            r="4" fill="#4e73df" 
          />
        )}
      </svg>
      <div className="d-flex justify-content-between mt-1 px-2">
         <small className="text-muted" style={{fontSize: '10px'}}>{normalizedData[0].period}</small>
         <small className="text-muted" style={{fontSize: '10px'}}>{normalizedData[normalizedData.length-1].period}</small>
      </div>
    </div>
  );
}
