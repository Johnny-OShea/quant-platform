import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import styles from "./sign-in.module.css";

export default function Home() {
    const { user, updateUser } = useAuth();
    const [form, setForm] = useState({
        income: "",
        location: "",
        preferred_currency: "USD",
        liked_strategies_text: "",
        progress: [],
    });

    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState("");
    const [err, setErr] = useState("");

    // Prefill from current user
    useEffect(() => {
        if (!user) return;
        setForm(f => ({
            ...f,
            income: user.income ?? "",
            location: user.location ?? "",
            preferred_currency: user.preferred_currency ?? "USD",
        }));
    }, [user]);

    // Screen if the user is not logged in
    if (!user) return <div>Hello</div>;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMsg(""); setErr("");
        setSaving(true);

        // Build payload (keep it simple)
        const payload = {
            income: form.income === "" ? null : Number(form.income),
            location: form.location || null,
            preferred_currency: form.preferred_currency || null,
        };

        try {
            const res = await fetch(`http://localhost:5000/api/users/${user.email}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok || !data?.success) {
                const m = data?.message || `Error ${res.status}`;
                throw new Error(m);
            }

            // Update local auth context with scalar fields so UI reflects changes
            updateUser({
                income: payload.income ?? undefined,
                location: payload.location ?? undefined,
                preferred_currency: payload.preferred_currency ?? undefined,
            });

            setMsg("Profile saved ✅");
        } catch (e2) {
            setErr(e2.message || "Save failed");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.card}>
                <h2 className={styles.title}>Your Profile</h2>
                <p className={styles.subtitle}>Hey {user.username}! Finish your details below.</p>

                <form className={styles.form} onSubmit={handleSubmit} noValidate>
                    {/* Income */}
                    <div>
                        <div className={styles.labelRow}>
                            <label htmlFor="income" className={styles.label}>Income</label>
                        </div>
                        <div className={styles.inputWrap}>
                            <input
                                id="income"
                                name="income"
                                type="number"
                                className={styles.input}
                                placeholder="e.g., 85000"
                                value={form.income}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                            />
                        </div>
                    </div>

                    {/* Location */}
                    <div>
                        <div className={styles.labelRow}>
                            <label htmlFor="location" className={styles.label}>Location</label>
                        </div>
                        <div className={styles.inputWrap}>
                            <input
                                id="location"
                                name="location"
                                className={styles.input}
                                placeholder="City, Country"
                                value={form.location}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Preferred Currency */}
                    <div>
                        <div className={styles.labelRow}>
                            <label htmlFor="preferred_currency" className={styles.label}>Preferred currency</label>
                        </div>
                        <div className={styles.inputWrap}>
                            <select
                                id="preferred_currency"
                                name="preferred_currency"
                                className={styles.input}
                                value={form.preferred_currency}
                                onChange={handleChange}
                            >
                                <option value="USD">USD — US Dollar</option>
                                <option value="EUR">EUR — Euro</option>
                                <option value="GBP">GBP — British Pound</option>
                                <option value="JPY">JPY — Japanese Yen</option>
                                <option value="CAD">CAD — Canadian Dollar</option>
                                <option value="AUD">AUD — Australian Dollar</option>
                            </select>
                        </div>
                    </div>

                    {/* Liked strategies (comma-separated) */}
                    <div>
                        <div className={styles.labelRow}>
                            <label htmlFor="liked_strategies_text" className={styles.label}>Liked strategies</label>
                        </div>
                        <div className={styles.inputWrap}>
                            <input
                                id="liked_strategies_text"
                                name="liked_strategies_text"
                                className={styles.input}
                                placeholder="e.g., williams_r, macd_cross, cvr3_vix"
                                value={form.liked_strategies_text}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <button className={styles.cta} type="submit" disabled={saving}>
                        {saving ? "Saving..." : "Save profile"}
                    </button>

                    {(msg || err) && (
                        <div className={`${styles.message} ${err ? styles.error : styles.success}`}>
                            {err || msg}
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
