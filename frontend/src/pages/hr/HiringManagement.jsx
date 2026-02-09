import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Typography, Button, IconButton, Chip, Tabs, Tab
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import VisibilityIcon from '@mui/icons-material/Visibility';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import SearchBar from '../../components/SearchBar';
import CustomPagination from '../../components/CustomPagination';
import InviteEmployeeCard from '../../components/InviteEmployeeCard';

const HiringManagement = () => {

    const [applications, setApplications] = useState([]);
    const [search, setSearch] = useState('');
    const [tabValue, setTabValue] = useState('Pending'); 
    const [page, setPage] = useState(1);
    const rowsPerPage = 5;

    // --- Mock Data ---
    const mockApplications = [
        { id: 1, name: 'Klee Spark', email: 'klee@mondstadt.com', position: 'Frontend Intern', status: 'Pending', date: '2026-02-08' },
        { id: 2, name: 'Diluc Ragnvindr', email: 'diluc@winery.com', position: 'Security Lead', status: 'Approved', date: '2026-02-05' },
        { id: 3, name: 'Jean Gunnhildr', email: 'jean@knights.com', position: 'HR Manager', status: 'Approved', date: '2026-02-01' },
        { id: 4, name: 'Albedo', email: 'albedo@alchemy.com', position: 'Data Scientist', status: 'Pending', date: '2026-02-07' },
        { id: 5, name: 'Bennett', email: 'bennett@adventure.com', position: 'QA Engineer', status: 'Rejected', date: '2026-01-20' },
        { id: 6, name: 'Sucrose', email: 'sucrose@lab.com', position: 'Research Assistant', status: 'Pending', date: '2026-02-09' },
        { id: 7, name: 'Kaeya Alberich', email: 'kaeya@knights.com', position: 'Sales Director', status: 'Approved', date: '2026-02-04' },
        { id: 8, name: 'Lisa Minci', email: 'lisa@library.com', position: 'Librarian', status: 'Rejected', date: '2026-01-15' },
    ];

    useEffect(() => {
        setApplications(mockApplications);
    }, []);

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
                                {['CANDIDATE', 'POSITION', 'STATUS', 'DATE', 'RESUME', 'ACTION'].map((head) => (
                                    <TableCell key={head} sx={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.75rem', borderBottom: '1px solid #f1f5f9', pb: 2 }}>
                                        {head}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedApps.map((row) => {
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

                                        {/* Resume Icon */}
                                        <TableCell>
                                            <IconButton size="small" sx={{ color: '#64748b', '&:hover': { color: '#4338ca', bgcolor: '#e0e7ff' } }}>
                                                <DescriptionIcon fontSize="small" />
                                            </IconButton>
                                        </TableCell>

                                        {/* Action Button */}
                                        <TableCell>
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
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
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
        </Layout>
    );
};

export default HiringManagement;