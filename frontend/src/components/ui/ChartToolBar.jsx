import styles from "./chart-tool-bar.module.css";

const PRESETS = ["1D","5D","10D","1M","3M","6M","1Y","5Y","10Y","MAX"];

export default function ChartToolbar({
                                         range, setRange,        // string from PRESETS or "CUSTOM"
                                         freq, setFreq,          // "1d" | "1wk" | "1mo"
                                         start, setStart,        // yyyy-mm-dd or ""
                                         end, setEnd             // yyyy-mm-dd or ""
                                     }) {
    return (
        <div className={styles.row}>
            <div className={styles.group}>
                {PRESETS.map(k => (
                    <button
                        key={k}
                        className={`${styles.btn} ${range === k ? styles.btnActive : ""}`}
                        onClick={() => setRange(k)}
                        type="button"
                    >
                        {k}
                    </button>
                ))}
                <button
                    className={`${styles.btn} ${range === "CUSTOM" ? styles.btnActive : ""}`}
                    onClick={() => setRange("CUSTOM")}
                    type="button"
                >
                    Custom
                </button>
            </div>

            <div className={styles.group}>
                <label className={styles.label}>Frequency</label>
                <select className={styles.select} value={freq} onChange={(e) => setFreq(e.target.value)}>
                    <option value="1d">1D</option>
                    <option value="1wk">1W</option>
                    <option value="1mo">1M</option>
                </select>
            </div>

            {range === "CUSTOM" && (
                <div className={styles.group}>
                    <label className={styles.label}>From</label>
                    <input className={styles.date} type="date" value={start} onChange={(e) => setStart(e.target.value)} />
                    <label className={styles.label}>to</label>
                    <input className={styles.date} type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
                </div>
            )}
        </div>
    );
}
