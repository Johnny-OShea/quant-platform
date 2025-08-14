import { useEffect, useMemo, useState } from "react";
import styles from "./strategy-workspace.module.css";
import { STRATEGIES, CATEGORIES } from "../data/strategyRegistry";
import { useAuth } from "../context/AuthContext";

export default function StrategyWorkspace() {
    const { user } = useAuth();
    const currency = (user?.preferred_currency || "USD").toUpperCase();

    // sidebar state
    const [category, setCategory] = useState("all");
    const [query, setQuery] = useState("");

    // selected strategy (default = first)
    const [selectedKey, setSelectedKey] = useState(STRATEGIES[0].key);

    // params per strategy key (so switching preserves values)
    const [paramsByKey, setParamsByKey] = useState({});
    const [invested, setInvested] = useState(10000);

    const selected = useMemo(
        () => STRATEGIES.find(s => s.key === selectedKey),
        [selectedKey]
    );

    // initialize defaults for a strategy the first time it’s selected
    useEffect(() => {
        if (!selected) return;
        if (!paramsByKey[selected.key]) {
            const defaults = Object.fromEntries(
                Object.entries(selected.paramDefs).map(([k, d]) => [k, d.default])
            );
            setParamsByKey(p => ({ ...p, [selected.key]: defaults }));
        }
    }, [selected, paramsByKey]);

    const params = paramsByKey[selected?.key] || {};

    // series + signals + equity (dummy for now)
    const series = useMemo(() => generateSeries(180), []);
    const signals = useMemo(
        () => (selected ? selected.computeSignals(series, params) : []),
        [selected, series, params]
    );
    const result = useMemo(
        () => backtestBuySell(series, signals, invested),
        [series, signals, invested]
    );

    const list = useMemo(() => {
        return STRATEGIES
            .filter(s => (category === "all" ? true : s.category === category))
            .filter(s => s.name.toLowerCase().includes(query.toLowerCase()));
    }, [category, query]);

    const setParam = (k, v) =>
        setParamsByKey(p => ({
            ...p,
            [selected.key]: { ...(p[selected.key] || {}), [k]: Math.max(1, Number(v) || 1) },
        }));

    return (
        <div className={styles.split}>
            {/* Sidebar: categories + search + list */}
            <aside className={styles.sidebar}>
                <div className={styles.sideHeader}>
                    <h3 className={styles.sideTitle}>Strategies</h3>
                    <input
                        className={styles.sideSearch}
                        placeholder="Search..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <div className={styles.catRow}>
                        {CATEGORIES.map(c => (
                            <button
                                key={c}
                                className={`${styles.catChip} ${category === c ? styles.catChipActive : ""}`}
                                onClick={() => setCategory(c)}
                            >
                                {c[0].toUpperCase() + c.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={styles.sideList}>
                    {list.map(s => (
                        <button
                            key={s.key}
                            className={`${styles.sideItem} ${s.key === selectedKey ? styles.sideItemActive : ""}`}
                            onClick={() => setSelectedKey(s.key)}
                            title={s.summary}
                        >
                            <div className={styles.sideItemName}>{s.name}</div>
                            <div className={styles.sideItemSub}>{s.category}</div>
                        </button>
                    ))}
                    {list.length === 0 && <div className={styles.sideEmpty}>No matches.</div>}
                </div>
            </aside>

            {/* Main: detail view changes per strategy */}
            <main className={styles.main}>
                <div className={styles.card}>
                    {/* Header */}
                    <div className={styles.headerRow}>
                        <div>
                            <h2 className={styles.title}>{selected?.name}</h2>
                            <p className={styles.subtitle}>{selected?.summary}</p>
                        </div>
                        <div className={styles.kpiPill}>
                            Invested:&nbsp;
                            <input
                                className={styles.kpiInput}
                                type="number"
                                min="0"
                                step="100"
                                value={invested}
                                onChange={(e) => setInvested(Number(e.target.value || 0))}
                            />
                            <span className={styles.kpiUnit}>{currency}</span>
                        </div>
                    </div>

                    {/* Chart */}
                    <div className={styles.chartWrap}>
                        <MiniChart series={series} signals={signals} />
                    </div>

                    {/* KPIs */}
                    <div className={styles.kpiRow}>
                        <KPI label="Final equity" value={fmtMoney(result.finalEquity, currency)} />
                        <KPI label="Return" value={`${((result.finalEquity / invested - 1) * 100).toFixed(1)}%`} />
                        <KPI label="Trades" value={String(result.trades)} />
                        <KPI label="Win rate" value={result.trades ? `${Math.round(result.wins / result.trades * 100)}%` : "—"} />
                    </div>

                    {/* Dynamic params */}
                    <div className={styles.paramGrid}>
                        {selected && Object.entries(selected.paramDefs).map(([key, def]) => (
                            <ParamBox
                                key={key}
                                label={def.label}
                                value={params[key]}
                                min={def.min} max={def.max} step={def.step}
                                onChange={(v) => setParam(key, v)}
                            />
                        ))}
                    </div>

                    <div className={styles.paramActions}>
                        <button
                            className={styles.link}
                            type="button"
                            onClick={() => {
                                const defaults = Object.fromEntries(
                                    Object.entries(selected.paramDefs).map(([k,d]) => [k, d.default])
                                );
                                setParamsByKey(p => ({ ...p, [selected.key]: defaults }));
                            }}
                        >
                            Reset defaults
                        </button>
                    </div>

                    {/* Description */}
                    <div className={styles.textBlock}>
                        <h3 className={styles.textTitle}>About this strategy</h3>
                        <ul className={styles.bullets}>
                            {selected?.description.map((t, i) => <li key={i}>{t}</li>)}
                        </ul>
                        <p className={styles.textBodyMuted}>
                            Backend will supply real signals and stats per strategy; this UI updates automatically by registry entry.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}

/* ---------- small components ---------- */
function KPI({ label, value }) {
    return (
        <div className={styles.kpiCard}>
            <div className={styles.kpiLabel}>{label}</div>
            <div className={styles.kpiVal}>{value}</div>
        </div>
    );
}

function ParamBox({ label, value, onChange, min=1, max=999, step=1 }) {
    return (
        <div className={styles.paramBox}>
            <div className={styles.paramLabel}>{label}</div>
            <input
                type="number"
                min={min}
                max={max}
                step={step}
                className={styles.paramInput}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
}

/* ---------- chart + helpers (same as before) ---------- */
function MiniChart({ series, signals, width = 900, height = 260, margin = 20 }) {
    if (!series?.length) return null;
    const x = (i) => margin + (i * (width - 2 * margin)) / (series.length - 1);
    const minP = Math.min(...series.map(s => s.close));
    const maxP = Math.max(...series.map(s => s.close));
    const y = (p) => {
        const top = margin, bottom = height - margin;
        return bottom - ((p - minP) / (maxP - minP)) * (bottom - top);
    };
    const d = series.map((p, i) => `${i ? "L" : "M"} ${x(i)} ${y(p.close)}`).join(" ");
    return (
        <svg className={styles.chart} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Price chart">
            <rect x="0" y="0" width={width} height={height} rx="12" className={styles.chartBg} />
            <path d={d} className={styles.pricePath} fill="none" />
            {signals.map((s, idx) => (
                <g key={idx} transform={`translate(${x(s.index)}, ${y(series[s.index].close)})`}>
                    <circle r="5" className={s.side === "buy" ? styles.buyDot : styles.sellDot} />
                    <text y={s.side === "buy" ? -10 : 18} textAnchor="middle" className={styles.signalLabel}>
                        {s.side === "buy" ? "Buy" : "Sell"}
                    </text>
                </g>
            ))}
        </svg>
    );
}

// demo series + backtest
function generateSeries(n = 180) {
    const arr = []; let price = 100;
    for (let i = 0; i < n; i++) {
        const drift = 0.05 * Math.sin(i / 7) + 0.03 * Math.cos(i / 13);
        const noise = (Math.random() - 0.5) * 0.8;
        price = Math.max(1, price + drift + noise);
        arr.push({ i, close: Number(price.toFixed(2)) });
    }
    return arr;
}
function backtestBuySell(series, signals, initial = 10000) {
    let cash = initial, shares = 0, last = "sell", trades = 0, wins = 0, entry = null;
    for (const sig of signals) {
        const price = series[sig.index].close;
        if (sig.side === "buy" && last === "sell") { shares = cash / price; cash = 0; last = "buy"; trades++; entry = price; }
        else if (sig.side === "sell" && last === "buy") { cash = shares * price; shares = 0; last = "sell"; if (entry!=null && price>entry) wins++; entry=null; }
    }
    const final = cash + shares * series[series.length - 1].close;
    return { finalEquity: Number(final.toFixed(2)), trades, wins };
}
function fmtMoney(n, currency = "USD") {
    try { return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n); }
    catch { return `$${n.toFixed(2)}`; }
}
