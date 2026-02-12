const nodemailer = require('nodemailer');

const sendEmail = async (email, token) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

// !!register page
  const url = `http://localhost:5173/register?token=${token}`;

  const mailOptions = {
    from: `"HR Department" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Employee Registration Invitation',
    html: `
      <p>Hello,</p>
      <p>You have been invited to join our company. Please click the link below to register your account:</p>
      <a href="${url}">${url}</a>
      <p>This link will expire in 3 hours.</p>
    `,
  };

  return await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;