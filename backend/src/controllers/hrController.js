const RegistrationToken = require('../models/RegistrationToken');
const User = require('../models/auth');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// --- SECTION 1: HIRING / INVITATIONS ---
/**
 * 1.1 Send an invitation email with a 3-hour token.
 */
async function sendInvitation(req, res) {
  try {
    const { email, name } = req.body;
    const token = crypto.randomBytes(20).toString('hex');
    await RegistrationToken.create({ token, email, name });
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Registration Invitation',
      text: `Click here to register: http://localhost:5173/signup?token=${token}`
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Invitation sent' });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
        const pendingUsers = await User.find({
            role: 'Employee',
            onboardingStatus: 'Pending'
        }).select('personalInfo.firstName personalInfo.lastName email onboardingStatus');
        res.status(200).json(pendingUsers);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch pending applications", error: error.message });
    }
};

/**
 * 2.2 Approve or Reject an onboarding application with feedback.
 */
async function reviewApplication(req, res) {
  try {
    const { userId, status, feedback } = req.body;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { onboardingStatus: status, feedback: feedback },
      { new: true }
    );

    res.status(200).json({ message: `Application ${status}`, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- SECTION 3: EMPLOYEE PROFILES ---
/**
 * 3.1 Get all approved employee profiles (with Search).
 */
async function getAllEmployees(req, res) {
    try {
        const {search} = req.query;
        let query = {role : 'Employee', onboardingStatus: 'Approved'};
        if (search) {
            query.$or = [
                { "personalInfo.firstName": { $regex: search, $options: 'i' } },
                { "personalInfo.lastName": { $regex: search, $options: 'i' } },
                { "personalInfo.preferredName": { $regex: search, $options: 'i' } }
            ]
        }
        const employees = await User.find(query)
        .select('personalInfo email ssn workAuthorizationTitle')
        .sort({"personalInfo.lastName" : 1});
        res.status(200).json(employees);
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching employee profiles" });
    }
};

// --- SECTION 4: VISA STATUS MANAGEMENT ---
/**
 * 4.1 Get status of all OPT employees.
 */
async function getAllVisaStatus(req, res) {
    try {
        const employees = await User.find({ "personalInfo.workAuthorization": "F1-OPT" })
        .select('personalInfo.firstName personalInfo.lastName visaStatus email');
    
    res.status(200).json(employees);
    } catch (error) {
    res.status(500).json({ message: "Failed to fetch visa status" });
    }
};

/**
 * 4.2  Review specific visa document (Receipt, EAD, etc.)
 */
async function reviewVisaFile(req, res) {
    try {
        const { userId, fileType, status, feedback } = req.body; 
        const updateData = {
            [`visaStatus.${fileType}.status`]: status,
            [`visaStatus.${fileType}.feedback`]: status === 'Rejected' ? feedback : ""
        };
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true }
        );
        if (!updatedUser) return res.status(404).json({ message: "Employee Not Found" });

        res.status(200).json({ message: `文件已标记为 ${status}`, data: updatedUser });
    } catch (error) {
        res.status(500).json({ message: "审批操作失败", error: error.message });
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
    getAllVisaStatus,
    reviewVisaFile,
    sendVisaNotification,
};