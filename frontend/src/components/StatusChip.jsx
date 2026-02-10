import React from "react";
import { Chip } from "@mui/material";

const map = {
    pending: { label: "Pending", color: "warning" },
    approved: { label: "Approved", color: "success" },
    rejected: { label: "Rejected", color: "error" },
};

export default function StatusChip({ status = "pending" }) {
    const value = map[status] || { label: status, color: "default" };
    return <Chip size="small" label={value.label} color={value.color} />;
}