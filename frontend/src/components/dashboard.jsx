import * as React from "react";
import { NavLink, Outlet } from "react-router-dom";

import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

import MenuIcon from "@mui/icons-material/Menu";

const drawerWidth = 260;

//resuable dashboard layout using MUI components.
const linkStyle = ({ isActive }) => ({
    textDecoration: "none",
    color: "inherit",
    display: "block",
    borderRadius: 10,
    overflow: "hidden",
});

export default function DashboardLayout({
    title = "Dashboard",
    navItems = [],
    rightSlot = null,
}) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md")); // < md => mobile behavior
    const [mobileOpen, setMobileOpen] = React.useState(false);

    const toggleDrawer = () => setMobileOpen((v) => !v);
    const closeDrawer = () => setMobileOpen(false);

    const drawerContent = (
        <Box sx={{ height: "100%" }}>
            <Toolbar sx={{ px: 2 }}>
                <Typography variant="h6" noWrap>
                    {title}
                </Typography>
            </Toolbar>

            <Divider />

            <List sx={{ p: 1 }}>
                {navItems.map((item) => (
                    <ListItem key={item.to} disablePadding sx={{ mb: 0.5 }}>
                        <NavLink to={item.to} style={linkStyle} onClick={isMobile ? closeDrawer : undefined}>
                            {({ isActive }) => (
                                <ListItemButton
                                    sx={{
                                        borderRadius: 2,
                                        ...(isActive
                                            ? { bgcolor: "action.selected" }
                                            : { "&:hover": { bgcolor: "action.hover" } }),
                                    }}
                                >
                                    <ListItemText primary={item.label} />
                                </ListItemButton>
                            )}
                        </NavLink>
                    </ListItem>
                ))}
            </List>

            <Box sx={{ flexGrow: 1 }} />

            <Divider />
            <Box sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                    © Your App
                </Typography>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: "flex" }}>
            <CssBaseline />

            {/* Top AppBar */}
            <AppBar
                position="fixed"
                color="inherit"
                elevation={0}
                sx={{
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    zIndex: (t) => t.zIndex.drawer + 1,
                }}
            >
                <Toolbar sx={{ gap: 1 }}>
                    {isMobile && (
                        <IconButton edge="start" onClick={toggleDrawer} aria-label="open drawer">
                            <MenuIcon />
                        </IconButton>
                    )}

                    <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
                        {title}
                    </Typography>

                    {/* optional slot for extra controls */}
                    {rightSlot}

                    <Avatar sx={{ width: 32, height: 32 }} />
                </Toolbar>
            </AppBar>

            {/* Sidebar */}
            <Box
                component="nav"
                sx={{
                    width: { md: drawerWidth },
                    flexShrink: { md: 0 },
                }}
                aria-label="dashboard navigation"
            >
                {/* Mobile drawer */}
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={toggleDrawer}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: "block", md: "none" },
                        "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
                    }}
                >
                    {drawerContent}
                </Drawer>

                {/* Desktop drawer */}
                <Drawer
                    variant="permanent"
                    open
                    sx={{
                        display: { xs: "none", md: "block" },
                        "& .MuiDrawer-paper": {
                            boxSizing: "border-box",
                            width: drawerWidth,
                            borderRightColor: "divider",
                        },
                    }}
                >
                    {drawerContent}
                </Drawer>
            </Box>

            {/* Main content */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    width: { md: `calc(100% - ${drawerWidth}px)` },
                    minHeight: "100vh",
                    bgcolor: "background.default",
                }}
            >
                {/* spacer to push content below AppBar */}
                <Toolbar />

                <Box sx={{ p: { xs: 2, md: 3 } }}>
                    {/* Your AntD forms/buttons/cards can be inside pages rendered here */}
                    <Outlet />
                </Box>
            </Box>
        </Box>
    );
}
