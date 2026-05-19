const express = require('express');
const nodemailer = require('nodemailer');
const db = require('../db/queries');
const validation = require('../middleware/validation');

const router = express.Router();

// Email transporter setup
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT == 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// POST /api/enroll
router.post('/', async (req, res) => {
  try {
    // Validate required fields
    const errors = validation.validateEnrollment(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    const {
      full_name, date_of_birth, gender, nationality, id_passport_number, phone,
      email, physical_address, city, country, german_level, target_exam_date,
      how_heard, occupation, primary_goals, prior_experience, motivation_statement,
      agreed_to_terms
    } = req.body;

    // Save to database
    const enrollmentId = await db.createEnrollment({
      full_name, date_of_birth, gender, nationality, id_passport_number, phone,
      email, physical_address, city, country, german_level, target_exam_date,
      how_heard, occupation, primary_goals, prior_experience, motivation_statement,
      agreed_to_terms: agreed_to_terms === 'on' || agreed_to_terms === true
    });

    // Send confirmation email to applicant
    const applicantEmail = {
      from: process.env.SCHOOL_EMAIL,
      to: email,
      subject: `✓ Enrollment Received — Wickman's Language School`,
      html: getApplicantEmailTemplate(full_name, german_level, target_exam_date)
    };

    // Send notification to school
    const adminEmail = {
      from: process.env.SCHOOL_EMAIL,
      to: process.env.SCHOOL_EMAIL,
      subject: `New Enrollment — ${full_name} · ${german_level}`,
      html: getAdminEmailTemplate(req.body, enrollmentId)
    };

    await Promise.all([
      transporter.sendMail(applicantEmail),
      transporter.sendMail(adminEmail)
    ]);

    res.json({
      success: true,
      message: 'Enrollment received. Check your email for confirmation.',
      id: enrollmentId
    });

  } catch (error) {
    console.error('Enrollment error:', error);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// Email templates
function getApplicantEmailTemplate(name, level, examDate) {
  return `
    <div style="font-family: Lato, sans-serif; max-width: 600px; margin: 0 auto; color: #0d1b2a;">
      <div style="background: #10283f; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-family: Playfair Display;">Wickman's Language School</h1>
        <p style="margin: 5px 0 0 0; opacity: 0.9;">German Language • Goethe-Institut Certified</p>
      </div>
      
      <div style="padding: 30px; background: white; border: 1px solid #e0e0e0; border-top: none;">
        <h2 style="color: #10283f; font-family: Playfair Display; margin-top: 0;">Danke schön, ${name}!</h2>
        <p style="font-size: 16px; line-height: 1.6;">Your enrollment has been received. We're excited to have you join us on this journey to German fluency and beyond.</p>
        
        <div style="background: #e8f4f8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #c9922a;">
          <h3 style="color: #10283f; margin-top: 0;">Your Enrollment Summary</h3>
          <p><strong>Level:</strong> ${level}</p>
          <p><strong>Target Exam Date:</strong> ${examDate || 'To be confirmed'}</p>
          <p style="font-size: 14px; opacity: 0.8; margin-bottom: 0;">Our team will contact you within 48 hours with next steps, payment details, and class schedule.</p>
        </div>
        
        <h3 style="color: #10283f; font-family: Playfair Display;">What's Next?</h3>
        <ol style="line-height: 2; color: #666;">
          <li>Check your email for a message from our admissions team</li>
          <li>Join our WhatsApp group for course updates and community</li>
          <li>Review the <a href="https://www.goetheharare.org/exam/" style="color: #c9922a; text-decoration: none;">official exam calendar</a></li>
          <li>Prepare for your 12-week intensive course!</li>
        </ol>
        
        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-top: 20px; text-align: center;">
          <p style="margin: 0; color: #666; font-size: 14px;">
            Have questions? <a href="https://wa.me/qr/UTCOXJZLFRMQO1" style="color: #25d366; text-decoration: none;">Chat with us on WhatsApp</a> or email <a href="mailto:info@wickmanslanguageschool.com" style="color: #c9922a; text-decoration: none;">info@wickmanslanguageschool.com</a>
          </p>
        </div>
      </div>
      
      <div style="background: #10283f; color: white; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px; opacity: 0.9;">
        <p style="margin: 5px 0;">&copy; 2026 Wickman's Language School · Victoria Falls, Zimbabwe</p>
        <p style="margin: 5px 0;">Opening Borders, One Word at a Time.</p>
      </div>
    </div>
  `;
}

function getAdminEmailTemplate(data, id) {
  return `
    <div style="font-family: Lato, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10283f; border-bottom: 2px solid #c9922a; padding-bottom: 10px;">New Enrollment Submission</h2>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr style="background: #e8f4f8;">
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Full Name</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">${data.full_name}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Email</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;"><a href="mailto:${data.email}">${data.email}</a></td>
        </tr>
        <tr style="background: #e8f4f8;">
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Phone</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">${data.phone}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Level</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;"><strong style="color: #c9922a;">${data.german_level}</strong></td>
        </tr>
        <tr style="background: #e8f4f8;">
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Target Exam Date</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">${data.target_exam_date}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Occupation</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">${data.occupation}</td>
        </tr>
        <tr style="background: #e8f4f8;">
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Source</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">${data.how_heard}</td>
        </tr>
      </table>
      
      <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h4 style="margin-top: 0; color: #10283f;">Motivation Statement</h4>
        <p style="color: #666; margin: 0;">${data.motivation_statement || '(Not provided)'}</p>
      </div>
      
      <p style="text-align: center; margin-top: 20px;">
        <a href="${process.env.SITE_URL}/admin/enrollments" style="background: #c9922a; color: white; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-weight: bold;">View All Enrollments</a>
      </p>
    </div>
  `;
}

module.exports = router;
