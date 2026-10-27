import { useState } from "react";

export default function Auth({ onLogin }) {
    const [isRegister, setIsRegister] = useState(false);
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        phone: "",
        role: "farmer",
    });
    const [message, setMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setMessage("");
        setIsSuccess(false);

        if (isRegister && form.password.length < 8) {
            setMessage("Password must be at least 8 characters long.");
            return;
        }

        setLoading(true);

        try {
            const endpoint = isRegister ? "register" : "login";

            const response = await fetch(
                `http://localhost:5000/api/users/${endpoint}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(
                        isRegister
                            ? { ...form }
                            : { email: form.email, password: form.password }
                    ),
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Authentication failed");
            }

            localStorage.setItem("agritech_token", data.token);
            localStorage.setItem("agritech_user", JSON.stringify(data.user));

            setIsSuccess(true);
            setMessage(data.message || (isRegister ? "Registration successful!" : "Login successful!"));
            if (onLogin) onLogin(data.user);
        } catch (error) {
            setIsSuccess(false);
            setMessage(error.message || "Unable to connect to the server");
        } finally {
            setLoading(false);
        }
    };

    const handleQuickDemoLogin = async () => {
        setMessage("");
        setIsSuccess(false);
        setLoading(true);
        setIsRegister(false);
        setForm((prev) => ({
            ...prev,
            email: "demo@agritech.com",
            password: "Password123",
        }));

        try {
            const response = await fetch(
                "http://localhost:5000/api/users/login",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: "demo@agritech.com",
                        password: "Password123",
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Demo login failed");
            }

            localStorage.setItem("agritech_token", data.token);
            localStorage.setItem("agritech_user", JSON.stringify(data.user));

            setIsSuccess(true);
            setMessage("Welcome, Demo Farmer! Signing in...");
            setTimeout(() => {
                if (onLogin) onLogin(data.user);
            }, 300);
        } catch (error) {
            setIsSuccess(false);
            setMessage(error.message || "Unable to connect to server");
        } finally {
            setLoading(false);
        }
    };

    const fillDemoInputs = () => {
        setIsRegister(false);
        setForm((prev) => ({
            ...prev,
            email: "demo@agritech.com",
            password: "Password123",
        }));
        setMessage("Demo credentials filled! Click 'Sign In' or use Instant Login.");
        setIsSuccess(true);
    };

    return (
        <section className="auth-container">
            <h2>{isRegister ? "Create AgriTech Account" : "Welcome Back"}</h2>
            <p className="auth-subtitle">
                {isRegister
                    ? "Join thousands of farmers improving crop yields and farm management."
                    : "Access your smart farming dashboard and resources."}
            </p>

            {/* Quick Demo Access Box */}
            <div className="demo-credentials-banner">
                <div className="demo-banner-header">
                    <span className="demo-badge">⭐ Video / Test Demo Account</span>
                    <button
                        type="button"
                        className="demo-fill-btn"
                        onClick={fillDemoInputs}
                        title="Fill inputs with demo credentials"
                    >
                        Auto-Fill
                    </button>
                </div>
                <div className="demo-credentials-text">
                    <div><strong>Email:</strong> <code>demo@agritech.com</code></div>
                    <div><strong>Password:</strong> <code>Password123</code></div>
                </div>
                <button
                    type="button"
                    className="demo-login-action-btn"
                    onClick={handleQuickDemoLogin}
                    disabled={loading}
                >
                    🚀 1-Click Instant Demo Login
                </button>
            </div>

            <div className="auth-divider">
                <span>or enter credentials</span>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
                {isRegister && (
                    <>
                        <div className="form-group">
                            <label htmlFor="auth-name">Full Name</label>
                            <input
                                id="auth-name"
                                placeholder="Enter your full name"
                                required
                                value={form.name}
                                onChange={(e) =>
                                    setForm({ ...form, name: e.target.value })
                                }
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="auth-phone">Phone Number</label>
                            <input
                                id="auth-phone"
                                type="tel"
                                placeholder="e.g. +91 9876543210"
                                value={form.phone}
                                onChange={(e) =>
                                    setForm({ ...form, phone: e.target.value })
                                }
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="auth-role">Account Role</label>
                            <select
                                id="auth-role"
                                value={form.role}
                                onChange={(e) =>
                                    setForm({ ...form, role: e.target.value })
                                }
                            >
                                <option value="farmer">Farmer / Grower</option>
                                <option value="buyer">Buyer / Retailer</option>
                            </select>
                        </div>
                    </>
                )}

                <div className="form-group">
                    <label htmlFor="auth-email">Email Address</label>
                    <input
                        id="auth-email"
                        type="email"
                        placeholder="farmer@example.com"
                        required
                        value={form.email}
                        onChange={(e) =>
                            setForm({ ...form, email: e.target.value })
                        }
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="auth-password">Password</label>
                    <input
                        id="auth-password"
                        type="password"
                        placeholder={isRegister ? "At least 8 characters" : "Enter your password"}
                        required
                        minLength={isRegister ? 8 : undefined}
                        value={form.password}
                        onChange={(e) =>
                            setForm({ ...form, password: e.target.value })
                        }
                    />
                </div>

                {message && (
                    <div
                        className={`alert-banner ${isSuccess ? "alert-success" : "alert-danger"}`}
                        role="alert"
                    >
                        {isSuccess ? "✓ " : "⚠ "}
                        {message}
                    </div>
                )}

                <button type="submit" className="primary-btn auth-submit-btn" disabled={loading}>
                    {loading
                        ? "Please wait..."
                        : isRegister
                            ? "Create Account"
                            : "Sign In"}
                </button>
            </form>

            <div className="auth-toggle">
                <span>{isRegister ? "Already registered?" : "New to AgriTech?"}</span>{" "}
                <button
                    type="button"
                    className="link-btn"
                    onClick={() => {
                        setIsRegister(!isRegister);
                        setMessage("");
                    }}
                >
                    {isRegister ? "Sign In here" : "Create an Account"}
                </button>
            </div>
        </section>
    );
}