const axios = require('axios');

const chatWithGPT = async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ message: "Formato dei messaggi non valido" });
  }

  try {
    const openaiResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: messages,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        }
      }
    );

    const reply = openaiResponse.data.choices[0].message;
    res.json(reply);

  } catch (error) {
    console.error("Errore GPT:", error.response?.data || error.message);
    res.status(500).json({ message: 'Errore durante la risposta AI', error: error.message });
  }
};

module.exports = { chatWithGPT };
