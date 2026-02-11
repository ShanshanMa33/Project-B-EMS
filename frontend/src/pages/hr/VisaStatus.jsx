import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, Chip, Paper, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, Typography } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SendIcon from '@mui/icons-material/Send';

import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import SearchBar from '../../components/SearchBar';
import TableFilter from '../../components/TableFilter';
import CustomPagination from '../../components/CustomPagination';
import StatusBadge from '../../components/StatusBadge';
import { getHRVisaDocumentDownloadUrl, getHRVisaDocumentPreviewUrl } from '../../api/hr';
import { fetchHRVisaRows, reviewHRVisaDocumentThunk, sendHRVisaReminderThunk } from '../../store/hrSlice';

const ROWS_PER_PAGE = 5;
const EXPIRING_SOON_DAYS = 100;
const WORK_AUTH_OPTIONS = ['H1-B', 'F1(OPT)', 'F1(STEM)', 'Citizen'];

const headerCellSx = {
    color: '#94a3b8',
    fontWeight: 700,
    fontSize: '0.75rem',
    borderBottom: '1px solid #f1f5f9',
};

function renderDaysLeft(daysLeft) {
    if (typeof daysLeft !== 'number' || daysLeft > 9000) {
        return <span style={{ color: '#64748b' }}>-</span>;
    }

    const isExpired = daysLeft <= 0;
    const isWarning = daysLeft > 0 && daysLeft <= EXPIRING_SOON_DAYS;

    return (
        <Box
            sx={{
                display: 'inline-flex',
                alignItems: 'center',
                px: 1.5,
                py: 0.5,
                borderRadius: '20px',
                bgcolor: isExpired ? '#fef2f2' : isWarning ? '#fff7ed' : '#f0fdf4',
                color: isExpired ? '#dc2626' : isWarning ? '#ea580c' : '#16a34a',
                fontWeight: 700,
                fontSize: '0.875rem',
            }}
        >
            {isExpired ? 'EXPIRED' : `${daysLeft} Days`}
        </Box>
    );
}

const VisaStatus = () => {
    const dispatch = useDispatch();
    const visaRows = useSelector((state) => state.hr.visaRows);
    const actionLoading = useSelector((state) => state.hr.actionLoading);

    const [tabValue, setTabValue] = useState(0);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [page, setPage] = useState(1);
    const [sendingId, setSendingId] = useState('');

    useEffect(() => {
        dispatch(fetchHRVisaRows());
    }, [dispatch]);

    const inProgressList = useMemo(() => visaRows.filter((row) => row.inProgress), [visaRows]);
    const expiringSoonCount = useMemo(
        () => visaRows.filter((row) => typeof row.daysLeft === 'number' && row.daysLeft >= 0 && row.daysLeft <= EXPIRING_SOON_DAYS).length,
        [visaRows]
    );

    const currentList = tabValue === 0 ? inProgressList : visaRows;

    const filteredData = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        return currentList.filter((item) => {
            const matchesSearch =
                keyword.length === 0 ||
                [item.firstName, item.lastName, item.preferredName, item.name]
                    .filter(Boolean)
                    .some((value) => String(value).toLowerCase().includes(keyword));

            const matchesType = filterType === 'All' || item.title === filterType;
            return matchesSearch && matchesType;
        });
    }, [currentList, search, filterType]);

    const totalPages = Math.ceil(filteredData.length / ROWS_PER_PAGE);
    const safePage = totalPages === 0 ? 1 : Math.min(page, totalPages);
    const paginatedData = useMemo(() => {
        const start = (safePage - 1) * ROWS_PER_PAGE;
        return filteredData.slice(start, start + ROWS_PER_PAGE);
    }, [filteredData, safePage]);

    const handleTabChange = (_, newValue) => {
        setTabValue(newValue);
        setPage(1);
        setSearch('');
    };

    const openExternal = (url) => window.open(url, '_blank', 'noopener,noreferrer');

    const handleSendReminder = async (row) => {
        if (!row?.email || sendingId || actionLoading) {
            if (!row?.email) alert('No email found for this employee');
            return;
        }

        setSendingId(row.id);
        try {
            await dispatch(
                sendHRVisaReminderThunk({
                    email: row.email,
                    name: row.name,
                    nextStep: row.nextStep,
                })
            ).unwrap();
            alert(`Reminder sent to ${row.email}`);
        } catch (error) {
            console.error('Send reminder failed:', error);
            alert('Failed to send reminder');
        } finally {
            setSendingId('');
        }
    };

    const handleReviewDoc = async (row, status) => {
        const doc = row.pendingReviewDoc;
        if (!doc || sendingId || actionLoading) return;

        const feedback = status === 'rejected' ? window.prompt('Please enter feedback for rejection:', '') || '' : '';
        if (status === 'rejected' && !feedback.trim()) return;

        setSendingId(row.id);
        try {
            await dispatch(
                reviewHRVisaDocumentThunk({
                    userId: row.id,
                    docId: doc.docId,
                    status,
                    feedback: feedback.trim(),
                })
            ).unwrap();
            await dispatch(fetchHRVisaRows()).unwrap();
        } catch (error) {
            console.error('Review visa document failed:', error);
            alert('Failed to review document');
        } finally {
            setSendingId('');
        }
    };

    return (
        <Layout activePage="Visa Status">
            <PageHeader title="Visa Status Management" subtitle="HR Portal / Visa Status" />

            <Box sx={{ display: 'flex', gap: 3, mb: 4 }}>
                <StatCard title="All Records" count={visaRows.length} icon={<BusinessCenterIcon fontSize="small" sx={{ color: '#059669' }} />} />
                <StatCard title="In Progress" count={inProgressList.length} icon={<AssignmentIcon fontSize="small" sx={{ color: '#4338ca' }} />} />
                <StatCard title="Expiring Soon" count={expiringSoonCount} icon={<AccessTimeIcon fontSize="small" sx={{ color: '#d97706' }} />} />
            </Box>

            <Paper
                elevation={0}
                sx={{
                    bgcolor: 'white',
                    borderRadius: '24px',
                    p: 4,
                    minHeight: '60vh',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <Box sx={{ mb: 3 }}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                        <Tabs value={tabValue} onChange={handleTabChange} aria-label="visa tabs">
                            <Tab label="In Progress" sx={{ fontWeight: 600, textTransform: 'none', fontSize: '1rem' }} />
                            <Tab label="All Visa Status" sx={{ fontWeight: 600, textTransform: 'none', fontSize: '1rem' }} />
                        </Tabs>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b' }}>
                            {tabValue === 0 ? 'Onboarding & Applications' : 'All Employee Visa Records'}
                            <span style={{ color: '#94a3b8', fontWeight: 500, marginLeft: '8px', fontSize: '0.9em' }}>
                                ({filteredData.length})
                            </span>
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 2, flex: 1, justifyContent: 'flex-end', maxWidth: '600px' }}>
                            <SearchBar value={search} onChange={(e) => setSearch(e.target.value)} />
                            <Box sx={{ height: '40px', minWidth: '160px' }}>
                                <TableFilter
                                    options={WORK_AUTH_OPTIONS}
                                    value={filterType}
                                    onChange={(e) => {
                                        setFilterType(e.target.value);
                                        setPage(1);
                                    }}
                                />
                            </Box>
                        </Box>
                    </Box>
                </Box>

                <TableContainer sx={{ flex: 1 }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={headerCellSx}>EMPLOYEE</TableCell>
                                <TableCell sx={headerCellSx}>WORK AUTH</TableCell>
                                <TableCell sx={headerCellSx}>START DATE</TableCell>
                                <TableCell sx={headerCellSx}>END DATE</TableCell>
                                <TableCell sx={headerCellSx}>DAYS LEFT</TableCell>
                                <TableCell sx={headerCellSx}>{tabValue === 0 ? 'NEXT STEP' : 'DOCUMENT'}</TableCell>
                                {tabValue === 0 && <TableCell sx={headerCellSx}>ACTION</TableCell>}
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {paginatedData.map((row) => (
                                <TableRow key={row.id} hover sx={{ '& td': { borderBottom: '1px solid #f8fafc' }, cursor: 'pointer' }}>
                                    <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>{row.name}</TableCell>
                                    <TableCell>
                                        <StatusBadge status={row.title} />
                                    </TableCell>
                                    <TableCell sx={{ color: '#64748b' }}>{row.startDate}</TableCell>
                                    <TableCell sx={{ color: '#64748b' }}>{row.endDate}</TableCell>
                                    <TableCell>{renderDaysLeft(row.daysLeft)}</TableCell>

                                    {tabValue === 0 ? (
                                        <>
                                            <TableCell sx={{ color: '#64748b', fontWeight: 500 }}>{row.nextStep}</TableCell>
                                            <TableCell>
                                                {row.actionType === 'review' && row.pendingReviewDoc ? (
                                                    <Box sx={{ display: 'grid', gap: 0.8 }}>
                                                        <Typography sx={{ color: '#334155', fontSize: '0.8rem' }}>{row.pendingReviewDoc.label}</Typography>
                                                        <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
                                                            <Button
                                                                size="small"
                                                                variant="outlined"
                                                                onClick={() => openExternal(getHRVisaDocumentPreviewUrl(row.id, row.pendingReviewDoc.docId))}
                                                            >
                                                                Preview
                                                            </Button>
                                                            <Button
                                                                size="small"
                                                                variant="contained"
                                                                color="success"
                                                                disabled={sendingId === row.id || actionLoading}
                                                                onClick={() => handleReviewDoc(row, 'approved')}
                                                            >
                                                                Approve
                                                            </Button>
                                                            <Button
                                                                size="small"
                                                                variant="contained"
                                                                color="error"
                                                                disabled={sendingId === row.id || actionLoading}
                                                                onClick={() => handleReviewDoc(row, 'rejected')}
                                                            >
                                                                Reject
                                                            </Button>
                                                        </Box>
                                                    </Box>
                                                ) : (
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        startIcon={<SendIcon />}
                                                        disabled={sendingId === row.id || actionLoading}
                                                        onClick={() => handleSendReminder(row)}
                                                        sx={{
                                                            textTransform: 'none',
                                                            borderRadius: '8px',
                                                            borderColor: '#e2e8f0',
                                                            color: '#475569',
                                                            '&:hover': { borderColor: '#3b82f6', color: '#3b82f6', bgcolor: '#eff6ff' },
                                                        }}
                                                    >
                                                        Send Notification
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </>
                                    ) : (
                                        <TableCell sx={{ color: '#64748b', maxWidth: 320 }}>
                                            {row.approvedDocuments?.length ? (
                                                <Box sx={{ display: 'grid', gap: 0.8 }}>
                                                    {row.approvedDocuments.map((doc) => {
                                                        const previewUrl = getHRVisaDocumentPreviewUrl(row.id, doc.docId);
                                                        const downloadUrl = getHRVisaDocumentDownloadUrl(row.id, doc.docId);
                                                        return (
                                                            <Box key={`${row.id}-${doc.docId}`} sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'wrap' }}>
                                                                <Chip size="small" label={doc.label} sx={{ bgcolor: '#ecfeff', color: '#0e7490', fontWeight: 700 }} />
                                                                <Button size="small" variant="outlined" onClick={() => openExternal(previewUrl)}>
                                                                    Preview
                                                                </Button>
                                                                <Button size="small" variant="contained" onClick={() => openExternal(downloadUrl)}>
                                                                    Download
                                                                </Button>
                                                            </Box>
                                                        );
                                                    })}
                                                </Box>
                                            ) : (
                                                '-'
                                            )}
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}

                            {paginatedData.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={tabValue === 0 ? 7 : 6} align="center" sx={{ py: 5, color: '#64748b' }}>
                                        No records found
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
        </Layout>
    );
};

export default VisaStatus;
