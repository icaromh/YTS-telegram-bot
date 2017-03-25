const request = require('request');
const TelegramBot = require('node-telegram-bot-api');
const Crawler = require('./crawler.js');

const Telegram = new TelegramBot(process.env.TELEGRAM_KEY, {polling: true});

let lastTorrents = [];
let usersToNotify = [];

/* REMOVE ON DEPLOY */
const fs = require('fs');
let list = fs.readFileSync('./mock/torrents.js');
lastTorrents = JSON.parse(list.toString());
/* REMOVE ON DEPLOY */

let crawler = new Crawler((err, found) => {
  if(lastTorrents.length === 0){
    lastTorrents = found;
  }

  if(JSON.stringify(lastTorrents) === JSON.stringify(found)){
    console.log("Nothing new"); // do not update
    return;
  }

  let differ = found.filter(m => {
    let movie = lastTorrents.find(t => t.title === m.title);
    if(movie === undefined){
      console.log('do not exists ', m.title);
      return m;
    }
  });

  differ.forEach(movie => {
    // lastTorrents.pop();
    // lastTorrents.splice(0,1, movie);

    usersToNotify.forEach(user => {
      Telegram.sendPhoto(user, movie.image, {
        caption: `${movie.title}`
      });

      movie.links.map(l => {
        Telegram.sendMessage(user, `${l.description}: ${l.href}`);
      });
    })
  })

});

Telegram.onText(/\/news/, (msg, match) => {
  Telegram.sendMessage(msg.chat.id, "Searching updates", {
    disable_notification: true,
  });

});

Telegram.onText(/\/start/, (msg, match) => {
  let response = `Hey ${msg.from.first_name},
  /list - Show .torrent list available
  /notify - Receive message when new movie is added
  /download [movie name] - Get .torrent links for all resolutions
  `;

  Telegram.sendMessage(msg.chat.id, response, {
    disable_notification: true,
  });
});

Telegram.onText(/\/notify/, (msg, match) => {
  let userInList = usersToNotify.findIndex(u => u === msg.chat.id);

  if(userInList !== -1){
    delete usersToNotify[userInList];
    Telegram.sendMessage(msg.chat.id, "Notifications are now DISABLED");
    return;
  }

  usersToNotify.push(msg.chat.id);
  Telegram.sendMessage(msg.chat.id, "Notifications are now ENABLED");
});

Telegram.onText(/\/list/, (msg, match) => {
  let keyboard = lastTorrents.map(el => [{ text: `/download ${el.title}` }]);

  Telegram.sendMessage(msg.chat.id, "Choose movie to download", {
    'one_time_keyboard': true,
    resize_keyboard: true,
    'reply_markup' : { keyboard: keyboard }
  });
});

Telegram.onText(/\/download (.*)/, (msg, match) => {
  let title = match[1];
  let movie = lastTorrents.find(m => m.title === title);

  if (!movie) {
    Telegram.sendMessage(msg.chat.id, "Movie not Found :(");
    return;
  }

  Telegram.sendPhoto(msg.chat.id, movie.image, {
    caption: `${movie.title}`
  });

  let links = movie.links.map(l => {
    Telegram.sendMessage(msg.chat.id, `${l.description}: ${l.href}`);
  });

});
