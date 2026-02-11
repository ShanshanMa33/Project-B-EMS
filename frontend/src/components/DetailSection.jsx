import React from "react";
import { Box, Divider, Paper, Typography } from "@mui/material";

const valueOrDash = (value) => (value === undefined || value === null || value === "" ? "-" : value);

export function DetailSection({ title, children }) {
    return (
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: "14px", border: "1px solid #e2e8f0" }}>
            <Typography sx={{ fontWeight: 800, color: "#1e293b", mb: 1.2 }}>{title}</Typography>
            <Divider sx={{ mb: 1.5 }} />
            <Box sx={{ display: "grid", gap: 1 }}>{children}</Box>
        </Paper>
    );
}

export function DetailRow({ label, value }) {
    return (
        <Typography sx={{ color: "#334155", fontSize: "0.95rem" }}>
            <strong>{label}:</strong> {valueOrDash(value)}
        </Typography>
    );
}
