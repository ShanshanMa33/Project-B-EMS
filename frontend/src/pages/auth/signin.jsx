import { useDispatch, useSelector } from "react-redux";
import { signIn } from "../../store/authSlice";
import { fetchOnboarding } from "../../store/onboardingSlice";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Card, Form, Input, message } from "antd";
import { getRedirectRoute, normalizeOnboardingStatus } from "../../utils/authWorkflow";

export default function SignIn() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error } = useSelector((state) => state.auth);

    const [form] = Form.useForm();

    const onSubmit = async () => {
        try {
            const values = await form.validateFields();
            const payload = await dispatch(signIn({ username: values.username, password: values.password })).unwrap();

            const signedInUser = payload?.user || {};
            const role = String(signedInUser.role || "").toLowerCase();
            if (role !== "employee") {
                navigate(getRedirectRoute(signedInUser), { replace: true });
                return;
            }

            // Prefer backend-provided onboardingStatus; refresh from onboarding API if missing.
            let onboardingStatus = signedInUser.onboardingStatus;
            if (!onboardingStatus) {
                const onboardingPayload = await dispatch(fetchOnboarding()).unwrap();
                onboardingStatus = normalizeOnboardingStatus(onboardingPayload?.status);
            }

            navigate(
                getRedirectRoute({ ...signedInUser, onboardingStatus }),
                { replace: true }
            );
        } catch (err) {
            if (typeof err === "string") {
                message.error(err);
                return;
            }
            if (err?.message) {
                message.error(err.message);
            }
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
    );
}
