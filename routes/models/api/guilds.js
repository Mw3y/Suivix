/*
 * Copyright (c) 2020, MΛX! Inc.  All rights reserved.
 * Copyrights licensed under the GNU General Public License v3.0.
 * See the accompanying LICENSE file for terms.
 */

module.exports = async(req, res) => {
    if (!req.session.passport.user.identity) {
        res.status(404).json({
            error: "Unknown User"
        })
    } else {
        if (!req.session.passport.user.lastFetchedGuilds) req.session.passport.user.lastFetchedGuilds = new Date(Date.now() - 2000 * 60);
        var diff = ((new Date().getTime() - new Date(req.session.passport.user.lastFetchedGuilds).getTime()) / 1000) / 60;
        if (!req.session.passport.user.guilds || diff > 0.2) {
            const guilds = await oauth.getUserGuilds(req.session.passport.user.ticket.access_token);
            let array = [];
            for (var k in guilds) {
                guilds[k].suivix = client.guilds.cache.get(guilds[k].id) ? true : false;
                array[k] = guilds[k];
            }

            array.sort(function(a, b) {
                return a.name.localeCompare(b.name);
            })
            array.sort(function(a, b) {
                if (a.suivix == b.suivix) return 0;
                if (b.suivix) return 1
                return -1;
            });
            req.session.passport.user.guilds = array;
            req.session.passport.user.lastFetchedGuilds = new Date();
            console.log("[DEBUG] User's guilds have been refreshed! ".blue + '({username}#{discriminator})'.formatUnicorn({
                username: req.session.passport.user.identity.username,
                discriminator: req.session.passport.user.identity.discriminator
            }).yellow + separator);
        }
        res.send(req.session.passport.user.guilds);
    }
};