/*
 * Copyright (c) 2020, MΛX! Inc.  All rights reserved.
 * Copyrights licensed under the GNU General Public License v3.0.
 * See the accompanying LICENSE file for terms.
 */
const AttendanceRequest = require('../AttendanceRequest'),
    PollRequest = require('../PollRequest'),
    Poll = require('../Poll');

/**
 * Represents a RequestManager
 * @param {*} client - The bot client
 * @param {*} sequelize - The database
 */
class RequestManager {

    /**
     * Fetch a request
     * @param {*} request - The request 
     */
    async getRequest(request) {
        if (!request || (Math.abs(new Date(request.date) - new Date()) / 36e5) > parseInt(Config.ATTENDANCE_VALIDITY_TIME)) return undefined;
        let guild = await client.guilds.cache.get(request.guild_id);
        if(!guild) return undefined;
        let channel = request.channel_id ? guild.channels.cache.get(request.channel_id) : undefined;
        let author = await guild.members.fetch(request.author);
        if(!author) return undefined;
        if (request.type === "attendance") return new AttendanceRequest(request.id, author, new Date(request.date), guild, channel);
        else return new PollRequest(request.id, author, new Date(request.date), guild, channel);
    }

    /**
     * Fetch a poll by its message
     * @param {*} message - The message 
     */
    async getPollRequestByMessage(message) {
        const [poll] = await sequelize.query(`SELECT * FROM poll WHERE messageId = ${message.id}`);
        if (!poll[0]) return undefined;
        return new Poll(poll[0]);
    }

    /**
     * Update all the polls which are not expired
     */
    async updateAllPolls() {
        const [polls] = await sequelize.query(`SELECT * FROM poll`);
        for(let i = 0; i < polls.length; i++) {
            await (new Poll(polls[i])).updateTimeLeft();
        }
    }

    /** 
     * Create a new request
     * @param {String} type - The request type (Attendance)
     * @param {*} timestamp - The timestamp when the user created the request
     * @param {Json} author - The request author
     * @param {String} guild_id - The guild id where the user started the request
     * @param {*} channel_id - The id of the channel were user started the poll (optional)
     * @param {*} message_id - The id of the message to edit for further modifications (optional)
     */
    async createNewRequest(type, timestamp, author, guild_id, channel_id = undefined, message_id = undefined) {
        console.log(`${author.username}#${author.discriminator}`.yellow + ` created a new ${type} request.`.blue + ` (id: '${timestamp}', server: '${guild_id}')` + separator);
        sequelize.query(`UPDATE stats SET ${type + "_requests"} = ${type + "_requests"} + 1`); //Update stats
        return {
            type: type,
            id: timestamp,
            author: author.id,
            date: new Date(),
            guild_id: guild_id,
            channel_id: channel_id,
            message_id: message_id,
        }
    }

    /**
     * Delete the request
     * @param {*} request - The request
     */
    deleteRequest(request) {
        console.log("⚠   A(n) ".red + request.type.red + " request has been deleted!".red + ` (id: ${request.id})` + separator);
        return undefined;
    }

}

module.exports = RequestManager;