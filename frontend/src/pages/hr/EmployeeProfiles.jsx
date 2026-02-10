import React, { useState, useEffect } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import PublicIcon from '@mui/icons-material/Public';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import StatCard from '../../components/StatCard';
import TableFilter from '../../components/TableFilter';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader'; 
import StatusBadge from '../../components/StatusBadge';
import SearchBar from '../../components/SearchBar';
import CustomPagination from '../../components/CustomPagination';
import { fetchHRProfiles } from '../../store/hrSlice';


const EmployeeProfiles = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const employees = useSelector((state) => state.hr.profiles);
    const loading = useSelector((state) => state.hr.profilesLoading);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [page, setPage] = useState(1);

    const rowsPerPage = 6;

    useEffect(() => {
        dispatch(fetchHRProfiles(search));
    }, [dispatch, search]);

    const onSearchChange = (e) => {
        const value = e.target.value;
        setSearch(value);
        setPage(1);
    };

    const displayedEmployees = employees.filter((emp) => {
        if (filterType === 'All') return true;
        const authTitle = emp.title || '';
        return authTitle.includes(filterType);
    });

    const totalCount = employees.length;
    const citizenCount = employees.filter((e) => e.title === 'Citizen').length;
    const nonCitizenCount = totalCount - citizenCount;

    const totalPages = Math.ceil(displayedEmployees.length / rowsPerPage);
    const startIndex = (page - 1) * rowsPerPage;
    const paginatedEmployees = displayedEmployees.slice(startIndex, startIndex + rowsPerPage);
    const resultCountLabel =
        displayedEmployees.length === 0
            ? 'No records found'
            : displayedEmployees.length === 1
                ? '1 record found'
                : `${displayedEmployees.length} records found`;

    const handlePageChange = (_, value) => {
        setPage(value);
    };


    return (
        <Layout activePage="Employee Profiles">
            <PageHeader title="Employee Profiles" subtitle="HR Portal / Employee Profiles" />

            <Box sx={{ display: 'flex', gap: 3, mb: 4 }}>
                <StatCard 
                    title="Total Employees" 
                    count={totalCount} 
                    icon={<PeopleAltIcon fontSize="small" sx={{ color: '#4338ca' }}/>} 
                />
                <StatCard 
                    title="Citizens" 
                    count={citizenCount} 
                    icon={<VerifiedUserIcon fontSize="small" sx={{ color: '#059669' }}/>} 
                />
                <StatCard 
                    title="Non-Citizens" 
                    count={nonCitizenCount} 
                    icon={<PublicIcon fontSize="small" sx={{ color: '#0ea5e9' }}/>} 
                />
            </Box>

            <Paper elevation={0} sx={{ bgcolor: 'white', borderRadius: '24px', p: 4, 
                                minHeight: '60vh', boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                                display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      
                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b' }}>
                        {filterType === 'All' ? 'All Employees' : filterType}
                        <span style={{ color: '#1e293b', fontWeight: 500, marginLeft: '8px', fontSize: '0.9em' }}>
                            ({displayedEmployees.length})
                        </span>
                    </Typography>
                    <Typography sx={{ color: '#64748b', fontSize: '0.875rem' }}>
                        {resultCountLabel}
                    </Typography>
         
                </Box>

                <Box sx={{ display: 'flex', gap: 2, flex: 1, justifyContent: 'flex-end', maxWidth: '600px' }}>
    
                <SearchBar 
                    placeholder="Search employee..."
                    value={search}
                    onChange={onSearchChange}
                />

                 <Box sx={{ height: '40px', minWidth: '160px' }}> 
                <TableFilter 
                    label="Work Auth"
                    options={['Citizen', 'H1-B', 'F1(OPT)', 'Green Card']}
                    value={filterType}
                    onChange={(e) => {
                        setFilterType(e.target.value);
                        setPage(1);
                    }}
                />
                </Box>
                </Box>              
                </Box>

                {/* Table */}
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                {['NAME', 'SSN', 'WORK AUTH', 'PHONE', 'EMAIL'].map((head) => (
                                    <TableCell key={head} sx={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.75rem', borderBottom: '1px solid #f1f5f9', pb: 2 }}>
                                        {head}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 5 }}><CircularProgress /></TableCell></TableRow>
                            ) : paginatedEmployees.map((emp) => (
                                <TableRow key={emp._id} hover sx={{ 
                                    cursor: 'pointer', transition: 'all 0.2s',
                                    '& td': { borderBottom: '1px solid #f8fafc' },
                                    '&:hover': { bgcolor: '#f8fafc' }
                                }}
                                onClick={() => navigate(`/hr/profiles/${emp._id}`)}
                                >
                                    <TableCell sx={{ fontWeight: 600, color: '#1e293b', py: 2.5 }}>
                                        {emp.name}
                                    </TableCell>
                                    <TableCell sx={{ fontFamily: 'monospace', color: '#64748b' }}>
                                        {emp.ssn}
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge status={emp.title} />
                                    </TableCell>
                                    <TableCell sx={{ color: '#64748b' }}>{emp.phone}</TableCell>
                                    <TableCell sx={{ color: '#64748b' }}>{emp.email}</TableCell>
                                </TableRow>
                            ))}
                            {!loading && paginatedEmployees.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 5, color: '#64748b' }}>
                                        No employee profiles found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <Box sx={{ mt: 'auto', pt: 3 }}>
                <CustomPagination 
                totalPages={totalPages} 
                page={page} 
                onChange={handlePageChange} 
                />
                </Box>
            </Paper>
        </Layout>
    );
};

export default EmployeeProfiles;
