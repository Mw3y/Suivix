/*
 * Copyright (c) 2020, MΛX! Inc.  All rights reserved.
 * Copyrights licensed under the GNU General Public License v3.0.
 * See the accompanying LICENSE file for terms.
 */
const RequestManager = require('../../../classes/managers/RequestManager');

module.exports = async (req, res) => {
    try {
        if (!req.session.passport) {
            req.session.pending_request = {
                guild_id: req.query.guild_id,
                channel_id: req.query.channel_id
            }
            res.redirect(Routes.LOGIN_PAGE);
        } else {
            if (req.query.guild_id) {
                const request = await new RequestManager().createNewRequest("attendance", +new Date(), req.session.passport.user.identity, req.query.guild_id);
                req.session.passport.user.attendance_request = request;
                res.redirect(Routes.ATTENDANCE_PAGE);
            } else {
                res.redirect(Routes.SERVERS_SELECTION);
            }
        }
    } catch (err) {
        console.log(err);
        res.sendFile(Server.getApiViewsFile(req, res, Routes.ERROR_500, "/index.html"));
    }
};