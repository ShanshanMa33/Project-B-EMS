import React from 'react';
import { Box } from '@mui/material';
import Sidebar from './SideBar';

const Layout = ({ children, activePage }) => {
    return (
        <Box sx={{
            display: 'flex',
            width: '100vw',
            maxWidth: '100%',
            bgcolor: '#F8F9FF',
            height: '100vh',
            overflow: 'hidden',
        }}>
            {/* 1. Sidebar */}
            <Sidebar activePage={activePage} />

            {/* 2. page content (children) */}
            <Box sx={{
                flexGrow: 1,
                p: { xs: 2, sm: 3, md: 4 },
                pb: { xs: 10, sm: 12, md: 14 },
                height: '100vh',
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
