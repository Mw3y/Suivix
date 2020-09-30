/*
 * Copyright (c) 2020, MΛX! Inc.  All rights reserved.
 * Copyrights licensed under the GNU General Public License v3.0.
 * See the accompanying LICENSE file for terms.
 */
module.exports = (req, res) => {
    if (!req.session.passport.user.identity) {
        res.redirect(Routes.LOGIN_PAGE);
    } else if (req.session.passport.user.attendance_download_id && !req.query.attendance_id) {
        res.download(Server.getCsvAttendanceResult(req.session.passport.user.attendance_download_id));
    } else {
        if (!req.query.attendance_id) res.status(404).json("Error: No download has been found.");
        else res.download(Server.getCsvAttendanceResult(req.query.attendance_id));
    }
};