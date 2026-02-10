import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Box, Card, CardContent, Typography } from "@mui/material";
import { Button, Steps } from "antd";

import PageHeader from "../../components/PageHeader";
import { fetchOnboarding, createOnboarding, updateOnboarding } from "../../store/onboardingSlice";

const STATUS_TO_STEP = {
    not_started: 0,
    draft: 0,
    submitted: 1,
    in_review: 2,
    approved: 3,
    rejected: 3,
};

export default function EmployeeOnboarding() {
    const dispatch = useDispatch();
    const { application, loading, error } = useSelector((s) => s.onboarding);

    useEffect(() => {
        dispatch(fetchOnboarding());
    }, [dispatch]);

    const currentStep = useMemo(() => {
        const s = application?.status || "not_started";
        return STATUS_TO_STEP[s] ?? 0;
    }, [application]);

    const steps = useMemo(
        () => [
            { title: "Start", description: "Create onboarding record" },
            { title: "Submit", description: "Submit for HR review" },
            { title: "Review", description: "HR is reviewing" },
            { title: "Decision", description: "Approved / Rejected" },
        ],
        []
    );

    const startOnboarding = async () => {
        await dispatch(createOnboarding({})).unwrap();
        dispatch(fetchOnboarding());
    };

    const submitToHR = async () => {
        if (!application?._id) return;
        await dispatch(updateOnboarding({ id: application._id, status: "submitted" })).unwrap();
        dispatch(fetchOnboarding());
    };

    const canSubmit =
        application?._id && (application.status === "draft" || application.status === "not_started");

    return (
        <Box>
            <PageHeader title="Onboarding" subtitle="Track your onboarding application progress." />

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {typeof error === "string" ? error : "Onboarding error"}
                </Alert>
            )}

            <Card
                elevation={0}
                sx={{
                    borderRadius: "16px",
                    bgcolor: "white",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                }}
            >
                <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: "#1e293b", mb: 2 }}>
                        Current Status:{" "}
                        <span style={{ color: "#6366f1" }}>
                            {(application?.status || "not_started").replaceAll("_", " ")}
                        </span>
                    </Typography>

                    <Steps current={currentStep} items={steps} />

                    <Box sx={{ mt: 3, display: "flex", gap: 10 / 10, flexWrap: "wrap" }}>
                        {!application?._id ? (
                            <Button type="primary" onClick={startOnboarding} loading={loading}>
                                Start Onboarding
                            </Button>
                        ) : (
                            <>
                                <Button type="primary" onClick={submitToHR} disabled={!canSubmit} loading={loading}>
                                    Submit to HR
                                </Button>
                                <Button onClick={() => dispatch(fetchOnboarding())}>Refresh</Button>
                            </>
                        )}
                    </Box>

                    <Typography variant="body2" sx={{ color: "#64748b", mt: 2 }}>
                        If submit fails, double-check your onboardingSlice API path starts with <b>/api</b>.
                    </Typography>
                </CardContent>
            </Card>
        </Box>
    );
}
