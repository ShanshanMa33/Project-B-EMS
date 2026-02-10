const RegistrationToken = require('../models/RegistrationToken');
const sendEmail = require('../utils/sendEmail');
const User = require('../models/users');
const EmployeeProfile = require('../models/employeeProfile');
const OnboardingApplication = require('../models/onboardingApplication');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const statusLabelMap = {
    not_started: 'Pending',
    in_progress: 'Pending',
    submitted: 'Pending',
    in_review: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
};

function formatWorkAuthTitle(profile) {
    if (profile?.isPermanentResidentOrCitizen === true) {
        if (profile?.residentStatus === 'citizen') return 'Citizen';
        if (profile?.residentStatus === 'green_card') return 'Green Card';
    }

    switch (profile?.workAuthorization?.type) {
        case 'h1b':
            return 'H1-B';
        case 'l2':
            return 'L2';
        case 'f1_cpt_opt':
            return 'F1(OPT)';
        case 'h4':
            return 'H4';
        case 'other':
            return 'N/A';
        default:
            return 'N/A';
    }
}

// --- SECTION 1: HIRING / INVITATIONS ---
/**
 * 1.1 Send an invitation email with a 3-hour token.
 */
async function sendInvitation(req, res) {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }
    try {
        const token = crypto.randomBytes(20).toString('hex');
        const newInvitation = new RegistrationToken({
            token,
            email,
            status: 'unused'
        });
        await newInvitation.save();
        await sendEmail(email, token);
        res.status(201).json({ 
            message: 'Invitation sent successfully!',
            token: token
        });
    } catch (error) {
        res.status(500).json({ message: 'Error', error: error.message });
    }
};

/**
 * 1.2 Get history of all sent registration tokens.
 */
async function getInvitationHistory(req, res) {
    try {
        const history = await RegistrationToken.find().sort({ createdAt : -1});
        res.status(200).json(history);
    } catch (error) {
        res.status(500).json({ 
            message: "Unable to retrieve invitation history.", 
            error: error.message 
          });
    }
};

// --- SECTION 2: ONBOARDING APPLICATION REVIEW ---
/**
 * 2.1 Get all employees with 'Pending' onboarding status.
 */
async function getPendingApplication(req, res) {
    try {
        const apps = await OnboardingApplication.find({
            status: { $in: ['submitted', 'in_review', 'not_started', 'in_progress'] },
        })
            .populate('User', 'email')
            .sort({ updatedAt: -1 });

        const userIds = apps.map((a) => a.User?._id).filter(Boolean);
        const profiles = await EmployeeProfile.find({ user: { $in: userIds } });
        const profileByUserId = new Map(profiles.map((p) => [String(p.user), p]));

        const pendingUsers = apps.map((app) => {
            const profile = profileByUserId.get(String(app.User?._id));
            const firstName = profile?.preferredName || profile?.firstName || 'N/A';
            const lastName = profile?.lastName || '';
            return {
                _id: String(app._id),
                userId: String(app.User?._id || ''),
                name: `${firstName} ${lastName}`.trim(),
                email: app.User?.email || profile?.email || '',
                position: app.positionTitle || profile?.position || '',
                status: statusLabelMap[app.status] || 'Pending',
                rawStatus: app.status,
                feedback: app.notes || '',
                date: app.updatedAt,
            };
        });

        res.status(200).json(pendingUsers);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch pending applications", error: error.message });
    }
};

async function getAllApplications(req, res) {
    try {
        const apps = await OnboardingApplication.find({})
            .populate('User', 'email')
            .sort({ updatedAt: -1 });

        const userIds = apps.map((a) => a.User?._id).filter(Boolean);
        const profiles = await EmployeeProfile.find({ user: { $in: userIds } });
        const profileByUserId = new Map(profiles.map((p) => [String(p.user), p]));

        const results = apps.map((app) => {
            const profile = profileByUserId.get(String(app.User?._id));
            const firstName = profile?.preferredName || profile?.firstName || 'N/A';
            const lastName = profile?.lastName || '';
            return {
                _id: String(app._id),
                userId: String(app.User?._id || ''),
                name: `${firstName} ${lastName}`.trim(),
                email: app.User?.email || profile?.email || '',
                position: app.positionTitle || profile?.position || '',
                status: statusLabelMap[app.status] || 'Pending',
                rawStatus: app.status,
                date: app.updatedAt,
            };
        });

        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch applications", error: error.message });
    }
};

/**
 * 2.2 Approve or Reject an onboarding application with feedback.
 */
async function reviewApplication(req, res) {
  try {
    const { userId, status, feedback } = req.body;
    const statusMap = {
        Pending: 'in_review',
        Approved: 'approved',
        Rejected: 'rejected',
        in_review: 'in_review',
        approved: 'approved',
        rejected: 'rejected',
    };
    const targetStatus = statusMap[status];
    if (!userId || !targetStatus) {
        return res.status(400).json({ message: 'userId and valid status are required' });
    }

    const app = await OnboardingApplication.findOne({ User: userId });
    if (!app) {
        return res.status(404).json({ message: 'Onboarding application not found' });
    }

    app.status = targetStatus;
    if (targetStatus === 'rejected') {
        app.notes = (feedback || '').trim();
    }
    app.statusHistory.push({ status: targetStatus, changedAt: new Date() });
    await app.save();

    res.status(200).json({ message: `Application ${targetStatus}`, app });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

async function getApplicationDetail(req, res) {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ message: 'userId is required' });
        }

        const app = await OnboardingApplication.findOne({ User: userId })
            .populate('User', 'email username');
        const profile = await EmployeeProfile.findOne({ user: userId });

        if (!app && !profile) {
            return res.status(404).json({ message: 'Application not found' });
        }

        return res.status(200).json({ app, profile });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to fetch application detail', error: error.message });
    }
}

// --- SECTION 3: EMPLOYEE PROFILES ---
/**
 * 3.1 Get all approved employee profiles (with Search).
 */
async function getAllEmployees(req, res) {
    try {
        const { search } = req.query;
        const query = {};
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { preferredName: { $regex: search, $options: 'i' } },
            ];
        }

        const profiles = await EmployeeProfile.find(query).sort({ lastName: 1 });
        const userIds = profiles.map((p) => p.user);
        const users = await User.find({ _id: { $in: userIds }, role: 'employee' }).select('_id email');
        const userById = new Map(users.map((u) => [String(u._id), u]));

        const employees = profiles.map((p) => {
            const user = userById.get(String(p.user));
            const name = `${p.preferredName || p.firstName || ''} ${p.lastName || ''}`.trim();
            return {
                _id: String(p.user),
                name,
                ssn: p.ssn || '',
                phone: p.phones?.cell || '',
                email: user?.email || p.email || '',
                title: formatWorkAuthTitle(p),
                workAuthorization: p.workAuthorization || {},
            };
        });
        res.status(200).json(employees);
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching employee profiles", error: error.message });
    }
};

// --- SECTION 4: VISA STATUS MANAGEMENT ---
/**
 * 4.1 Get status of all OPT employees.
 */
async function getAllVisaStatus(req, res) {
    try {
        const profiles = await EmployeeProfile.find({});
        const userIds = profiles.map((p) => p.user).filter(Boolean);
        const users = await User.find({ _id: { $in: userIds } }).select('_id email');
        const userById = new Map(users.map((u) => [String(u._id), u]));

        const data = profiles.map((p) => {
            const endDate = p.workAuthorization?.endDate ? new Date(p.workAuthorization.endDate) : null;
            const startDate = p.workAuthorization?.startDate ? new Date(p.workAuthorization.startDate) : null;
            const daysLeft = endDate ? Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24)) : null;
            const user = userById.get(String(p.user));
            return {
                _id: String(p.user),
                name: `${p.preferredName || p.firstName || ''} ${p.lastName || ''}`.trim(),
                email: user?.email || p.email || '',
                title: formatWorkAuthTitle(p),
                startDate,
                endDate,
                daysLeft,
                nextStep: p.workAuthorization?.type === 'f1_cpt_opt' ? 'Upload OPT Receipt' : 'Review Documents',
                reviewStatus: p.workAuthorization?.reviewStatus || 'pending',
                reviewFeedback: p.workAuthorization?.reviewFeedback || '',
            };
        });

        res.status(200).json(data);
    } catch (error) {
    res.status(500).json({ message: "Failed to fetch visa status", error: error.message });
    }
};

/**
 * 4.2  Review specific visa document (Receipt, EAD, etc.)
 */
async function reviewVisaFile(req, res) {
    try {
        const { userId, status, feedback } = req.body;
        const normalizedStatus = String(status || '').toLowerCase();
        if (!userId || !['approved', 'rejected'].includes(normalizedStatus)) {
            return res.status(400).json({ message: 'userId and valid status are required' });
        }

        const updateData = {
            'workAuthorization.reviewStatus': normalizedStatus,
            'workAuthorization.reviewFeedback': normalizedStatus === 'rejected' ? (feedback || '') : '',
        };

        const updatedProfile = await EmployeeProfile.findOneAndUpdate(
            { user: userId },
            { $set: updateData },
            { new: true }
        );
        if (!updatedProfile) {
            return res.status(404).json({ message: 'Employee profile not found' });
        }

        res.status(200).json({ message: `Visa ${normalizedStatus}`, data: updatedProfile });
    } catch (error) {
        res.status(500).json({ message: 'Failed to review visa file', error: error.message });
    }
}

/**
 * 4.3  Send notification for next visa step
 */
async function sendVisaNotification(req, res) {
    try {
        const { email, name, nextStep } = req.body;
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Next Step: Visa Document',
            text: `Hello ${name}, please upload your ${nextStep} now.`
        });
        res.status(200).json({ message: 'Notification sent.' });
    } catch (error) {
        res.status(500).json({ error: 'Notification failed.' });
    }
}

module.exports = {
    sendInvitation,
    reviewApplication,
    getAllEmployees,
    getInvitationHistory,
    getPendingApplication,
    getAllApplications,
    getApplicationDetail,
    getAllVisaStatus,
    reviewVisaFile,
    sendVisaNotification,
};
