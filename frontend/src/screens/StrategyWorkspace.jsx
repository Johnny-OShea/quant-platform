import { useEffect, useMemo, useState } from "react";
import styles from "./strategy-workspace.module.css";
import { STRATEGIES, CATEGORIES } from "../data/strategyRegistry";
import { useAuth } from "../context/AuthContext";
import MiniChart from "../components/ui/MiniChart.jsx";
import ChartToolbar from "../components/ui/ChartToolBar.jsx";
import { getPrices } from "../hooks/StockDataHook.jsx";

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

    // Information to get the stock Data (from backend)
    const [symbol, setSymbol] = useState("AMZN");
    const [timeframe, setTimeFrame] = useState("1d");
    const [rawDaily, setRawDaily] = useState([]);
    const [loadingPx, setLoadingPx] = useState(false);
    const [pxErr, setPxErr] = useState("");

    // chart controls (Fidelity-like)
    const [range, setRange] = useState("1Y");
    const [freq, setFreq] = useState("1d");
    const [start, setStart] = useState("");
    const [end, setEnd] = useState("");

    const selected = useMemo(
        () => STRATEGIES.find(s => s.key === selectedKey),
        [selectedKey]
    );

    // init defaults per strategy
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

    // ------------------------- GET STOCK DATA FROM BACKEND DATABASE --------------------------
    // ------------------------- CALL FUNCTION IN StockDataHook.jsx ----------------------------
    useEffect(() => {
        // In the worst case we may need to abort
        let abort = false;
        // What happens when the system is loading the stock data
        async function load() {

            // Try to load in the data
            try {

                // We are loading and there is no error yet
                setLoadingPx(true);
                setPxErr("");

                if (!(symbol.trim() === "")) {
                    // Get the stock data
                    const data = await getPrices({symbol, timeframe});
                    // map to chart stockData format: [{i, close}]
                    const s = (data.prices || []).map((p, i) => ({
                        i,
                        date: new Date(p.ts),
                        close: Number(p.close)
                    }));

                    // We can set the stock data now
                    if (!abort) setRawDaily(s);
                }
            } catch (e) {
                if (!abort) {
                    setPxErr(e.message || "Failed to load prices");
                    setRawDaily([]);
                }
            } finally {
                if (!abort) setLoadingPx(false);
            }
        }

        // Load the stock data in based on the method above.
        load();
        return () => { abort = true; };
    }, [symbol, timeframe]);

    // derive visible series by range + frequency (front-end)
    const stockData = useMemo(() => {
        if (!rawDaily.length) return [];

        const first = rawDaily[0].date;
        const last = rawDaily[rawDaily.length - 1].date;

        let from = first, to = last;
        if (range === "CUSTOM" && start && end) {
            from = new Date(start); to = new Date(end);
        } else {
            from = rangeStartFromPreset(range, last, first);
            to = last;
        }

        let sliced = rawDaily.filter(d => d.date >= from && d.date <= to);
        if (freq === "1wk") sliced = aggregateByWeek(sliced);
        if (freq === "1mo") sliced = aggregateByMonth(sliced);

        return sliced.map((d, i) => ({ ...d, i }));
    }, [rawDaily, range, start, end, freq]);

    // Signals use the fetched stockData
    const signals = useMemo(
        () => (selected ? selected.computeSignals(stockData, params) : []),
        [selected, stockData, params]
    );

    // Equity from signals (unchanged)
    const result = useMemo(
        () => backtestBuySell(stockData, signals, invested),
        [stockData, signals, invested]
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

            {/* Sidebar */}
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

            {/* Main Content */}
            <main className={styles.main}>
                <div className={styles.card}>

                    {/* Header */}
                    <div className={styles.headerRow}>
                        <div>
                            <h2 className={styles.title}>{selected?.name}</h2>
                            <p className={styles.subtitle}>{selected?.summary}</p>
                        </div>

                        {/* quick symbol input */}
                        <div className={styles.kpiPill}>
                            <input
                                className={styles.kpiInput}
                                value={symbol}
                                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                                aria-label="Symbol"
                            />
                            <span className={styles.kpiUnit}>Symbol</span>
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

                    <ChartToolbar
                        range={range} setRange={setRange}
                        freq={freq} setFreq={setFreq}
                        start={start} setStart={setStart}
                        end={end} setEnd={setEnd}
                    />

                    {/* Chart */}
                    <div className={styles.chartWrap}>
                        {loadingPx ? (
                            <div className={styles.textBodyMuted}>Loading prices...</div>
                        ) : pxErr ? (
                            <div className={styles.errorText}>{pxErr}</div>
                        ) : stockData.length ? (
                            <MiniChart series={stockData} signals={signals} />
                        ) : (
                            <div className={styles.textBodyMuted}>No Information About This Stock Was Found.</div>
                        )}
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
                            Backend supplies real prices; signals recalc live as you tweak parameters.
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

function rangeStartFromPreset(preset, last, first) {
    const oneDay = 24*60*60*1000;
    const map = {
        "1D": 1, "5D": 5, "10D": 10,
        "1M": 30, "3M": 90, "6M": 180,
        "1Y": 365, "5Y": 365*5, "10Y": 365*10
    };
    if (preset === "MAX" || !map[preset]) return first;
    const start = new Date(last.getTime() - map[preset]*oneDay);
    return start < first ? first : start;
}

function aggregateByWeek(series) {
    const key = (d) => {
        const date = new Date(d.date);
        const day = (date.getUTCDay() + 6) % 7;
        const thurs = new Date(date); thurs.setUTCDate(date.getUTCDate() - day + 3);
        const year = thurs.getUTCFullYear();
        const week1 = new Date(Date.UTC(year,0,4));
        const week = 1 + Math.round(((thurs - week1)/86400000 - 3) / 7);
        return `${year}-W${week}`;
    };
    const map = new Map();
    for (const d of series) map.set(key(d), d);
    return Array.from(map.values()).sort((a,b) => a.date - b.date);
}

function aggregateByMonth(series) {
    const key = (d) => `${d.date.getUTCFullYear()}-${d.date.getUTCMonth()+1}`;
    const map = new Map();
    for (const d of series) map.set(key(d), d);
    return Array.from(map.values()).sort((a,b) => a.date - b.date);
}

function backtestBuySell(series, signals, initial = 10000) {
    let cash = initial, shares = 0, last = "sell", trades = 0, wins = 0, entry = null;
    for (const sig of signals) {
        const price = series[sig.index]?.close ?? 0;
        if (sig.side === "buy" && last === "sell") { shares = cash / price; cash = 0; last = "buy"; trades++; entry = price; }
        else if (sig.side === "sell" && last === "buy") { cash = shares * price; shares = 0; last = "sell"; if (entry!=null && price>entry) wins++; entry=null; }
    }
    const lastClose = series.length ? series[series.length - 1].close : 0;
    const final = cash + shares * lastClose;
    return { finalEquity: Number(final.toFixed(2)), trades, wins };
}
function fmtMoney(n, currency = "USD") {
    try { return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n); }
    catch { return `$${n.toFixed(2)}`; }
}
