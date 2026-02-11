import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, CircularProgress, Paper, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, Typography } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';

import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import SearchBar from '../../components/SearchBar';
import CustomPagination from '../../components/CustomPagination';
import InviteEmployeeCard from '../../components/InviteEmployeeCard';
import StatusBadge from '../../components/StatusBadge';
import ApplicationActionCell from '../../components/ApplicationActionCell';
import ApplicationDetailDialog from '../../components/ApplicationDetailDialog';
import RejectApplicationDialog from '../../components/RejectApplicationDialog';
import ActionConfirmDialog from '../../components/ActionConfirmDialog';
import {
    clearApplicationDetail,
    fetchHRApplicationDetail,
    fetchHRApplications,
    reviewHRApplicationThunk,
} from '../../store/hrSlice';

const ROWS_PER_PAGE = 5;
const TAB_OPTIONS = ['Pending', 'Rejected', 'Approved'];
const TABLE_HEADERS = ['CANDIDATE', 'POSITION', 'STATUS', 'DATE', 'APPLICATION', 'ACTION'];

const tableHeaderSx = {
    color: '#94a3b8',
    fontWeight: 700,
    fontSize: '0.75rem',
    borderBottom: '1px solid #f1f5f9',
    pb: 2,
};

const HiringManagement = () => {
    const dispatch = useDispatch();
    const { applications, applicationsLoading: loading, actionLoading, applicationDetailLoading, applicationDetail } = useSelector((state) => state.hr);

    const [search, setSearch] = useState('');
    const [tabValue, setTabValue] = useState('Pending');
    const [page, setPage] = useState(1);
    const [actingId, setActingId] = useState('');
    const [rejectOpen, setRejectOpen] = useState(false);
    const [rejectRow, setRejectRow] = useState(null);
    const [rejectFeedback, setRejectFeedback] = useState('');
    const [applicationOpen, setApplicationOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);

    useEffect(() => {
        dispatch(fetchHRApplications());
    }, [dispatch]);

    const countsByStatus = useMemo(
        () => applications.reduce(
            (acc, app) => {
                acc[app.status] = (acc[app.status] || 0) + 1;
                return acc;
            },
            { Pending: 0, Rejected: 0, Approved: 0 }
        ),
        [applications]
    );

    const filteredApps = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        return applications.filter((app) => {
            const matchesSearch =
                keyword.length === 0
                || app.name.toLowerCase().includes(keyword)
                || app.email.toLowerCase().includes(keyword);
            return matchesSearch && app.status === tabValue;
        });
    }, [applications, search, tabValue]);

    const totalPages = Math.ceil(filteredApps.length / ROWS_PER_PAGE);
    const safePage = totalPages === 0 ? 1 : Math.min(page, totalPages);
    const paginatedApps = useMemo(() => {
        const start = (safePage - 1) * ROWS_PER_PAGE;
        return filteredApps.slice(start, start + ROWS_PER_PAGE);
    }, [filteredApps, safePage]);

    const handleSearchChange = (e) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const handleTabChange = (_, newValue) => {
        setTabValue(newValue);
        setPage(1);
        setSearch('');
    };

    const closeRejectDialog = () => {
        setRejectOpen(false);
        setRejectRow(null);
        setRejectFeedback('');
    };

    const closeApplicationDialog = () => {
        setApplicationOpen(false);
        dispatch(clearApplicationDetail());
    };

    const handleReview = async (row, nextStatus, feedback = '') => {
        if (!row?.userId || actingId || actionLoading) return false;

        setActingId(row.id);
        try {
            await dispatch(
                reviewHRApplicationThunk({
                    userId: row.userId,
                    status: nextStatus,
                    feedback,
                })
            ).unwrap();
            return true;
        } catch (error) {
            console.error(`Failed to ${nextStatus} application:`, error);
            alert(`Failed to ${nextStatus.toLowerCase()} application`);
            return false;
        } finally {
            setActingId('');
        }
    };

    const openConfirmAction = (row, status, feedback = '') => {
        if (!row?.userId || actingId || actionLoading) return;
        setConfirmAction({ row, status, feedback });
    };

    const closeConfirmAction = () => {
        setConfirmAction(null);
    };

    const submitConfirmedAction = async () => {
        if (!confirmAction) return;

        const { row, status, feedback } = confirmAction;
        const isRejected = status === 'Rejected';
        const success = await handleReview(row, status, feedback);

        if (success && isRejected) {
            closeRejectDialog();
        }

        closeConfirmAction();
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

        openConfirmAction(rejectRow, 'Rejected', rejectFeedback.trim());
    };

    const handleViewApplication = async (row) => {
        if (!row?.userId) return;

        setApplicationOpen(true);
        try {
            await dispatch(fetchHRApplicationDetail(row.userId)).unwrap();
        } catch (error) {
            console.error('Failed to load application detail:', error);
            alert('Failed to load application detail');
            setApplicationOpen(false);
        }
    };

    return (
        <Layout activePage="Hiring Management">
            <PageHeader title="Hiring Management" subtitle="HR Portal / Hiring Management" />

            <InviteEmployeeCard />

            <Paper
                elevation={0}
                sx={{
                    bgcolor: 'white',
                    borderRadius: '24px',
                    p: 4,
                    minHeight: '50vh',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b' }}>
                        Onboarding Applications
                    </Typography>
                    <Box sx={{ maxWidth: '300px' }}>
                        <SearchBar placeholder="Search..." value={search} onChange={handleSearchChange} />
                    </Box>
                </Box>

                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                    <Tabs value={tabValue} onChange={handleTabChange} aria-label="application tabs">
                        {TAB_OPTIONS.map((tab) => (
                            <Tab
                                key={tab}
                                label={`${tab} (${countsByStatus[tab] || 0})`}
                                value={tab}
                                sx={{ fontWeight: 600, textTransform: 'none', fontSize: '1rem' }}
                            />
                        ))}
                    </Tabs>
                </Box>

                <TableContainer sx={{ flex: 1 }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                {TABLE_HEADERS.map((head) => (
                                    <TableCell key={head} sx={tableHeaderSx}>
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
                                const isActing = actingId === row.id || actionLoading;

                                return (
                                    <TableRow key={row.id} hover sx={{ '& td': { borderBottom: '1px solid #f8fafc' }, cursor: 'pointer' }}>
                                        <TableCell>
                                            <Box>
                                                <Typography sx={{ fontWeight: 600, color: '#1e293b' }}>{row.name}</Typography>
                                                <Typography variant="body2" sx={{ color: '#64748b' }}>{row.email}</Typography>
                                            </Box>
                                        </TableCell>

                                        <TableCell sx={{ color: '#1e293b', fontWeight: 500 }}>{row.position}</TableCell>

                                        <TableCell>
                                            <StatusBadge status={row.status} />
                                        </TableCell>

                                        <TableCell sx={{ color: '#94a3b8' }}>{row.date}</TableCell>

                                        <TableCell>
                                            <Button variant="text" size="small" onClick={() => handleViewApplication(row)} sx={{ textTransform: 'none', fontWeight: 600 }}>
                                                View Application
                                            </Button>
                                        </TableCell>

                                        <TableCell>
                                            <ApplicationActionCell
                                                row={row}
                                                disabled={isActing}
                                                onApprove={() => openConfirmAction(row, 'Approved')}
                                                onReject={() => openRejectDialog(row)}
                                            />
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
                    <CustomPagination totalPages={totalPages} page={safePage} onChange={(_, value) => setPage(value)} />
                </Box>
            </Paper>

            <RejectApplicationDialog
                open={rejectOpen}
                feedback={rejectFeedback}
                onFeedbackChange={setRejectFeedback}
                onCancel={closeRejectDialog}
                onSubmit={submitReject}
                submitting={actingId === rejectRow?.id || actionLoading}
            />

            <ApplicationDetailDialog
                open={applicationOpen}
                loading={applicationDetailLoading}
                detail={applicationDetail}
                onClose={closeApplicationDialog}
            />

            <ActionConfirmDialog
                open={Boolean(confirmAction)}
                title={confirmAction?.status === 'Rejected' ? 'Confirm Rejection' : 'Confirm Approval'}
                description={
                    confirmAction?.status === 'Rejected'
                        ? 'Are you sure you want to reject this application? This will notify the employee with your feedback.'
                        : 'Are you sure you want to approve this application?'
                }
                confirmLabel={confirmAction?.status === 'Rejected' ? 'Reject' : 'Approve'}
                confirmColor={confirmAction?.status === 'Rejected' ? 'error' : 'success'}
                loading={actionLoading}
                onCancel={closeConfirmAction}
                onConfirm={submitConfirmedAction}
            />
        </Layout>
    );
};

export default HiringManagement;
