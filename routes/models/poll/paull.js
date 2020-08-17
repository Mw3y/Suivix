/*
 * Copyright (c) 2020, MΛX! Inc.  All rights reserved.
 * Copyrights licensed under the GNU General Public License v3.0.
 * See the accompanying LICENSE file for terms.
 */
module.exports = (req, res) => {
    if (!req.session.passport.user.identity) {
        res.redirect(Routes.LOGIN_PAGE);
    } else if (!req.session.passport.user.poll_request) {
        res.redirect(Routes.SERVERS_SELECTION);
    } else {
        res.sendFile(Server.getViewsFile(req, res, Routes.PAULL_PAGE, "/", req.query.language ? req.query.language : undefined));
    }
};