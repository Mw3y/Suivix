/*
 * Copyright (c) 2020, MΛX! Inc.  All rights reserved.
 * Copyrights licensed under the GNU General Public License v3.0.
 * See the accompanying LICENSE file for terms.
 */
var package = require('../../../package.json');

module.exports = (req, res) => {
    res.send({
        version: package.version,
        en: "• New attendance result design.<br>• The csv file is now sent to Discord.<br><br><span class='moreInfos'>If you encounter a bug, or you think something is broken, please contact me on Discord: MΛX#2231</span>",
        fr: "• Refonte totale de l'affichage du résultat du suivi.<br>• Le fichier csv est désormais envoyé sur Discord.<br><br><span class='moreInfos'>Si vous rencontrez un bug, ou pensez que quelque chose ne marche pas bien, merci de me contacter sur Discord : MΛX#2231</span>"
    });
};