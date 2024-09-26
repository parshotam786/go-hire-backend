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
      to: email, // Send to the user's email
      subject: "Thank you for your feedback!",
      text: `Dear ${name},\n\nThank you for your message! We appreciate your feedback:\n\n"${message}"\n\nBest regards,\nYour Rentixx Team`,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    // Return success response
    res.status(200).json({ message: "Feedback saved and email sent!" });
  } catch (error) {
    console.error("Error saving feedback or sending email:", error);
    res.status(500).json({
      error: "An error occurred while saving feedback or sending email.",
    });
  }
};

module.exports = { BlogFeedBackController };
