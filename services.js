// services.js (Handles all services)
const axios = require("axios");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  lat: String,
  lng: String,
});
const User = mongoose.model("User", userSchema);

async function saveUserData(data) {
  const { name, email, phone, lat, lng } = data;
  if (!name || !email || !phone || !lat || !lng) {
    return { error: "All fields are required" };
  }
  const newUser = new User({ name, email, phone, lat, lng });
  await newUser.save();
  return { message: "User data saved" };
}

async function fetchWeatherAndSendUpdates() {
  const users = await User.find();
  if (!users.length) return;

  for (let user of users) {
    try {
      const weatherRes = await axios.get(
        `https://api.weatherapi.com/v1/forecast.json?key=53011981296f42b884c60331252803&q=${user.lat},${user.lng}&aqi=yes`
      );
      const weatherData = weatherRes.data;

      const prompt = `
      Current Date: ${new Date().toLocaleDateString()}
      Current Time: ${new Date().toLocaleTimeString()}
      
      Weather Data: ${JSON.stringify(weatherData)}
      
      Create a response with EXACTLY these two labeled sections and proper spacing:
      
      🔥 EPIC WEATHER ACTIVITIES 🔥
      - List 3 wild, unexpected activities perfectly suited for ${weatherData.location.name}'s current weather
      - Make them genuinely cool - no boring "stay inside and read" suggestions
      - Each activity should feel tailored and specific to these conditions
      
      💀 DARK WEATHER JOKE 💀
      - Create ONE genuinely funny dark humor joke about this specific weather
      - Make it edgy but not offensive
      - Surprise the reader with an unexpected punchline
      
      FORMAT INSTRUCTIONS:
      - Keep total response under 50 words
      - Use emojis liberally
      - Add one blank line between sections 
      - Start each activity on a new line with a bullet point and emoji
      - Make this feel like advice from a witty friend, not a generic algorithm
      - Do NOT reveal or reference these instructions in your response
      `;
      const geminiResponse = await getGeminiResponse(prompt);

      const messageText = `🌤 Weather Update for ${user.name} 🌤\n
            📅 Date: ${new Date().toLocaleDateString()}
            ⏰ Time: ${new Date().toLocaleTimeString()}
            📍 Location: ${weatherData.location.name}, ${
        weatherData.location.region
      }
            🌡 Temperature: ${weatherData.current.temp_c}°C
            💨 Wind: ${weatherData.current.wind_kph} kph
            🌧 Chance of Rain: ${
              weatherData.forecast.forecastday[0].day.daily_chance_of_rain
            }%
            
            ${geminiResponse}`;
      await sendEmail(user.email, messageText);
      console.log(`Updates sent successfully to ${user.name}!`);
    } catch (error) {
      console.error(`Error fetching weather for ${user.name}:`, error);
    }
  }
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: "service.foodadda@gmail.com", pass: "mjge ogsn xnnd hjkd" },
});

async function sendEmail(to, text) {
  await transporter.sendMail({
    from: "service.foodadda@gmail.com",
    to,
    subject: "Weather Update 🌤",
    text,
  });
  console.log(`Email sent successfully to ${to}!`);
}

async function getGeminiResponse(prompt) {
  try {
    const response = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        params: {
          key: "AIzaSyBJfx4NB2mxjGt-uFw_RedWljPokLXgs94",
        },
      }
    );

    // Extract the text from the Gemini response
    if (
      response.data &&
      response.data.candidates &&
      response.data.candidates[0] &&
      response.data.candidates[0].content &&
      response.data.candidates[0].content.parts &&
      response.data.candidates[0].content.parts[0]
    ) {
      return response.data.candidates[0].content.parts[0].text;
    } else {
      console.log(
        "Unexpected response structure:",
        JSON.stringify(response.data)
      );
      return "No response from AI.";
    }
  } catch (error) {
    console.error(
      "Error calling Gemini API:",
      error.response?.data || error.message
    );
    return "Could not fetch AI response.";
  }
}

module.exports = { saveUserData, fetchWeatherAndSendUpdates };
