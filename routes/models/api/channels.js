/*
 * Copyright (c) 2020, MΛX! Inc.  All rights reserved.
 * Copyrights licensed under the GNU General Public License v3.0.
 * See the accompanying LICENSE file for terms.
 */
const RequestManager = require('../../../classes/managers/RequestManager');

module.exports = async(req, res) => {
    const request = await new RequestManager().getRequest(req.session.passport.user[req.headers.referer.split("/")[3].split("?")[0] + "_request"]);
    if (!request) {
        res.status(404).json("Request does not exists")
    } else {
        res.send(request.getChannels());
    }
};