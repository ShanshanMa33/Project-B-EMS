import React from 'react';
import { Box, Typography, Avatar } from '@mui/material';

const PageHeader = ({ title, subtitle }) => {
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
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b' }}>jdoe</Typography>
                    <Typography variant="caption" sx={{ color: '#6366f1', fontWeight: 600 }}>HR Manager</Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#e0e7ff', color: '#4338ca', fontWeight: 'bold' }}>JD</Avatar>
            </Box>
        </Box>
    );
};

export default PageHeader;