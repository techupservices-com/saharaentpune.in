require('dotenv').config();

const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(__dirname));

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 465,
  secure: String(process.env.SMTP_SECURE || 'true').toLowerCase() === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return char;
    }
  });
}

app.post('/api/contact', async (req, res) => {
  const name = String(req.body.name || '').trim();
  const company = String(req.body.company || '').trim();
  const email = String(req.body.email || '').trim();
  const phone = String(req.body.phone || '').trim();
  const service = String(req.body.service || '').trim();
  const message = String(req.body.message || '').trim();

  if (!name || !email || !phone || !message) {
    return res.status(400).json({
      ok: false,
      message: 'Please fill in name, email, phone, and message.',
    });
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return res.status(400).json({
      ok: false,
      message: 'Please enter a valid email address.',
    });
  }

  try {
    await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: process.env.MAIL_TO,
      replyTo: email,
      subject: `New website enquiry from ${name}`,
      text: [
        `Name: ${name}`,
        `Company: ${company || 'N/A'}`,
        `Email: ${email}`,
        `Phone: ${phone}`,
        `Service Interest: ${service || 'N/A'}`,
        '',
        'Message:',
        message,
      ].join('\n'),
      html: `
        <h2>New Website Enquiry</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Company:</strong> ${escapeHtml(company || 'N/A')}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
        <p><strong>Service Interest:</strong> ${escapeHtml(service || 'N/A')}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
      `,
    });

    await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: email,
      subject: 'We received your enquiry | Sahara Enterprises',
      text: [
        `Hello ${name},`,
        '',
        'Thank you for contacting Sahara Enterprises. We have received your enquiry and our team will get back to you shortly.',
        '',
        `Service Interest: ${service || 'Not specified'}`,
        `Phone: ${phone}`,
        '',
        'Your message:',
        message,
        '',
        'Regards,',
        'Sahara Enterprises',
        'contact@saharaentpune.in',
      ].join('\n'),
      html: `
        <h2>We Received Your Enquiry</h2>
        <p>Hello ${escapeHtml(name)},</p>
        <p>Thank you for contacting Sahara Enterprises. We have received your enquiry and our team will get back to you shortly.</p>
        <p><strong>Service Interest:</strong> ${escapeHtml(service || 'Not specified')}</p>
        <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
        <p><strong>Your Message:</strong></p>
        <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
        <p>Regards,<br>Sahara Enterprises<br>contact@saharaentpune.in</p>
      `,
    });

    return res.json({ ok: true, message: 'Enquiry sent successfully.' });
  } catch (error) {
    console.error('Failed to send enquiry email:', error);
    return res.status(500).json({
      ok: false,
      message: 'Unable to send enquiry right now. Please try again shortly.',
    });
  }
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Sahara Enterprises site listening on port ${port}`);
});
