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
            overflow: 'hidden',
        }}>
            {/* 1. Sidebar */}
            <Sidebar activePage={activePage} />

            {/* 2. page content (children) */}
            <Box sx={{
                flexGrow: 1,
                p: { xs: 2, sm: 3, md: 4 },
                pb: { xs: 7, sm: 8, md: 10 },
                minHeight: '100vh',
                overflowY: 'auto',
                overflowX: 'hidden',
                scrollPaddingBottom: { xs: 28, sm: 32, md: 40 },
            }}>
                {children}
            </Box>
        </Box>
    );
};

export default Layout;
