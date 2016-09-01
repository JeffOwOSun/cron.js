var cron = require('./cron.js');
var moment = require('moment-timezone');

var tg = cron.TimeGroup(cron.exampleRules);
console.log('rules:', cron.exampleRules);
console.log('start stop:', cron.exampleStart, cron.exampleStop);
console.log(tg.enumerate(cron.exampleStart, cron.exampleStop).map(function(date){
  return moment(date).tz('Asia/Hong_Kong').format('YYYY-MM-DD HH:mm:ss z');
}));
