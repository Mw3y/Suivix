/*
 * Copyright (c) 2020, MΛX! Inc.  All rights reserved.
 * Copyrights licensed under the GNU General Public License v3.0.
 * See the accompanying LICENSE file for terms.
 */
module.exports = (req, res) => {
    res.sendFile(Server.getApiViewsFile(req, res, Routes.PRIVACY_POLICY, "/index.html"));
};