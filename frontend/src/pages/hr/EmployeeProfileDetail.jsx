import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { Avatar, Box, Button, CircularProgress, Paper, Typography } from "@mui/material";

import Layout from "../../components/Layout";
import PageHeader from "../../components/PageHeader";
import { DetailRow, DetailSection } from "../../components/DetailSection";
import {
    getHRDocumentDownloadUrl,
    getHRDocumentPreviewUrl,
    getHROnboardingDocumentDownloadUrl,
    getHROnboardingDocumentPreviewUrl,
} from "../../api/hr";
import { formatDate } from "../../utils/profileFormatters";
import { clearApplicationDetail, fetchHRApplicationDetail } from "../../store/hrSlice";

export default function EmployeeProfileDetail() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const loading = useSelector((state) => state.hr.applicationDetailLoading);
    const detail = useSelector((state) => state.hr.applicationDetail);
    const emergencyList = detail?.emergencyContacts || [];
    const docs = detail?.documents || [];
    const openExternal = (url) => window.open(url, "_blank", "noopener,noreferrer");

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

            <Paper elevation={0} sx={{ p: 3, borderRadius: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.02)", mb: 10 }}>
                {loading ? (
                    <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
                        <CircularProgress />
                    </Box>
                ) : !detail ? (
                    <Typography color="error">Profile not found.</Typography>
                ) : (
                    <Box sx={{ display: "grid", gap: 2 }}>
                        <DetailSection title="Name & Identity">
                            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
                                <Avatar
                                    src={detail?.profile?.profilePicture || ""}
                                    sx={{ width: 64, height: 64, bgcolor: "#e2e8f0", color: "#334155", fontWeight: 700 }}
                                >
                                    {(detail?.profile?.preferredName || detail?.profile?.firstName || detail?.fullName || "U").slice(0, 1).toUpperCase()}
                                </Avatar>
                                <Box>
                                    <DetailRow label="Email" value={detail?.email} />
                                    <DetailRow label="Profile Picture" value={detail?.profile?.profilePicture || "Not uploaded"} />
                                </Box>
                            </Box>
                            <DetailRow label="First Name" value={detail?.profile?.firstName} />
                            <DetailRow label="Last Name" value={detail?.profile?.lastName} />
                            <DetailRow label="Middle Name" value={detail?.profile?.middleName} />
                            <DetailRow label="Preferred Name" value={detail?.profile?.preferredName} />
                            <DetailRow label="SSN" value={detail?.profile?.ssn} />
                            <DetailRow label="Date Of Birth" value={formatDate(detail?.profile?.dob)} />
                            <DetailRow label="Gender" value={detail?.profile?.gender} />
                        </DetailSection>

                        <DetailSection title="Address">
                            <DetailRow label="Building/Apt" value={detail?.address?.line2} />
                            <DetailRow label="Street" value={detail?.address?.line1} />
                            <DetailRow label="City" value={detail?.address?.city} />
                            <DetailRow label="State" value={detail?.address?.state} />
                            <DetailRow label="Zip" value={detail?.address?.zip} />
                        </DetailSection>

                        <DetailSection title="Contact Info">
                            <DetailRow label="Cell Phone" value={detail?.contact?.cellPhone} />
                            <DetailRow label="Work Phone" value={detail?.contact?.workPhone} />
                        </DetailSection>

                        <DetailSection title="Employment">
                            <DetailRow label="Job Title" value={detail?.employment?.jobTitle || "-"} />
                            <DetailRow label="Visa Title" value={detail?.employment?.visaTitle || "N/A"} />
                            <DetailRow label="Start Date" value={formatDate(detail?.employment?.startDate)} />
                            <DetailRow label="End Date" value={formatDate(detail?.employment?.endDate)} />
                        </DetailSection>

                        <DetailSection title="Emergency Contacts">
                            {emergencyList.length === 0 ? (
                                <Typography sx={{ color: "#64748b" }}>No emergency contact found.</Typography>
                            ) : (
                                emergencyList.map((c, idx) => (
                                    <Paper key={`${c.firstName}-${idx}`} elevation={0} sx={{ p: 1.5, borderRadius: "10px", bgcolor: "#f8fafc" }}>
                                        <DetailRow label="First Name" value={c.firstName} />
                                        <DetailRow label="Last Name" value={c.lastName} />
                                        <DetailRow label="Middle Name" value={c.middleName} />
                                        <DetailRow label="Phone" value={c.phone} />
                                        <DetailRow label="Email" value={c.email} />
                                        <DetailRow label="Relationship" value={c.relationship} />
                                    </Paper>
                                ))
                            )}
                        </DetailSection>

                        <DetailSection title="Documents">
                            {docs.map((doc) => {
                                const hasFile = Boolean(doc.fileName);
                                const previewUrl = doc.source === "onboarding"
                                    ? getHROnboardingDocumentPreviewUrl(userId, doc.docId)
                                    : getHRDocumentPreviewUrl(userId, doc.key);
                                const downloadUrl = doc.source === "onboarding"
                                    ? getHROnboardingDocumentDownloadUrl(userId, doc.docId)
                                    : getHRDocumentDownloadUrl(userId, doc.key);
                                return (
                                    <Box
                                        key={doc.key}
                                        sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, p: 1.2, borderRadius: "10px", bgcolor: "#f8fafc" }}
                                    >
                                        <Box sx={{ minWidth: 0 }}>
                                            <Typography sx={{ fontWeight: 700, color: "#0f172a" }}>{doc.label}</Typography>
                                            <Typography sx={{ color: "#64748b", fontSize: "0.85rem" }}>
                                                {hasFile ? doc.fileName : "Not uploaded"}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: "flex", gap: 1 }}>
                                            <Button size="small" variant="outlined" disabled={!hasFile} onClick={() => openExternal(previewUrl)}>
                                                Preview
                                            </Button>
                                            <Button size="small" variant="contained" disabled={!hasFile} onClick={() => openExternal(downloadUrl)}>
                                                Download
                                            </Button>
                                        </Box>
                                    </Box>
                                );
                            })}
                        </DetailSection>
                    </Box>
                )}
            </Paper>
        </Layout>
    );
}
