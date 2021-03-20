/*
 * Copyright (c) 2020, MΛX! Inc.  All rights reserved.
 * Copyrights licensed under the GNU General Public License v3.0.
 * See the accompanying LICENSE file for terms.
 */
const Discord = require("discord.js"),
    DBL = require("dblapi.js"),
    UserManager = require("./classes/managers/UserManager");

class BotClient {

    /**
     * The discord bot
     */
    constructor() {
        this.client = new Discord.Client({
            partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
            ws: {
                intents: new Discord.Intents(Discord.Intents.ALL - Discord.Intents.FLAGS["GUILD_PRESENCES"])
            }
        });
        this.handleLogs();
    }

    /**
     * Send a message in the channel "console" of the bot main server
     * @param {String} message
     */
    displayConsoleChannel(message) {
        this.client.guilds.cache
            .get(Config.MAIN_SERVER_ID)
            .channels.cache.get(Config.CONSOLE_CHANNEL_ID)
            .send(message)
            .catch((err) => console.log("⚠   Error while sending ".red + "CONSOLE_MESSAGE" + " message!".red + ` (server: '${guild.name}')` + separator));
    }

    /**
     * Set the bot activity text
     * @param {String} activity - The activity text
     * @param {*} args - Optionals arguments
     */
    setActivity(activity) {
        this.client.user
            .setActivity(activity, {
                type: "WATCHING",
            })
            .catch(console.error);
    }

    /**
     * Launch the bot instance for Discord
     */
    login() {
        var suivixArt =
            "────────────────────────────────────\n   _____         _         _       \n  / ____|       (_)       (_)      \n | (___   _   _  _ __   __ _ __  __\n  \\___ \\ | | | || |\\ \\ / /| |\\ \\/ /\n  ____) || |_| || | \\ V / | | >  < \n |_____/  \\__,_||_|  \\_/  |_|/_/\\_\\\n────────────────────────────────────\nSuivix Bot Client has been launched !" + separator;
        this.client.login(Config.DISCORD_CLIENT_TOKEN);
        console.log(suivixArt.gray.bold);
        if (Config.TOPGG_API_TOKEN) {
            this.dbl = new DBL(Config.TOPGG_API_TOKEN, this.client);
            console.log("Discord Bot List API initialized!" + separator);
        }
        return this.client;
    }

    /**
     * Upload the bot guilds count on DBL
     */
    postDBLStats() {
        if (Config.TOPGG_API_TOKEN) this.dbl.postStats(this.client.guilds.cache.size).catch((err) => console.log("Unable to post top.gg stats."));
    }

    /**
     * Send the leave message for Suivix
     * @param {*} guild - The guild wich the bot has left
     */
    async getLeaveMessage(guild) {
        const user = await new UserManager().getUserById(guild.owner.id);
        const text = Text.global.translations[user.language].messages;
        return new Discord.MessageEmbed().setTitle(text.title)
            .setDescription(text.leave.description.formatUnicorn({
                guildName: guild.name
            }))
            .addField("\u200b", text.leave.field1.formatUnicorn({
                host: Config.WEBSITE_HOST,
                protocol: Config.HTTPS_ENABLED ? "https" : "http",
                guildId: guild.id
            }), false)
            .addField("\u200b", text.leave.field2, false)
            .setThumbnail("https://i.imgur.com/Q1rdarX.png");
    }

    /**
     * Send the join message for Suivix
     * @param {*} guild - The guild wich the bot has joined
     */
    async getJoinMessage(guild, language) {
        const text = Text.global.translations[language].messages;
        return new Discord.MessageEmbed().setTitle(text.title)
            .setDescription(text.join.formatUnicorn({
                guildName: guild.name,
                prefix: Config.PREFIX
            }))
            .setThumbnail("https://i.imgur.com/QOh0nwk.png");
    }

    /**
     * Write logs into a folder (Code from https://github.com/DraftBot-A-Discord-Adventure/DraftBot)
     */
    async handleLogs() {
        const fs = require('fs');
        const now = new Date();
        const originalConsoleLog = console.log;

        /* Remove old logs (> 7 days) */
        fs.readdir('files/logs', function (err, files) {
            if (err) {
                console.log('Unable to scan directory: ' + err);
                return;
            }
            files.forEach(function (file) {
                const parts = file.split('-');
                if (parts.length === 5) {
                    if (now - new Date(parseInt(parts[1]), parseInt(parts[2]) - 1, parseInt(parts[3])) > 7 * 24 * 60 * 60 * 1000) { // 7 days
                        fs.unlink('files/logs/' + file, function (err) {
                            if (err !== undefined && err !== null) {
                                originalConsoleError("Error while deleting files/logs/" + file + ": " + err);
                            }
                        });
                    }
                }
            });
        });

        /* Find first available log file */
        let i = 1;
        do {
            global.currLogsFile = 'files/logs/logs-' + now.getFullYear() + "-" + ("0" + (now.getMonth() + 1)).slice(-2) + "-" + ("0" + now.getDate()).slice(-2) + "-" + ("0" + i).slice(-2) + ".txt";
            i++;
        } while (fs.existsSync(global.currLogsFile));

        /* Add log to file */
        const addConsoleLog = function (message) {
            let now = new Date();
            let dateStr = "[" + now.getFullYear() + "/" + ("0" + (now.getMonth() + 1)).slice(-2) + "/" + ("0" + now.getDate()).slice(-2) + " " + ("0" + now.getHours()).slice(-2) + ":" + ("0" + now.getMinutes()).slice(-2) + ":" + ("0" + now.getSeconds()).slice(-2) + "]\n";
            try {
                fs.appendFileSync(global.currLogsFile, dateStr + message.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '') + "\n", new function (err) {
                    if (err !== undefined) {
                        originalConsoleError("Error while writing in log file: " + err);
                    }
                });
            } catch {
                originalConsoleLog(message);
            }
        };

        /* Console override */
        console.log = function (message, optionalParams) {
            addConsoleLog(message);
            originalConsoleLog(message, optionalParams === undefined ? "" : optionalParams);
        };
        const originalConsoleWarn = console.warn;
        console.warn = function (message, optionalParams) {
            addConsoleLog(message);
            originalConsoleWarn(message, optionalParams === undefined ? "" : optionalParams);
        };
        const originalConsoleInfo = console.info;
        console.info = function (message, optionalParams) {
            addConsoleLog(message);
            originalConsoleInfo(message, optionalParams === undefined ? "" : optionalParams);
        };
        const originalConsoleDebug = console.debug;
        console.debug = function (message, optionalParams) {
            addConsoleLog(message);
            originalConsoleDebug(message, optionalParams === undefined ? "" : optionalParams);
        };
        const originalConsoleError = console.error;
        console.error = function (message, optionalParams) {
            addConsoleLog(message);
            originalConsoleError(message, optionalParams === undefined ? "" : optionalParams);
        };
        const originalConsoleTrace = console.trace;
        console.trace = function (message, optionalParams) {
            addConsoleLog(message);
            originalConsoleTrace(message, optionalParams === undefined ? "" : optionalParams);
        };
    }

}

module.exports = BotClient;