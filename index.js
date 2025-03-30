// index.js (Main Server File)
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const cron = require('node-cron');
const mongoose = require('mongoose');
const { saveUserData, fetchWeatherAndSendUpdates } = require('./services');

const app = express();
app.use(bodyParser.json());
app.use(cors()); // Allow CORS from all origins

mongoose.connect('mongodb+srv://KrupeshVachhani:bL84obJrhkZ3VDB7@cluster0.kzvkzah.mongodb.net/weatherDB?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

app.post('/save', async (req, res) => {
    const result = await saveUserData(req.body);
    if (result.error) {
        return res.status(400).json({ error: result.error });
    }
    res.json({ message: 'Data saved successfully' });
});

cron.schedule('*/1 * * * *', fetchWeatherAndSendUpdates); // Runs every 2 minutes

app.listen(3000, () => console.log('Server running on port 3000'));

console.log('Run the following command to install required packages:');
console.log('npm install express body-parser cors node-cron mongoose axios nodemailer');

