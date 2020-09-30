/*
 * Copyright (c) 2020, MΛX! Inc.  All rights reserved.
 * Copyrights licensed under the GNU General Public License v3.0.
 * See the accompanying LICENSE file for terms.
 */
module.exports = (req, res) => {
    if (!req.session.passport.user.identity) {
        res.redirect(Routes.LOGIN_PAGE);
    } else if (!req.session.passport.user.attendance_request.download_id) {
        res.status(404).json("Error: No download has been found.");
    } else {
        const file = Server.getCsvAttendanceResult(req.session.passport.user.attendance_request.download_id);
        res.download(file);
    }
};