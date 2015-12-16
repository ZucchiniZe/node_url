'use strict';

const koa = require('koa');
const Router = require('koa-router');
const views = require('koa-views');
const bodyParser = require('koa-bodyparser');
const mongoose = require('koa-mongoose');
const url = require('url');

const customMiddleware = require('./middleware.js');
const Link = require('./models/Link.js');

const app = koa();
const router = Router();

const port = process.env.PORT || 3000;
let mongo = url.parse(process.env.MONGOLAB_URI || 'mongodb://:@127.0.0.1:27017/link_shortener');

mongo.auth = {
  user: mongo.auth.split(':')[0],
  pass: mongo.auth.split(':')[1]
};
mongo.pathname = mongo.pathname.slice(1);

app.use(customMiddleware());

app.use(bodyParser());

app.use(views('views', {
  map: { html: 'swig' }
}));

app.use(router.routes());
app.use(router.allowedMethods());

app.use(mongoose({
  user: mongo.auth.user,
  pass: mongo.auth.pass,
  host: mongo.hostname,
  port: mongo.port,
  database: mongo.pathname,
  db: {
    native_parser: true
  },
  server: {
    poolSize: 1
  }
}));

router.get('/', function* () {
  this.state.hostname = this.href;
  this.state.links = yield Link.find({}).limit(this.query.limit || 8).sort('-created_at');

  yield this.render('index');
});

router.post('/', function* () {
  let url = this.request.body.url;
  let short = this.request.body.short;
  let desc = this.request.body.desc;
  let old_link = yield Link.findOne({ long_url: url });

  this.body = this.href;

  if(!old_link) {
    if(url.length > 0) {
      let link;

      if(!short) {
        link = new Link({
          long_url: url,
          desc: desc
        });
      } else {
        link = new Link({
          long_url: url,
          short_url: short,
          desc: desc
        });
      }

      yield link.saveQ();

      this.body += link.short_url;
    } else {
      this.body = 'at least give me a url';
    }
  } else {
    old_link.creation_trys++;
    yield old_link.saveQ();

    this.body += old_link.short_url;
  }
});

router.get('/s/:url', function* () {
  this.state.link = yield Link.findOne({ short_url: this.params.url });
  yield this.render('stats');
});

router.get('/:url', function* (next) {
  if(this.params.url.length > 0) {
    let link = yield Link.findOne({ short_url: this.params.url });

    link.hits++;
    yield link.saveQ();

    this.redirect(link.long_url);
  } else {
    yield next;
  }
});

app.listen(port);
