import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Alert, Button, Card, Form, Input, message } from "antd";
import { registerWithToken } from "../../store/authSlice";
import { api } from "../../api/client";

export default function Register() {
    const dispatch = useDispatch();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { loading, error } = useSelector((state) => state.auth);
    const [form] = Form.useForm();

    const tokenFromQuery = searchParams.get("token") || "";

    const initialValues = useMemo(() => ({
        token: tokenFromQuery,
        username: "",
        password: "",
        confirmPassword: "",
    }), [tokenFromQuery]);

    useEffect(() => {
        if (!tokenFromQuery) return;

        let alive = true;
        (async () => {
            try {
                const res = await api.get("/api/auth/registration-token-status", {
                    params: { token: tokenFromQuery },
                });
                if (!alive) return;

                const status = String(res.data?.status || "").toLowerCase();
                if (status === "used") {
                    message.info("This invitation link has already been used. Please sign in.");
                    navigate("/signin", { replace: true });
                }
            } catch {
                // If status check fails, keep page usable; submit endpoint will still validate.
            }
        })();

        return () => {
            alive = false;
        };
    }, [tokenFromQuery, navigate]);

    const onSubmit = async () => {
        const values = await form.validateFields();
        const result = await dispatch(registerWithToken({
            token: values.token,
            username: values.username,
            password: values.password,
        }));
        if (!registerWithToken.fulfilled.match(result)) return;
        message.success("Registration successful. Please sign in.");
        navigate("/signin");
    };

    return (
        <div style={{ maxWidth: 560, width: "92%", margin: "56px auto" }}>
            <Card title="Employee Registration">
                {!tokenFromQuery && (
                    <Alert
                        type="warning"
                        showIcon
                        message="Registration token is missing. Please use the link provided by HR."
                        style={{ marginBottom: 16 }}
                    />
                )}
                {error && (
                    <Alert
                        type="error"
                        showIcon
                        message={typeof error === "string" ? error : error?.message || "Registration failed"}
                        style={{ marginBottom: 16 }}
                    />
                )}

                <Form form={form} layout="vertical" initialValues={initialValues}>
                    <Form.Item
                        label="Registration Token"
                        name="token"
                        rules={[{ required: true, message: "Token is required" }]}
                    >
                        <Input placeholder="Paste your token" />
                    </Form.Item>

                    <Form.Item
                        label="Username"
                        name="username"
                        rules={[{ required: true, message: "Username is required" }]}
                    >
                        <Input placeholder="Choose a username" />
                    </Form.Item>

                    <Form.Item
                        label="Password"
                        name="password"
                        rules={[{ required: true, message: "Password is required" }]}
                        hasFeedback
                    >
                        <Input.Password placeholder="Create a password" />
                    </Form.Item>

                    <Form.Item
                        label="Confirm Password"
                        name="confirmPassword"
                        dependencies={["password"]}
                        hasFeedback
                        rules={[
                            { required: true, message: "Please confirm your password" },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue("password") === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error("Passwords do not match"));
                                },
                            }),
                        ]}
                    >
                        <Input.Password placeholder="Re-enter password" />
                    </Form.Item>

                    <Button type="primary" size="large" block onClick={onSubmit} loading={loading}>
                        Create Account
                    </Button>
                    <Button type="link" block onClick={() => navigate("/signin")}>
                        Already have an account? Sign in
                    </Button>
                </Form>
            </Card>
        </div>
    );
}
