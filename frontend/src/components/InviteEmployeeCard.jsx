import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Paper } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';

const InviteEmployeeCard = () => {
    const [email, setEmail] = useState('');

    return (
        <Paper
            elevation={0}
            sx={{
                borderRadius: '40px',
                background: 'linear-gradient(to right, #30307c, #4446a7)',
                color: 'white',
                p: '45px 50px',
                mb: 4,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                overflow: 'hidden',
                maxWidth: '900px',
            }}
        >
            <Box sx={{ maxWidth: '70%' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
                    Invite New Employee
                </Typography>
                <Typography variant="body1" sx={{ mb: 4, opacity: 0.8, fontSize: '1.05rem', maxWidth: '85%' }}>
                    Generate a secure 3-hour registration token. The employee will receive an email with the signup link to onboard.
                </Typography>

                <Box sx={{
                    display: 'flex',
                    bgcolor: 'rgba(255,255,255,0.1)',
                    borderRadius: '16px',
                    p: '8px',
                    border: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <TextField
                        fullWidth
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        variant="standard"
                        InputProps={{
                            disableUnderline: true,
                            sx: { color: 'white', px: 2, fontSize: '1rem' }
                        }}
                        sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}
                    />
                    <Button
                        variant="contained"
                        sx={{
                            bgcolor: 'white',
                            color: '#30307c',
                            borderRadius: '12px',
                            textTransform: 'none',
                            fontWeight: 700,
                            px: 4,
                            py: 1.2,
                            boxShadow: 'none',
                            '&:hover': { bgcolor: '#f1f1f1', boxShadow: 'none' }
                        }}
                    >
                        Send Invite
                    </Button>
                </Box>
            </Box>

            <Box sx={{
                width: '90px',
                height: '90px',
                bgcolor: 'rgba(255,255,255,0.1)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255,255,255,0.2)',
                mr: 2
            }}>
                <EmailIcon sx={{ fontSize: 35, color: 'white' }} />
            </Box>
        </Paper>
    );
};

export default InviteEmployeeCard;