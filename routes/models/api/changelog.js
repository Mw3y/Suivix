/*
 * Copyright (c) 2020, MΛX! Inc.  All rights reserved.
 * Copyrights licensed under the GNU General Public License v3.0.
 * See the accompanying LICENSE file for terms.
 */
var package = require('../../../package.json');

module.exports = (req, res) => {
    res.send({
        version: package.version,
        en: "• The poll creation feature is now in beta access for the \"Testers\"!<br>Accessible at <a href='https://suivix.xyz/poll'>https://suivix.xyz/poll</a>.<br><br><span class='moreInfos'>If you encounter a bug, or you think something is broken, please contact me on Discord: MΛX#2231</span>",
        fr: "• La création de sondages est en accès anticipé pour les \"Testeurs\"<br>Rendez-vous sur <a href='https://suivix.xyz/poll'>https://suivix.xyz/poll</a>.<br><br><span class='moreInfos'>Si vous rencontrez un bug, ou pensez que quelque chose ne marche pas bien, merci de me contacter sur Discord : MΛX#2231</span>"
    });
};