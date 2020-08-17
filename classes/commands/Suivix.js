/*
 * Copyright (c) 2020, MΛX! Inc.  All rights reserved.
 * Copyrights licensed under the GNU General Public License v3.0.
 * See the accompanying LICENSE file for terms.
 */
const Discord = require('discord.js'),
    RequestManager = require('../managers/RequestManager');

/**
 * Launch the command
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 * @param args - Arguments typed by the user in addition to the command
 * @param client - The bot client 
 */
const suivixCommand = async function(message, args, client, sequelize) {
    const guild = message.guild;
    const channel = message.channel;
    const author = message.author;

    let [dbUser] = await sequelize.query(`SELECT * FROM users WHERE id = "${author.id}"`, {
        raw: true
    });
    if (!dbUser[0])[dbUser] = await createUser(author, guild, sequelize);

    const language = dbUser[0].language === "fr" ? "fr" : "en";
    const TextTranslation = Text.suivix.translations[language];

    let msg = (args.includes("help") || args.includes("aide")) ? await generateAttendanceHelpMessage(channel, author, TextTranslation) :
        await generateAttendanceRequestMessage(channel, author, TextTranslation);

    if (msg) {
        msg.react("🇫🇷");
        msg.react("🇬🇧");
    }
};

/**
 * Add a user in the database
 * @param {*} author - The command author
 */
async function createUser(author, server, sequelize) {
    console.log("A new user has been created in database : ".blue + '{username}#{discriminator}'.formatUnicorn({ username: author.username, discriminator: author.discriminator }).yellow + ".".blue + " (on server '{server}')".formatUnicorn({ server: server.name }) + separator);
    await sequelize.query(`INSERT INTO users (id, language) VALUES (${author.id}, "fr")`);
    return await sequelize.query(`SELECT * FROM users WHERE id = "${author.id}"`, {
        raw: true
    });
}

/**
 * Returns the message for the suivix command
 * @param {*} channel - The channel where the command was trigerred
 */
const generateAttendanceRequestMessage = async function(channel, author, Text) {
    return await channel.send(new Discord.MessageEmbed().setDescription(Text.request.description.formatUnicorn({ protocol: getProtocol(), host: Config.WEBSITE_HOST, guild_id: channel.guild.id }))
        .setImage("https://i.imgur.com/QbiPChv.png")
        .setTitle(Text.request.title)).catch((err) => {
        console.log("⚠   Error while sending message!".brightRed + separator);
        author.send(Text.request.unableToSendMessage)
    });
}

/**
 * Returns the help message for the suivix command
 * @param {*} channel - The channel where the command was trigerred
 */
const generateAttendanceHelpMessage = async function(channel, author, Text) {
    return await channel.send(Text.request.help.content, {
        embed: new Discord.MessageEmbed().setDescription(Text.request.help.description.formatUnicorn({ host: Config.WEBSITE_HOST }))
            .setThumbnail("https://i.imgur.com/8qCFYLj.png")
            .setTitle(Text.request.help.title)
    }).catch((err) => {
        console.log("⚠   Error while sending message!".brightRed + separator);
        author.send(Text.request.unableToSendMessage);
    });
}

const getProtocol = function() {
    return Config.HTTPS_ENABLED ? "https" : "http";
}

module.exports.suivixCommand = suivixCommand;