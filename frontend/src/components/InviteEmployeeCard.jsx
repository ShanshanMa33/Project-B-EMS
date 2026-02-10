import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Paper } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import { sendHRInvitation } from '../api/hr';

const InviteEmployeeCard = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        if (!email) return alert("Please enter email");
        setLoading(true);
        try {
            await sendHRInvitation({ email });
            alert('Invitation sent!');
            setEmail('');
        } catch (err) {
            alert('Failed: ' + (err.response?.data?.message || 'Error'));
        } finally {
            setLoading(false);
        }
    };

    return (
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

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '16px', p: '8px' }}>
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
    );
};

export default InviteEmployeeCard;
