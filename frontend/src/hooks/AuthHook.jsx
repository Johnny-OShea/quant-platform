import { useState } from "react";

function useAuthFormBase({
                             initialValues,
                             endpoint,
                             method = "POST",
                             validate,
                             successMessage = "OK",
                             mapRequest = (v) => v,
                             onSuccess,
                         }) {
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState("");
    const [status, setStatus] = useState("idle"); // idle | success | error
    const [loading, setLoading] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);

    const togglePasswordVisible = () => setPasswordVisible(v => !v);

    const handleChange = (e) => {
        const { name, type, checked, value } = e.target;
        setValues(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const nextErrors = validate ? validate(values) : {};
        setErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) {
            setMessage("Please fix the highlighted fields.");
            setStatus("error");
            return;
        }

        try {
            setLoading(true);
            setStatus("idle");
            const res = await fetch(endpoint, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(mapRequest(values)),
            });

            let data = {};
            try { data = await res.json(); } catch {}

            if (!res.ok) {
                const errText = data?.message || `Error ${res.status}`;
                throw new Error(errText);
            }

            setMessage(data?.message || successMessage);
            setStatus("success");

            onSuccess && onSuccess(data)
        } catch (err) {
            setMessage(err.message || "Something went wrong");
            setStatus("error");
        } finally {
            setLoading(false);
        }
    };

    return {
        values, setValues,
        errors, setErrors,
        message, status, loading,
        passwordVisible, togglePasswordVisible,
        handleChange, handleSubmit,
    };
}

/** ---------- Validators ---------- */
const emailOK = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s || "");

// Register: username, email, password>=8, terms
function validateRegister(values) {
    const e = {};
    if (!values.username?.trim()) e.username = "Required";
    if (!values.email?.trim()) e.email = "Required";
    else if (!emailOK(values.email)) e.email = "Enter a valid email";
    if (!values.password?.trim()) e.password = "Required";
    else if (values.password.length < 8) e.password = "Min 8 characters";
    if (!values.terms_policies) e.terms_policies = "Required";
    return e;
}

// Sign-in: email, password
function validateSignIn(values) {
    const e = {};
    if (!values.email?.trim()) e.email = "Required";
    else if (!emailOK(values.email)) e.email = "Enter a valid email";
    if (!values.password?.trim()) e.password = "Required";
    return e;
}

/** ---------- Public hooks ---------- */
export function useRegisterForm({ initialValues, endpoint, onSuccess }) {
    return useAuthFormBase({
        initialValues,
        endpoint,
        validate: validateRegister,
        successMessage: "Account created!",
        onSuccess,
    });
}

export function useSignInForm({ initialValues, endpoint, onSuccess }) {
    return useAuthFormBase({
        initialValues,
        endpoint,
        validate: validateSignIn,
        successMessage: "Signed in!",
        onSuccess,
    });
}