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
            initSelect2RoleList(lang, lang === "en" ? "Who can answer the poll?" : "Qui peut répondre au sondage ?", 4);
            initSelect2ChannelList(true, lang, lang === "en" ? "Where will the poll be send?" : "Où le sondage va-t-il être envoyé ?", 1, false);
        } else {
            redirect("SERVERS_SELECTION");
        }

    }
    request.send();
}

function createPoll(selectedChannels, rolesList) {
    getSelectedChannel();
}

function getSelectedChannel() {
    const channelsList = $("#select-1").val();
    if (channelsList.length === 0) {
        shake();
        return;
    };
    getSelectedRoles(channelsList);
}

function getSelectedRoles(selectedChannels) {
    const rolesList = $("#select-2").val();
    if (rolesList.length === 0) {
        shake();
        return;
    }
    getPollStatement(selectedChannels, rolesList);
}

function getPollStatement(channel, roles) {
    const subject = $("#subject").val();
    const description = $("#description").val().replace(/\r?\n\r?/g, '\n').replace(/\r/g, '\n').replace(/\n/g,'<br>');
    const anonymous = $('#anonymous').is(":checked");
    const publicResult = $('#publicResult').is(":checked");
    const answers = $('#answers').text();
    const duration = $('#duration').text();
    console.log(subject, anonymous, publicResult, answers, duration)
    console.log(subject.length, answers.length, duration.length)
    if (subject.length === 0 || answers.length === 0 || duration.length === 0) {
        shake();
        return;
    }
    $(".btn").hide();
    $("#loading").show();
    setInterval(() => {
        $("#loading").hide();
    }, 1000);

    const params = "channel=" + channel + "&roles=" + roles.join("-") + "&subject=" + subject + "&description=" + description + "&anonymous=" + anonymous + "&publicResult=" + publicResult +
    "&answers=" + answers + "&duration=" + duration;
    console.log(params)
    var request = new XMLHttpRequest()
    request.open('GET', getUrl(`api/get/poll/create`, window) + "?" + params, true)
    request.setRequestHeader('Content-Type', 'application/json');
    request.onload = function () {
        const response = JSON.parse(this.response);
        if (response.success) {
            $("#loading").hide();
            $("#statement-title").text(response.title);
            $("#statement-description").text(response.description);
            $("#redirect-button").css("display", "flex");
            $("#warning-button").hide();
            $(".warning").attr("src", "/icons/party.svg")
            $("#newRequest").attr("onclick", "redirect('POLL_NEWREQUEST', 'guild_id=" + response.guild_id + (response.channel_id ? "&channel_id=" + response.channel_id : "") + "');")
            $("#newRequest").css("display", "flex");
            $("#support-option").hide();
            $("#support-option1").hide();
            $("#statement").show();
        } else {
            $("#loading").hide();
            $("#statement-title").text(response.title);
            $("#statement-description").text(response.description);
            $("#warning-button").show();
            $("#support-option").show();
            $("#support-option1").show();
            $("#statement").show();
        }
    }
    request.send();
}
$('#duration').on('keydown paste', function (event) {
    const value = parseInt($(this).text() + event.key);
    if (($(this).text().length >= 5 || value < 1) && event.keyCode != 8) {
        event.preventDefault();
    }
});

$('#answers').on('keydown paste', function (event) {
    const value = parseInt($(this).text() + event.key);
    if ((value > 10 || value < 1) && event.keyCode != 8) {
        event.preventDefault();
    }
});

$('[nopaste]').on('paste', function (event) {
    event.preventDefault();
});

$("[onlynumbers]").keypress(function (e) {
    if (isNaN(String.fromCharCode(e.which)) || e.keyCode === 32 || e.keyCode === 13) e.preventDefault();
});

function clearPollSelection() {
    $('#select-1').val([]).trigger('change');
    $('#select-2').val([]).trigger('change');
    $('#answers').text("");
    $('#duration').text("");
    $('#subject').val("");
    $('#description').val("");
}

function textAreaAdjust(element) {
    element.style.height = "1px";
    element.style.height = (element.scrollHeight) + "px";
}

$('.pollDescription').focus(function () {
    $(this).animate({
        height: this.scrollHeight
    }, 500);
});

$('.pollDescription').focusout(function () {
    $(this).animate({
        height: "60px"
    }, 500);
});