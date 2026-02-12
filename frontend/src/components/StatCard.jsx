import React from 'react';
import { Paper, Box, Typography } from '@mui/material';

const StatCard = ({ title, count, icon }) => {
    return (
        <Paper elevation={0} sx={{ 
            p: 2,
            width: 175,
            minWidth: 0,
            borderRadius: '16px', 
            bgcolor: 'white',     
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
            transition: 'transform 0.2s',
            '&:hover': { transform: 'translateY(-2px)' }
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.8, color: '#64748b' }}>
                <Box sx={{ 
                    p: 0.6, borderRadius: '8px', 
                    bgcolor: 'white', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center' 
                }}>
                    {icon}
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem' }}>{title}</Typography>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b', ml: 0.25 }}>
                {count}
            </Typography>
        </Paper>
    );
};

export default StatCard;
