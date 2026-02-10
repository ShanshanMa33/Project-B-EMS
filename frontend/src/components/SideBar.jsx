import { useMemo, useState } from 'react';
import {
    Box, Paper, Typography, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
    Avatar, Divider, Drawer, IconButton, useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';

import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import LogoutIcon from '@mui/icons-material/Logout';
import BadgeIcon from '@mui/icons-material/Badge';
import MenuIcon from '@mui/icons-material/Menu';

import { logout } from '../store/authSlice';

const drawerWidth = 260;

const Sidebar = ({ activePage }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);

    const role = user?.role || 'employee';

    const muiTheme = useTheme();
    const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
    const [mobileOpen, setMobileOpen] = useState(false);


    const menuItems = useMemo(() => {
        if (role === 'hr') {
            return [
                { text: 'Dashboard', path: '/hr/dashboard', icon: <DashboardIcon /> },
                { text: 'Employee Profiles', path: '/hr/profiles', icon: <PeopleIcon /> },
                { text: 'Visa Status', path: '/hr/visa', icon: <AssignmentIndIcon /> },
                { text: 'Hiring Management', path: '/hr/hiring', icon: <PersonAddIcon /> },
            ];
        } else {
            return [
                { text: 'Dashboard', path: '/dashboard/employee', icon: <DashboardIcon /> },
                { text: 'My Profile', path: '/dashboard/employee/profile', icon: <BadgeIcon /> },
                { text: 'Visa Status', path: '/dashboard/employee/visaStatus', icon: <AssignmentIndIcon /> },
                { text: "Onboarding", path: '/dashboard/employee/onboarding', icon: <PersonAddIcon /> }
            ];
        }
    }, [role]);

    const handleNavigate = (path) => {
        navigate(path);
        if (isMobile) setMobileOpen(false);
    };

    const isItemActive = (item) => {
        const currentPath = location.pathname;
        if (activePage === item.text) return true;

        if (item.path === '/dashboard/employee') {
            return currentPath === '/dashboard/employee';
        }
        return currentPath === item.path;
    };

    const content = (
        <Paper
            elevation={0}
            sx={{
                width: drawerWidth,
                height: '100vh',
                borderRadius: 0,
                display: 'flex',
                flexDirection: 'column',
                p: 3,
                bgcolor: 'white',
                borderRight: '1px solid #f1f5f9',
            }}
        >
            {/* Branding */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4, px: 1 }}>
                <Box sx={{
                    width: 40, height: 40,
                    bgcolor: '#4f46e5',
                    borderRadius: '12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 900, fontSize: '1.2rem'
                }}>
                    HP
                </Box>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b', letterSpacing: '-0.5px' }}>
                        HR PORTER
                    </Typography>
                    <Typography variant="caption" xs={{ color: "#94a3b8", fontWeight: 600 }}>
                        {role === 'hr' ? "HR" : "Employee"} Portal
                    </Typography>
                </Box>
            </Box>

            {/* Menu Items */}
            <List sx={{ flexGrow: 1 }}>
                {menuItems.map((item) => {
                    const isActive = isItemActive(item);

                    return (
                        <ListItem key={item.text} disablePadding sx={{ mb: 1.2 }}>
                            <ListItemButton
                                onClick={() => handleNavigate(item.path)}
                                sx={{
                                    borderRadius: '16px',
                                    py: 1.3,
                                    px: 2.2,
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
                    )
                })}
            </List>

            <Divider sx={{ my: 2 }} />

            {/* User Info */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, px: 1 }}>
                <Avatar sx={{ bgcolor: '#e0e7ff', color: '#4338ca', fontWeight: 800 }}>
                    {(user?.username || "U").slice(0, 2).toUpperCase()}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b' }} noWrap>
                        {user?.username || user?.email || "User"}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#6366f1', fontWeight: 700 }}>
                        {role === 'hr' ? "HR" : "Employee"}
                    </Typography>
                </Box>
            </Box>

            {/* Logout */}
            <ListItemButton
                onClick={() => { dispatch(logout()); navigate('/signin'); }}
                sx={{
                    borderRadius: '16px',
                    py: 1.3, px: 2.2,
                    color: '#94a3b8',
                    '&:hover': { bgcolor: '#fee2e2', color: '#ef4444' }
                }}
            >
                <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                    <LogoutIcon />
                </ListItemIcon>
                <ListItemText
                    primary="Logout"
                    primaryTypographyProps={{
                        fontWeight: 600,
                        fontSize: '0.95rem'
                    }} />
            </ListItemButton>
        </Paper>
    );

    if (isMobile) {
        return (
            <>
                {/* show the buttton only when drawer is closed */}
                {!mobileOpen && (
                    <IconButton
                        onClick={() => setMobileOpen(true)}
                        sx={{
                            position: 'fixed',
                            top: 16,
                            left: 16,
                            zIndex: (theme) => theme.zIndex.drawer + 2,
                            bgcolor: 'white',
                            border: '1px solid #e2e8f0',
                            '&:hover': { bgcolor: '#f8fafc' }
                        }}
                    >
                        <MenuIcon />
                    </IconButton>
                )}

                <Drawer
                    open={mobileOpen}
                    onClose={() => setMobileOpen(false)}
                    ModalProps={{ keepMounted: true }}
                    sx={{ "& .MuiDrawer-paper": { width: drawerWidth } }}
                >
                    {content}
                </Drawer>
            </>
        )
    }

    return content;
};

export default Sidebar;
