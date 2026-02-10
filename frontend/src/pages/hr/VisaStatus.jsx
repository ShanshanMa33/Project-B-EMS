import React, { useState, useEffect } from 'react';
import { 
  Box, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Typography, Button, IconButton, Chip, Tabs, Tab 
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SendIcon from '@mui/icons-material/Send'; // Action Icon

import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import SearchBar from '../../components/SearchBar';
import TableFilter from '../../components/TableFilter';
import CustomPagination from '../../components/CustomPagination';
import { fetchHRVisaRows, sendHRVisaReminderThunk } from '../../store/hrSlice';

const VisaStatus = () => {
    const dispatch = useDispatch();
    const visaRows = useSelector((state) => state.hr.visaRows);
    const actionLoading = useSelector((state) => state.hr.actionLoading);
    // 1. 状态管理
    const [tabValue, setTabValue] = useState(0); // 0: In Progress, 1: All Status
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [page, setPage] = useState(1);
    const [sendingId, setSendingId] = useState('');
    const rowsPerPage = 5;

    useEffect(() => {
        dispatch(fetchHRVisaRows());
    }, [dispatch]);

    const inProgressList = visaRows.filter((row) => row.daysLeft !== null && row.daysLeft >= 0 && row.daysLeft <= 180);
    const allVisaList = visaRows;

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
        setPage(1);
        setSearch('');
    };

    // --- 筛选逻辑 ---
    const currentList = tabValue === 0 ? inProgressList : allVisaList;

    const filteredData = currentList.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
        const matchesType = filterType === 'All' || item.title === filterType;
        return matchesSearch && matchesType;
    });

    // --- 分页逻辑 ---
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const paginatedData = filteredData.slice((page - 1) * rowsPerPage, (page - 1) * rowsPerPage + rowsPerPage);

    const handleSendReminder = async (row) => {
        if (!row?.email || sendingId || actionLoading) {
            if (!row?.email) alert('No email found for this employee');
            return;
        }
        setSendingId(row.id);
        try {
            await dispatch(sendHRVisaReminderThunk({
                email: row.email,
                name: row.name,
                nextStep: row.nextStep,
            })).unwrap();
            alert(`Reminder sent to ${row.email}`);
        } catch (err) {
            console.error('Send reminder failed:', err);
            alert('Failed to send reminder');
        } finally {
            setSendingId('');
        }
    };

    return (
        <Layout activePage="Visa Status">
            <PageHeader title="Visa Status Management" subtitle="HR Portal / Visa Status" />

            <Box sx={{ display: 'flex', gap: 3, mb: 4 }}>
                <StatCard title="All Records" count={allVisaList.length} icon={<BusinessCenterIcon fontSize="small" sx={{ color: '#059669' }}/>} />
                <StatCard title="In Progress" count={inProgressList.length} icon={<AssignmentIcon fontSize="small" sx={{ color: '#4338ca' }}/>} />
                <StatCard title="Expiring Soon" count={visaRows.filter((r) => r.daysLeft !== null && r.daysLeft >= 0 && r.daysLeft <= 100).length} icon={<AccessTimeIcon fontSize="small" sx={{ color: '#d97706' }}/>} />
                
            </Box>

            <Paper 
                elevation={0}
                sx={{ 
                    bgcolor: 'white', borderRadius: '24px', p: 4, minHeight: '60vh', 
                    boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                    display: 'flex', flexDirection: 'column'
                }}
            >
                {/* 1. Header Area: Tabs + Search + Filter */}
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
                                    options={['H1-B', 'F1(OPT)', 'F1(STEM)', 'Citizen']}
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                />
                            </Box>
                        </Box>
                    </Box>
                </Box>

                {/* 2. Table Area: */}
                <TableContainer sx={{ flex: 1 }}>
                    <Table>
                        <TableHead>
                            <TableRow>
        
                                <TableCell sx={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>EMPLOYEE</TableCell>
                                <TableCell sx={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>WORK AUTH</TableCell>

                                {tabValue === 0 && (
                                    <>
                                        <TableCell sx={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>NEXT STEP</TableCell>
                                        <TableCell sx={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>ACTION</TableCell>
                                    </>
                                )}

                                {tabValue === 1 && (
                                    <>
                                        <TableCell sx={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>START DATE</TableCell>
                                        <TableCell sx={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>END DATE</TableCell>
                                        <TableCell sx={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>DAYS LEFT</TableCell>
                                    </>
                                )}
                                
                                <TableCell sx={{ borderBottom: '1px solid #f1f5f9' }}></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedData.map((row) => (
                                <TableRow key={row.id} hover sx={{ '& td': { borderBottom: '1px solid #f8fafc' }, cursor: 'pointer' }}>
 
                                    <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>{row.name}</TableCell>
                                    <TableCell>
                                        <Chip label={row.title} size="small" sx={{ bgcolor: '#eff6ff', color: '#3b82f6', fontWeight: 600, borderRadius: '6px' }} />
                                    </TableCell>

                                    {tabValue === 0 && (
                                        <>
                                            <TableCell sx={{ color: '#64748b', fontWeight: 500 }}>
                                                {row.nextStep}
                                            </TableCell>
                                            <TableCell>
                                                {/* Action Button */}
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
                                                        '&:hover': { borderColor: '#3b82f6', color: '#3b82f6', bgcolor: '#eff6ff' }
                                                    }}
                                                >
                                                    {row.action}
                                                </Button>
                                            </TableCell>
                                        </>
                                    )}

                                    {tabValue === 1 && (
                                        <>
                                            <TableCell sx={{ color: '#64748b' }}>{row.startDate}</TableCell>
                                            <TableCell sx={{ color: '#64748b' }}>{row.endDate}</TableCell>
                                            <TableCell>
                                                {row.daysLeft > 9000 ? (
                                                    <span style={{color:'#64748b'}}>-</span>
                                                ) : (
                                                    <Box sx={{ 
                                                        display: 'inline-flex', alignItems: 'center', px: 1.5, py: 0.5, borderRadius: '20px',
                                                        bgcolor: row.daysLeft <= 0 ? '#fef2f2' : row.daysLeft <= 100 ? '#fff7ed' : '#f0fdf4',
                                                        color: row.daysLeft <= 0 ? '#dc2626' : row.daysLeft <= 100 ? '#ea580c' : '#16a34a',
                                                        fontWeight: 700, fontSize: '0.875rem'
                                                    }}>
                                                        {row.daysLeft <= 0 ? 'EXPIRED' : `${row.daysLeft} Days`}
                                                    </Box>
                                                )}
                                            </TableCell>
                                        </>
                                    )}

                                    <TableCell>
                                        <IconButton size="small"><MoreVertIcon sx={{ color: '#94a3b8' }} /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Box sx={{ pt: 3, display: 'flex', justifyContent: 'center' }}>
                    <CustomPagination totalPages={totalPages} page={page} onChange={(e, v) => setPage(v)} />
                </Box>

            </Paper>
        </Layout>
    );
};

export default VisaStatus;
             
