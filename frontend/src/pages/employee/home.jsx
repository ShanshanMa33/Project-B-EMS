import React, { useMemo } from "react";
import { Box, Card, CardContent, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

export default function EmployeeHome() {
    const navigate = useNavigate();
    const authUser = useSelector((s) => s.auth?.user);
    const profile = useSelector((s) => s.employeeProfile?.profile);
    const onboarding = useSelector((s) => s.onboarding?.application);

    const fullName = useMemo(() => {
        const first = profile?.firstName || profile?.basicInfo?.firstName || authUser?.firstName || "";
        const last = profile?.lastName || profile?.basicInfo?.lastName || authUser?.lastName || "";
        const name = `${first} ${last}`.trim();
        return name || authUser?.username || "there";
    }, [authUser, profile]);

    return (
        <Box sx={{ display: "grid", gap: 2 }}>
            <Card
                elevation={0}
                sx={{
                    borderRadius: 4,
                    border: "1px solid #e2e8f0",
                    overflow: "hidden",
                    background:
                        "linear-gradient(135deg, rgba(79,70,229,1) 0%, rgba(147,51,234,1) 100%)",
                    color: "white",
                }}
            >
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                    <Typography sx={{ fontSize: 34, fontWeight: 900, lineHeight: 1.1 }}>
                        Welcome back, {fullName}!
                    </Typography>

                    <Typography sx={{ mt: 1, opacity: 0.9 }}>
                        Keep your personal and visa information up to date to avoid delays.
                    </Typography>

                    <Box sx={{ display: "flex", gap: 1.5, mt: 2, flexWrap: "wrap" }}>
                        <Button
                            variant="contained"
                            onClick={() => navigate("/dashboard/employee/profile")}
                            sx={{
                                textTransform: "none",
                                fontWeight: 900,
                                borderRadius: 999,
                                bgcolor: "white",
                                color: "#1f2937",
                                "&:hover": { bgcolor: "#f1f5f9" },
                            }}
                        >
                            Update Profile
                        </Button>

                        <Button
                            variant="outlined"
                            onClick={() => navigate("/dashboard/employee/visaStatus")}
                            sx={{
                                textTransform: "none",
                                fontWeight: 900,
                                borderRadius: 999,
                                borderColor: "rgba(255,255,255,0.55)",
                                color: "white",
                                "&:hover": { borderColor: "rgba(255,255,255,0.9)" },
                            }}
                        >
                            Manage Visa Status
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
}
