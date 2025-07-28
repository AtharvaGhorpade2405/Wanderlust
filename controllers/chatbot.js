const { GoogleGenerativeAI } = require("@google/generative-ai");
const Listing = require("../models/listing");

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

module.exports.sendMessage = async (req, res) => {
  const { message } = req.body;
  const listings = await Listing.find({});
  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    // Get or initialize chat history in the session
    if (req.session.chatHistory.length === 0) {
      req.session.chatHistory = [
        {
          role: "user",
          parts: [
            {
              text: `Here are some listings:
              ${listings
                .map(
                  (listing) =>
                    listing.description +
                    "The url to this listing is: https://majorproject1-3-t8p8.onrender.com/listings/" +
                    listing._id
                )
                .join("\n")}.
              Also, don't send any tables in responses, stick to paragraphs.
              Remember, dont use tables, stick to paragraphs because I'm using you in a site of mine and if you send tables in responses, it destroys the structure of the chat window where you're place. Bold out some important words in the response too. If you're sending out bullet points in the response, do not indent the bullet points, it destroys the structure of the message. When a user asks about a listing, go through the listings in the above list of listings and answer accordingly, give them links to the listing wherever required. If they ask to plan a vacation, do it on your own without referencing the above listings. You are an assistant to the users of my website, if they ask you to do anything other than something related to travelling and listings, politely deny their request and say that you cannot answer such questions.`,
            },
          ],
        },
      ];
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const chat = model.startChat({
      history: req.session.chatHistory, // load previous history from session
      generationConfig: {
        temperature: 0.8,
      },
    });

    const result = await chat.sendMessage(message);
    const response = result.response.text();

    // Save the message and bot reply to session history
    req.session.chatHistory.push(
      { role: "user", parts: [{ text: message }] },
      { role: "model", parts: [{ text: response }] }
    );

    res.status(200).send(response);
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    res.status(500).json({ error: "Something went wrong." });
  }
};
