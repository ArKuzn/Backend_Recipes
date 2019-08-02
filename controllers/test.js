const moment = require('moment');
const request = require("request");
const cheerio = require("cheerio");

const calendarSiteUrl = `https://buh.ru/calendar/2019/`;

// array of 365/366 objects
const year = [];

const reducer = (accumulator, currentDate) => {
  if (!currentDate.is_holiday) {
    accumulator++
  }
  return accumulator;
}

request(calendarSiteUrl, async (error, response, body) => {
  if (!error) {
    const $ = cheerio.load(body);
    const datesHtml = $('.ui-datepicker-calendar tbody > tr td > a[data-day]');
    datesHtml.each(function (i, date) {
      try {
        dateObj = $(date).attr('data-day').split('_');
        dateObj = dateObj.join('-');
        year.push({ day: dateObj, is_holiday: !$(date).hasClass('dtype16474') });
      }
      catch (err) {
        console.log(err);
      }
    })
  } else {
    console.log("Произошла ошибка: " + error);
  }
})





const workTime = async function (req, res) {
  let userDated;
  if (req.query.dates) {
    userDated = req.query.dates.split('|');
  }
  let end = moment(userDated[1], 'YYYY-MM-DD');
  let start = moment(userDated[0], 'YYYY-MM-DD');
  let diffStart = start.diff(moment('01.01.2019', 'DD-MM-YYYY'), 'days');
  let diffEnd = end.diff(start, 'days');
  let days = year.slice(diffStart, diffEnd + diffStart + 1);
  workdays = days.reduce(reducer, 0);
  return res.status(200).json({ workdays })
}



module.exports = {
  workTime,

};
