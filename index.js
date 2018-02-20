const Telegraf = require("telegraf");
const bot = new Telegraf(process.env.BOT_TOKEN);
const fetch = require('node-fetch')
const express = require('express')
const http = require('http');
const https = require('https');
var Parse = require('parse/node');

Parse.initialize(process.env.PARSE_APP_ID);
Parse.serverURL = process.env.PARSE_SERVER_URL;
var app = new express();
var server = http.createServer(app);
var port = process.env.PORT || 3000;
var URL = process.env.URL || 'http://localhost'

function getMealPlan() {
  return new Promise((res,rej) => {

    var Mensa = Parse.Object.extend("Mensa");
    var query = new Parse.Query(Mensa);
    query.find().then((canteens) => {
      canteens.forEach((canteen) => {
        // console.log(JSON.stringify(canteen));
        if(canteen.get("name") === "Wilhelmshöher Allee") {
          var d = new Date();
          var week = canteen.get("week");
          var day = d.getDay() - 1;
          if (day > 4) day = 0;
          var mealPlan = week[0].days[day].meals;
          // console.log(JSON.stringify(mealPlan[0].prices.student));
          mealPlan = mealPlan.map((meal, index) => ({
            id: parseInt(index),
            name: meal.description,
            price: parseFloat(meal.prices.student).toFixed(2) + "/" +
                   parseFloat(meal.prices.employees).toFixed(2) + "/" +
                   parseFloat(meal.prices.external).toFixed(2) + " €", 
            desc: meal.additions.join(", ")
          }))
          res(mealPlan);
        }
      });
    }).catch((error) => {
      rej(error);
    });
  });
}

app.get("/", (req,res) => {
  console.log("Hello");
});

server.listen(port, function() {
  console.log("listening on " + port);
});

setInterval(() => {
  https.get(URL);
}, 300000);

function fetchMealPlan () {
  return new Promise((res,rej) => {
    const meals = getMealPlan().then((meals) => {
      res(meals);
    });
  });
}

bot.start(function (ctx) {
    console.log('started: ' + ctx.from.id);
    return ctx.reply('Willkommen beim Speiseplan für UKS WA73 \n /plan für den heutigen Speiseplan');
});

bot.command('plan', async (ctx) => { 
  const meals = fetchMealPlan().then((meals) => {
    var res = "";

    meals.forEach((meal) => {
      res += "Essen " + (meal.id + 1) + "\n";
      res += meal.name + "\n";
      res += "Preis: " + meal.price + "\n";
      res += "(" + meal.desc + ")\n\n";
    });

    console.log("Processing command request");
    return ctx.reply(res); 
  });
});
// bot.command('hunger', function (ctx) { return ctx.reply('Bald wird es hier den Speiseplan geben'); });

bot.on('inline_query', async ({ inlineQuery, answerInlineQuery }) => {
  const meals = fetchMealPlan().then((meals) => {
    const results = meals.map((meal) => ({
      type: 'article',
      id: meal.id,
      message_text: meal.name + " für " + meal.price + " (" + meal.desc + ")",
      title: meal.price,
      description: meal.name + " (" + meal.desc + ")"
    }))
    console.log("Processing inline request");
    return answerInlineQuery(results, {cache_time: 0})
  });
})

bot.startPolling();

process.on('SIGTERM', function () {
  bot.stop(() => {
    console.log("Closed bot");
    server.close(function () {
      console.log("Closed server");
      process.exit(0);
    });
  });
});
