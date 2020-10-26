/*
 * Copyright (c) 2020, MΛX! Inc.  All rights reserved.
 * Copyrights licensed under the GNU General Public License v3.0.
 * See the accompanying LICENSE file for terms.
 */
module.exports = (req, res) => {
    if (!req.session.passport.user.identity) {
        res.redirect(Routes.LOGIN_PAGE);
        /*} else if (req.session.passport.user.identity.account_type.type <= 1) {
            res.redirect(Routes.UPGRADE_PAGE);
        */
    } else {
        res.sendFile(Server.getViewsFile(req, res, Routes.POLL_PAGE, "/", req.query.language ? req.query.language : undefined));
    }

}