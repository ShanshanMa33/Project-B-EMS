import React from 'react';
import { Box, Typography, Avatar } from '@mui/material';
import { useSelector } from 'react-redux';


const PageHeader = ({ title, subtitle }) => {
    const { user } = useSelector((state) => state.auth);
    // Prefer username from auth payload, then fall back to other name fields.
    const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
    const displayName = user?.username || user?.name || fullName || user?.email || 'User';
    // Normalize role so HR/Employee is always shown correctly.
    const normalizedRole = String(user?.role || '').toLowerCase();
    const roleLabel = normalizedRole === 'hr' ? 'HR' : 'Employee';
    // Get initials for avatar
    const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2).toUpperCase();


    return (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b', letterSpacing: '-0.5px', mb: 0.5 }}>
                    {title}
                </Typography>
                <Typography variant="body1" sx={{ color: '#94a3b8', fontWeight: 500 }}>
                    {subtitle}
                </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b' }}>{displayName}</Typography>
                    <Typography variant="caption" sx={{ color: '#6366f1', fontWeight: 600 }}> {roleLabel}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#e0e7ff', color: '#4338ca', fontWeight: 'bold' }}>{initials}</Avatar>
            </Box>
        </Box>
    );
};

export default PageHeader;
