require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const cron = require('node-cron');

// Error handling for required environment variables
const token = process.env.TELEGRAM_BOT_TOKEN;
const allowedUsersEnv = process.env.ALLOWED_USER_IDS;
const sheetDB_API = process.env.SHEETDB_API_URL;

if (!token) {
  throw new Error('Missing TELEGRAM_BOT_TOKEN in .env');
}
if (!allowedUsersEnv) {
  throw new Error('Missing ALLOWED_USER_IDS in .env');
}
if (!sheetDB_API) {
  throw new Error('Missing SHEETDB_API_URL in .env');
}

const bot = new TelegramBot(token, { polling: true });
const allowedUsers = allowedUsersEnv.split(',');

// In-memory session store
const userSessions = {};

function resetSession(userId) {
  delete userSessions[userId];
}

function isAuthorized(msg) {
  return allowedUsers.includes(String(msg.from.id));
}

const welcomeMessage = `👋 Welcome to the Transaction Tracker Bot!

You can use this bot to log and view your investment transactions.
Type /help to see the list of available commands.`;

const helpMessage = `📋 *Available Commands:*
/start - Show welcome message
/help - Show this help message
/invest <amount> - Log a new investment
/return <amount> - Log a return
/summary - Show a summary of your transactions
/history - Show your transaction history`;

bot.onText(/\/start/, (msg) => {
  if (!isAuthorized(msg)) return;
  bot.sendMessage(msg.chat.id, welcomeMessage);
});

bot.onText(/\/help/, (msg) => {
  if (!isAuthorized(msg)) return;
  bot.sendMessage(msg.chat.id, helpMessage, { parse_mode: 'Markdown' });
});

// Interactive /invest command
bot.onText(/\/invest$/, (msg) => {
  if (!isAuthorized(msg)) return;
  const userId = msg.from.id;
  userSessions[userId] = { type: 'Invest', step: 'amount' };
  bot.sendMessage(msg.chat.id, 'How much would you like to invest?');
});

// Interactive /return command
bot.onText(/\/return$/, (msg) => {
  if (!isAuthorized(msg)) return;
  const userId = msg.from.id;
  userSessions[userId] = { type: 'Return', step: 'amount' };
  bot.sendMessage(msg.chat.id, 'How much would you like to return?');
});

// Handle replies for interactive flows
bot.on('message', async (msg) => {
  if (!isAuthorized(msg)) return;
  const userId = msg.from.id;
  const session = userSessions[userId];
  if (!session) return;
  // Ignore commands
  if (msg.text.startsWith('/')) return;

  if (session.step === 'amount') {
    const amount = msg.text.trim();
    if (!/^[0-9]+$/.test(amount)) {
      bot.sendMessage(msg.chat.id, 'Please enter a valid number for the amount.');
      return;
    }
    session.amount = amount;
    session.step = 'note';
    bot.sendMessage(msg.chat.id, 'Please enter a note for this transaction, or type "skip" to leave it blank.');
    return;
  }
  if (session.step === 'note') {
    session.note = msg.text.trim().toLowerCase() === 'skip' ? '' : msg.text.trim();
    session.step = 'confirm';
    const summary = `You are about to log:\nType: ${session.type}\nAmount: ₹${session.amount}\nNote: ${session.note || '(none)'}\n\nConfirm?`;
    bot.sendMessage(msg.chat.id, summary, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'Yes', callback_data: 'confirm_yes' },
            { text: 'No', callback_data: 'confirm_no' }
          ]
        ]
      }
    });
    return;
  }
});

// Handle confirmation buttons
bot.on('callback_query', async (query) => {
  const userId = query.from.id;
  const session = userSessions[userId];
  if (!session) return;
  if (query.data === 'confirm_no') {
    bot.sendMessage(query.message.chat.id, 'Transaction cancelled.');
    resetSession(userId);
    return;
  }
  if (query.data === 'confirm_yes') {
    // Prepare data
    const data = {
      data: {
        Date: new Date().toISOString().split('T')[0],
        Timestamp: new Date().toISOString(),
        Type: session.type,
        Amount: session.amount,
        'Return Amount': '',
        Status: 'Pending',
        Notes: session.note || ''
      }
    };
    try {
      await axios.post(`${sheetDB_API}`, data);
      bot.sendMessage(query.message.chat.id, `✅ ${session.type} of ₹${session.amount} logged.`);
    } catch (error) {
      bot.sendMessage(query.message.chat.id, `❌ Failed to log ${session.type.toLowerCase()}. Please try again later.`);
    }
    resetSession(userId);
    return;
  }
});

bot.onText(/\/summary/, async (msg) => {
  if (!isAuthorized(msg)) return;
  try {
    console.log(`User ${msg.from.id} requested /summary`);
    const res = await axios.get(`${sheetDB_API}`);
    const transactions = res.data;
    console.log('Fetched transactions for summary:', transactions);
    let investTotal = 0;
    let returnTotal = 0;
    transactions.forEach((t) => {
      if (t.Type === 'Invest') investTotal += Number(t.Amount);
      if (t.Type === 'Return') returnTotal += Number(t.Amount);
    });
    const summary = `💼 *Summary:*\nTotal Invested: ₹${investTotal}\nTotal Returned: ₹${returnTotal}\nNet: ₹${investTotal - returnTotal}`;
    bot.sendMessage(msg.chat.id, summary, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error fetching summary:', error.response ? error.response.data : error.message);
    bot.sendMessage(msg.chat.id, '❌ Failed to fetch summary. Please try again later.');
  }
});

bot.onText(/\/history/, async (msg) => {
  if (!isAuthorized(msg)) return;
  try {
    console.log(`User ${msg.from.id} requested /history`);
    const res = await axios.get(`${sheetDB_API}`);
    const transactions = res.data;
    console.log('Fetched transactions for history:', transactions);
    if (!transactions.length) {
      bot.sendMessage(msg.chat.id, 'No transactions found.');
      return;
    }
    let history = '📜 *Transaction History:*\n';
    transactions.slice(-10).reverse().forEach((t) => {
      history += `\n${t.Date} | ${t.Type} | ₹${t.Amount} | ${t.Status}`;
    });
    bot.sendMessage(msg.chat.id, history, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error fetching history:', error.response ? error.response.data : error.message);
    bot.sendMessage(msg.chat.id, '❌ Failed to fetch history. Please try again later.');
  }
});
