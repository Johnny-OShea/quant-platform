function sma(values, window) {
    const out = Array(values.length).fill(null);
    let sum = 0;
    for (let i = 0; i < values.length; i++) {
        sum += values[i];
        if (i >= window) sum -= values[i - window];
        if (i >= window - 1) out[i] = sum / window;
    }
    return out;
}

function computeSignalsSMACrossover(series, params) {
    const { fast = 12, slow = 26 } = params || {};
    const px = series.map(s => s.close);
    const f = sma(px, Math.max(1, fast));
    const s = sma(px, Math.max(1, slow));
    const sigs = [];
    let prevDiff = null;
    for (let i = 0; i < series.length; i++) {
        if (f[i] == null || s[i] == null) continue;
        const diff = f[i] - s[i];
        if (prevDiff != null) {
            if (prevDiff <= 0 && diff > 0) sigs.push({ index: i, side: "buy" });
            if (prevDiff >= 0 && diff < 0) sigs.push({ index: i, side: "sell" });
        }
        prevDiff = diff;
    }
    const cleaned = [];
    for (const sig of sigs) {
        if (cleaned.length === 0 && sig.side === "sell") continue;
        if (cleaned.length && cleaned[cleaned.length - 1].side === sig.side) continue;
        cleaned.push(sig);
    }
    return cleaned;
}

function computeSignalsEarningsMomentum(series, params) {
    // Dummy fundamental idea: buy X bars before a synthetic "earnings" date and sell Y after
    const { pre_window = 5, post_window = 5, period = 40 } = params || {};
    const sigs = [];
    for (let i = period; i < series.length; i += period) {
        const buyIdx = Math.max(0, i - pre_window);
        const sellIdx = Math.min(series.length - 1, i + post_window);
        // only buy if short-term momentum is up into earnings (demo)
        if (series[buyIdx].close < series[Math.min(i, series.length - 1)].close) {
            sigs.push({ index: buyIdx, side: "buy" });
            sigs.push({ index: sellIdx, side: "sell" });
        }
    }
    return sigs;
}

export const STRATEGIES = [
    {
        key: "sma_crossover",
        name: "SMA Crossover",
        category: "technical",
        summary: "Buy when a fast MA crosses above a slow MA; sell on cross down.",
        paramDefs: {
            fast:   { label: "Fast MA",   type: "number", min: 2,  max: 100, step: 1, default: 12 },
            slow:   { label: "Slow MA",   type: "number", min: 5,  max: 200, step: 1, default: 26 },
            signal: { label: "Signal Len", type: "number", min: 2,  max: 50,  step: 1, default: 9 }, // (here for UI parity)
        },
        description: [
            "Tracks trend changes using a fast vs. slow moving average.",
            "Works best in trending markets; may chop in sideways regimes.",
        ],
        computeSignals: computeSignalsSMACrossover,
    },
    {
        key: "earnings_momentum",
        name: "Earnings Momentum",
        category: "fundamental",
        summary: "Buy before earnings if momentum is positive; exit shortly after.",
        paramDefs: {
            pre_window:  { label: "Days before", type: "number", min: 1, max: 20, step: 1, default: 5 },
            post_window: { label: "Days after",  type: "number", min: 1, max: 20, step: 1, default: 5 },
            period:      { label: "Earnings every (bars)", type: "number", min: 20, max: 60, step: 1, default: 40 },
        },
        description: [
            "Simulates periodic earnings events and plays momentum into/after the event.",
            "Illustrative only—your backend will drive real event dates and logic.",
        ],
        computeSignals: computeSignalsEarningsMomentum,
    },
];

export const CATEGORIES = ["all", "technical", "fundamental", "ml"];
