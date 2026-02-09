import React from 'react';
import { Box } from '@mui/material';
import Sidebar from './SideBar'

const Layout = ({ children, activePage }) => {
    return (
        <Box sx={{ 
            display: 'flex', 
            bgcolor: '#f4f7f9',
            minHeight: '100vh',
        }}>
            {/* 1. Sidebar */}
            <Sidebar activePage={activePage} />

            {/* 2. page content (children) */}
            <Box sx={{ 
                flexGrow: 1, 
                p: 6,
                overflowY: 'auto'
            }}>
                {children}
            </Box>
        </Box>
    );
};

export default Layout;