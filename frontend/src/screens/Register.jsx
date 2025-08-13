import styles from "./register.module.css";
import { useAuthForm } from "../hooks/AuthHook";

function Register() {

    // Obtain all necessary values from the AuthHook class
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
    } = useAuthForm({
        initialValues: { username: "", email: "", password: "", terms_policies: false },
        endpoint: "http://localhost:5000/api/users",
    });

    return (
        <div className={styles.page}>
            <div className={styles.card}>
                <h2 className={styles.title}>Registration Form</h2>
                <p className={styles.subtitle}>Create your account to get started</p>

                <form className={styles.form} onSubmit={handleSubmit} noValidate>
                    {/* Username */}
                    <div>
                        <div className={styles.labelRow}>
                            <label htmlFor="username" className={`${styles.label} ${styles.required}`}>
                                Name
                            </label>
                        </div>
                        <div className={styles.inputWrap}>
                            <input
                                id="username"
                                name="username"
                                className={styles.input}
                                placeholder="Your name"
                                value={values.username}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        {errors.username && <div className={styles.errorText}>{errors.username}</div>}
                    </div>

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
                                placeholder="Minimum 8 characters"
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
                                {passwordVisible ? "👁" : "👁"}
                            </button>
                        </div>
                        {errors.password && <div className={styles.errorText}>{errors.password}</div>}
                    </div>

                    {/* Terms */}
                    <div className={styles.termsRow}>
                        <input
                            id="terms"
                            name="terms_policies"
                            type="checkbox"
                            checked={values.terms_policies}
                            onChange={handleChange}
                            aria-invalid={!!errors.terms_policies}
                        />
                        <label htmlFor="terms">
                            I agree to the Terms & Privacy Policy.
                        </label>
                        {errors.terms_policies && <div className={styles.errorText}>{errors.terms_policies}</div>}
                    </div>

                    <button className={styles.cta} type="submit" disabled={loading}>
                        {loading ? "Creating..." : "CREATE ACCOUNT"}
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
                    Already have an account? <a className={styles.link} href="/login">Sign in</a>
                </p>
            </div>
        </div>
    );
}

export default Register;
