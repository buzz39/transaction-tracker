require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const cron = require('node-cron');

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

const allowedUsers = process.env.ALLOWED_USER_IDS.split(',');
const sheetDB_API = process.env.SHEETDB_API_URL;

function isAuthorized(msg) {
  return allowedUsers.includes(String(msg.from.id));
}

bot.onText(/\/invest (\d+)/, async (msg, match) => {
  if (!isAuthorized(msg)) return;
  const amount = match[1];
  const data = {
    data: {
      Date: new Date().toLocaleDateString(),
      Timestamp: new Date().toISOString(),
      Type: 'Invest',
      Amount: amount,
      Status: 'Pending'
    }
  };
  await axios.post(`${sheetDB_API}/Transactions`, data);
  bot.sendMessage(msg.chat.id, `✅ Investment of ₹${amount} logged.`);
});

// Extend for /return, /summary, /history, reminders similar to this pattern
