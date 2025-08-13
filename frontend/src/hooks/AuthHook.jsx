import { useState } from "react";

/**
 * Reusable auth form hook
 * - Handles state, validation, submit, messages, loading
 * - Optional password visibility toggle
 */
export function useAuthForm({ initialValues, endpoint }) {
    const [values, setValues] = useState(initialValues);
    const [message, setMessage] = useState("");
    const [status, setStatus] = useState("idle"); // 'idle' | 'success' | 'error'
    const [loading, setLoading] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [errors, setErrors] = useState({});

    const togglePasswordVisible = () => setPasswordVisible(v => !v);

    const handleChange = (e) => {
        const { name, type, checked, value } = e.target;
        setValues(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    };


    const validate = () => {
        const next = {};

        // Check that the user entered something for the username
        if (!values.username?.trim()) next.username = "Required";

        // Check that the user entered something for the email
        if (!values.email?.trim()) next.email = "Required";

        // Check that the email is of valid format
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
            next.email = "Enter a valid email";

        // Check that the user entered something for the password
        if (!values.password?.trim()) next.password = "Required";

        // Check that the password is long enough
        else if (values.password.length < 8)
            next.password = "Min 8 characters";

        // Check that the user has selected agree
        if (!values.terms_policies)
            next.terms_policies = "Required"

        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) {
            setMessage("Please fix the highlighted fields.");
            setStatus("error");
            return;
        }

        try {
            setLoading(true);
            setStatus("idle");
            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });

            let data = {};
            try { data = await res.json(); } catch { /* non-JSON */ }

            if (!res.ok) {
                const errText = data?.message || `Error ${res.status}`;
                throw new Error(errText);
            }

            setMessage(data?.message || "Account created!");
            setStatus("success");
        } catch (err) {
            setMessage(err.message || "Error creating account");
            setStatus("error");
        } finally {
            setLoading(false);
        }
    };

    return {
        values,
        errors,
        message,
        status,
        loading,
        passwordVisible,
        togglePasswordVisible,
        handleChange,
        handleSubmit,
        setValues,
    };
}
