/*
 * Copyright (c) 2020, MΛX! Inc.  All rights reserved.
 * Copyrights licensed under the GNU General Public License v3.0.
 * See the accompanying LICENSE file for terms.
 */
const Discord = require('discord.js'),
    moment = require('moment');

class Request {

    /**
     * Represents a poll request
     * @param {*} id - The poll request id
     * @param {Member} author - The poll request author
     * @param {Date} date - The creation date of the poll request
     * @param {Discord.Guild} guild - The poll request guild
     * @param {Discord.TextChannel} - The channel where the poll has been sent
     */
    constructor(id, author, date, guild) {
        this.id = id;
        this.author = author;
        this.date = date;
        this.guild = guild;
    }

    /**
     * Returns the attendance request id
     */
    getId() {
        return this.id;
    }

    /**
     * Returns the attendance request author
     */
    getAuthor() {
        return this.author;
    }

    /**
     * Returns the attendance request creation date
     */
    getDate() {
        return this.date;
    }

    /**
     * Returns the attendance request guild
     */
    getGuild() {
        return this.guild;
    }

    /**
     * Returns the entire list of voice channels in the guild that the user can see
     */
    getVoiceChannels() {
        return this.guild.channels.cache.filter(channel => channel.type === "voice" && channel.permissionsFor(this.author).has('VIEW_CHANNEL'));
    }

    /**
     * Returns the entire list of voice channels categories
     */
    getCategories(channels) {
        let channelsCategories = new Map();
        channels.forEach(function (c) {
            if (c.parent) {
                channelsCategories[c.id] = c.parent.name
            } else {
                channelsCategories[c.id] = "Unknown";
            }
        });
        return channelsCategories
    }

    /**
     * Returns the entire list of roles in the guild
     */
    getRoles() {
        return this.guild.roles.cache;
    }

    /**
     * Return the channel category
     * @param {Discord.VoiceChannel} channel - The voice channel
     */
    getCategory(channel, sentence) {
        return channel.parent === null ? sentence : channel.parent.name;
    }

    /**
     * Does the suivi
     * @returns {Json} - The statement of the request
     * @param {String} language - The user language
     */
    async sendPoll(language) {
        const TextTranslation = Text.poll.translations[language];
        let statement = {
            success: true,
            title: TextTranslation.website.statement.success.title,
            description: TextTranslation.website.statement.success.description,
            guild_id: this.guild.id
        };

        return statement;
    }
}
module.exports = Request;