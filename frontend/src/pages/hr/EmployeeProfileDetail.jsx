import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { Box, Button, CircularProgress, Paper, Typography } from "@mui/material";

import Layout from "../../components/Layout";
import PageHeader from "../../components/PageHeader";
import { clearApplicationDetail, fetchHRApplicationDetail } from "../../store/hrSlice";

const valueOrDash = (value) => (value === undefined || value === null || value === "" ? "-" : value);

export default function EmployeeProfileDetail() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const loading = useSelector((state) => state.hr.applicationDetailLoading);
    const detail = useSelector((state) => state.hr.applicationDetail);
    const profile = detail?.profile || null;

    useEffect(() => {
        if (userId) {
            dispatch(fetchHRApplicationDetail(userId));
        }
        return () => {
            dispatch(clearApplicationDetail());
        };
    }, [dispatch, userId]);

    return (
        <Layout activePage="Employee Profiles">
            <PageHeader title="Employee Profile" subtitle="HR Portal / Employee Profiles / Detail" />

            <Box sx={{ mb: 2 }}>
                <Button variant="outlined" onClick={() => navigate("/hr/profiles")}>
                    Back To Employee Profiles
                </Button>
            </Box>

            <Paper elevation={0} sx={{ p: 3, borderRadius: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
                {loading ? (
                    <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
                        <CircularProgress />
                    </Box>
                ) : !profile ? (
                    <Typography color="error">Profile not found.</Typography>
                ) : (
                    <Box sx={{ display: "grid", gap: 1.5 }}>
                        <Typography><strong>Name:</strong> {valueOrDash(`${profile.preferredName || profile.firstName || ""} ${profile.lastName || ""}`.trim())}</Typography>
                        <Typography><strong>Email:</strong> {valueOrDash(profile.email || detail?.app?.User?.email)}</Typography>
                        <Typography><strong>Phone:</strong> {valueOrDash(profile.phones?.cell)}</Typography>
                        <Typography><strong>SSN:</strong> {valueOrDash(profile.ssn)}</Typography>
                        <Typography><strong>Address:</strong> {valueOrDash(profile.address?.line1)}</Typography>
                        <Typography><strong>City:</strong> {valueOrDash(profile.address?.city)}</Typography>
                        <Typography><strong>State:</strong> {valueOrDash(profile.address?.state)}</Typography>
                        <Typography><strong>Zip:</strong> {valueOrDash(profile.address?.zipCode || profile.address?.zip)}</Typography>
                        <Typography><strong>Work Authorization:</strong> {valueOrDash(profile.workAuthorization?.type)}</Typography>
                    </Box>
                )}
            </Paper>
        </Layout>
    );
}
