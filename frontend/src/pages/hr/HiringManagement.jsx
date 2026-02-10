import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Typography, Button, Chip, Tabs, Tab, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { Visibility as VisibilityIcon } from '@mui/icons-material';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import SearchBar from '../../components/SearchBar';
import CustomPagination from '../../components/CustomPagination';
import InviteEmployeeCard from '../../components/InviteEmployeeCard';
import {
    clearApplicationDetail,
    fetchHRApplicationDetail,
    fetchHRApplications,
    reviewHRApplicationThunk,
} from '../../store/hrSlice';

const HiringManagement = () => {
    const dispatch = useDispatch();
    const applications = useSelector((state) => state.hr.applications);
    const loading = useSelector((state) => state.hr.applicationsLoading);
    const actionLoading = useSelector((state) => state.hr.actionLoading);
    const applicationLoading = useSelector((state) => state.hr.applicationDetailLoading);
    const applicationDetail = useSelector((state) => state.hr.applicationDetail);
    const [search, setSearch] = useState('');
    const [tabValue, setTabValue] = useState('Pending'); 
    const [page, setPage] = useState(1);
    const [actingId, setActingId] = useState('');
    const [rejectOpen, setRejectOpen] = useState(false);
    const [rejectRow, setRejectRow] = useState(null);
    const [rejectFeedback, setRejectFeedback] = useState('');
    const [applicationOpen, setApplicationOpen] = useState(false);
    const rowsPerPage = 5;

    useEffect(() => {
        dispatch(fetchHRApplications());
    }, [dispatch]);

    const filteredApps = applications.filter(app => {
        const matchesSearch = app.name.toLowerCase().includes(search.toLowerCase()) || app.email.toLowerCase().includes(search.toLowerCase());
        const matchesTab = app.status === tabValue; 
        return matchesSearch && matchesTab;
    });

    const pendingCount = applications.filter(a => a.status === 'Pending').length;
    const rejectedCount = applications.filter(a => a.status === 'Rejected').length;
    const approvedCount = applications.filter(a => a.status === 'Approved').length;

    const totalPages = Math.ceil(filteredApps.length / rowsPerPage);
    const paginatedApps = filteredApps.slice((page - 1) * rowsPerPage, (page - 1) * rowsPerPage + rowsPerPage);

    useEffect(() => { setPage(1); }, [search, tabValue]);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleReview = async (row, nextStatus, feedback = '') => {
        if (!row?.userId || actingId || actionLoading) return;
        setActingId(row.id);
        try {
            await dispatch(reviewHRApplicationThunk({
                userId: row.userId,
                status: nextStatus,
                feedback,
            })).unwrap();
        } catch (err) {
            console.error(`Failed to ${nextStatus} application:`, err);
            alert(`Failed to ${nextStatus.toLowerCase()} application`);
        } finally {
            setActingId('');
        }
    };

    const openRejectDialog = (row) => {
        setRejectRow(row);
        setRejectFeedback('');
        setRejectOpen(true);
    };

    const submitReject = async () => {
        if (!rejectRow) return;
        if (!rejectFeedback.trim()) {
            alert('Please enter feedback before rejecting.');
            return;
        }
        await handleReview(rejectRow, 'Rejected', rejectFeedback.trim());
        setRejectOpen(false);
        setRejectRow(null);
        setRejectFeedback('');
    };

    const handleViewApplication = async (row) => {
        if (!row?.userId) return;
        setApplicationOpen(true);
        try {
            await dispatch(fetchHRApplicationDetail(row.userId)).unwrap();
        } catch (err) {
            console.error('Failed to load application detail:', err);
            alert('Failed to load application detail');
            setApplicationOpen(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Pending': return { bg: '#eff6ff', color: '#3b82f6' }; // 蓝
            case 'Approved': return { bg: '#f0fdf4', color: '#16a34a' }; // 绿
            case 'Rejected': return { bg: '#fef2f2', color: '#dc2626' }; // 红
            default: return { bg: '#f1f5f9', color: '#64748b' };
        }
    };

    return (
        <Layout activePage="Hiring Management">
            <PageHeader title="Hiring Management" subtitle="HR Portal / Hiring Management" />

            <InviteEmployeeCard />

            <Paper
                elevation={0}
                sx={{
                    bgcolor: 'white', borderRadius: '24px', p: 4, minHeight: '50vh',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                    display: 'flex', flexDirection: 'column'
                }}
            >
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b' }}>
                        Onboarding Applications
                    </Typography>
                    <Box sx={{ maxWidth: '300px' }}>
                        <SearchBar
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </Box>
                </Box>

                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                    <Tabs value={tabValue} onChange={handleTabChange} aria-label="application tabs">
                        <Tab label={`Pending (${pendingCount})`} value="Pending" sx={{ fontWeight: 600, textTransform: 'none', fontSize: '1rem' }} />
                        <Tab label={`Rejected (${rejectedCount})`} value="Rejected" sx={{ fontWeight: 600, textTransform: 'none', fontSize: '1rem' }} />
                        <Tab label={`Approved (${approvedCount})`} value="Approved" sx={{ fontWeight: 600, textTransform: 'none', fontSize: '1rem' }} />
                    </Tabs>
                </Box>

                <TableContainer sx={{ flex: 1 }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                {['CANDIDATE', 'POSITION', 'STATUS', 'DATE', 'APPLICATION', 'ACTION'].map((head) => (
                                    <TableCell key={head} sx={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.75rem', borderBottom: '1px solid #f1f5f9', pb: 2 }}>
                                        {head}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                                        <CircularProgress />
                                    </TableCell>
                                </TableRow>
                            ) : paginatedApps.map((row) => {
                                const statusStyle = getStatusStyle(row.status);
                                return (
                                    <TableRow key={row.id} hover sx={{ '& td': { borderBottom: '1px solid #f8fafc' }, cursor: 'pointer' }}>
                                        {/* Candidate Name & Email */}
                                        <TableCell>
                                            <Box>
                                                <Typography sx={{ fontWeight: 600, color: '#1e293b' }}>{row.name}</Typography>
                                                <Typography variant="body2" sx={{ color: '#64748b' }}>{row.email}</Typography>
                                            </Box>
                                        </TableCell>

                                        {/* Position */}
                                        <TableCell sx={{ color: '#1e293b', fontWeight: 500 }}>{row.position}</TableCell>

                                        {/* Status Chip */}
                                        <TableCell>
                                            <Chip
                                                label={row.status}
                                                size="small"
                                                sx={{
                                                    bgcolor: statusStyle.bg,
                                                    color: statusStyle.color,
                                                    fontWeight: 700,
                                                    borderRadius: '6px',
                                                    fontSize: '0.75rem'
                                                }}
                                            />
                                        </TableCell>

                                        {/* Date */}
                                        <TableCell sx={{ color: '#94a3b8' }}>{row.date}</TableCell>

                                        {/* View Application */}
                                        <TableCell>
                                            <Button
                                                variant="text"
                                                size="small"
                                                onClick={() => handleViewApplication(row)}
                                                sx={{ textTransform: 'none', fontWeight: 600 }}
                                            >
                                                View Application
                                            </Button>
                                        </TableCell>

                                        {/* Action Button */}
                                        <TableCell>
                                            {row.status === 'Pending' ? (
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        disabled={actingId === row.id || actionLoading}
                                                        onClick={() => handleReview(row, 'Approved')}
                                                        sx={{
                                                            textTransform: 'none',
                                                            borderRadius: '8px',
                                                            borderColor: '#bbf7d0',
                                                            color: '#16a34a',
                                                            py: 0.2,
                                                            fontSize: '0.8rem',
                                                            '&:hover': { borderColor: '#16a34a', bgcolor: '#f0fdf4' }
                                                        }}
                                                    >
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        disabled={actingId === row.id || actionLoading}
                                                        onClick={() => openRejectDialog(row)}
                                                        sx={{
                                                            textTransform: 'none',
                                                            borderRadius: '8px',
                                                            borderColor: '#fecaca',
                                                            color: '#dc2626',
                                                            py: 0.2,
                                                            fontSize: '0.8rem',
                                                            '&:hover': { borderColor: '#dc2626', bgcolor: '#fef2f2' }
                                                        }}
                                                    >
                                                        Reject
                                                    </Button>
                                                </Box>
                                            ) : (
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    startIcon={<VisibilityIcon />}
                                                    sx={{
                                                        textTransform: 'none',
                                                        borderRadius: '8px',
                                                        borderColor: '#e2e8f0',
                                                        color: '#475569',
                                                        py: 0.2,
                                                        fontSize: '0.8rem',
                                                        '&:hover': { borderColor: '#4338ca', color: '#4338ca', bgcolor: '#e0e7ff' }
                                                    }}
                                                >
                                                    View
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {!loading && paginatedApps.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 5, color: '#64748b' }}>
                                        No applications found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Box sx={{ pt: 3, display: 'flex', justifyContent: 'center' }}>
                    <CustomPagination
                        totalPages={totalPages}
                        page={page}
                        onChange={(e, v) => setPage(v)}
                    />
                </Box>

            </Paper>

            <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Reject Application</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Feedback (employee can see this)"
                        fullWidth
                        multiline
                        minRows={4}
                        value={rejectFeedback}
                        onChange={(e) => setRejectFeedback(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRejectOpen(false)}>Cancel</Button>
                    <Button color="error" variant="contained" onClick={submitReject} disabled={actingId === rejectRow?.id || actionLoading}>
                        Reject
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={applicationOpen}
                onClose={() => {
                    setApplicationOpen(false);
                    dispatch(clearApplicationDetail());
                }}
                fullWidth
                maxWidth="md"
            >
                <DialogTitle>Application Detail</DialogTitle>
                <DialogContent dividers>
                    {applicationLoading ? (
                        <Box sx={{ py: 4, display: 'grid', placeItems: 'center' }}>
                            <CircularProgress size={26} />
                        </Box>
                    ) : (
                        <Box sx={{ display: 'grid', gap: 2 }}>
                            <Box>
                                <Typography sx={{ fontWeight: 700, mb: 0.5 }}>Onboarding Application</Typography>
                                <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8fafc' }}>
                                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 13 }}>
{JSON.stringify(applicationDetail?.app, null, 2)}
                                    </pre>
                                </Paper>
                            </Box>
                            <Box>
                                <Typography sx={{ fontWeight: 700, mb: 0.5 }}>Employee Profile</Typography>
                                <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8fafc' }}>
                                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 13 }}>
{JSON.stringify(applicationDetail?.profile, null, 2)}
                                    </pre>
                                </Paper>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        setApplicationOpen(false);
                        dispatch(clearApplicationDetail());
                    }}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Layout>
    );
};

export default HiringManagement;
