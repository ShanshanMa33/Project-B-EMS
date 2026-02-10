import React from 'react';
import { Pagination, Box } from '@mui/material';

const CustomPagination = ({ totalPages, page, onChange }) => {
    
    if (totalPages <= 1) return null;

    return (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <Pagination 
                count={totalPages} 
                page={page} 
                onChange={onChange}
                color="primary" 
                shape="rounded"
            
                sx={{
                    '& .MuiPaginationItem-root': {
                        color: '#64748b',
                        fontWeight: 600,
                        borderRadius: '8px',
                        transition: 'all 0.2s',
                        '&.Mui-selected': {
                            bgcolor: '#e0e7ff',
                            color: '#4338ca', 
                            fontWeight: 700,
                            '&:hover': {
                                bgcolor: '#c7d2fe',
                            }
                        },
                        '&:hover': {
                            bgcolor: '#f1f5f9'
                        }
                    }
                }}
            />
        </Box>
    );
};

export default CustomPagination;