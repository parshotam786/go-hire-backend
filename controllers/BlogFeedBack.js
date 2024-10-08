const nodemailer = require("nodemailer");
const FeedBackBlog = require("../models/feedbackModel");

const BlogFeedBackController = async (req, res) => {
  const { name, email, message } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Name is required." });
  }
  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }
  if (!message) {
    return res.status(400).json({ error: "Message is required." });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).send({ error: "Invalid email format" });
  }
  try {
    const newFeedback = new FeedBackBlog({
      name,
      email,
      message,
    });

    await newFeedback.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "parshotamrughanii@gmail.com",
        pass: "walz hskf huzy yljv", // Use App Password for better security
      },
    });

    // Set up email options
    const mailOptions = {
      from: "parshotamrughanii@gmail.com",
      to: "parshotamrughanii@gmail.com", // Your email address
      subject: `Rentixx Feedback Received from ${name}`,
      text: `You have received new feedback from ${name} (${email}):\n\n"${message}"\n\nBest regards,\nYour Rentixx Team`,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    // Return success response
    res
      .status(200)
      .json({ success: true, message: "Feedback Sent Successfully!" });
  } catch (error) {
    console.error("Error saving feedback or sending email:", error);
    res.status(500).json({
      error: "An error occurred while saving feedback or sending email.",
    });
  }
};

module.exports = { BlogFeedBackController };
