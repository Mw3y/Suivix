/*
 * Copyright (c) 2020, MΛX! Inc.  All rights reserved.
 * Copyrights licensed under the GNU General Public License v3.0.
 * See the accompanying LICENSE file for terms.
 */
const RequestManager = require('../../../classes/managers/RequestManager');

module.exports = async (req, res) => {
    if (!req.session.passport) {
        req.session.pending_request = {
            guild_id: req.query.guild_id,
            channel_id: req.query.channel_id
        }
        res.redirect(Routes.LOGIN_PAGE);
    } else {
        if (req.query.guild_id) {
            const request = await new RequestManager().createNewRequest("poll", +new Date(), req.session.passport.user.identity, req.query.guild_id, req.query.channel_id);
            req.session.passport.user.poll_request = request;
            res.redirect(Routes.POLL_PAGE);
        } else {
            res.redirect(Routes.SERVERS_SELECTION);
        }
    }
}