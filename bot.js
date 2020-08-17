/*
 * Copyright (c) 2020, MΛX! Inc.  All rights reserved.
 * Copyrights licensed under the GNU General Public License v3.0.
 * See the accompanying LICENSE file for terms.
 */
const Discord = require("discord.js"),
    DBL = require("dblapi.js");

class BotClient {
    
    constructor() {
        this.client = new Discord.Client();
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
        let [dbUser] = await sequelize.query(`SELECT * FROM users WHERE id = "${guild.owner.id}"`);
        const language = !dbUser[0] ? "en" : dbUser[0].language;
        if (language === "fr")
            return new Discord.MessageEmbed().setTitle("Message Important")
                .setDescription(`Suivix vient de quitter le serveur Discord \`${guild.name}\` dont vous êtes propriétaire.`)
                .addField("\u200b", `Cette action est peut-être involontaire, si vous ne souhaitiez pas le départ de Suivix, vous pouvez le faire revenir en [cliquant ici](https://${Config.WEBSITE_HOST}/invite). Dans le cas contraire, si vous le souhaitez bien évidemment, pourriez-vous m'envoyer le motif qui vous a poussé à désinstaller Suivix en utilisant le formulaire de contact [disponible ici](https://${Config.WEBSITE_HOST}/fr#contact-section) ?`, false)
                .addField("\u200b", "Cordialement,\n\`Le Créateur De Suivix, MΛX\`", false)
                .setThumbnail("https://i.imgur.com/Q1rdarX.png");
        else
            return new Discord.MessageEmbed().setTitle("Important Message")
                .setDescription(`Suivix has left the Discord server \`${guild.name}\` which you own.`)
                .addField("\u200b", `This action may be involuntary, if you didn't want Suivix to leave, you can make him come back by [clicking here](https://${Config.WEBSITE_HOST}/invite). Otherwise, if you'd like to, could you send me the reason why you wanted to uninstall Suivix by using the contact form [available here](https://${Config.WEBSITE_HOST}/en#contact-section) ?`, false)
                .addField("\u200b", "Sincerely,\n\`The Suivix Creator, MΛX\`", false)
                .setThumbnail("https://i.imgur.com/Q1rdarX.png");

    }

    /**
     * Send the join message for Suivix
     * @param {*} guild - The guild wich the bot has joined
     */
    //TODO: Store in Json
    async getJoinMessage(guild, language) {
        if (language === "fr")
            return new Discord.MessageEmbed().setTitle("Message Important")
                .setDescription(`Suivix vient de rejoindre le serveur Discord \`${guild.name}\` dont vous êtes propriétaire. En cas de problème, vous trouverez toute l'aide dont vous avez besoin avec la commande \`${Config.PREFIX}suivix aide\`.`)
                .setThumbnail("https://i.imgur.com/QOh0nwk.png");
        else
            return new Discord.MessageEmbed().setTitle("Important Message")
                .setDescription(`Suivix has just joined the Discord server \`${guild.name}\` which you own. In case of problem, you will find all the help you need with the \`${Config.PREFIX}suivix help\` command.`)
                .setThumbnail("https://i.imgur.com/QOh0nwk.png");
    }

}

module.exports = BotClient;