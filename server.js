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
        <div style="margin:0; padding:32px 16px; background:#f5faff; font-family:Arial,Helvetica,sans-serif; color:#0d1f35;">
          <div style="max-width:640px; margin:0 auto; background:#ffffff; border:1px solid #d6e8f5; border-radius:18px; overflow:hidden;">
            <div style="padding:24px 28px; background:linear-gradient(135deg,#0a6ebd,#0da8a0); color:#ffffff;">
              <div style="font-size:13px; letter-spacing:0.16em; text-transform:uppercase; opacity:0.85; margin-bottom:10px;">Sahara Enterprises</div>
              <h1 style="margin:0; font-size:28px; line-height:1.2;">We Received Your Enquiry</h1>
              <p style="margin:12px 0 0; font-size:15px; line-height:1.7; color:rgba(255,255,255,0.88);">Thank you for reaching out. Our team will review your request and get back to you shortly.</p>
            </div>
            <div style="padding:28px;">
              <p style="margin:0 0 18px; font-size:16px; line-height:1.7;">Hello ${escapeHtml(name)},</p>
              <p style="margin:0 0 22px; font-size:15px; line-height:1.8; color:#3a5572;">We have successfully received your enquiry through the Sahara Enterprises website. Below is a copy of the details you submitted for reference.</p>
              <div style="background:#f5faff; border:1px solid #d6e8f5; border-radius:14px; padding:20px 22px; margin-bottom:24px;">
                <div style="margin-bottom:12px; font-size:13px; color:#0da8a0; font-weight:700; letter-spacing:0.08em; text-transform:uppercase;">Submission Summary</div>
                <p style="margin:0 0 10px; font-size:14px; line-height:1.7;"><strong>Name:</strong> ${escapeHtml(name)}</p>
                <p style="margin:0 0 10px; font-size:14px; line-height:1.7;"><strong>Company:</strong> ${escapeHtml(company || 'Not specified')}</p>
                <p style="margin:0 0 10px; font-size:14px; line-height:1.7;"><strong>Email:</strong> ${escapeHtml(email)}</p>
                <p style="margin:0 0 10px; font-size:14px; line-height:1.7;"><strong>Phone:</strong> ${escapeHtml(phone)}</p>
                <p style="margin:0 0 10px; font-size:14px; line-height:1.7;"><strong>Service Interest:</strong> ${escapeHtml(service || 'Not specified')}</p>
                <p style="margin:0; font-size:14px; line-height:1.7;"><strong>Message:</strong><br>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
              </div>
              <p style="margin:0 0 18px; font-size:15px; line-height:1.8; color:#3a5572;">If you need to add anything else, simply reply to this email and our team will review it along with your enquiry.</p>
              <div style="padding:18px 20px; background:#0d1f35; border-radius:14px; color:#ffffff;">
                <div style="font-size:13px; letter-spacing:0.08em; text-transform:uppercase; color:#2dccc3; margin-bottom:8px;">Sahara Enterprises</div>
                <div style="font-size:14px; line-height:1.8; color:rgba(255,255,255,0.82);">Born to Achieve<br>contact@saharaentpune.in<br>+91 98603 00559</div>
              </div>
            </div>
          </div>
        </div>
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
