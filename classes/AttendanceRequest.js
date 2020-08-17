/*
 * Copyright (c) 2020, MΛX! Inc.  All rights reserved.
 * Copyrights licensed under the GNU General Public License v3.0.
 * See the accompanying LICENSE file for terms.
 */
const Discord = require('discord.js'),
    moment = require('moment');

class Request {

    /**
     * Represents an attendance request
     * @param {*} id - The attendance request id
     * @param {Member} author - The attendance request author
     * @param {Date} date - The creation date of the attendance request
     * @param {Guild} guild - The attendance request guild
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
     * @param {String} channels - The voice channels
     * @param {String} roles - The roles
     * @param {String} timezone - The user timezone
     * @param {String} language - The user language
     */
    async doAttendance(channels, roles, timezone, language) {
        const TextTranslation = Text.suivix.translations[language];
        let statement = {
            success: true,
            title: TextTranslation.website.statement.success.title,
            description: TextTranslation.website.statement.success.description,
            guild_id: this.guild.id
        };

        let parsedRoles = this.transformStringListIntoArray(roles, "roles");
        let parsedChannels = this.transformStringListIntoArray(channels, "channels");
        let students = this.getUsersFromRoles(parsedRoles); //fetch users with roles
        let channelStudents = this.getChannelsPresents(parsedChannels, parsedRoles); //fetch users in voice channels

        let rolesString = this.parseListIntoString(parsedRoles, TextTranslation.connector, true, this.channel === undefined ? true : false, "`@", "`");
        let channelsString = this.parseListIntoString(parsedChannels, TextTranslation.connector, false, true);
        let categoriesList = this.getCategoriesList(parsedChannels, TextTranslation.unknown);
        let categoriesString = this.parseListIntoString(categoriesList, TextTranslation.connector);
        let categories = categoriesString.length > 55 ? TextTranslation.errors.tooMuchCategories : categoriesString;

        let absentsText = "";
        let presentsText = "";
        let absents;
        let presents;

        //Creating the list string of absents users
        let data = this.dataToString(TextTranslation.infos.noAbsent, TextTranslation.infos.absentsList, students, channelStudents);
        absentsText = data.get("text");
        absents = data.get("diff");

        //Creating the list string of presents users
        data = this.dataToString("", TextTranslation.infos.presentsList, students, absents);
        presentsText = data.get("text");
        presents = data.get("diff");

        //Parsing TextTranslation
        const intro = TextTranslation.intro.formatUnicorn({
            username: (this.author.displayName === this.author.user.username ? this.author.user.username : this.author.nickname + ` (@${this.author.user.username})`),
            category: categories,
            date: this.generateDate(timezone, language),
            role: rolesString
        });
        const presentSentence = TextTranslation.infos.presentsTotal.formatUnicorn({
            presents: presents.length,
            total: students.length
        });
        const absentSentence = TextTranslation.infos.absentsTotal.formatUnicorn({
            absents: absents.length,
            total: students.length
        });

        //Check if the message is too long to be send on Discord
        if ((intro + absentsText + presentsText + presentSentence + absentSentence).length >= 2048) {
            if (channelStudents.length !== students.length) {
                absentsText = TextTranslation.infos.absentsList + TextTranslation.errors.tooMuchAbsents; //Minimize TextTranslation
            } else if (presentUsers.length > 0) {
                presentsText = TextTranslation.infos.presentsList + TextTranslation.errors.tooMuchPresents; //Minimize TextTranslation
            }
        }

        let colors = parsedRoles.filter(role => role.color !== 0); //Getting colored roles
        const selectedColor = colors[Math.floor(Math.random() * colors.length)];
        const color = selectedColor ? selectedColor.color : 0; //Picking a random one

        //Send result to the user in dm
        const resultMessage = await this.author.send(new Discord.MessageEmbed().setTitle(TextTranslation.title + channelsString).setFooter(TextTranslation.credits) //send result
                .setDescription(intro + presentSentence + absentSentence + absentsText + presentsText).setColor(color))
            .catch(function (err) {
                console.log("⚠   Error while sending ".red + "ATTENDANCE_RESULT" + " message!".red + separator)
            });

        if(!resultMessage) {
            statement.success = false;
            statement.title = TextTranslation.website.statement.errors.title;
            statement.description = TextTranslation.website.statement.errors.unableToSendMessage;
        }

        if (statement.success) console.log(
            "{username}#{discriminator}".formatUnicorn({
                username: this.author.user.username,
                discriminator: this.author.user.discriminator
            }).yellow +
            " has finished an attendance request.".blue +
            " (id: '{id}', server: '{server}')".formatUnicorn({
                id: this.id,
                server: this.guild.name
            }) +
            separator
        );

        return statement;
    }

    /**
     * Convert data to a string
     * @param {String} basicSentence - The base sentence 
     * @param {String} sentence - The sentence if data is not null
     * @param {Discord.Collection} usersList - All the users
     * @param {Array} channelUsers - The users in the voice channel
     */
    dataToString(basicSentence, sentence, usersList, channelUsers) {
        const guild = this.guild;
        let text = basicSentence;
        let collection = usersList.filter(x => channelUsers.indexOf(x) === -1); //compare the two arrays
        let users = Array.from(collection.values()); //Convert into an array
        let usersName = new Array();
        for (let i = 0; i < users.length; i++) { //Create a list with all users name
            const user = guild.member(users[i]);
            usersName[i] = user.displayName + "#" + user.user.discriminator;
        }
        usersName.sort(); //Sort it A -> Z

        if (users.length > 0) { //If there is more than 1 user
            text = sentence; //Display the sentence when there is users
            for (let i in usersName) { //Create the list
                let user = users.find(u => (u.displayName + "#" + u.user.discriminator) === usersName[i]);
                let member = guild.member(user);
                text += "• " + (member.displayName === user.user.username ? user.user.username : member.nickname + ` (@${user.user.username})`) + "\n";
            }
            text += "```";
        }
        return new Map().set("text", text).set("diff", users);
    }

    /**
     * Returns the list of channels category
     * @param {Array} channels - The list
     * @param {String} unknown - "Unknown" translation
     */
    getCategoriesList(channels, unknown) {
        let categories = new Array();
        for (let i = 0; i < channels.length; i++) {
            categories.push(channels[i].parent === null ? unknown : channels[i].parent.name);
        }
        return categories;
    }

    /**
     * Transform id list into an array of discord roles/channels
     * @param {String} channels - The list
     * @param {String} type - Roles or Channels
     */
    transformStringListIntoArray(stringList, type) {
        const list = stringList.split("-");
        const guild = this.guild;
        let arrayList = new Array();
        for (let i = 0; i < list.length; i++) {
            arrayList.push(guild[type].cache.get(list[i])); //Add it in in the array
        }
        return arrayList;
    }

    /**
     * Returns all users in the channels
     * @param {*} channels - The channels list
     * @param {*} roles - The roles list
     */
    getChannelsPresents(channels, roles) {
        let users = new Array();
        for (let i = 0; i < roles.length; i++) {
            for (let a = 0; a < channels.length; a++) {
                const presents = channels[a].members.filter(member => member.roles.cache.has(roles[i].id)); //fetch users in the voice channel
                users.push(...Array.from(presents.values())); //Add it in in the array
            }
        }
        return [...new Set(users)]; //Delete duplicated entries
    }

    /**
     * Returns a list of users wich have at least one role of the roles list
     * @param {*} roles - The list
     */
    getUsersFromRoles(roles) {
        let users = new Array();
        const guild = this.guild;
        for (let i = 0; i < roles.length; i++) {
            const returned = guild.roles.cache.find(r => r.id === roles[i].id).members; //fetch user with the role
            users.push(...Array.from(returned.values())); //Add it in in the array
        }
        return [...new Set(users)]; //Delete duplicated entries
    }

    /**
     * Convert a list into a string like this : "value1, value2 and value3"
     * @param {*} list - The list
     * @param {*} sentence - The "and" traduction
     */
    parseListIntoString(list, sentence, toString = false, toName = false, startsWith = "", endsWith = "") {
        if (list.length === 1) {
            let value = list[0];
            if (toString) value = list[0].toString();
            if (toName) value = (list[0].name.includes("@everyone") ?
                "`" : startsWith) + list[0].name + endsWith;
            return value;
        } else {
            let string = "";
            for (let i = 0; i < list.length; i++) {
                let value = list[i];
                if (toString) value = list[i].toString();
                if (toName) value = (list[i].name.includes("@everyone") ?
                    "`" : startsWith) + list[i].name + endsWith;
                if (i < list.length - 2) {
                    string += value + ", ";
                } else if (i < list.length - 1) {
                    string += value + ` ${sentence} `;
                } else {
                    string += value;
                }
            }
            return string;
        }
    }

    /**
     * Parse the date
     * @param {*} timezone - The user timezone 
     * @param {*} language - The user language 
     */
    generateDate(timezone, lang) {
        if (timezone === undefined) timezone = "Europe/Paris";
        if (lang === undefined) lang = "fr";
        let dateString = moment(new Date()).tz(timezone).locale(lang).format("LLLL");
        return "`" + dateString.charAt(0).toUpperCase() + dateString.slice(1) + "`";
    };
}
module.exports = Request;