/*
 * Copyright (c) 2020, MΛX! Inc.  All rights reserved.
 * Copyrights licensed under the GNU General Public License v3.0.
 * See the accompanying LICENSE file for terms.
 */
module.exports = (req, res, forcedLanguage) => {
    let language = req.query.language ? req.query.language : req.params.language;
    if (forcedLanguage) language = forcedLanguage;
    if (language !== "fr" && language !== "en" && language !== undefined) {
        res.redirect(Routes.HOME_PAGE);
    } else {
        res.sendFile(
            Server.getViewsFile(req, res, Routes.HOME_PAGE, "home/", language)
        );
    }
}