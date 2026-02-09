import React from 'react';
import { Box, Paper, Typography, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Link, useLocation } from 'react-router-dom';

import DashboardIcon from '@mui/icons-material/Dashboard'; 
import PeopleIcon from '@mui/icons-material/People';     
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd'; 
import PersonAddIcon from '@mui/icons-material/PersonAdd'; 
import LogoutIcon from '@mui/icons-material/Logout';

const Sidebar = ({ activePage }) => {
    const navigate = useNavigate();

    const menuItems = [
        { text: 'Dashboard', path: '/hr/dashboard', icon: <DashboardIcon /> },
        { text: 'Employee Profiles', path: '/hr/profiles', icon: <PeopleIcon /> },
        { text: 'Visa Status', path: '/hr/visa', icon: <AssignmentIndIcon /> },
        { text: 'Hiring Management', path: '/hr/hiring', icon: <PersonAddIcon /> },
    ];

    return (
        <Paper 
            elevation={0} 
            sx={{ 
                width: 250, 
                height: '100vh',
                borderRadius: 0,
                display: 'flex', 
                flexDirection: 'column', 
                p: 3,
                bgcolor: 'white',
                borderRight: '1px solid #f1f5f9',
                borderRadius: '24px'
            }}
        >
            {/* 1. Logo */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 6, px: 2 }}>
                <Box sx={{ 
                    width: 40, height: 40, 
                    bgcolor: '#4f46e5',
                    borderRadius: '12px', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 900, fontSize: '1.2rem'
                }}>
                    HP
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b', letterSpacing: '-0.5px' }}>
                    HR PORTER
                </Typography>
            </Box>

            {/* 2. Menu */}
            <List sx={{ flexGrow: 1 }}>
                {menuItems.map((item) => {
                    const isActive = activePage === item.text || (item.text === 'Employee Profiles' && activePage === 'Profiles');
                    
                    return (
                        <ListItem key={item.text} disablePadding sx={{ mb: 1.5 }}>
                            <ListItemButton 
                                onClick={() => navigate(item.path)}
                                sx={{ 
                                    borderRadius: '16px',
                                    py: 1.5,
                                    px: 2.5,
                                    bgcolor: isActive ? '#e0e7ff' : 'transparent', 
                                    color: isActive ? '#4338ca' : '#94a3b8',     
                                    '&:hover': { 
                                        bgcolor: isActive ? '#e0e7ff' : '#f8fafc',
                                        color: isActive ? '#4338ca' : '#64748b' 
                                    },
                                    transition: 'all 0.2s ease-in-out'
                                }}
                            >
                                <ListItemIcon sx={{ 
                                    minWidth: 40, 
                                    color: 'inherit'
                                }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText 
                                    primary={item.text} 
                                    primaryTypographyProps={{ 
                                        fontWeight: isActive ? 700 : 500,
                                        fontSize: '0.95rem'
                                    }} 
                                />
                                {isActive && (
                                    <Box sx={{ 
                                        width: 8, height: 8, 
                                        bgcolor: '#4338ca',
                                        borderRadius: '50%',
                                        ml: 1 
                                    }} />
                                )}
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>

            {/* 3.Logout */}
            <Box sx={{mb:5}}>
                <ListItemButton 
                    sx={{ 
                        borderRadius: '16px', 
                        py: 1.5, px: 2.5,
                        color: '#94a3b8',
                        '&:hover': { bgcolor: '#fee2e2', color: '#ef4444' }
                    }}
                >
                    <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                        <LogoutIcon />
                    </ListItemIcon>
                    <ListItemText 
                        primary="Logout" 
                        slotProps={{
                            primary: {
                              sx: {
                                fontWeight: 500,
                                fontSize: '0.95rem'
                              }
                            }
                          }}
                    />
                </ListItemButton>
            </Box>
        </Paper>
    );
};

export default Sidebar;