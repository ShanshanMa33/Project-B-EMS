import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography, Paper, CircularProgress } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import PeopleIcon from '@mui/icons-material/People';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import { fetchHRProfiles, fetchHRVisaRows } from '../../store/hrSlice';
import { getHRVisaDistribution } from '../../api/hrApi';

const VISA_ALERT_DAYS = 100;
const PIE_COLORS = ['#6366f1', '#14b8a6', '#f59e0b', '#ef4444', '#64748b'];

const Dashboard = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const visaRows = useSelector((state) => state.hr.visaRows);
    const employeeCount = useSelector((state) => state.hr.profilesStats.totalEmployees);
    const loadingVisa = useSelector((state) => state.hr.visaLoading);
    const [distribution, setDistribution] = useState([]);
    const [distributionLoading, setDistributionLoading] = useState(false);

    useEffect(() => {
        dispatch(fetchHRVisaRows());
        dispatch(fetchHRProfiles({ page: 1, pageSize: 1 }));
    }, [dispatch]);

    useEffect(() => {
        let mounted = true;
        const run = async () => {
            setDistributionLoading(true);
            try {
                const res = await getHRVisaDistribution();
                const list = Array.isArray(res?.data?.distribution) ? res.data.distribution : [];
                if (mounted) setDistribution(list);
            } catch (_) {
                if (mounted) setDistribution([]);
            } finally {
                if (mounted) setDistributionLoading(false);
            }
        };
        run();
        return () => { mounted = false; };
    }, []);

    const visaDistributionItems = useMemo(
        () => distribution.filter((item) => Number(item?.value || 0) > 0),
        [distribution]
    );
    const visaDistributionTotal = visaDistributionItems.reduce((sum, item) => sum + Number(item.value || 0), 0);
    const pieGradient = useMemo(() => {
        if (visaDistributionTotal <= 0 || visaDistributionItems.length === 0) return '#e2e8f0';
        let cursor = 0;
        const segments = visaDistributionItems.map((item, idx) => {
            const percent = (Number(item.value || 0) / visaDistributionTotal) * 100;
            const start = cursor;
            const end = cursor + percent;
            cursor = end;
            return `${PIE_COLORS[idx % PIE_COLORS.length]} ${start}% ${end}%`;
        });
        return `conic-gradient(${segments.join(', ')})`;
    }, [visaDistributionItems, visaDistributionTotal]);

    const expiringSoonCount = visaRows.filter(
        (row) => typeof row.daysLeft === 'number' && row.daysLeft <= VISA_ALERT_DAYS
    ).length;
    const inProgressCount = visaRows.filter((row) => Boolean(row.inProgress)).length;

    const stats = [
        { title: 'Total Employees', count: employeeCount, icon: <PeopleIcon sx={{ color: '#4338ca' }} /> },
        { title: 'Visa Alerts', count: expiringSoonCount, icon: <ErrorOutlineIcon sx={{ color: '#ef4444' }} /> },
        { title: 'In Progress', count: inProgressCount, icon: <GroupAddIcon sx={{ color: '#22c55e' }} /> },
    ];
    const hrActionItems = visaRows
        .filter((row) => row?.actionType === 'review' || row?.actionType === 'notify_hr')
        .sort((a, b) => {
            const toMillis = (row) => {
                const candidates = [
                    row?.updatedAt,
                    row?.pendingReviewDoc?.uploadedAt,
                    ...(Array.isArray(row?.documents) ? row.documents.flatMap((d) => [d?.uploadedAt, d?.reviewedAt]) : []),
                ];
                const best = candidates
                    .map((v) => new Date(v).getTime())
                    .filter((t) => Number.isFinite(t))
                    .sort((x, y) => y - x)[0];
                return best || 0;
            };
            return toMillis(b) - toMillis(a);
        });
    const latestHrAction = hrActionItems[0] || null;
    const panelSx = {
        p: 4,
        borderRadius: '24px',
        minHeight: 380,
        width: '100%',
        bgcolor: 'white',
        boxShadow: 'none',
        border: '1px solid #f1f5f9',
    };

    return (
        <Layout activePage="Dashboard">
            <PageHeader title="Dashboard" subtitle="Overview" />

            <Box sx={{ pt: 3, pl: 0, pr: 8, pb: 0 }}>
                <Box
                    sx={{
                        mb: 4,
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                        columnGap: '12px',
                    }}
                >
                    {stats.map((stat) => (
                        <Box key={stat.title} sx={{ minWidth: 0 }}>
                            <StatCard 
                                title={stat.title} 
                                count={stat.count} 
                                icon={stat.icon} 
                            />
                        </Box>
                    ))}
                </Box>

                <Box
                    sx={{
                        display: 'grid',
                        gap: 10,
                        alignItems: 'stretch',
                        gridTemplateColumns: { xs: '1fr', lg: latestHrAction ? 'minmax(0, 1fr) minmax(0, 2fr)' : '1fr' },
                    }}
                >
                    <Box sx={{ minWidth: 0 }}>
                        <Paper sx={panelSx}>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Visa Distribution</Typography>
                            <Box sx={{ minHeight: 260, bgcolor: '#f8fafc', borderRadius: '16px', p: 2, overflowY: 'auto' }}>
                                {(loadingVisa || distributionLoading) ? (
                                    <Box sx={{ minHeight: 260, display: 'grid', placeItems: 'center' }}>
                                        <CircularProgress size={28} />
                                    </Box>
                                ) : visaDistributionItems.length === 0 ? (
                                    <Box sx={{ minHeight: 260, display: 'grid', placeItems: 'center', color: '#64748b' }}>
                                        No visa data found
                                    </Box>
                                ) : (
                                    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '220px 1fr' }, alignItems: 'center' }}>
                                        <Box sx={{ display: 'grid', placeItems: 'center' }}>
                                            <Box
                                                sx={{
                                                    width: 180,
                                                    height: 180,
                                                    borderRadius: '50%',
                                                    background: pieGradient,
                                                    position: 'relative',
                                                }}
                                            >
                                                <Box
                                                    sx={{
                                                        position: 'absolute',
                                                        inset: 28,
                                                        borderRadius: '50%',
                                                        bgcolor: '#fff',
                                                        display: 'grid',
                                                        placeItems: 'center',
                                                        color: '#334155',
                                                        fontWeight: 700,
                                                        fontSize: '0.85rem',
                                                    }}
                                                >
                                                    {visaDistributionTotal}
                                                </Box>
                                            </Box>
                                        </Box>
                                        <Box sx={{ display: 'grid', gap: 1 }}>
                                            {visaDistributionItems.map((item, idx) => {
                                                const value = Number(item.value || 0);
                                                const percentage = visaDistributionTotal > 0 ? Math.round((value / visaDistributionTotal) * 100) : 0;
                                                return (
                                                    <Box key={item.label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#334155', fontSize: '0.9rem' }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                                                            <span>{item.label}</span>
                                                        </Box>
                                                        <span>{value} ({percentage}%)</span>
                                                    </Box>
                                                );
                                            })}
                                        </Box>
                                    </Box>
                                )}
                            </Box>
                        </Paper>
                    </Box>

                    {latestHrAction ? (
                        <Box sx={{ minWidth: 0 }}>
                            <Paper sx={panelSx}>
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                                    To Do ({hrActionItems.length})
                                </Typography>
                                <Box
                                    sx={{
                                        p: 1.5,
                                        borderRadius: '12px',
                                        border: '1px solid #e2e8f0',
                                        bgcolor: '#f8fafc',
                                        cursor: 'pointer',
                                    }}
                                    onClick={() => navigate('/hr/visa')}
                                >
                                    <Typography sx={{ fontWeight: 700, color: '#1e293b' }}>
                                        {latestHrAction.name}
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.85rem', color: '#64748b' }}>
                                        {latestHrAction.title || 'Visa Item'} · {latestHrAction.nextStep || 'HR action required'}
                                    </Typography>
                                </Box>
                            </Paper>
                        </Box>
                    ) : null}
                </Box>
            </Box>
        </Layout>
    );
};

export default Dashboard;
