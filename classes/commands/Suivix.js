/*
 * Copyright (c) 2020, MΛX! Inc.  All rights reserved.
 * Copyrights licensed under the GNU General Public License v3.0.
 * See the accompanying LICENSE file for terms.
 */
const Discord = require('discord.js'),
    UserManager = require('../managers/UserManager');

/**
 * Launch the command
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 * @param args - Arguments typed by the user in addition to the command
 * @param client - The bot client 
 */
const suivixCommand = async function (message, args, client, sequelize) {
    const user = await new UserManager().getUserById(message.author.id, "en");
    const language = user.language === "fr" ? "fr" : "en";
    const TextTranslation = Text.suivix.translations[language];

    let msg = (args.includes("help") || args.includes("aide")) ? await generateAttendanceHelpMessage(message.channel, message.author, TextTranslation) :
        await generateAttendanceRequestMessage(message.channel, message.author, TextTranslation);

    if (msg) {
        msg.react("🇫🇷").catch(err => console.log("Error while adding language reaction!".red + separator));
        msg.react("🇬🇧").catch(err => console.log("Error while adding language reaction!".red + separator));
    }
};

/**
 * Returns the message for the suivix command
 * @param {*} channel - The channel where the command was trigerred
 */
const generateAttendanceRequestMessage = async function (channel, author, Text) {
    return await channel.send(new Discord.MessageEmbed().setDescription(Text.request.description.formatUnicorn({
            protocol: getProtocol(),
            host: Config.WEBSITE_HOST,
            guild_id: channel.guild.id,
            channel_id: channel.id
        }))
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
const generateAttendanceHelpMessage = async function (channel, author, Text) {
    return await channel.send(Text.request.help.content, {
        embed: new Discord.MessageEmbed().setDescription(Text.request.help.description.formatUnicorn({
                host: Config.WEBSITE_HOST
            }))
            .setThumbnail("https://i.imgur.com/8qCFYLj.png")
            .setTitle(Text.request.help.title)
    }).catch((err) => {
        console.log("⚠   Error while sending message!".brightRed + separator);
        author.send(Text.request.unableToSendMessage);
    });
}

const getProtocol = function () {
    return Config.HTTPS_ENABLED ? "https" : "http";
}

module.exports.suivixCommand = suivixCommand;