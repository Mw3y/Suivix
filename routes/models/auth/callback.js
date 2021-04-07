/*
 * Copyright (c) 2020, MΛX! Inc.  All rights reserved.
 * Copyrights licensed under the GNU General Public License v3.0.
 * See the accompanying LICENSE file for terms.
 */
const RequestManager = require("../../../classes/managers/RequestManager"),
    UserManager = require('../../../classes/managers/UserManager'),
    Language = require('../../../utils/Language');

module.exports = async (req, res) => {
    let user = req.session.passport.user.identity = await oauth.getUser(req.session.passport.user.ticket.access_token);
    req.session.passport.user.identity.account_type = await (new UserManager()).getUserAccountType(req.session.passport.user.identity.id, Language.getUserLanguage(req, res));
    user.lastFetched = req.session.passport.user.identity.lastFetched = new Date();
    console.log('{username}#{discriminator}'.formatUnicorn({
        username: user.username,
        discriminator: user.discriminator
    }).yellow + " logged in on ".blue + new Date().toString().yellow + ".".blue + separator);

    if (req.session.attendance_pending_request ||req.session.poll_pending_request) {
        if (req.session.attendance_pending_request) {
            res.redirect(Routes.ATTENDANCE_NEWREQUEST + "/?guild_id=" + req.session.attendance_pending_request.guild_id + "&channel_id=" + req.session.attendance_pending_request.channel_id);
            req.session.attendance_pending_request = undefined;
        }
        if (req.session.poll_pending_request) {
            res.redirect(Routes.POLL_NEWREQUEST + "/?guild_id=" + req.session.poll_pending_request.guild_id + "&channel_id=" + req.session.poll_pending_request.channel_id);
            req.session.poll_pending_request = undefined;
        }
        return;
    }
    const request = await new RequestManager().getRequest(req.session.passport.user.attendance_request);
    if (!request && req.query.redirect !== "false") {
        res.redirect(Routes.SERVERS_SELECTION);
        if (request) console.log("⚠   An user tried to use an old attendance request".red + ` (user: '${user.username}#${user.discriminator}')`.yellow + separator);
        if (!request) console.log("⚠   An user tried to use a request which does not exist".red + ` (user: '${user.username}#${user.discriminator}')`.yellow + separator);
    } else if (req.query.redirect === "false") {
        res.redirect(Routes.SERVERS_SELECTION);
    } else {
        res.redirect(Routes.ATTENDANCE_PAGE);
    }
}