import React from 'react';
import { Box, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Sidebar from './SideBar';

const Layout = ({ children, activePage }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    return (
        <Box sx={{
            display: 'flex',
            bgcolor: '#F8F9FF',
            minHeight: '100vh',
        }}>
            {/* 1. Sidebar */}
            <Sidebar activePage={activePage} />

            {/* 2. page content (children) */}
            <Box sx={{
                flexGrow: 1,
                p: { xs: 2, sm: 3, md: 4 },
                overflowY: 'auto'
            }}>
                {children}
            </Box>
        </Box>
    );
};

export default Layout;