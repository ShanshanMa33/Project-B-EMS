import React from 'react';
import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    Paper,
    Typography,
} from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { api } from '../api/client';

const display = (value) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'string') return value.trim() || 'N/A';
    return String(value);
};

function DetailSection({ title, children }) {
    return (
        <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography sx={{ fontWeight: 700, mb: 1.5 }}>{title}</Typography>
            {children}
        </Paper>
    );
}

function LabelValue({ label, value }) {
    return (
        <Box sx={{ mb: 1 }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                {label}
            </Typography>
            <Typography sx={{ color: '#0f172a', fontWeight: 500 }}>
                {display(value)}
            </Typography>
        </Box>
    );
}

export default function ApplicationDetailDialog({ open, loading, detail, onClose }) {
    const app = detail?.app || {};
    const profile = detail?.profile || {};
    const docs = Array.isArray(detail?.documents) ? detail.documents : [];
    const emergencyContacts = Array.isArray(detail?.emergencyContacts) ? detail.emergencyContacts : [];

    const fullName = `${app?.firstName || ''} ${app?.lastName || ''}`.trim()
        || `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim()
        || app?.preferredName
        || profile?.preferredName
        || 'N/A';

    const userId = String(
        app?.employee?._id
        || app?.employee
        || app?.User?._id
        || app?.User
        || profile?.user?._id
        || profile?.user
        || ''
    );

    const previewDoc = async (doc) => {
        if (!userId || !doc) return;
        const endpoint = doc.source === 'onboarding'
            ? `/api/hr/onboarding-documents/${userId}/${doc.docId}/preview`
            : `/api/hr/documents/${userId}/${doc.key}/preview`;
        const res = await api.get(endpoint, {
            responseType: 'blob',
        });
        const contentType = res?.headers?.['content-type'] || 'application/octet-stream';
        const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: contentType });
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener,noreferrer');
        setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle>Application Detail</DialogTitle>
            <DialogContent dividers>
                {loading ? (
                    <Box sx={{ py: 4, display: 'grid', placeItems: 'center' }}>
                        <CircularProgress size={26} />
                    </Box>
                ) : !detail ? (
                    <Typography sx={{ color: '#64748b' }}>No application detail available.</Typography>
                ) : (
                    <Box sx={{ display: 'grid', gap: 2 }}>
                        <DetailSection title="Basic Info">
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <LabelValue label="Full Name" value={fullName} />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <LabelValue label="Email" value={app?.email || profile?.email || app?.User?.email} />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <LabelValue label="Status" value={app?.status} />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <LabelValue label="Preferred Name" value={app?.preferredName || profile?.preferredName} />
                                </Grid>
                            </Grid>
                        </DetailSection>

                        <DetailSection title="Address">
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <LabelValue label="Line 1" value={app?.address?.AddressLine1 || profile?.address?.line1} />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <LabelValue label="Line 2" value={app?.address?.AddressLine2 || profile?.address?.line2} />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <LabelValue label="City" value={app?.address?.City || profile?.address?.city} />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <LabelValue label="State" value={app?.address?.State || profile?.address?.state} />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <LabelValue label="ZIP" value={app?.address?.ZipCode || profile?.address?.zipCode} />
                                </Grid>
                            </Grid>
                        </DetailSection>

                        <DetailSection title="Work Authorization">
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <LabelValue label="Citizen / PR" value={app?.workAuth?.isCitizenOrPR} />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <LabelValue label="Type" value={app?.workAuth?.visaType || profile?.workAuthorization?.type} />
                                </Grid>
                            </Grid>
                        </DetailSection>

                        <DetailSection title="Reference">
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={4}>
                                    <LabelValue label="First Name" value={app?.reference?.firstName} />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <LabelValue label="Last Name" value={app?.reference?.lastName} />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <LabelValue label="Relationship" value={app?.reference?.relationship} />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <LabelValue label="Phone" value={app?.reference?.phone} />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <LabelValue label="Email" value={app?.reference?.email} />
                                </Grid>
                            </Grid>
                        </DetailSection>

                        <DetailSection title="Emergency Contact(s)">
                            {emergencyContacts.length === 0 ? (
                                <Typography sx={{ color: '#64748b' }}>No emergency contacts provided.</Typography>
                            ) : (
                                emergencyContacts.map((c, idx) => (
                                    <Paper key={`${c?.email || c?.phone || idx}`} variant="outlined" sx={{ p: 1.5, mb: 1.5, bgcolor: '#f8fafc' }}>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} md={4}>
                                                <LabelValue label="First Name" value={c?.firstName} />
                                            </Grid>
                                            <Grid item xs={12} md={4}>
                                                <LabelValue label="Last Name" value={c?.lastName} />
                                            </Grid>
                                            <Grid item xs={12} md={4}>
                                                <LabelValue label="Relationship" value={c?.relationship} />
                                            </Grid>
                                            <Grid item xs={12} md={6}>
                                                <LabelValue label="Phone" value={c?.phone} />
                                            </Grid>
                                            <Grid item xs={12} md={6}>
                                                <LabelValue label="Email" value={c?.email} />
                                            </Grid>
                                        </Grid>
                                    </Paper>
                                ))
                            )}
                        </DetailSection>

                        <DetailSection title="Documents">
                            {docs.length === 0 ? (
                                <Typography sx={{ color: '#64748b' }}>No documents attached.</Typography>
                            ) : (
                                docs.map((doc) => (
                                    <Box
                                        key={doc.key}
                                        sx={{
                                            mb: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: 1,
                                        }}
                                    >
                                        <Box>
                                            <Typography sx={{ fontWeight: 600 }}>{doc.label}</Typography>
                                            <Typography sx={{ color: '#64748b' }}>{display(doc.fileName)}</Typography>
                                        </Box>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            startIcon={<VisibilityOutlinedIcon fontSize="small" />}
                                            onClick={() => previewDoc(doc)}
                                            disabled={!doc?.fileName || !userId || (doc.source === 'onboarding' && !doc?.docId)}
                                        >
                                            Preview
                                        </Button>
                                    </Box>
                                ))
                            )}
                        </DetailSection>
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
}
