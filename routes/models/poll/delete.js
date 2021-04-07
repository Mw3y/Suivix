/*
 * Copyright (c) 2020, MΛX! Inc.  All rights reserved.
 * Copyrights licensed under the GNU General Public License v3.0.
 * See the accompanying LICENSE file for terms.
 */
const RequestManager = require("../../../classes/managers/RequestManager");

module.exports = (req, res) => {
    if (!req.session.passport.user.identity) {
        res.redirect(Routes.LOGIN_PAGE);
    } else if (req.session.passport.user.poll_request) {
        req.session.passport.user.poll_request = new RequestManager().deleteRequest(req.session.passport.user.poll_request);
        res.redirect(Routes.SERVERS_SELECTION);
    } else {
        res.redirect(Routes.SERVERS_SELECTION);
    }
};