/*
 * Copyright (c) 2020, MΛX! Inc.  All rights reserved.
 * Copyrights licensed under the GNU General Public License v3.0.
 * See the accompanying LICENSE file for terms.
 */
const RequestManager = require('../../../classes/managers/RequestManager');

module.exports = async (req, res) => {
    if (!req.session.passport.user.ticket) {
        res.status(404).json({
            error: "Unknown User"
        })
    } else {
        if (!req.session.passport.user.lastFetchedIdentity) req.session.passport.user.lastFetchedIdentity = new Date(Date.now() - 2000 * 60);
        var diff = ((new Date().getTime() - new Date(req.session.passport.user.lastFetchedIdentity).getTime()) / 1000) / 60;
        if (!req.session.passport.user.identity || diff > 1) {
            req.session.passport.user.identity = await oauth.getUser(req.session.passport.user.ticket.access_token);;
            req.session.passport.user.lastFetchedIdentity = new Date();
            console.log("[DEBUG] User's identity have been refreshed! ".blue + '({username}#{discriminator})'.formatUnicorn({
                username: req.session.passport.user.identity.username,
                discriminator: req.session.passport.user.identity.discriminator
            }).yellow + separator);
        }

        const manager = new RequestManager();
        let attendance_request;
        if(await manager.getRequest(req.session.passport.user.attendance_request)) attendance_request = req.session.passport.user.attendance_request;
        
        res.send(Object.assign(req.session.passport.user.identity, {
            attendance_request: attendance_request
        }));
    }

};