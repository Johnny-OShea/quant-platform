import styles from "./mini-chart.module.css";

/**
 * MiniChart with axes + grid
 * Props:
 *  - series: [{ date: Date, close: number }, ...]  // already sliced to the visible window
 *  - signals: [{ index:number, side:'buy'|'sell' }, ...]  // indexes relative to series arg
 *  - width,height,margin: optional
 *  - currency?: string (for y-axis labels)
 *  - showMarkers?: boolean (default true)
 */
export default function MiniChart({
                                      series,
                                      signals = [],
                                      width = 900,
                                      height = 280,
                                      margin = 36,
                                      currency = "USD",
                                      showMarkers = true,
                                  }) {
    if (!series?.length) return null;

    // scales
    const x = (i) => margin + (i * (width - 2 * margin)) / Math.max(1, series.length - 1);
    const minP = Math.min(...series.map(s => s.close));
    const maxP = Math.max(...series.map(s => s.close));
    const y = (p) => {
        const top = margin, bottom = height - margin;
        return bottom - ((p - minP) / Math.max(1e-9, (maxP - minP))) * (bottom - top);
    };

    // price path
    const d = series.map((p, i) => `${i ? "L" : "M"} ${x(i)} ${y(p.close)}`).join(" ");
    console.log(series[0].date)
    // ticks
    const yTicks = makeLinearTicks(minP, maxP, 4);
    const xTicks = makeIndexTicks(series.length, 6).map(t => ({
        idx: t.idx,
        label: fmtDate(series[t.idx].date)
    }));

    return (
        <svg className={styles.chart} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Price chart">
            {/* background */}
            <rect x="0" y="0" width={width} height={height} rx="12" className={styles.chartBg} />

            {/* grid (y) */}
            {yTicks.map((t, i) => (
                <g key={i}>
                    <line x1={margin} y1={y(t)} x2={width - margin} y2={y(t)} className={styles.gridLine} />
                    <text x={margin - 8} y={y(t)} className={styles.axisLabel} textAnchor="end" dominantBaseline="middle">
                        {fmtMoney(t, currency)}
                    </text>
                </g>
            ))}

            {/* grid (x) */}
            {xTicks.map((t, i) => (
                <g key={i}>
                    <line x1={x(t.idx)} y1={height - margin} x2={x(t.idx)} y2={margin} className={styles.gridLineLight} />
                    <text x={x(t.idx)} y={height - margin + 16} className={styles.axisLabel} textAnchor="middle">
                        {t.label}
                    </text>
                </g>
            ))}

            {/* axes */}
            <line x1={margin} y1={height - margin} x2={width - margin} y2={height - margin} className={styles.axis} />
            <line x1={margin} y1={margin} x2={margin} y2={height - margin} className={styles.axis} />

            {/* price path */}
            <path d={d} className={styles.pricePath} fill="none" />

            {/* buy/sell markers (no labels to keep it clean) */}
            {showMarkers && signals.map((s, idx) => (
                <g key={idx} transform={`translate(${x(s.index)}, ${y(series[s.index].close)})`}>
                    {s.side === "buy"
                        ? <path d="M 0 -6 L 6 6 L -6 6 Z" className={styles.buyMarker} />
                        : <path d="M 0 6 L 6 -6 L -6 -6 Z" className={styles.sellMarker} />
                    }
                </g>
            ))}
        </svg>
    );
}

function makeLinearTicks(min, max, steps = 4) {
    if (!isFinite(min) || !isFinite(max) || max <= min) return [min];
    const span = max - min;
    const raw = span / steps;
    const pow10 = Math.pow(10, Math.floor(Math.log10(raw)));
    const nice = [1, 2, 2.5, 5, 10].find(m => raw / (m * pow10) <= 1) * pow10;
    const start = Math.ceil(min / nice) * nice;
    const ticks = [];
    for (let v = start; v <= max + 1e-9; v += nice) ticks.push(v);
    return ticks;
}

function makeIndexTicks(n, k = 6) {
    if (n <= 1) return [{ idx: 0 }];
    const step = Math.max(1, Math.floor((n - 1) / (k - 1)));
    const ticks = [];
    for (let i = 0; i < n; i += step) ticks.push({ idx: i });
    if (ticks[ticks.length - 1].idx !== n - 1) ticks.push({ idx: n - 1 });
    return ticks;
}

function fmtDate(d) {
    // Adaptive: if range < 2 months -> day; < 3 years -> month; else -> year
    const now = d;
    const opts = { month: "short", day: "numeric" };
    return new Intl.DateTimeFormat(undefined, opts).format(now);
}

function fmtMoney(n, currency = "USD") {
    try { return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(n); }
    catch { return `$${n.toFixed(0)}`; }
}
