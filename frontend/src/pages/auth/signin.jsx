import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { signIn } from "../../store/authSlice";
import { useNavigate } from "react-router-dom";
import { Button, Input, Card } from "antd";

export default function SignIn() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error } = useSelector((state) => state.auth);

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const onSubmit = async () => {
        const res = await dispatch(signIn({ username, password }));
        if (signIn.fulfilled.match(res)) {
            const role = String(res.payload.user?.role || "").toLowerCase();
            navigate(role === "hr" ? "/hr/dashboard" : "/dashboard/employee");
        }
    };

    return (
        <div style={{ maxWidth: 420, margin: "80px auto" }}>
            <Card title="Sign In">
                <Input
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)} />
                <div style={{ height: 12 }} />
                <Input
                    placeholder="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)} />
                <div style={{ height: 12 }} />
                {error && <div style={{ color: "crimson", marginBottom: 12 }}>{error}</div>}
                <Button type="primary" block onClick={onSubmit} loading={loading}>
                    Sign In
                </Button>
            </Card>
        </div>
    )
}
