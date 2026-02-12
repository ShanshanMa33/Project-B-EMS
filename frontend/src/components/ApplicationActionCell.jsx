import React from 'react';
import { Box, Button } from '@mui/material';
import { Visibility as VisibilityIcon } from '@mui/icons-material';

const actionButtonBaseSx = {
    textTransform: 'none',
    borderRadius: '8px',
    py: 0.2,
    fontSize: '0.8rem',
};

export default function ApplicationActionCell({ row, disabled = false, onApprove, onReject }) {
    const isPending = row?.status === 'Pending';

    if (!row) return null;

    if (!isPending) {
        return (
            <Button
                variant="outlined"
                size="small"
                startIcon={<VisibilityIcon />}
                sx={{
                    ...actionButtonBaseSx,
                    borderColor: '#e2e8f0',
                    color: '#475569',
                    '&:hover': { borderColor: '#4338ca', color: '#4338ca', bgcolor: '#e0e7ff' },
                }}
            >
                View
            </Button>
        );
    }

    return (
        <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
                variant="outlined"
                size="small"
                disabled={disabled}
                onClick={onApprove}
                sx={{
                    ...actionButtonBaseSx,
                    borderColor: '#bbf7d0',
                    color: '#16a34a',
                    '&:hover': { borderColor: '#16a34a', bgcolor: '#f0fdf4' },
                }}
            >
                Approve
            </Button>
            <Button
                variant="outlined"
                size="small"
                disabled={disabled}
                onClick={onReject}
                sx={{
                    ...actionButtonBaseSx,
                    borderColor: '#fecaca',
                    color: '#dc2626',
                    '&:hover': { borderColor: '#dc2626', bgcolor: '#fef2f2' },
                }}
            >
                Reject
            </Button>
        </Box>
    );
}
