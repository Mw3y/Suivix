console.log('   _____         _         _       \n  / ____|       (_)       (_)      \n | (___   _   _  _ __   __ _ __  __\n  \\___ \\ | | | || |\\ \\ / /| |\\ \\/ /\n  ____) || |_| || | \\ V / | | >  < \n |_____/  \\__,_||_|  \\_/  |_|/_/\\_\\\n────────────────────────────────────\nConsole de déboguage. (Si vous n\'êtes pas développeur, il est déconseillé d\'aller plus loin.)')

const initPaull = function (lang) {
    var request = new XMLHttpRequest()
    request.open('GET', getUrl(`api/get/user`, window), true)
    request.withCredentials = true;

    request.onload = function () {
        const response = JSON.parse(this.response);
        document.getElementById("username").innerHTML = response.username;
        document.getElementById("requestID").innerHTML = response.requestID;
        document.getElementById("discriminator").innerHTML = "#" + response.discriminator;
        document.getElementById("avatar").src = response.avatar ? "https://cdn.discordapp.com/avatars/" + response.id + "/" + response.avatar : "https://cdn.discordapp.com/embed/avatars/2.png";
        $("#user-loader").hide();
        $("#user-loader-image").hide();
        $("#user-infos").show();

        initSelect2ChannelList(response.requestID, true, lang);
        initSelect2RoleList(response.requestID, lang);

        $("#poll-subject").on("input", function () {
            if ($(this).val() === "") return;
            $("#poll-subject-dest").text($(this).val());
        });
        $("#poll-reactions-number").on("input", function () {
            if ($(this).val() === "") return;
            changePollReactionsNumber($(this).val());
        });
        $("#poll-duration-hours").on("propertychange input", function () {
            $("#duration-hours").text($(this).val() + "h");
        });
        $("#poll-duration-minutes").on("propertychange input", function () {
            $("#duration-minutes").text($(this).val() + "min");
        });
    }
    request.send();
}

function changePollReactionsNumber(nb) {
    $(".reactions-container").empty();
    for (let i = 0; i < nb; i++) {
        $(".reactions-container").append('<div class="reaction"><div class="reaction-inner"><img src="/icons/' + i + '.svg" class="emoji"><div class="reactionCount" style="min-width: 9px;">1</div></div></div>')
    }
    $(".reactions-container").append('<div class="reaction"><div class="reaction-inner"><img src="/icons/list.svg" class="emoji"><div class="reactionCount" style="min-width: 9px;">1</div></div></div>')
}

function validateReactionsNumber(evt) {
    var theEvent = evt || window.event;

    // Handle paste
    if (theEvent.type === 'paste') {
        key = event.clipboardData.getData('text/plain');
    } else {
        var key = theEvent.keyCode || theEvent.which;
        key = String.fromCharCode(key);
    }

    var regex = /[0-9]|\./;
    if (!regex.test(key)) {
        theEvent.returnValue = false;
        if (theEvent.preventDefault) theEvent.preventDefault();
    } else if (parseInt($("#poll-reactions-number").val() + key) > 11 || parseInt($("#poll-reactions-number").val() + key) < 1) {
        theEvent.returnValue = false;
    }
}

function validate(evt) {
    var theEvent = evt || window.event;

    // Handle paste
    if (theEvent.type === 'paste') {
        key = event.clipboardData.getData('text/plain');
    } else {
        var key = theEvent.keyCode || theEvent.which;
        key = String.fromCharCode(key);
    }
    var regex = /[0-9]|\./;
    if (!regex.test(key)) {
        theEvent.returnValue = false;
        if (theEvent.preventDefault) theEvent.preventDefault();
    }
}

const RGB_HEX = /^#?(?:([\da-f]{3})[\da-f]?|([\da-f]{6})(?:[\da-f]{2})?)$/i;

const hex2RGB = str => {
    const [, short, long] = String(str).match(RGB_HEX) || [];

    if (long) {
        const value = Number.parseInt(long, 16);
        return [value >> 16, value >> 8 & 0xFF, value & 0xFF];
    } else if (short) {
        return Array.from(short, s => Number.parseInt(s, 16)).map(n => (n << 4) | n);
    }
};

function clearSelection() {
    $('#select-1').val('').trigger('change');
    $('#select-2').val('').trigger('change');
}
