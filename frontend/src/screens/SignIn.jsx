import styles from "./sign-in.module.css";
import { useSignInForm } from "../hooks/AuthHook";
import { LuEyeClosed } from "react-icons/lu";
import { FaRegEye } from "react-icons/fa";

function SignIn() {
    const {
        values,
        errors,
        message,
        status,
        loading,
        passwordVisible,
        togglePasswordVisible,
        handleChange,
        handleSubmit,
    } = useSignInForm({
        initialValues: { email: "", password: "" },
        endpoint: "http://localhost:5000/api/login",
    });

    return (
        <div className={styles.page}>
            <div className={styles.card}>
                <h2 className={styles.title}>Sign in</h2>
                <p className={styles.subtitle}>Welcome back — let’s get you in.</p>

                <form className={styles.form} onSubmit={handleSubmit} noValidate>
                    {/* Email */}
                    <div>
                        <div className={styles.labelRow}>
                            <label htmlFor="email" className={`${styles.label} ${styles.required}`}>
                                Email address
                            </label>
                        </div>
                        <div className={styles.inputWrap}>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                className={styles.input}
                                placeholder="you@example.com"
                                value={values.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        {errors.email && <div className={styles.errorText}>{errors.email}</div>}
                    </div>

                    {/* Password */}
                    <div>
                        <div className={styles.labelRow}>
                            <label htmlFor="password" className={`${styles.label} ${styles.required}`}>
                                Password
                            </label>
                        </div>
                        <div className={styles.inputWrap}>
                            <input
                                id="password"
                                type={passwordVisible ? "text" : "password"}
                                name="password"
                                className={styles.input}
                                placeholder="Your password"
                                value={values.password}
                                onChange={handleChange}
                                required
                            />
                            <button
                                type="button"
                                className={styles.eyeBtn}
                                onClick={togglePasswordVisible}
                                aria-label={passwordVisible ? "Hide password" : "Show password"}
                                title={passwordVisible ? "Hide password" : "Show password"}
                            >
                                {passwordVisible ? <FaRegEye /> : <LuEyeClosed />}
                            </button>
                        </div>
                        {errors.password && <div className={styles.errorText}>{errors.password}</div>}
                    </div>

                    <button className={styles.cta} type="submit" disabled={loading}>
                        {loading ? "Signing in..." : "SIGN IN"}
                    </button>

                    {message && (
                        <div
                            role="status"
                            aria-live="polite"
                            className={`${styles.message} ${
                                status === "error" ? styles.error : status === "success" ? styles.success : ""
                            }`}
                        >
                            {message}
                        </div>
                    )}
                </form>

                <p className={styles.footer}>
                    Don’t have an account? <a className={styles.link} href="/register">Create one</a>
                </p>
            </div>
        </div>
    );
}

export default SignIn;
