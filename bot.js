const request = require('request');
const TelegramBot = require('node-telegram-bot-api');
const YTSCrawler = require('./index.js');

const Telegram = new TelegramBot(process.env.TELEGRAM_KEY, {polling: true});

let lastTorrents = [];


Telegram.onText(/\/start/, (msg, match) => {
  let response = `Hey ${msg.from.first_name},
  /news - Get last movies
  /download - Show .torrent list available
  /notify - Receive message when new movie is added`;

  Telegram.sendMessage(msg.chat.id, response);
});


Telegram.onText(/\/news/, (msg, match) => {
  Telegram.sendMessage(msg.chat.id, "Searching updates");

  YTSCrawler.getNews((err, torrents) => {
    lastTorrents = torrents;

    torrents.forEach(item => {
      if(item.title !== ''){
        Telegram.sendMessage(msg.chat.id, `${item.image}
${item.title}`);
      }
    });
  });
});

Telegram.onText(/\/notify/, (msg, match) => {
  Telegram.sendMessage(msg.chat.id, "Notifications ENABLED");
  Telegram.sendMessage(msg.chat.id, JSON.stringify(lastTorrents[0]));
});

Telegram.onText(/\/download/, (msg, match) => {
  let keyboard = lastTorrents.map((el) => {
    return [{ text: `/download ${el.title}` }];
  });

  Telegram.sendMessage(msg.chat.id, "Choose movie to download", {
    'reply_markup' : { keyboard: keyboard }
  });
});

Telegram.onText(/\/download (.*)/, (msg, match) => {
  console.log(match);
  Telegram.sendMessage(msg.chat.id, "Good choice")
});
