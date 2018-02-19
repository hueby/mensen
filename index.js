var Telegraf = require("telegraf");
var bot = new Telegraf(process.env.BOT_TOKEN);

bot.start(function (ctx) {
    console.log('started: ' + ctx.from.id);
    return ctx.reply('Willkommen beim Speiseplan für UKS WA73 \n Versuche /help oder /hunger');
});

bot.command('help', function (ctx) { return ctx.reply('You shall not pass!'); });
bot.command('hunger', function (ctx) { return ctx.reply('Bald wird es hier den Speiseplan geben'); });
bot.startPolling();
