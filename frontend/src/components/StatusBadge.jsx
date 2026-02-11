import React from 'react';
import { Chip } from '@mui/material';

const StatusBadge = ({ status }) => {

    const getStyle = (status) => {
        const s = status?.toLowerCase() || '';
        
        if (s.includes('citizen') || s.includes('green card') || s.includes('approved') || s.includes('valid')) {
            return { bgcolor: '#ecfdf5', color: '#059669' }; 
        }
        if (s.includes('pending') || s.includes('wait')) {
            return { bgcolor: '#fffbeb', color: '#d97706' };
        }
        if (s.includes('rejected') || s.includes('closed') || s.includes('refused')) {
            return { bgcolor: '#fef2f2', color: '#dc2626' };
        }
        return { bgcolor: '#eff6ff', color: '#3b82f6' };
    };

    const style = getStyle(status);

    return (
        <Chip 
            label={status || 'N/A'} 
            size="small"
            sx={{ 
                bgcolor: style.bgcolor, 
                color: style.color,
                fontWeight: 700, 
                borderRadius: '6px', 
                fontSize: '0.75rem',
                height: '24px'
            }} 
        />
    );
};

export default StatusBadge;