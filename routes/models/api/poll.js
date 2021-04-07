/*
 * Copyright (c) 2020, MΛX! Inc.  All rights reserved.
 * Copyrights licensed under the GNU General Public License v3.0.
 * See the accompanying LICENSE file for terms.
 */
const RequestManager = require('../../../classes/managers/RequestManager'),
    UserManager = require('../../../classes/managers/UserManager');

module.exports = async (req, res) => {
    const manager = new RequestManager();
    const request = await manager.getRequest(req.session.passport.user.poll_request);
    if (!request) {
        res.status(404).json("Request does not exists")
    } else {
        //Refresh User language or create user
        const userManager = new UserManager();
        const userLanguage = req.cookies["language"] === undefined ? "en" : req.cookies["language"];
        let DatabaseUser = await userManager.getUserById(req.session.passport.user.identity.id);
        if (DatabaseUser.language !== userLanguage && req.cookies["language"] !== undefined) await userManager.changeUserParam(req.session.passport.user.identity.id, "language", userLanguage);

        //Execute attendance request
        const statement = await request.createPoll(req.query.channel, req.query.roles, req.query.subject, req.query.description, req.query.anonymous, req.query.publicResult, req.query.answers, req.query.duration, userLanguage);
        if (statement.success) req.session.passport.user.poll_request = manager.deleteRequest(req.session.passport.user.poll_request);
        res.status(200).send(statement);
    }
}