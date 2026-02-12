import React from 'react';
import { TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const SearchBar = ({ 
    placeholder = "Search...", 
    value, 
    onChange, 
    width = "300px"
}) => {
    return (
        <TextField 
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            size="small"
            slotProps={{
                input: {
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon fontSize="small" sx={{ color: '#94a3b8' }} />
                        </InputAdornment>
                    ),
                }
            }}
            sx={{ 
                width: '100%', 
                maxWidth: width,
                '& .MuiOutlinedInput-root': { 
                    height: '40px',
                    bgcolor: '#f3f4f6', 
                    borderRadius: '10px', 
                    transition: 'all 0.2s',
                    
                    '& fieldset': { border: 'none' },
                    '&:hover fieldset': { border: '1px solid #e2e8f0' },
                    '&.Mui-focused fieldset': { border: '1px solid #6366f1' },
                    '& input': { 
                        padding: '0 8px',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: '#1e293b'
                    } 
                }
            }}
        />
    );
};

export default SearchBar;