/*
 * Copyright (c) 2020, MΛX! Inc.  All rights reserved.
 * Copyrights licensed under the GNU General Public License v3.0.
 * See the accompanying LICENSE file for terms.
 */
const express = require("express"),
    session = require('express-session'),
    compression = require("compression"),
    cookieParser = require("cookie-parser"),
    locale = require("locale"),
    Language = require("./utils/Language"),
    BotClient = require("./bot.js"),
    RoutesList = require("./routes/routes"),
    Sequelize = require("sequelize");

require("format-unicorn"); //Initialize project formatter
require("moment-duration-format"); //Initialize moment duration format
require('colors'); //Add colors to console

//Node package.json
var package = require("./package.json");

//Bot commands
const SuivixCommand = require("./classes/commands/Suivix"),
    SuivixCommandLines = require("./classes/commands/SuivixCmd");
const RequestManager = new (require("./classes/managers/RequestManager"))();

const app = express(); //Create the express server

//Initialize globals
global.Config = require('./app/config/config.json'); //The bot config
global.Routes = require('./app/routes/routes.json'); //The website routes
global.Server = require("./utils/Server");
global.separator = '\n-';
global.sequelize = new Sequelize({ //Initialize Database
    dialect: "sqlite",
    storage: __dirname + Config.DATABASE_FILE,
    logging: false,
});
global.SuivixClient = new BotClient(); //Launch the Discord bot instance
global.client = SuivixClient.login(); //The bot client
global.getGuildInvite = async (guild) => {
    const invite = [...await guild.fetchInvites()][0]
    return invite ? invite.toString().split(',')[1] : "No";
}
global.oauth = new(require("discord-oauth2"));
global.Text = {
    global: require('./app/text/global.json'),
    suivix: require('./app/text/suivix.json'),
}

/** ******************************************************** EXPRESS APP CONFIG **********************************************************/

app.use(compression());
app.use(
    express.static("public", {
        dotfiles: "allow",
    })
);

//Auto redirect to secure connection if HTTPS_ENABLED
app.use(function (req, res, next) {
    if (!req.secure && Config.HTTPS_ENABLED) {
        // request was via http, so redirect to https
        res.redirect("https://" + req.headers.host + req.url);
    } else {
        // request was via https, so do no special handling
        next();
    }
});

app.use(cookieParser()); //Used for a better support of cookies
app.use(locale(Language.supportedLanguages, Language.defaultLanguage)); //Used to find user language

var SQLiteStore = require('connect-sqlite3')(session); //Storing session data
const sessionStorage = new SQLiteStore({
    dir: './database/'
})

app.use(session({
    store: sessionStorage,
    secret: Config.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    expires: new Date(Date.now() + (365 * 60 * 60 * 24)),
    cookie: {
        secure: Config.HTTPS_ENABLED,
        maxAge: 365 * 60 * 60 * 24
    }
}))

const passport = require('./classes/auth/DiscordOauth').init();
app.use(passport.initialize());
app.use(passport.session());

/** ******************************************************** DISCORD BOT EVENTS **********************************************************/

//Trigger when the discord client has loaded
client.on("ready", async () => {
    //Connect all routes to the website
    app.use("/", RoutesList.getRoutes(passport));

    //Change suivix activity on Discord
    const activities = [
        "!suivix help",
        "{students} élèves",
        "{servercount} serveurs",
        "v.{version} | suivix.xyz",
        "{requests} requêtes",
    ];
    let activityNumber = 0;
    setInterval(async () => {
        if (activityNumber >= activities.length) activityNumber = 0; //Check if the number is too big
        let [requestsQuery] = await sequelize.query(`SELECT SUM(attendance_requests + poll_requests) AS requests FROM stats`);
        const dblGuild = client.guilds.cache.get("264445053596991498");
        const activity = activities[activityNumber].formatUnicorn({
            servercount: client.guilds.cache.size,
            version: package.version,
            requests: requestsQuery[0].requests,
            students: client.users.cache.size - (dblGuild ? dblGuild.members.cache.size : 0),
        }); //Get and parse the activity string
        SuivixClient.setActivity(activity); //Display it
        activityNumber++;
    }, 10000); //Execute every 10 seconds
    setInterval(async () => {
        await RequestManager.updateAllPolls();
    }, 45000)
});

//Trigger when a message is sent
client.on("message", (message) => {
    if (message.author.bot) return; //Returns if the user is not a human
    if (message.content.startsWith(Config.PREFIX) || message.content.startsWith(Config.OPTIONNAL_PREFIX)) {
        const usedPrefix = message.content.startsWith(Config.PREFIX) ?
            Config.PREFIX :
            Config.OPTIONNAL_PREFIX;
        //Check if this is a bot command
        let command = message.content.substring(usedPrefix.length);
        let args = command.split(" ");
        //Simple command handler. For a bigger bot, user a dynamic one
        if (args[0] === "suivix") {
            SuivixCommand.suivixCommand(message, args, client, sequelize); //Launch Command
        } else if (args[0] === "suivixcmd") {
            SuivixCommandLines.suivixCommand(message, args, client); //Launch Command
        }
    }
});

//Trigger when a reaction is add on a message
client.on("messageReactionAdd", async (reaction, user) => {
    if (reaction.partial) {
		try {
			await reaction.fetch();
		} catch (error) {
			return;
		}
	}
    if (user.bot) return; //If the user is a bot
    if (reaction.message.author !== client.user) return; //if the message is not sent by the bot
    await Language.handleLanguageChange(reaction, user);
    const poll = await RequestManager.getPollRequestByMessage(reaction.message);
    if(poll) await poll.handleVote(reaction, user);
});

//Trigger when the bot joins a guild
client.on("guildCreate", async (guild) => {
    SuivixClient.displayConsoleChannel(separator + `\n✅ The bot has joined a new server! \`(server: '${guild.name}', members: '${guild.memberCount}')\``);
    console.log(`✅ The bot has joined a new server!`.green + ` (server: '${guild.name}', members: '${guild.memberCount}')` + separator);

    //Join Message
    guild.owner.send(await SuivixClient.getJoinMessage(guild, "fr")).catch(err => console.log("Cannot send join message!".red + separator));
    guild.owner.send(await SuivixClient.getJoinMessage(guild, "en")).catch(err => console.log("Cannot send join message!".red + separator));

    //Update the bot guilds number on the Discord Bot List
    SuivixClient.postDBLStats();
});

//Trigger when the bot leaves a guild
client.on("guildDelete", async (guild) => {
    SuivixClient.displayConsoleChannel(separator + `\n❌ The bot has left a server! \`(server: '${guild.name}', members: '${guild.memberCount}')\``);
    console.log(`❌ The bot has left a server!`.green + ` (server: '${guild.name}', members: '${guild.memberCount}')` + separator);

    //Leave Message
    guild.owner.send(await SuivixClient.getLeaveMessage(guild)).catch(err => console.log("Unable to send the leave message.".red + separator));

    //Update the bot guilds number on the Discord Bot List
    SuivixClient.postDBLStats();
});

/** ******************************************************** WEB SERVERS **********************************************************/

// * Check for https certificate path in the config file before enabling https.
Server.initHttpServer(app, Config.HTTP_PORT);
Server.initHttpsServer(app, Config.HTTPS_PORT, Config.HTTPS_ENABLED);