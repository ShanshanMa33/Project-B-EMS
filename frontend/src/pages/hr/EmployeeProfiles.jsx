import React, { useState, useEffect } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress} from '@mui/material';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import PublicIcon from '@mui/icons-material/Public';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import StatCard from '../../components/StatCard';
import TableFilter from '../../components/TableFilter';
import axios from 'axios';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader'; 
import StatusBadge from '../../components/StatusBadge';
import SearchBar from '../../components/SearchBar';
import CustomPagination from '../../components/CustomPagination';


const EmployeeProfiles = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [page, setPage] = useState(1);

    const rowsPerPage = 6;


    // --- 假数据 (Mock Data) ---
    const mockEmployees = [
        { _id: '1', name: 'Zhongli', ssn: '123-45-6789', title: 'Citizen', phone: '555-0101', email: 'zhongli@liyue.com' },
        { _id: '2', name: 'Raiden Shogun', ssn: '987-65-4321', title: 'H1-B', phone: '555-0202', email: 'raiden@inazuma.com' },
        { _id: '3', name: 'Nahida', ssn: '111-22-3333', title: 'F1(OPT)', phone: '555-0303', email: 'nahida@sumeru.com' },
        { _id: '4', name: 'Venti', ssn: '444-55-6666', title: 'Citizen', phone: '555-0404', email: 'venti@mondstadt.com' },
        { _id: '5', name: 'Furina', ssn: '777-88-9999', title: 'H1-B', phone: '555-0505', email: 'furina@fontaine.com' },
        { _id: '6', name: 'Neuvillette', ssn: '123-12-1234', title: 'H1-B', phone: '555-0606', email: 'neuvi@court.com' },
        { _id: '7', name: 'Navia', ssn: '321-32-4321', title: 'Citizen', phone: '555-0707', email: 'navia@spina.com' },
        { _id: '8', name: 'Ayaka Kamisato', ssn: '555-66-7777', title: 'Citizen', phone: '555-0808', email: 'ayaka@yashiro.com' },
        { _id: '9', name: 'Kazuha Kaedehara', ssn: '888-99-0000', title: 'F1(OPT)', phone: '555-0909', email: 'kazuha@crux.com' },
        { _id: '10', name: 'Hu Tao', ssn: '101-01-0101', title: 'Citizen', phone: '555-1010', email: 'hutao@wangsheng.com' },
        { _id: '11', name: 'Xiao', ssn: '202-02-0202', title: 'H1-B', phone: '555-1111', email: 'xiao@adepti.com' },
        { _id: '12', name: 'Ganyu', ssn: '303-03-0303', title: 'Green Card', phone: '555-1212', email: 'ganyu@qixing.com' },
        { _id: '13', name: 'Keqing', ssn: '404-04-0404', title: 'Citizen', phone: '555-1313', email: 'keqing@qixing.com' },
        { _id: '14', name: 'Tartaglia', ssn: '505-05-0505', title: 'H1-B', phone: '555-1414', email: 'childe@fatui.com' },
        { _id: '15', name: 'Yae Miko', ssn: '606-06-0606', title: 'F1(OPT)', phone: '555-1515', email: 'yae@publish.com' },
        { _id: '16', name: 'Arlecchino', ssn: '707-07-0707', title: 'Green Card', phone: '555-1616', email: 'father@hearth.com' },
    ];
    // --- Data Fetching Logic ---
    // const fetchEmployees = async (query = '') => {
    //     try {
    //         const token = localStorage.getItem('token'); 
    //         const response = await axios.get(`http://localhost:8000/api/hr/profiles?search=${query}`, {
    //             headers: { Authorization: `Bearer ${token}` }
    //         });
    //         setEmployees(response.data);
    //     } catch (error) {
    //         console.error("Fetch error:", error);
    //     }
    // };

    const fetchEmployees = async (searchTerm = '') => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:3000/api/employees`, {
                params: { search: searchTerm },
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = response.data.employees || response.data || [];
            if(Array.isArray(data) && data.length > 0) {
                setEmployees(data);
            } else {
                throw new Error("Empty data"); 
            }
        } catch (err) {
            console.log("👉 进入演示模式：使用假数据");
            const filtered = mockEmployees.filter(e => 
                e.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setEmployees(filtered);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, [search]);

    useEffect(() => {
        setPage(1);
    }, [search, filterType]);

    const onSearchChange = (e) => {
        const value = e.target.value;
        setSearch(value);
        fetchEmployees(value); 
    };

    const displayedEmployees = employees.filter(emp => {
        if (filterType === 'All') return true;
        const authTitle = emp.title || emp.workAuthorization?.title || '';
        return authTitle.includes(filterType);
    });

    const totalCount = employees.length;
    const citizenCount = employees.filter(e => (e.title || e.workAuthorization?.title) === 'Citizen').length;
    const nonCitizenCount = totalCount - citizenCount;

    const totalPages = Math.ceil(displayedEmployees.length / rowsPerPage);
    const startIndex = (page - 1) * rowsPerPage;
    const paginatedEmployees = displayedEmployees.slice(startIndex, startIndex + rowsPerPage);

    const handlePageChange = (event, value) => {
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
                    onChange={(e) => setFilterType(e.target.value)}
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
                                }}>
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