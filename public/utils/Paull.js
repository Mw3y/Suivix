const initPaull = function (lang) {
    var request = new XMLHttpRequest()
    request.open('GET', getUrl(`api/get/user`, window), true)
    request.withCredentials = true;

    request.onload = function () {
        const response = JSON.parse(this.response);
        document.getElementById("username").innerHTML = response.username;
        document.getElementById("discriminator").innerHTML = "#" + response.discriminator;
        document.getElementById("avatar").src = response.avatar ? "https://cdn.discordapp.com/avatars/" + response.id + "/" + response.avatar : "https://cdn.discordapp.com/embed/avatars/2.png";
        $("#user-loader").hide();
        $("#user-loader-image").hide();
        $("#user-infos").show();

        displayChangelog(lang, document.getElementById("version"), document.getElementById("changelogText"));

        if (response.poll_request) {
            initSelect2RoleList(lang, "Who can answer the poll?", 8);
            initSelect2ChannelList(true, lang, "Where will the poll be send?", 1);
        } else {
            redirect("SERVERS_SELECTION");
        }

    }
    request.send();
}

$('#duration').on('keydown paste', function (event) {
    if ($(this).text().length >= 5 && event.keyCode != 8) {
        event.preventDefault();
    }
});

$('#answers').on('keydown paste', function (event) {
    const value = parseInt($(this).text() + event.key);
    if (value > 10 || value < 1 && event.keyCode != 8) {
        event.preventDefault();
    }
});

$('[nopaste]').on('paste', function (event) {
    event.preventDefault();
});

$("[onlynumbers]").keypress(function (e) {
    if (isNaN(String.fromCharCode(e.which))) e.preventDefault();
});


function textAreaAdjust(element) {
    element.style.height = "1px";
    element.style.height = (element.scrollHeight) + "px";
}

$('.subject').focus(function () {
    $(this).animate({
        height: this.scrollHeight
    }, 500);
});

$('.subject').focusout(function () {
    $(this).animate({
        height: "60px"
    }, 500);
});