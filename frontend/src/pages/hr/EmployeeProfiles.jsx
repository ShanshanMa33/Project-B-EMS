import React, { useEffect, useMemo, useState } from 'react';
import { Box, CircularProgress, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
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

const ROWS_PER_PAGE = 6;
const TABLE_HEADERS = ['NAME', 'JOB TITLE', 'SSN', 'WORK AUTH', 'PHONE', 'EMAIL'];
const WORK_AUTH_OPTIONS = ['Citizen', 'H1-B', 'F1(OPT)', 'Green Card'];

function getResultCountLabel(count) {
    if (count === 0) return 'No records found';
    if (count === 1) return '1 record found';
    return `${count} records found`;
}

const EmployeeProfiles = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const {
        profiles: employees,
        profilesLoading: loading,
        profilesMeta,
        profilesStats,
    } = useSelector((state) => state.hr);

    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [page, setPage] = useState(1);

    const trimmedSearch = search.trim();
    const workAuth = filterType === 'All' ? '' : filterType;
    const totalPages = profilesMeta?.totalPages || 0;
    const currentPage = profilesMeta?.page || page;
    const totalRows = profilesMeta?.total || 0;

    useEffect(() => {
        dispatch(
            fetchHRProfiles({
                search: trimmedSearch,
                workAuth,
                page,
                pageSize: ROWS_PER_PAGE,
            })
        );
    }, [dispatch, page, trimmedSearch, workAuth]);

    const onSearchChange = (e) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const handleFilterChange = (e) => {
        setFilterType(e.target.value);
        setPage(1);
    };

    const handlePageChange = (_, value) => {
        setPage(value);
    };

    const resultCountLabel = useMemo(() => getResultCountLabel(totalRows), [totalRows]);

    return (
        <Layout activePage="Employee Profiles">
            <PageHeader title="Employee Profiles" subtitle="HR Portal / Employee Profiles" />

            <Box sx={{ display: 'flex', gap: 3, mb: 4 }}>
                <StatCard
                    title="Total Employees"
                    count={profilesStats.totalEmployees}
                    icon={<PeopleAltIcon fontSize="small" sx={{ color: '#4338ca' }} />}
                />
                <StatCard
                    title="Citizens"
                    count={profilesStats.citizens}
                    icon={<VerifiedUserIcon fontSize="small" sx={{ color: '#059669' }} />}
                />
                <StatCard
                    title="Non-Citizens"
                    count={profilesStats.nonCitizens}
                    icon={<PublicIcon fontSize="small" sx={{ color: '#0ea5e9' }} />}
                />
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
                    justifyContent: 'space-between',
                }}
            >
                <Box
                    sx={{
                        mb: 4,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 2,
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b' }}>
                            {filterType === 'All' ? 'All Employees' : filterType}
                            <span
                                style={{
                                    color: '#1e293b',
                                    fontWeight: 500,
                                    marginLeft: '8px',
                                    fontSize: '0.9em',
                                }}
                            >
                                ({totalRows})
                            </span>
                        </Typography>
                        <Typography sx={{ color: '#64748b', fontSize: '0.875rem' }}>
                            {resultCountLabel}
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, flex: 1, justifyContent: 'flex-end', maxWidth: '600px' }}>
                        <SearchBar placeholder="Search employee..." value={search} onChange={onSearchChange} />
                        <Box sx={{ height: '40px', minWidth: '160px' }}>
                            <TableFilter options={WORK_AUTH_OPTIONS} value={filterType} onChange={handleFilterChange} />
                        </Box>
                    </Box>
                </Box>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                {TABLE_HEADERS.map((head) => (
                                    <TableCell
                                        key={head}
                                        sx={{
                                            color: '#94a3b8',
                                            fontWeight: 700,
                                            fontSize: '0.75rem',
                                            borderBottom: '1px solid #f1f5f9',
                                            pb: 2,
                                        }}
                                    >
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
                            ) : (
                                employees.map((emp) => (
                                    <TableRow
                                        key={emp._id}
                                        hover
                                        sx={{
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            '& td': { borderBottom: '1px solid #f8fafc' },
                                            '&:hover': { bgcolor: '#f8fafc' },
                                        }}
                                        onClick={() => navigate(`/hr/profiles/${emp._id}`)}
                                    >
                                        <TableCell sx={{ fontWeight: 600, color: '#1e293b', py: 2.5 }}>
                                            {emp.name}
                                        </TableCell>
                                        <TableCell sx={{ color: '#64748b' }}>{emp.position || '-'}</TableCell>
                                        <TableCell sx={{ fontFamily: 'monospace', color: '#64748b' }}>
                                            {emp.ssn}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={emp.title} />
                                        </TableCell>
                                        <TableCell sx={{ color: '#64748b' }}>{emp.phone}</TableCell>
                                        <TableCell sx={{ color: '#64748b' }}>{emp.email}</TableCell>
                                    </TableRow>
                                ))
                            )}

                            {!loading && employees.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 5, color: '#64748b' }}>
                                        No employee profiles found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Box sx={{ mt: 'auto', pt: 3 }}>
                    <CustomPagination totalPages={totalPages} page={currentPage} onChange={handlePageChange} />
                </Box>
            </Paper>
        </Layout>
    );
};

export default EmployeeProfiles;
