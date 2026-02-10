import React, { useEffect } from 'react';
import { Box, Typography, Paper, CircularProgress } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import PeopleIcon from '@mui/icons-material/People';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import { fetchHRVisaRows } from '../../store/hrSlice';

const Dashboard = () => {
    const dispatch = useDispatch();
    const visaRows = useSelector((state) => state.hr.visaRows);
    const loadingVisa = useSelector((state) => state.hr.visaLoading);

    useEffect(() => {
        dispatch(fetchHRVisaRows());
    }, [dispatch]);

    const countMap = visaRows.reduce((acc, row) => {
        const key = row.title || 'N/A';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});
    const visaDistributionItems = Object.entries(countMap)
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count);
    const visaDistributionTotal = visaDistributionItems.reduce((sum, item) => sum + item.count, 0);

    const expiringSoonCount = visaRows.filter(
        (row) => typeof row.daysLeft === 'number' && row.daysLeft >= 0 && row.daysLeft <= 100
    ).length;
    const inProgressCount = visaRows.filter(
        (row) => typeof row.daysLeft === 'number' && row.daysLeft >= 0 && row.daysLeft <= 180
    ).length;

    const stats = [
        { title: 'Total Employees', count: visaRows.length, icon: <PeopleIcon sx={{ color: '#4338ca' }} /> },
        { title: 'Visa Alerts', count: expiringSoonCount, icon: <ErrorOutlineIcon sx={{ color: '#ef4444' }} /> },
        { title: 'In Progress', count: inProgressCount, icon: <GroupAddIcon sx={{ color: '#22c55e' }} /> },
        { title: 'Visa Types', count: visaDistributionItems.length, icon: <PendingActionsIcon sx={{ color: '#f59e0b' }} /> },
    ];

    return (
        <Layout activePage="Dashboard">
            <PageHeader title="Dashboard" subtitle="Overview" />

            <Box sx={{ pt: 3, pl: 0, pr: 8, pb: 0 }}>
                <Box
                    sx={{
                        mb: 4,
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 2,
                    }}
                >
                    {stats.map((stat) => (
                        <Box key={stat.title} sx={{ flex: '0 0 auto' }}>
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
                        gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) minmax(0, 2fr)' },
                    }}
                >
                    <Box sx={{ minWidth: 0 }}>
                        <Paper sx={{ p: 4, borderRadius: '24px', height: 400, width: '100%', bgcolor: 'white', boxShadow: 'none', border: '1px solid #f1f5f9' }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Visa Distribution</Typography>
                            <Box sx={{ height: 300, bgcolor: '#f8fafc', borderRadius: '16px', p: 2, overflowY: 'auto' }}>
                                {loadingVisa ? (
                                    <Box sx={{ height: '100%', display: 'grid', placeItems: 'center' }}>
                                        <CircularProgress size={28} />
                                    </Box>
                                ) : visaDistributionItems.length === 0 ? (
                                    <Box sx={{ height: '100%', display: 'grid', placeItems: 'center', color: '#64748b' }}>
                                        No visa data found
                                    </Box>
                                ) : (
                                    <Box sx={{ display: 'grid', gap: 1.2 }}>
                                        {visaDistributionItems.map((item) => {
                                            const percentage = visaDistributionTotal > 0 ? Math.round((item.count / visaDistributionTotal) * 100) : 0;
                                            return (
                                                <Box key={item.label} sx={{ display: 'grid', gap: 0.5 }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#334155', fontSize: '0.9rem' }}>
                                                        <span>{item.label}</span>
                                                        <span>{item.count} ({percentage}%)</span>
                                                    </Box>
                                                    <Box sx={{ width: '100%', height: 10, bgcolor: '#e2e8f0', borderRadius: 999 }}>
                                                        <Box
                                                            sx={{
                                                                height: '100%',
                                                                width: `${percentage}%`,
                                                                borderRadius: 999,
                                                                bgcolor: '#6366f1',
                                                            }}
                                                        />
                                                    </Box>
                                                </Box>
                                            );
                                        })}
                                    </Box>
                                )}
                            </Box>
                        </Paper>
                    </Box>

                    <Box sx={{ minWidth: 0 }}>
                        <Paper sx={{ p: 4, borderRadius: '24px', height: 400, width: '100%', bgcolor: 'white', boxShadow: 'none', border: '1px solid #f1f5f9' }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Recent Activity</Typography>
                            <Typography color="text.secondary">No new updates.</Typography>
                        </Paper>
                    </Box>
                </Box>
            </Box>
        </Layout>
    );
};

export default Dashboard;
