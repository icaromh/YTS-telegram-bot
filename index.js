var async = require('async');
var scraperjs = require('scraperjs');

const URI = "https://yts.ag";
const TorrentList = [];

const log = (msg) => {
  if(process.env.DEBUG)
    console.log(msg);
}

var router = new scraperjs.Router({
  firstMatch: true
});

const screpperTorrent = scraperjs.StaticScraper
  .create()
  .onStatusCode((statusCode, utils) => {
    if (statusCode !== 200) utils.stop();
  })
  .scrape($ => {
    let links = $('#movie-info .hidden-xs a[href^="https://yts.ag/torrent/download"]')
      .map((i, el) => {
        return {
          description: $(el).attr('title'),
          href: $(el).attr('href')
        }
      })
      .get();

      return {
        'image': $('#movie-poster img').attr('data-cfsrc'),
        'title': $('#movie-info h1').text().trim(),
        'links': links
      }
    })
    .then(torrent => torrent);

router
  .on(url => {
    log(`getting ${url}`)
    return true;
  })
  .use(screpperTorrent);

function getNews(cb){
  scraperjs
  .StaticScraper
  .create(URI)
  .scrape($ => {
    log('getting popular downloads')

    return $(".browse-movie-wrap")
      .map(function(){
        log($(this).find('.browse-movie-title').text());
        return {
          image: URI + $(this).find('.img-responsive').attr('data-cfsrc'),
          link: $(this).find('.browse-movie-link').attr('href'),
          name: $(this).find('.browse-movie-title').text().trim()
        }
      })
      .get();
  })
    .then(news => {
      async.eachLimit(news, 2, (movie, done) => {
        router.route(movie.link, (found, returned) => {
          if (found && returned) {
            TorrentList.push(returned);
          }
          done();
        });
      }, (err) => {
        if (err) cb(err);
        cb(null, TorrentList);
      })
    });
}


module.exports = {
  getNews: getNews
}
