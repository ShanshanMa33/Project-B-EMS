import React, { useEffect, useState } from 'react';
import {
    Box, Typography, TextField, Button, Paper, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, CircularProgress,
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import { getHRInvitationHistory, sendHRInvitation } from '../api/hr';

const InviteEmployeeCard = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [history, setHistory] = useState([]);

    const loadHistory = async () => {
        setHistoryLoading(true);
        try {
            const res = await getHRInvitationHistory();
            setHistory(Array.isArray(res.data) ? res.data : []);
        } catch (_) {
            setHistory([]);
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => {
        loadHistory();
    }, []);

    const handleSend = async () => {
        if (!email) return alert("Please enter email");
        setLoading(true);
        try {
            await sendHRInvitation({ name, email });
            alert('Invitation sent!');
            setName('');
            setEmail('');
            await loadHistory();
        } catch (err) {
            alert('Failed: ' + (err.response?.data?.message || 'Error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ mb: 4 }}>
            <Paper elevation={0} sx={{
                borderRadius: '40px', background: 'linear-gradient(to right, #30307c, #4446a7)',
                color: 'white', p: '45px 50px', mb: 4, display: 'flex',
                justifyContent: 'space-between', alignItems: 'center', maxWidth: '900px'
            }}>
                <Box sx={{ maxWidth: '70%' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>Invite New Employee</Typography>
                    <Typography variant="body1" sx={{ mb: 4, opacity: 0.8 }}>
                        Generate a 3-hour token. The employee will receive an email to onboard.
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '16px', p: '8px', mb: 1 }}>
                        <TextField
                            placeholder="Employee name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            variant="standard"
                            slotProps={{ input: { disableUnderline: true, sx: { color: 'white', px: 2 } } }}
                            sx={{ width: 220, flexShrink: 0 }}
                        />
                        <TextField
                            fullWidth placeholder="name@company.com"
                            value={email} onChange={(e) => setEmail(e.target.value)}
                            variant="standard"
                            slotProps={{ input: { disableUnderline: true, sx: { color: 'white', px: 2 } } }}
                            sx={{ flex: 1, minWidth: 0 }}
                        />
                        <Button
                            variant="contained" disabled={loading} onClick={handleSend}
                            sx={{ bgcolor: 'white', color: '#30307c', borderRadius: '12px', fontWeight: 700, px: 3, whiteSpace: 'nowrap', flexShrink: 0 }}
                        >
                            {loading ? 'Sending...' : 'Send Invite'}
                        </Button>
                    </Box>
                </Box>
                <EmailIcon sx={{ fontSize: 80, opacity: 0.2, mr: 4 }} />
            </Paper>

            <Paper
                elevation={0}
                sx={{
                    bgcolor: 'white',
                    borderRadius: '20px',
                    p: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                }}
            >
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b', mb: 2 }}>
                Registration Token History
            </Typography>

            <TableContainer>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            {['Name', 'Email', 'Registration Link', 'Status', 'Created Time'].map((h) => (
                                <TableCell key={h} sx={{ fontWeight: 700, color: '#64748b' }}>
                                    {h}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {historyLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                                    <CircularProgress size={22} />
                                </TableCell>
                            </TableRow>
                        ) : history.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 3, color: '#64748b' }}>
                                    No token history
                                </TableCell>
                            </TableRow>
                        ) : (
                            history.map((item) => (
                                <TableRow key={item._id}>
                                    <TableCell>{item.name || '-'}</TableCell>
                                    <TableCell>{item.email || '-'}</TableCell>
                                    <TableCell>
                                        {item.registrationLink ? (
                                            <a href={item.registrationLink} target="_blank" rel="noreferrer">
                                                {item.registrationLink}
                                            </a>
                                        ) : '-'}
                                    </TableCell>
                                    <TableCell>{item.status || '-'}</TableCell>
                                    <TableCell>
                                        {item.createdTime ? new Date(item.createdTime).toLocaleString() : '-'}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            </Paper>
        </Box>
    );
};

export default InviteEmployeeCard;
