import React from 'react';
import { Select, MenuItem, Box, Typography } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

const TableFilter = ({ options = [], value, onChange }) => {
    return (
        <Select
            value={value}
            onChange={onChange}
            displayEmpty
            IconComponent={KeyboardArrowDownIcon}
            renderValue={(selected) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FilterListIcon sx={{ color: '#64748b', fontSize: 20 }} />
                    <Typography sx={{ color: '#64748b', fontWeight: 500, fontSize: '0.875rem' }}>
                        Filter:
                    </Typography>
                    <Typography sx={{ color: '#1e293b', fontWeight: 600, fontSize: '0.875rem' }}>
                        {selected}
                    </Typography>
                </Box>
            )}
            sx={{ 
                minWidth: '180px',
                height: '100%',
                borderRadius: '12px',
                bgcolor: '#f3f4f6',
                '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                '&:hover': { bgcolor: '#e2e8f0' },
                '&.Mui-focused': { 
                    bgcolor: '#e2e8f0',
                    boxShadow: '0 0 0 2px #c7d2fe' 
                },
                '& .MuiSelect-select': { 
                    display: 'flex', 
                    alignItems: 'center',
                    py: 1.5,
                },
                '& .MuiSelect-icon': { color: '#64748b' }
            }}
            
            MenuProps={{
                PaperProps: {
                    elevation: 0,
                    sx: { 
                        mt: 1, 
                        borderRadius: '12px', 
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                        border: '1px solid #f1f5f9'
                    }
                }
            }}
        >
            <MenuItem value="All" sx={{ borderRadius: '8px', m: 0.5, fontWeight: 500 }}>
                All Status
            </MenuItem>
            {options.map((opt) => (
                <MenuItem 
                    key={opt} 
                    value={opt}
                    sx={{ borderRadius: '8px', m: 0.5, fontWeight: 500, color: '#475569' }}
                >
                    {opt}
                </MenuItem>
            ))}
        </Select>
    );
};

export default TableFilter;