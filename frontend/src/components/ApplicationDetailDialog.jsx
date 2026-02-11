import React from 'react';
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Paper, Typography } from '@mui/material';

export default function ApplicationDetailDialog({ open, loading, detail, onClose }) {
    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle>Application Detail</DialogTitle>
            <DialogContent dividers>
                {loading ? (
                    <Box sx={{ py: 4, display: 'grid', placeItems: 'center' }}>
                        <CircularProgress size={26} />
                    </Box>
                ) : (
                    <Box sx={{ display: 'grid', gap: 2 }}>
                        <Box>
                            <Typography sx={{ fontWeight: 700, mb: 0.5 }}>Onboarding Application</Typography>
                            <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8fafc' }}>
                                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 13 }}>
{JSON.stringify(detail?.app, null, 2)}
                                </pre>
                            </Paper>
                        </Box>
                        <Box>
                            <Typography sx={{ fontWeight: 700, mb: 0.5 }}>Employee Profile</Typography>
                            <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8fafc' }}>
                                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 13 }}>
{JSON.stringify(detail?.profile, null, 2)}
                                </pre>
                            </Paper>
                        </Box>
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
}
