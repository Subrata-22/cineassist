import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendVerificationEmail = async (email, token) => {
  const verificationUrl =
    `http://localhost:5000/api/auth/verify-email/${token}`;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Verify your CineAssist account',
    html: `
      <h2>Welcome to CineAssist</h2>
      <p>Please verify your email by clicking below:</p>
      <a href="${verificationUrl}">
        Verify Email
      </a>
    `,
  });
};