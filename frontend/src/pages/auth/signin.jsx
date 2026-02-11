import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { signIn } from "../../store/authSlice";
import { fetchOnboarding } from "../../store/onboardingSlice";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Card, Form, Input } from "antd";
import { api } from "../../api/client";

export default function SignIn() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error } = useSelector((state) => state.auth);

    const [form] = Form.useForm();

    const onSubmit = async () => {
        const values = await form.validateFields();
        const res = await dispatch(signIn({ username: values.username, password: values.password }));
        if (signIn.fulfilled.match(res)) {
            const role = res.payload.user.role;
            if (role === "hr") {
                navigate("/dashboard/hr");
                return;
            }

            const onboardingRes = await dispatch(fetchOnboarding());
            if (fetchOnboarding.fulfilled.match(onboardingRes)) {
                const status = onboardingRes.payload?.status;
                if (status !== "approved") {
                    navigate("/dashboard/employee/onboarding");
                    return;
                }
            }

            navigate("/dashboard/employee");
        }
    };

    return (
        <div style={{ maxWidth: 460, margin: "80px auto" }}>
            <Card title="Sign In">
                {error && (
                    <Alert
                        type="error"
                        showIcon
                        message={typeof error === "string" ? error : error?.message || "Sign-in failed"}
                        style={{ marginBottom: 16 }}
                    />
                )}
                <Form form={form} layout="vertical">
                    <Form.Item
                        label="Username"
                        name="username"
                        rules={[{ required: true, message: "Username is required" }]}
                    >
                        <Input placeholder="Username" />
                    </Form.Item>

                    <Form.Item
                        label="Password"
                        name="password"
                        rules={[{ required: true, message: "Password is required" }]}
                    >
                        <Input.Password placeholder="Password" />
                    </Form.Item>

                    <Button type="primary" block onClick={onSubmit} loading={loading}>
                        Sign In
                    </Button>
                </Form>
            </Card>
        </div>
    )
}