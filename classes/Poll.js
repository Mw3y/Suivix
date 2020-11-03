/*
 * Copyright (c) 2020, MΛX! Inc.  All rights reserved.
 * Copyrights licensed under the GNU General Public License v3.0.
 * See the accompanying LICENSE file for terms.
 */
const Discord = require('discord.js'),
    Server = require('../utils/Server'),
    moment = require('moment'),
    fs = require('fs'),
    {
        CanvasRenderService
    } = require('chartjs-node-canvas');

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
        this.language = poll.language;

        //Fetch message
        this.guild = client.guilds.cache.get(this.guildId);
        this.channel = this.guild.channels.cache.get(this.channelId);
    }

    /**
     * Handle the vote action
     * @param {*} reaction 
     * @param {*} user 
     */
    async handleVote(reaction, user) {
        if (!this.isExpired()) {
            if (this.canVote(reaction, user) && this.reactionIsValid(reaction)) {
                if (await this.getNumberOfVote(user) === 0) this.saveVote(reaction, user);
                else this.updateVote(reaction, user);
                await this.updatePoll(reaction);
            }
            await reaction.users.remove(user).catch(error => this.anonymous === "true" ? user.send(new Discord.MessageEmbed().setColor("#faa61a").setTitle(Text.poll.translations[this.language].polls.warning).setDescription(Text.poll.translations[this.language].polls.privacyError)) : "");
        } else {
            await this.deletePoll();
            await reaction.users.remove(user).catch(error => console.log("Unable to remove user's reaction from the message".red + separator));
        }
    }

    /**
     * Check if the reaction is part of the poll
     * @param {*} reaction 
     */
    reactionIsValid(reaction) {
        return reaction.users.cache.map(user => user.id).includes(client.user.id);
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
    async updateTimeLeft(doNotDelete = false) {
        const message = await this.channel.messages.fetch(this.messageId).catch(err => console.log("Unable to fetch message".red + separator));
        if(!message) return;
        const isExpired = this.isExpired();
        if (isExpired && doNotDelete) {
            message.embeds[0].color = "#f04747";
            message.embeds[0].fields[2].value = "0s";
            message.embeds[0].setTitle(message.embeds[0].title + " (" + Text.poll.translations[this.language].expired + ")");
        } else {
            message.embeds[0].fields[2].value = this.getTimeLeft(this.expiresAt);
        }
        if (message) await message.edit(message.embeds[0]);
        if (isExpired && !doNotDelete) this.deletePoll();
    }

    /**
     * Delete the poll from the database
     */
    async deletePoll() {
        await this.sendPollResult();
        await sequelize.query(`DELETE FROM poll WHERE messageId = ${this.messageId}`);
        await sequelize.query(`DELETE FROM vote WHERE messageId = ${this.messageId}`);
        console.log("A poll has been deleted!".red + "(author: " + this.author + ", pollId: " + this.messageId + ")" + separator);
        await this.updateTimeLeft(true)
    }

    /**
     * Send the results of the poll
     */
    async sendPollResult() {
        const [votes] = await sequelize.query(`SELECT * FROM vote WHERE messageId = "${this.messageId}"`);
        const message = await this.channel.messages.fetch(this.messageId).catch(err => console.log("Unable to fetch message".red + separator));
        if(!message) return;
        const resultsEmbed = new Discord.MessageEmbed();
        let possibleAnswers = {
            "1": "1️⃣",
            "2": "2️⃣",
            "3": "3️⃣",
            "4": "4️⃣",
            "5": "5️⃣",
            "6": "6️⃣",
            "7": "7️⃣",
            "8": "8️⃣",
            "9": "9️⃣",
            "10": "🔟"
        }

        let resultsText = "";
        let choices = [];
        let labels = [];
        for (let i = 1; i <= this.answers; i++) {
            const answers = votes.filter(entry => entry.vote === possibleAnswers[i]);
            labels.push(i);
            choices.push(answers.length);
            if (answers.length !== 0) resultsText += possibleAnswers[i] + " - "
            for (let a = 0; a < answers.length; a++) {
                const guildMember = this.guild.members.cache.get(answers[a].author);
                if (guildMember) resultsText += guildMember.displayName + ", ";
            }
            if (answers.length !== 0) resultsText += "\n"
        }

        await this.generatePollResultChart(labels, choices);
        resultsEmbed.setTitle(Text.poll.translations[this.language].resultsTitle)
            .setDescription((this.anonymous === "false" ? resultsText : Text.poll.translations[this.language].isAnonymous) + "\n\n" +
                Text.poll.translations[this.language].url + "(" + message.url + ").")
            .setColor("#FFD983")
            .attachFiles(['./files/polls/' + this.messageId + '.png'])
            .setImage("attachment://" + this.messageId + ".png");

        if (this.publicResult === "true") await this.channel.send(resultsEmbed);
        else await this.guild.members.cache.get(this.author).user.send(resultsEmbed);
    }

    /**
     * Generates the chart image for the poll result
     * @param {*} labels - The possibble answers
     * @param {*} choices - Users's choice
     */
    async generatePollResultChart(labels, choices) {
        const canvasRenderService = new CanvasRenderService(600, 400, (Chart) => {
            Chart.plugins.register({
                beforeDraw: function (chartInstance) {
                    var ctx = chartInstance.chart.ctx;
                    ctx.fillStyle = "rgb(32, 34, 37)";
                    ctx.fillRect(0, 0, chartInstance.chart.width, chartInstance.chart.height);
                }
            });

            Chart.plugins.register({
                beforeDraw: function (c) {
                    var legends = c.legend.legendItems;
                    legends.forEach(function (e) {
                        e.fillStyle = 'rgb(32, 34, 37)';
                    });
                }
            });

            Chart.defaults.global.defaultFontColor = 'white';
            Chart.defaults.global.defaultFontSize = 10;
            Chart.defaults.global.defaultFontFamily = 'Montserrat';
        });

        const configuration = {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: '\u200b',
                    data: choices,
                    backgroundColor: this.random_palette(),
                    borderWidth: 0
                }]
            },
            options: {
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero: true,
                            userCallback: function (label) {
                                // when the floored value is the same as the value we have a whole number
                                if (Math.floor(label) === label) {
                                    return label;
                                }

                            },
                        }
                    }]
                }
            }
        };

        const dataUrl = await canvasRenderService.renderToDataURL(configuration);
        let base64Image = dataUrl.split(';base64,').pop();
        if (!fs.existsSync('files/polls')) fs.mkdirSync("files/polls", {
            recursive: true
        });
        fs.writeFileSync(Server.getPollResult(this.messageId), base64Image, {
            encoding: 'base64'
        });
    }

    /**
     * Returns a random color palette for the chart
     */
    random_palette() {
        const colors = {
            1: ["#f08080", "#f4978e", "#f8ad9d", "#fbc4ab", "#ffdab9", "#50514f", "#59ffa0", "#ffed65", "#93b7be", "#f1fffa"],
            2: ["#8a2100", "#621708", "#941b0c", "#bc3908", "#f6aa1c", "#ffe2d1", "#e1f0c4", "#6bab90", "#55917f", "#fefffe"],
            3: ["#efd9ce", "#dec0f1", "#b79ced", "#957fef", "#7161ef", "#26547c", "#ef476f", "#06d6a0", "#169873", "#190e4f"]
        };
        return colors[Math.floor(Math.random() * (3 - 1 + 1)) + 1];
    }

    /**
     * Save a vote to the database
     * @param {*} reaction 
     */
    async saveVote(reaction, user) {
        await sequelize.query(`INSERT INTO vote (messageId, author, vote) VALUES (${this.messageId},${user.id},"${reaction.emoji.name}")`);
        console.log("A vote has been saved! ".blue + "(user: " + user.username + ", pollId: " + this.messageId + ")" + separator);
        user.send(new Discord.MessageEmbed().setColor("#43b581").setTitle(Text.poll.translations[this.language].polls.voteSaved).setDescription(Text.poll.translations[this.language].polls.voteSavedDescription)).catch(error => console.log("User's dms are closed!".red + separator))
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
        console.log("A vote has been updated! ".blue + "(user: " + user.username + ", pollId: " + this.messageId + ")" + separator);
        user.send(new Discord.MessageEmbed().setColor("#202225").setTitle(Text.poll.translations[this.language].polls.voteUpdated).setDescription(Text.poll.translations[this.language].polls.voteUpdatedDescription)).catch(error => console.log("User's dms are closed!".red + separator))
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
            arrayList.push(...this.guild.roles.cache.get(list[i]).members.map(member => member.id)); //Add it in in the array
        }
        return arrayList;
    }

}
module.exports = Poll;