import React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';

export default function RejectApplicationDialog({
    open,
    feedback,
    onFeedbackChange,
    onCancel,
    onSubmit,
    submitting = false,
}) {
    return (
        <Dialog open={open} onClose={onCancel} fullWidth maxWidth="sm">
            <DialogTitle>Reject Application</DialogTitle>
            <DialogContent>
                <TextField
                    autoFocus
                    margin="dense"
                    label="Feedback (employee can see this)"
                    fullWidth
                    multiline
                    minRows={4}
                    value={feedback}
                    onChange={(e) => onFeedbackChange(e.target.value)}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel}>Cancel</Button>
                <Button color="error" variant="contained" onClick={onSubmit} disabled={submitting}>
                    Reject
                </Button>
            </DialogActions>
        </Dialog>
    );
}
