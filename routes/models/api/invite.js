/*
 * Copyright (c) 2020, MΛX! Inc.  All rights reserved.
 * Copyrights licensed under the GNU General Public License v3.0.
 * See the accompanying LICENSE file for terms.
 */

module.exports = (req, res) => {
    res.redirect(`https://discordapp.com/oauth2/authorize?client_id=${Config.DISCORD_CLIENT_ID}&scope=bot&permissions=1476783216` + (req.query.guild_id ? '&guild_id=' + req.query.guild_id : ""));
};