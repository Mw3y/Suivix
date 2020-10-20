/*
 * Copyright (c) 2020, MΛX! Inc.  All rights reserved.
 * Copyrights licensed under the GNU General Public License v3.0.
 * See the accompanying LICENSE file for terms.
 */
const Discord = require('discord.js'),
    moment = require('moment');

class Poll {

    /**
     * Represents a poll
     */
    constructor(poll) {
        this.messageId = poll.messageId;
        this.channelId = poll.channelId;
        this.guildId = poll.guildId;
        this.author = poll.author;
        this.roles = poll.roles;
        this.expiresAt = poll.expiresAt;
        this.answers = poll.answers;
        this.anonymous = poll.anonymous;
        this.publicResult = poll.publicResult;
    }

    /**
     * Handle the vote action
     * @param {*} reaction 
     * @param {*} user 
     */
    async handleVote(reaction, user) {
        if (!this.isExpired()) {
            if(this.canVote(reaction, user)) {
                if (await this.getNumberOfVote(user) === 0) this.saveVote(reaction, user);
                else this.updateVote(reaction, user);
                await this.updatePoll(reaction);
            }
        } else {
            await this.deletePoll();
        }
        await reaction.users.remove(user);
    }

    /**
     * Check if the user has the rigth to vote
     * @param {*} reaction 
     * @param {*} user 
     */
    canVote(reaction, user) {
        return this.getUserListFromRoles(this.roles, reaction.message.guild).includes(user.id);
    }

    /**
     * Update the poll message
     * @param {*} reaction 
     */
    async updatePoll(reaction) {
        const [number] = await sequelize.query(`SELECT count(*) AS number FROM vote WHERE messageId = ${this.messageId}`);
        reaction.message.embeds[0].setFooter(reaction.message.embeds[0].footer.text.split("•")[0] + "• " + number[0].number + " vote(s)")
        reaction.message.embeds[0].fields[2].value = this.isExpired() ? "0s" : this.getTimeLeft(this.expiresAt);
        await reaction.message.edit(reaction.message.embeds[0]);
    }

    /**
     * Update the poll message
     */
    async updateTimeLeft(doNotDelete = false, msg) {
        let message = msg;
        if(!message) {
            const guild = client.guilds.cache.get(this.guildId);
            const channel = guild.channels.cache.get(this.channelId);
            message = await channel.messages.fetch(this.messageId);    
        }
        const isExpired = this.isExpired();
        if(isExpired) {
            message.embeds[0].color = "#f04747";
            message.embeds[0].fields[2].value = "0s";
        } else {
            message.embeds[0].fields[2].value = this.getTimeLeft(this.expiresAt);
        }
        if (message) await message.edit(message.embeds[0]);
        if(isExpired && !doNotDelete) this.deletePoll();
    }

    /**
     * Delete the poll from the database
     */
    async deletePoll() {
        await this.sendResult();
        await sequelize.query(`DELETE FROM poll WHERE messageId = ${this.messageId}`);
        await sequelize.query(`DELETE FROM vote WHERE messageId = ${this.messageId}`);
        console.log("A poll has been deleted!".red + separator);
        await this.updateTimeLeft(true)
    }

    /**
     * Send the results of the poll
     */
    async sendResult() {

    }

    /**
     * Save a vote to the database
     * @param {*} reaction 
     */
    async saveVote(reaction, user) {
        await sequelize.query(`INSERT INTO vote (messageId, author, vote) VALUES (${this.messageId},${user.id},"${reaction.emoji.name}")`);
        console.log("A vote has been saved!".blue + separator);
    }

    /**
     * How many votes the user has on this poll
     * @param {*} reaction 
     */
    async getNumberOfVote(user) {
        let [numberOfVoteByThisUserOnThisPoll] = await sequelize.query(`SELECT count(*) AS number FROM vote WHERE	author = ${user.id} AND messageId = ${this.messageId}`);
        return numberOfVoteByThisUserOnThisPoll[0].number;
    }

    /**
     * Update a vote
     * @param {*} user 
     */
    async updateVote(reaction, user) {
        sequelize.query(`UPDATE vote SET vote = "${reaction.emoji.name}" WHERE author = ${user.id} AND messageId = ${this.messageId}`);
        console.log("A vote has been updated!".blue + separator);
    }

    /**
     * If the poll is expired
     */
    isExpired() {
        return parseInt(this.getTimeLeft(this.expiresAt)) <= 0;
    }

    /**
     * Returns the time left before the poll expires
     */
    getTimeLeft(expiresAt) {
        var ms = moment(expiresAt).diff(moment(new Date()));
        var d = moment.duration(ms);
        var s = d.format("hh[h]mm:ss[s]");
        return s;
    }

    /**
     * Transform id list into an array of discord roles/channels
     * @param {String} stringList - The list
     * @param {String} guild - The guild where the poll is
     */
    getUserListFromRoles(stringList, guild) {
        const list = stringList.split("-");
        let arrayList = new Array();
        for (let i = 0; i < list.length; i++) {
            arrayList.push(...guild.roles.cache.get(list[i]).members.map(member => member.id)); //Add it in in the array
        }
        return arrayList;
    }

}
module.exports = Poll;