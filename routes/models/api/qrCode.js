var QRCode = require("qrcode");

module.exports = async (req, res) => {
    if (req.query.guild_id && req.query.channel_id) {
        try {
            const fileName = req.query.guild_id + "-" + req.query.channel_id;
            const pathToFile = Server.getQrCode(fileName);
            const url = getProtocol() + "://" + Config.WEBSITE_HOST + Routes.ATTENDANCE_NEWREQUEST +
            "?guild_id=" + req.query.guild_id +
            "&channel_id=" + req.query.channel_id;

            // Generating and sending qrcode
            await QRCode.toFile(pathToFile, url);
            res.download(pathToFile);
        } catch (err) {
            console.log(err)
            res.json({ "Error": "Unable to create qrcode due to an unexpected error." });
        }
    } else {
        res.json({ "Error": "Unable to create qrcode due to missing arguments." });
    }
}