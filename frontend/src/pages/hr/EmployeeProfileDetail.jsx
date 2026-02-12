import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { Avatar, Box, Button, CircularProgress, Paper, Typography } from "@mui/material";

import Layout from "../../components/Layout";
import PageHeader from "../../components/PageHeader";
import { DetailRow, DetailSection } from "../../components/DetailSection";
import { getHRDocumentDownloadUrl, getHRDocumentPreviewUrl } from "../../api/hr";
import { formatDate, getVisaTitle } from "../../utils/profileFormatters";
import { clearApplicationDetail, fetchHRApplicationDetail } from "../../store/hrSlice";

const PROFILE_FIELDS = [
    { label: "First Name", value: (profile) => profile.firstName },
    { label: "Last Name", value: (profile) => profile.lastName },
    { label: "Middle Name", value: (profile) => profile.middleName },
    { label: "Preferred Name", value: (profile) => profile.preferredName },
    { label: "SSN", value: (profile) => profile.ssn },
    { label: "Date Of Birth", value: (profile) => formatDate(profile.dateOfBirth) },
    { label: "Gender", value: (profile) => profile.gender },
];

const ADDRESS_FIELDS = [
    { label: "Building/Apt", value: (profile) => profile.address?.buildingApt },
    { label: "Street", value: (profile) => profile.address?.street || profile.address?.line1 },
    { label: "City", value: (profile) => profile.address?.city },
    { label: "State", value: (profile) => profile.address?.state },
    { label: "Zip", value: (profile) => profile.address?.zipCode || profile.address?.zip },
];

const CONTACT_FIELDS = [
    { label: "Cell Phone", value: (profile) => profile.phones?.cell },
    { label: "Work Phone", value: (profile) => profile.phones?.work },
];

const EMPLOYMENT_FIELDS = [
    { label: "Job Title", value: (profile, detail) => profile.position || detail?.app?.positionTitle },
    { label: "Visa Title", value: (profile) => getVisaTitle(profile) },
    { label: "Start Date", value: (profile) => formatDate(profile.workAuthorization?.startDate) },
    { label: "End Date", value: (profile) => formatDate(profile.workAuthorization?.endDate) },
];

export default function EmployeeProfileDetail() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const loading = useSelector((state) => state.hr.applicationDetailLoading);
    const detail = useSelector((state) => state.hr.applicationDetail);
    const profile = detail?.profile || null;
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

            <Paper elevation={0} sx={{ p: 3, borderRadius: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.02)", mb:10 }}>
                {loading ? (
                    <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
                        <CircularProgress />
                    </Box>
                ) : !profile ? (
                    <Typography color="error">Profile not found.</Typography>
                ) : (
                    <Box sx={{ display: "grid", gap: 2 }}>
                        <DetailSection title="Name & Identity">
                            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
                                <Avatar
                                    src={profile.profilePictureUrl || ""}
                                    sx={{ width: 64, height: 64, bgcolor: "#e2e8f0", color: "#334155", fontWeight: 700 }}
                                >
                                    {(profile.preferredName || profile.firstName || "U").slice(0, 1).toUpperCase()}
                                </Avatar>
                                <Box>
                                    <DetailRow label="Email" value={profile.email || detail?.app?.User?.email} />
                                    <DetailRow label="Profile Picture" value={profile.profilePictureUrl || profile.documents?.profilePicture || "Not uploaded"} />
                                </Box>
                            </Box>
                            {PROFILE_FIELDS.map((field) => (
                                <DetailRow key={field.label} label={field.label} value={field.value(profile)} />
                            ))}
                        </DetailSection>

                        <DetailSection title="Address">
                            {ADDRESS_FIELDS.map((field) => (
                                <DetailRow key={field.label} label={field.label} value={field.value(profile)} />
                            ))}
                        </DetailSection>

                        <DetailSection title="Contact Info">
                            {CONTACT_FIELDS.map((field) => (
                                <DetailRow key={field.label} label={field.label} value={field.value(profile)} />
                            ))}
                        </DetailSection>

                        <DetailSection title="Employment">
                            {EMPLOYMENT_FIELDS.map((field) => (
                                <DetailRow key={field.label} label={field.label} value={field.value(profile, detail)} />
                            ))}
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
                                const previewUrl = getHRDocumentPreviewUrl(userId, doc.key);
                                const downloadUrl = getHRDocumentDownloadUrl(userId, doc.key);
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
