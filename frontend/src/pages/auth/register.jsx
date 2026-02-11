import React, { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Alert, Button, Card, Form, Input, message } from "antd";
import { api } from "../../api/client";

export default function Register() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [form] = Form.useForm();

    const tokenFromQuery = searchParams.get("token") || "";
    const emailFromQuery = searchParams.get("email") || "";

    const initialValues = useMemo(() => ({
        token: tokenFromQuery,
        email: emailFromQuery,
        username: "",
        password: "",
        confirmPassword: "",
    }), [tokenFromQuery, emailFromQuery]);

    const onSubmit = async () => {
        const values = await form.validateFields();
        await api.post("/api/auth/register", {
            token: values.token,
            username: values.username,
            email: values.email,
            password: values.password,
        });
        message.success("Registration successful. Please sign in.");
        navigate("/signin");
    };

    return (
        <div style={{ maxWidth: 460, margin: "80px auto" }}>
            <Card title="Employee Registration">
                {!tokenFromQuery && (
                    <Alert
                        type="warning"
                        showIcon
                        message="Registration token is missing. Please use the link provided by HR."
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
                        label="Email"
                        name="email"
                        rules={[
                            { required: true, message: "Email is required" },
                            { type: "email", message: "Enter a valid email" },
                        ]}
                    >
                        <Input placeholder="you@example.com" />
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

                    <Button type="primary" block onClick={onSubmit}>
                        Create Account
                    </Button>
                </Form>
            </Card>
        </div>
    );
}
