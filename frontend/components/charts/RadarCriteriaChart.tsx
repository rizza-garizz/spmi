"use client";

interface CriteriaScore {
    label: string;
    score: number; // 0 - 4
}

interface Props {
    scores: CriteriaScore[];
}

export function RadarCriteriaChart({ scores }: Props) {
    if (!scores || scores.length === 0) return <div>No score data</div>;

    const size = 350;
    const center = size / 2;
    const radius = size * 0.35;
    const angleStep = (Math.PI * 2) / scores.length;

    // Helper to get coordinates
    const getCoords = (angle: number, distance: number) => {
        const x = center + Math.cos(angle - Math.PI / 2) * distance;
        const y = center + Math.sin(angle - Math.PI / 2) * distance;
        return { x, y };
    };

    // Background Hexagons/Circles
    const bgLevels = [1, 2, 3, 4];
    const bgPaths = bgLevels.map(level => {
        const r = (level / 4) * radius;
        return scores.map((_, i) => {
            const { x, y } = getCoords(i * angleStep, r);
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(" ") + " Z";
    });

    // Score Path
    const scorePath = scores.map((s, i) => {
        const r = (Math.min(s.score, 4) / 4) * radius;
        const { x, y } = getCoords(i * angleStep, r);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(" ") + " Z";

    return (
        <div className="radar-chart-container text-center">
            <svg viewBox={`0 0 ${size} ${size}`} className="w-100" style={{ maxHeight: '400px' }}>
                {/* Background Grid */}
                {bgPaths.map((path, i) => (
                    <path 
                        key={i} d={path} fill="none" stroke="#e9ecef" strokeWidth="1" 
                    />
                ))}
                
                {/* Axes */}
                {scores.map((s, i) => {
                    const { x, y } = getCoords(i * angleStep, radius);
                    const labelPos = getCoords(i * angleStep, radius + 25);
                    return (
                        <g key={i}>
                            <line x1={center} y1={center} x2={x} y2={y} stroke="#e9ecef" strokeWidth="1" />
                            <text 
                                x={labelPos.x} y={labelPos.y} 
                                fontSize="10" fill="#6c757d" 
                                textAnchor="middle" alignmentBaseline="middle"
                            >
                                {s.label}
                            </text>
                        </g>
                    );
                })}

                {/* Score Area */}
                <path 
                    d={scorePath} 
                    fill="rgba(78, 115, 223, 0.4)" 
                    stroke="#4e73df" 
                    strokeWidth="2" 
                />

                {/* Score Dots */}
                {scores.map((s, i) => {
                    const r = (Math.min(s.score, 4) / 4) * radius;
                    const { x, y } = getCoords(i * angleStep, r);
                    return <circle key={i} cx={x} cy={y} r="3" fill="#4e73df" />;
                })}
            </svg>
        </div>
    );
}
