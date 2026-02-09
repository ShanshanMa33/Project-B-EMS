import React, { useState, useEffect } from 'react';
import { 
  Box, Paper, Typography, List, ListItem, ListItemButton, 
  ListItemText, TextField, InputAdornment, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Chip, Link 
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import axios from 'axios';
import Layout from '../../components/Layout';

const EmployeeProfiles = () => {
    const [employees, setEmployees] = useState([]);
    const [search, setSearch] = useState('');

    // --- Data Fetching Logic ---
    const fetchEmployees = async (query = '') => {
        try {
            const token = localStorage.getItem('token'); 
            const response = await axios.get(`http://localhost:3000/api/hr/profiles?search=${query}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEmployees(response.data);
        } catch (error) {
            console.error("Fetch error:", error);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    const onSearchChange = (e) => {
        const value = e.target.value;
        setSearch(value);
        fetchEmployees(value); 
    };

    return (
        <Box>
            {/* 1. Sidebar */}
            <Layout activePage="Profiles">
            {/* 2. Main Content - 右侧主体 */}
            <Box sx={{ flexGrow: 1, p: 6, zIndex: 1, position: 'relative'}}>
                
                {/* 顶部标题栏 */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 5 }}>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b' }}>
                            Employee Profiles
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#94a3b8', mt: 1 }}>
                            HR Portal / Employee Profiles
                        </Typography>
                    </Box>
                    {/* 右上角 HR 标识圆圈 */}
                    <Box sx={{ 
                        width: 45, height: 45, bgcolor: '#c7d2fe', borderRadius: '50%', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#6366f1', fontWeight: 'bold', fontSize: '0.8rem'
                    }}>
                        HR
                    </Box>
                </Box>

                {/* 搜索栏 */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                    <TextField 
                        fullWidth 
                        placeholder="Search by name..."
                        value={search}
                        onChange={onSearchChange}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: '#94a3b8' }} />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ 
                            bgcolor: 'white', 
                            borderRadius: '15px',
                            '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                            boxShadow: '0px 2px 10px rgba(0,0,0,0.03)'
                        }}
                    />
                    <Typography sx={{ whiteSpace: 'nowrap', color: '#64748b', fontSize: '0.9rem' }}>
                        Total Employees: {employees.length}
                    </Typography>
                </Box>

                {/* 3. Data Table Card - 数据卡片 */}
                <TableContainer 
                    component={Paper} 
                    sx={{ 
                        borderRadius: '30px', 
                        p: 3, 
                        boxShadow: '0px 10px 30px rgba(0,0,0,0.04)',
                        border: 'none'
                    }}
                >
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ color: '#94a3b8', fontWeight: 600, borderBottom: 'none' }}>NAME</TableCell>
                                <TableCell sx={{ color: '#94a3b8', fontWeight: 600, borderBottom: 'none' }}>SSN</TableCell>
                                <TableCell sx={{ color: '#94a3b8', fontWeight: 600, borderBottom: 'none' }}>WORK AUTH</TableCell>
                                <TableCell sx={{ color: '#94a3b8', fontWeight: 600, borderBottom: 'none' }}>CONTACT</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {employees.map((emp) => (
                                <TableRow key={emp._id} sx={{ '& td': { borderBottom: '1px solid #f1f5f9' } }}>
                                    <TableCell>
                                        <Link 
                                            href="#" 
                                            onClick={(e) => {
                                                e.preventDefault();
                                                window.open(`/hr/employee/${emp._id}`, '_blank');
                                            }}
                                            sx={{ color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}
                                        >
                                            {`${emp.personalInfo.firstName} ${emp.personalInfo.lastName}`}
                                        </Link>
                                    </TableCell>
                                    <TableCell sx={{ color: '#64748b' }}>***-**-{emp.personalInfo.ssn?.slice(-4) || '0000'}</TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={emp.personalInfo.workAuthorizationTitle} 
                                            sx={{ 
                                                bgcolor: emp.personalInfo.workAuthorizationTitle === 'Citizen' ? '#ecfdf5' : '#eff6ff', 
                                                color: emp.personalInfo.workAuthorizationTitle === 'Citizen' ? '#10b981' : '#3b82f6',
                                                fontWeight: 600,
                                                borderRadius: '8px'
                                            }} 
                                        />
                                    </TableCell>
                                    <TableCell sx={{ color: '#64748b' }}>555-0101</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
            </Layout>
        </Box>
    );
};

export default EmployeeProfiles;