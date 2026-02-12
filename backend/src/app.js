const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const employeeProfileRoutes = require('./routes/employeeProfile');
const onboardingApplicationRoutes = require('./routes/onboardingApplication');
const hrRoutes = require('./routes/hrRoutes');
const visaCaseRoutes = require('./routes/visaCase');

const app = express();

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/employee', employeeProfileRoutes);
app.use('/api/', onboardingApplicationRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/visa', visaCaseRoutes);
// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'API is running' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
    if (err?.name === 'ValidationError') {
        return res.status(400).json({ message: err.message });
    }
    if (err?.name === 'MulterError') {
        return res.status(400).json({ message: err.message });
    }

    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    console.error('API error:', err);
    res.status(status).json({ message });
});

module.exports = app;
