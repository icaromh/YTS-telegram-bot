var async = require('async');
var scraperjs = require('scraperjs');

const URI = "https://yts.ag";
const TorrentList = [];
const TimeToUpdate = 5 * 1000;

const log = (msg) => {
  if(process.env.DEBUG)
    console.log(msg);
}

class Crawler {

  constructor(updateMovies){
    this.isSearching = false;
    this.router = new scraperjs.Router({
      firstMatch: true
    });

    this.mountScrapper();
    this.mountRouter();
    this.getLastest(updateMovies);

    setInterval(() => {
      if(!this.isSearching){
        log("Searching again ...");
        this.getLastest(updateMovies)
      }
    }, TimeToUpdate);

  }

  mountScrapper(){
    this.screpperTorrent = scraperjs.StaticScraper
      .create()
      .onStatusCode((statusCode, utils) => {
        if (statusCode !== 200) utils.stop();
      })
      .scrape($ => {
        let links = $('#movie-info .hidden-xs a[href^="https://yts.ag/torrent/download"]')
          .map((i, el) => {
            let format = $(el).attr('title').match(/([0-9].*)p|3D/ig);
            return {
              description: format[0],
              href: $(el).attr('href')
            }
          }).get();

        return {
          'image': $('#movie-poster img').attr('data-cfsrc'),
          'title': $('#movie-info h1').text().trim(),
          'links': links
        }
      })
      .then(torrent => torrent);
  }

  mountRouter(){
    this.router
      .on(url => {
        log(`getting ${url}`)
        return true;
      })
      .use(this.screpperTorrent);
  }

  getLastest(cb){
    this.isSearching = true;
    scraperjs
    .StaticScraper
    .create(URI)
    .scrape($ => {
      log('getting popular downloads')

      return $(".browse-movie-wrap")
        .map(function(){
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
          this.router.route(movie.link, (found, returned) => {
            if (found && returned) {
              TorrentList.push(returned);
            }
            done();
          });
        }, (err) => {
          this.isSearching = false;
          if (err) cb(err);
          cb(null, TorrentList);
        })
      });
  }

}


module.exports = Crawler
