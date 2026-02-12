import React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';

export default function ActionConfirmDialog({
    open,
    title = 'Please Confirm',
    description = '',
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    confirmColor = 'primary',
    loading = false,
    onCancel,
    onConfirm,
}) {
    return (
        <Dialog open={open} onClose={onCancel} fullWidth maxWidth="xs">
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <Typography sx={{ color: '#475569' }}>{description}</Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel} disabled={loading}>
                    {cancelLabel}
                </Button>
                <Button variant="contained" color={confirmColor} onClick={onConfirm} disabled={loading}>
                    {confirmLabel}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
