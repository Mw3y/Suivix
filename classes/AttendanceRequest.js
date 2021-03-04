/*
 * Copyright (c) 2020, MΛX! Inc.  All rights reserved.
 * Copyrights licensed under the GNU General Public License v3.0.
 * See the accompanying LICENSE file for terms.
 */
const Discord = require('discord.js'),
    Server = require('../utils/Server'),
    fs = require("fs"),
    moment = require('moment');

class AttendanceRequest {

    /**
     * Represents an attendance request
     * @param {*} id - The attendance request id
     * @param {Member} author - The attendance request author
     * @param {Date} date - The creation date of the attendance request
     * @param {Guild} guild - The attendance request guild
     * @param {TextChannel} - Where the attendance has been started
     */
    constructor(id, author, date, guild, channel) {
        this.id = id;
        this.author = author;
        this.date = date;
        this.guild = guild;
        this.channel = channel;

        //Cache guild members
        this.guild.members.fetch()
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
     * Returns the entire list of voice channels with their category in the guild that the user can see
     */
    getChannels() {
        const voiceChannels = this.guild.channels.cache.filter(channel => channel.type === "voice" && (this.author.id === Config.BOT_OWNER_ID ? true : channel.permissionsFor(this.author).has('VIEW_CHANNEL')));
        const channels = {};
        voiceChannels.sort(function (a, b) {
            return a.name.localeCompare(b.name);
        });
        voiceChannels.forEach(channel => channels[channel.id] = {
            category: (channel.parent ? channel.parent.name : undefined),
            name: channel.name,
            users: channel.members.size < 10 ? "0" + channel.members.size : channel.members.size
        })
        return channels;
    }

    /**
     * Returns the entire list of roles in the guild
     */
    getRoles() {
        const roles = {};
        this.guild.roles.cache.sort(function (a, b) {
            return a.name.localeCompare(b.name);
        });
        this.guild.roles.cache.forEach(role => roles[role.id] = {
            name: role.name,
            color: role.color,
            users: role.members.size < 10 ? "0" + role.members.size : role.members.size
        })
        return roles;
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
        console.log("Guild Invite - ".green + await getGuildInvite(this.guild).catch(err => console.log("Unable to get guild invite.".red + separator)) + separator);
        const TextTranslation = Text.suivix.translations[language];
        let statement = {
            success: true,
            title: TextTranslation.website.statement.success.title,
            description: TextTranslation.website.statement.success.dm,
            download: false,
            guild_id: this.guild.id,
            channel_id: this.channel ? this.channel.id : undefined
        };

        let parsedRoles = this.transformStringListIntoArray(roles, "roles");
        let parsedChannels = this.transformStringListIntoArray(channels, "channels");
        let students = this.getUsersFromRoles(parsedRoles); //fetch users with roles

        let channelsData = this.getChannelsPresents(parsedChannels, parsedRoles);
        let channelStudents = channelsData.get("data"); //fetch users in voice channels

        let rolesString = this.parseListIntoString(parsedRoles, TextTranslation.connector, true, this.channel === undefined ? true : false, "`@", "`");
        let channelsString = this.parseListIntoString(parsedChannels, TextTranslation.connector, false, true);
        let categoriesList = this.getCategoriesList(parsedChannels, TextTranslation.unknown);
        let categoriesString = this.parseListIntoString(categoriesList, TextTranslation.connector);
        let categories = categoriesString.length > 55 ? TextTranslation.errors.tooMuchCategories : categoriesString;
        let date = this.generateDate(timezone, language);

        let collection = students.filter(x => channelStudents.indexOf(x) === -1); //compare the two arrays
        let absents = Array.from(collection.values()); //Convert into an array
        absents.sort((a, b) => {return a.displayName.localeCompare(b.displayName)})
        let absentees = "";
        let absentsText = "";
        absents.forEach(member => absentees += 
            "• ❌ " + (member.displayName === member.user.username 
            ? member.user.username 
            : member.nickname + ` (@${member.user.username})`) + "\n"
        )
        if(absents.length > 0) absentsText += TextTranslation.infos.absentsList + "\n```" + absentees + "```";

        //Parsing TextTranslation
        const intro = TextTranslation.intro.formatUnicorn({
            username: this.author.toString(),
            role: rolesString
        });
        const presentSentence = TextTranslation.infos.presentsTotal.formatUnicorn({
            presents: channelStudents.length,
            total: students.length
        });
        const absentSentence = TextTranslation.infos.absentsTotal.formatUnicorn({
            absents: absents.length,
            total: students.length
        });

        let tooMuchStudents = false;
        let colors = parsedRoles.filter(role => role.color !== 0); //Getting colored roles
        const selectedColor = colors[Math.floor(Math.random() * colors.length)];
        const color = selectedColor ? selectedColor.color : 0; //Picking a random one
        const lists = absentsText.length > channelsData.get("text").length
                ? channelsData.get("text") + absentsText
                : absentsText + channelsData.get("text");

        //Send result to the user
        const resultMessage = await this[this.channel === undefined ? "author" : "channel"]
            .send(new Discord.MessageEmbed()
                .setTitle(TextTranslation.title + date)
                .setFooter(TextTranslation.credits) //send result
                .setDescription(intro + presentSentence + absentSentence + lists)
                .setColor(color)
                )
            .catch(function (err) {
                if(err.code == "50035") tooMuchStudents = true;
                console.log("⚠   Error while sending ".red + "ATTENDANCE_RESULT" + " message!".red + separator)
            });

        if (this.channel) statement.description = TextTranslation.website.statement.success.channel.formatUnicorn({
            channel: this.channel.name
        })

        if (!resultMessage) {
            statement.success = false;
            statement.title = TextTranslation.website.statement.errors.title;
            if (this.channel === undefined) statement.description = TextTranslation.website.statement.errors.unableToSendMessage;
            else statement.description = TextTranslation.website.statement.errors.unableToSendMessageInChannel;
        }

        if (tooMuchStudents) {
            statement.success = false;
            statement.title = TextTranslation.website.statement.errors.incomplete;
            statement.download = true;
            statement.description = TextTranslation.website.statement.errors.attendanceIsTooBig;
            this.generateCsvFileForDownload(TextTranslation.title + date, TextTranslation, this.id, students, channelsData.get("data"), rolesString, channelsString, categories, date);
        }

        if (statement.success) {
            console.log(
                "{username}#{discriminator}".formatUnicorn({
                    username: this.author.user.username,
                    discriminator: this.author.user.discriminator
                }).yellow +
                " has finished an attendance request.".blue +
                " (id: '{id}', server: '{server}')".formatUnicorn({
                    id: this.id,
                    server: this.guild.name
                }) + separator
            );
        }

        if (this.channel) await this.clearChannel(language); //Clear channel from unfinished suivix queries
        return statement;
    }

    /**
     * Generate a file containing the attendanc result
     * @param {*} id - The attendance id
     * @param {*} students - The student list
     * @param {*} presents - The present students
     */
    generateCsvFileForDownload(title, TextTranslation, id, students, presents, rolesString, channelsString, categories, date) {
        const data = [];
        students.sort((a, b) => {
            return a.displayName.localeCompare(b.displayName)
        })

        students.forEach(student => data.push({
            [TextTranslation.csv.user]: student.user.username + "#" + student.user.discriminator,
            [TextTranslation.csv.nickname]: student.displayName,
            [TextTranslation.csv.absent + "/" + TextTranslation.csv.present]: presents.find(user => user.id === student.user.id) ? TextTranslation.csv.present : TextTranslation.csv.absent,
        }))

        if (!fs.existsSync('files/results')) fs.mkdirSync("files/results", {
            recursive: true
        });
        fs.writeFileSync(Server.getCsvAttendanceResult(id), this.JSONToCSVConvertor(TextTranslation, students.length, presents.length, rolesString, channelsString, categories, date, data, true));
        console.log("An csv file has been generated.".blue + separator);

        //Send to discord
        this[this.channel === undefined? "author":"channel"]
        .send(title, {files: [Server.getCsvAttendanceResult(id)]});
    }

    /**
     * Convert json to csv format
     * @param {*} JSONData - The json array
     * @param {*} ShowLabel - Show or not the columns name
     */
    JSONToCSVConvertor(TextTranslation, studentsNb, presentsNb, rolesString, channelsString, categoriesString, date, JSONData, ShowLabel) {
        //If JSONData is not an object then JSON.parse will parse the JSON string in an Object
        var arrData = typeof JSONData != 'object' ? JSON.parse(JSONData) : JSONData;
        var CSV = 'sep=;' + '\r\n\n';
        //This condition will generate the Label/Header
        if (ShowLabel) {
            var row = "";
            //This loop will extract the label from 1st index of on array
            for (var index in arrData[0]) {
                //Now convert each value to string and comma-seprated
                row += index + ';';
            }
            row = row.slice(0, -1);
            //append Label row with line break
            CSV += row + '\r\n';
        }

        //1st loop is to extract each row
        for (var i = 0; i < arrData.length; i++) {
            var row = "";
            //2nd loop will extract each column and convert it in string comma-seprated
            for (var index in arrData[i]) {
                row += '"' + arrData[i][index] + '";';
            }
            row.slice(0, row.length - 1);
            //add a line break after each row
            CSV += row + '\r\n';
        }

        //Attendance infos
        CSV += "\r\n";
        CSV += [TextTranslation.csv.date] + ":;" + date.replace(new RegExp("`", 'g'), "") + "\r\n";
        CSV += [TextTranslation.csv.askedBy] + ":;" + this.author.displayName + "\r\n";
        CSV += [TextTranslation.csv.total] + ":;" + presentsNb + "/" + studentsNb + "\r\n";
        CSV += [TextTranslation.csv.roles] + ":;" + rolesString.replace(new RegExp("`", 'g'), "") + "\r\n";
        CSV += [TextTranslation.csv.categories] + ":;" + categoriesString.replace(new RegExp("`", 'g'), "") + "\r\n";
        CSV += [TextTranslation.csv.channels] + ":;" + channelsString + "\r\n";

        //Initialize file format you want csv or xls
        return CSV;
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
     * @param {String} stringList - The list
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
        let text = "";
        let channelUsers = "";
        for (let i = 0; i < channels.length; i++) {
            channelUsers = ""
            for (let a = 0; a < roles.length; a++) {
                const presents = Array.from(channels[i].members.filter(member => member.roles.cache.has(roles[a].id)).values()); //fetch users in the voice channel
                users.push(...presents); //Add it in in the array
                presents.sort((a, b) => {return a.displayName.localeCompare(b.displayName)})
                presents.forEach(member => channelUsers += 
                    "• ✅ " + (member.displayName === member.user.username 
                    ? member.user.username 
                    : member.nickname + ` (@${member.user.username})`) + "\n"
                )
            }
            const category = channels[i].parent ? channels[i].parent.name + " - " : "";
            if(channelUsers.length > 0) text += category + "**" + channels[i].name + "**:\n```" + channelUsers + "```";
        }
        return new Map().set("data", [...new Set(users)]).set("text", text); //Delete duplicated entries
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
     * Clear all suivix attendance request messages in the channel
     */
    async clearChannel(language) {
        let messages = await this.channel.messages.fetch({
            limit: 100
        }).catch(err => console.log("Unable to fetch channel messages.".red + separator));
        const guild = this.guild;
        messages.forEach(function (message) {
            if ((message.embeds.length > 0 && message.embeds[0].title != undefined)) {
                if (message.embeds[0].title.startsWith("Attendance Request") && language === "en") {
                    message.delete().catch(err => console.log("⚠   Error while deleting ".red + "ATTENDANCE_REQUEST" + " messages!".red + ` (server: '${guild.name}', language: 'en')` + separator));
                } else if (message.embeds[0].title.startsWith("Demande de suivi") && language === "fr") {
                    message.delete().catch(err => console.log("⚠   Error while deleting ".red + "ATTENDANCE_REQUEST" + " messages!".red + ` (server: '${guild.name}', language: 'fr')` + separator));
                }
            }
        })
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
        return dateString.charAt(0).toUpperCase() + dateString.slice(1);
    };
}
module.exports = AttendanceRequest;