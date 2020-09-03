/*
 * Copyright (c) 2020, MΛX! Inc.  All rights reserved.
 * Copyrights licensed under the GNU General Public License v3.0.
 * See the accompanying LICENSE file for terms.
 */
var package = require('../../../package.json');

module.exports = (req, res) => {
    res.send({
        version: package.version,
        en: "• New home page & multiple changes on the global design.<br><br>• The channels, roles and timezone selector now have a search field.<br>The role selector is also now colored.<br><br>• Multiple bug fixes & performances enhancement.<br><br><span class='moreInfos'>If you encounter a bug, or you think something is broken, please contact me on Discord: MΛX#2231</span>",
        fr: "• Nouvelle page d'accueil & multiples changement du design global.<br><br>• Vous pouvez désormais chercher un rôle, un salon ou un fuseau horaire grâce à la barre de recherche présente dans les menus de sélection.<br>Le sélecteur de rôles est maintenant en couleur.<br><br>• De multiples bugs ont été réglés. Les performances globales ont été améliorées.<br><br><span class='moreInfos'>Si vous rencontrez un bug, ou pensez que quelque chose ne marche pas bien, merci de me contacter sur Discord : MΛX#2231</span>"
    });
};