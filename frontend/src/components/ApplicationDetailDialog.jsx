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
import {
    previewHROnboardingDocument,
    previewHRProfileDocument,
} from '../api/hrApi';

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
    const profile = detail?.profile || {};
    const address = detail?.address || {};
    const workAuthorization = detail?.workAuthorization || {};
    const reference = detail?.reference || {};
    const docs = Array.isArray(detail?.documents) ? detail.documents : [];
    const emergencyContacts = Array.isArray(detail?.emergencyContacts) ? detail.emergencyContacts : [];

    const fullName = detail?.fullName || 'N/A';
    const userId = String(detail?.userId || '');

    const previewDoc = async (doc) => {
        if (!userId || !doc) return;
        const res = doc.source === 'onboarding'
            ? await previewHROnboardingDocument(userId, doc.docId)
            : await previewHRProfileDocument(userId, doc.key);
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
                                    <LabelValue label="Email" value={detail?.email} />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <LabelValue label="Status" value={detail?.onboardingStatus} />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <LabelValue label="Preferred Name" value={profile?.preferredName} />
                                </Grid>
                            </Grid>
                        </DetailSection>

                        <DetailSection title="Address">
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <LabelValue label="Line 1" value={address?.line1} />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <LabelValue label="Line 2" value={address?.line2} />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <LabelValue label="City" value={address?.city} />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <LabelValue label="State" value={address?.state} />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <LabelValue label="ZIP" value={address?.zip} />
                                </Grid>
                            </Grid>
                        </DetailSection>

                        <DetailSection title="Work Authorization">
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <LabelValue
                                        label="Citizen / PR"
                                        value={
                                            workAuthorization?.isCitizenOrPR === true
                                                ? "Yes"
                                                : workAuthorization?.isCitizenOrPR === false
                                                    ? "No"
                                                    : null
                                        }
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <LabelValue
                                        label="Type"
                                        value={
                                            workAuthorization?.displayTitle
                                            || workAuthorization?.citizenOrGreenCard
                                            || workAuthorization?.otherVisaTitle
                                            || workAuthorization?.type
                                        }
                                    />
                                </Grid>
                            </Grid>
                        </DetailSection>

                        <DetailSection title="Reference">
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={4}>
                                    <LabelValue label="First Name" value={reference?.firstName} />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <LabelValue label="Last Name" value={reference?.lastName} />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <LabelValue label="Relationship" value={reference?.relationship} />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <LabelValue label="Phone" value={reference?.phone} />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <LabelValue label="Email" value={reference?.email} />
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
