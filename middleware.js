'use strict';

function timing(next) {
  return function* (next) {
    let start = new Date;
    yield next;
    let ms = new Date - start;
    this.set('X-Respose-Time', ms + 'ms');
    console.log('%s %s - %sms', this.method, this.url, ms);
  };
};

module.exports = timing;
