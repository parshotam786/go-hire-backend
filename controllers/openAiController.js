// pages/api/ask.js
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const OpenAIHandler = async (req, res) => {
  if (req.method === 'POST') {
    const { prompt } = req.body;

    try {
      // Ensure the correct API call and parameters are used
      const response = await openai.chat.completions.create({
        model: 'gpt-4o', // Make sure the model name is correct
        messages: [{ role: 'user', content: prompt }], // Format for chat completions
      });

      // Extract the response content
      const message = response.choices[0].message.content;

      res.status(200).json({success:true, message });
    } catch (error) {
      res.status(500).json({ success:false, error: error.message });
    }
  } else {
    res.status(405).json({ success:false, message: 'Method not allowed' });
  }
};

module.exports = { OpenAIHandler };
