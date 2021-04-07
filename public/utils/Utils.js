console.log('   _____         _         _       \n  / ____|       (_)       (_)      \n | (___   _   _  _ __   __ _ __  __\n  \\___ \\ | | | || |\\ \\ / /| |\\ \\/ /\n  ____) || |_| || | \\ V / | | >  < \n |_____/  \\__,_||_|  \\_/  |_|/_/\\_\\\n────────────────────────────────────\nConsole de déboguage. (Si vous n\'êtes pas développeur, il est déconseillé d\'aller plus loin.)')

const getUrl = function (url, window) {
    var location = window.location;
    return location.protocol + "//" + location.host + "/" + location.pathname.split('/')[0] + url;
}

function httpGetRequest(url, token) {
    var request = new XMLHttpRequest()
    request.open('GET', url, true)
    request.setRequestHeader("Authorization", token)
    return request;
}

const initAttendance = function (lang) {
    var request = new XMLHttpRequest()
    request.open('GET', getUrl(`api/get/user`, window), true)
    request.withCredentials = true;

    request.onload = function () {
        const response = JSON.parse(this.response);
        const avatar = response.avatar ? "https://cdn.discordapp.com/avatars/" + response.id + "/" + response.avatar : "https://cdn.discordapp.com/embed/avatars/2.png";
        const navUser = $(".buttonUser");
        if (navUser.is(":visible")) navUser.html('<img class="smallAvatar buttonSmallIcon" src="' + avatar + '"><p class="buttonUserNormal">' + response.username +
                '</p><p class="buttonUserHover">' +
                (lang === "en" ? "Logout" : "Déconnexion") + '</p>')
            .attr("href", "/auth/logout?redirectTo=/");

        displayChangelog(lang, document.getElementById("version"), document.getElementById("changelogText"));

        if (response.attendance_request) {
            initSelect2ChannelList(true, lang);
            initSelect2RoleList(lang);
            initSelect2Timezone(lang);
        } else {
            redirect("SERVERS_SELECTION");
        }

    }
    request.send();
}

function doAttendance() {
    getSelectedChannels()
}

function getSelectedChannels() {
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
    getAttendanceStatement(selectedChannels, rolesList);
}

function getAttendanceStatement(channels, roles) {
    const timezone = $("#select-3").val();
    if (timezone.length === 0) {
        shake();
        return;
    }
    $(".btn").hide();
    $("#loading").show();
    setInterval(() => {
        $("#loading").hide();
    }, 1000);

    const params = "channels=" + channels.join("-") + "&roles=" + roles.join("-") + "&timezone=" + timezone;
    var request = new XMLHttpRequest()
    request.open('GET', getUrl(`api/get/attendance/done`, window) + "?" + params, true)
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
            $("#newRequest").attr("onclick", "redirect('ATTENDANCE_NEWREQUEST', 'guild_id=" + response.guild_id + (response.channel_id ? "&channel_id=" + response.channel_id : "") + "');")
            $("#newRequest").css("display", "flex");
            $("#support-option").hide();
            $("#support-option1").hide();
            $("#statement").show();
        } else {
            $("#loading").hide();
            $("#statement-title").text(response.title);
            $("#statement-description").text(response.description);
            if (response.download) {
                $("#redirect-button").css("display", "flex");
                $("#download-button").show();
            } else {
                $("#warning-button").show();
            }
            $("#support-option").show();
            $("#support-option1").show();
            $("#statement").show();
        }
    }
    request.send();
}

function initSelect2RoleList(lang, customPlaceholder, max = 8) {
    var request = new XMLHttpRequest()
    request.open('GET', getUrl(`api/get/roles`, window), true)
    request.onload = function () {
        const response = JSON.parse(this.response);
        if (this.status === 404) {
            return;
        }
        const placeholder = customPlaceholder ? customPlaceholder : (lang === "fr" ? "Rôles" : "Roles") + " 📚";
        document.getElementById("select-roles").innerHTML = "<select id='select-2'multiple><option> <select></option></select > ";
        initSelect2($("#select-2"), placeholder, [], max)
        let i = 0;
        for (let key in response) {
            var newOption = new Option(reductText(response[key].name, 32) + "<span class='select2-users big'><img class='select2-users-icon' src='/icons/users.png'><var class='select2-users-text'> " + response[key].users + "</var></span>", key, false, false);
            $(newOption).appendTo('#select-2').trigger('change');
            const hexaColor = response[key].color === 0 ? "fff" : response[key].color.toString(16).padStart(6, '0');
            const colorArray = hex2RGB(hexaColor);
            const color = hexaColor !== "fff" ? "rgba(" + colorArray[0] + "," + colorArray[1] + "," + colorArray[2] + ",.1)" : "#36393f";
            $('head').append('<style type="text/css">.select2-results__options[id*="select-2"] .select2-results__option:nth-child(' + (i + 1) + ') {color: #' + hexaColor + '; border-radius: 4px; margin-bottom: 4px; text-align: left;} .select2-results__options[id*="select-2"] .select2-results__option:nth-child(' + (i + 1) + '):hover {background: ' + color + ';}</style>');
            i++;
        }
    }
    request.send();
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
}

function initSelect2Timezone(lang) {
    var aryIannaTimeZones = [
        'Europe/Andorra',
        'Asia/Dubai',
        'Asia/Kabul',
        'Europe/Tirane',
        'Asia/Yerevan',
        'Antarctica/Casey',
        'Antarctica/Davis',
        'Antarctica/DumontDUrville', // https://bugs.chromium.org/p/chromium/issues/detail?id=928068
        'Antarctica/Mawson',
        'Antarctica/Palmer',
        'Antarctica/Rothera',
        'Antarctica/Syowa',
        'Antarctica/Troll',
        'Antarctica/Vostok',
        'America/Argentina/Buenos_Aires',
        'America/Argentina/Cordoba',
        'America/Argentina/Salta',
        'America/Argentina/Jujuy',
        'America/Argentina/Tucuman',
        'America/Argentina/Catamarca',
        'America/Argentina/La_Rioja',
        'America/Argentina/San_Juan',
        'America/Argentina/Mendoza',
        'America/Argentina/San_Luis',
        'America/Argentina/Rio_Gallegos',
        'America/Argentina/Ushuaia',
        'Pacific/Pago_Pago',
        'Europe/Vienna',
        'Australia/Lord_Howe',
        'Antarctica/Macquarie',
        'Australia/Hobart',
        'Australia/Currie',
        'Australia/Melbourne',
        'Australia/Sydney',
        'Australia/Broken_Hill',
        'Australia/Brisbane',
        'Australia/Lindeman',
        'Australia/Adelaide',
        'Australia/Darwin',
        'Australia/Perth',
        'Australia/Eucla',
        'Asia/Baku',
        'America/Barbados',
        'Asia/Dhaka',
        'Europe/Brussels',
        'Europe/Sofia',
        'Atlantic/Bermuda',
        'Asia/Brunei',
        'America/La_Paz',
        'America/Noronha',
        'America/Belem',
        'America/Fortaleza',
        'America/Recife',
        'America/Araguaina',
        'America/Maceio',
        'America/Bahia',
        'America/Sao_Paulo',
        'America/Campo_Grande',
        'America/Cuiaba',
        'America/Santarem',
        'America/Porto_Velho',
        'America/Boa_Vista',
        'America/Manaus',
        'America/Eirunepe',
        'America/Rio_Branco',
        'America/Nassau',
        'Asia/Thimphu',
        'Europe/Minsk',
        'America/Belize',
        'America/St_Johns',
        'America/Halifax',
        'America/Glace_Bay',
        'America/Moncton',
        'America/Goose_Bay',
        'America/Blanc-Sablon',
        'America/Toronto',
        'America/Nipigon',
        'America/Thunder_Bay',
        'America/Iqaluit',
        'America/Pangnirtung',
        'America/Atikokan',
        'America/Winnipeg',
        'America/Rainy_River',
        'America/Resolute',
        'America/Rankin_Inlet',
        'America/Regina',
        'America/Swift_Current',
        'America/Edmonton',
        'America/Cambridge_Bay',
        'America/Yellowknife',
        'America/Inuvik',
        'America/Creston',
        'America/Dawson_Creek',
        'America/Fort_Nelson',
        'America/Vancouver',
        'America/Whitehorse',
        'America/Dawson',
        'Indian/Cocos',
        'Europe/Zurich',
        'Africa/Abidjan',
        'Pacific/Rarotonga',
        'America/Santiago',
        'America/Punta_Arenas',
        'Pacific/Easter',
        'Asia/Shanghai',
        'Asia/Urumqi',
        'America/Bogota',
        'America/Costa_Rica',
        'America/Havana',
        'Atlantic/Cape_Verde',
        'America/Curacao',
        'Indian/Christmas',
        'Asia/Nicosia',
        'Asia/Famagusta',
        'Europe/Prague',
        'Europe/Berlin',
        'Europe/Copenhagen',
        'America/Santo_Domingo',
        'Africa/Algiers',
        'America/Guayaquil',
        'Pacific/Galapagos',
        'Europe/Tallinn',
        'Africa/Cairo',
        'Africa/El_Aaiun',
        'Europe/Madrid',
        'Africa/Ceuta',
        'Atlantic/Canary',
        'Europe/Helsinki',
        'Pacific/Fiji',
        'Atlantic/Stanley',
        'Pacific/Chuuk',
        'Pacific/Pohnpei',
        'Pacific/Kosrae',
        'Atlantic/Faroe',
        'Europe/Paris',
        'Europe/London',
        'Asia/Tbilisi',
        'America/Cayenne',
        'Africa/Accra',
        'Europe/Gibraltar',
        'America/Godthab',
        'America/Danmarkshavn',
        'America/Scoresbysund',
        'America/Thule',
        'Europe/Athens',
        'Atlantic/South_Georgia',
        'America/Guatemala',
        'Pacific/Guam',
        'Africa/Bissau',
        'America/Guyana',
        'Asia/Hong_Kong',
        'America/Tegucigalpa',
        'America/Port-au-Prince',
        'Europe/Budapest',
        'Asia/Jakarta',
        'Asia/Pontianak',
        'Asia/Makassar',
        'Asia/Jayapura',
        'Europe/Dublin',
        'Asia/Jerusalem',
        'Asia/Kolkata',
        'Indian/Chagos',
        'Asia/Baghdad',
        'Asia/Tehran',
        'Atlantic/Reykjavik',
        'Europe/Rome',
        'America/Jamaica',
        'Asia/Amman',
        'Asia/Tokyo',
        'Africa/Nairobi',
        'Asia/Bishkek',
        'Pacific/Tarawa',
        'Pacific/Enderbury',
        'Pacific/Kiritimati',
        'Asia/Pyongyang',
        'Asia/Seoul',
        'Asia/Almaty',
        'Asia/Qyzylorda',
        'Asia/Qostanay', // https://bugs.chromium.org/p/chromium/issues/detail?id=928068
        'Asia/Aqtobe',
        'Asia/Aqtau',
        'Asia/Atyrau',
        'Asia/Oral',
        'Asia/Beirut',
        'Asia/Colombo',
        'Africa/Monrovia',
        'Europe/Vilnius',
        'Europe/Luxembourg',
        'Europe/Riga',
        'Africa/Tripoli',
        'Africa/Casablanca',
        'Europe/Monaco',
        'Europe/Chisinau',
        'Pacific/Majuro',
        'Pacific/Kwajalein',
        'Asia/Yangon',
        'Asia/Ulaanbaatar',
        'Asia/Hovd',
        'Asia/Choibalsan',
        'Asia/Macau',
        'America/Martinique',
        'Europe/Malta',
        'Indian/Mauritius',
        'Indian/Maldives',
        'America/Mexico_City',
        'America/Cancun',
        'America/Merida',
        'America/Monterrey',
        'America/Matamoros',
        'America/Mazatlan',
        'America/Chihuahua',
        'America/Ojinaga',
        'America/Hermosillo',
        'America/Tijuana',
        'America/Bahia_Banderas',
        'Asia/Kuala_Lumpur',
        'Asia/Kuching',
        'Africa/Maputo',
        'Africa/Windhoek',
        'Pacific/Noumea',
        'Pacific/Norfolk',
        'Africa/Lagos',
        'America/Managua',
        'Europe/Amsterdam',
        'Europe/Oslo',
        'Asia/Kathmandu',
        'Pacific/Nauru',
        'Pacific/Niue',
        'Pacific/Auckland',
        'Pacific/Chatham',
        'America/Panama',
        'America/Lima',
        'Pacific/Tahiti',
        'Pacific/Marquesas',
        'Pacific/Gambier',
        'Pacific/Port_Moresby',
        'Pacific/Bougainville',
        'Asia/Manila',
        'Asia/Karachi',
        'Europe/Warsaw',
        'America/Miquelon',
        'Pacific/Pitcairn',
        'America/Puerto_Rico',
        'Asia/Gaza',
        'Asia/Hebron',
        'Europe/Lisbon',
        'Atlantic/Madeira',
        'Atlantic/Azores',
        'Pacific/Palau',
        'America/Asuncion',
        'Asia/Qatar',
        'Indian/Reunion',
        'Europe/Bucharest',
        'Europe/Belgrade',
        'Europe/Kaliningrad',
        'Europe/Moscow',
        'Europe/Simferopol',
        'Europe/Kirov',
        'Europe/Astrakhan',
        'Europe/Volgograd',
        'Europe/Saratov',
        'Europe/Ulyanovsk',
        'Europe/Samara',
        'Asia/Yekaterinburg',
        'Asia/Omsk',
        'Asia/Novosibirsk',
        'Asia/Barnaul',
        'Asia/Tomsk',
        'Asia/Novokuznetsk',
        'Asia/Krasnoyarsk',
        'Asia/Irkutsk',
        'Asia/Chita',
        'Asia/Yakutsk',
        'Asia/Khandyga',
        'Asia/Vladivostok',
        'Asia/Ust-Nera',
        'Asia/Magadan',
        'Asia/Sakhalin',
        'Asia/Srednekolymsk',
        'Asia/Kamchatka',
        'Asia/Anadyr',
        'Asia/Riyadh',
        'Pacific/Guadalcanal',
        'Indian/Mahe',
        'Africa/Khartoum',
        'Europe/Stockholm',
        'Asia/Singapore',
        'America/Paramaribo',
        'Africa/Juba',
        'Africa/Sao_Tome',
        'America/El_Salvador',
        'Asia/Damascus',
        'America/Grand_Turk',
        'Africa/Ndjamena',
        'Indian/Kerguelen',
        'Asia/Bangkok',
        'Asia/Dushanbe',
        'Pacific/Fakaofo',
        'Asia/Dili',
        'Asia/Ashgabat',
        'Africa/Tunis',
        'Pacific/Tongatapu',
        'Europe/Istanbul',
        'America/Port_of_Spain',
        'Pacific/Funafuti',
        'Asia/Taipei',
        'Europe/Kiev',
        'Europe/Uzhgorod',
        'Europe/Zaporozhye',
        'Pacific/Wake',
        'America/New_York',
        'America/Detroit',
        'America/Kentucky/Louisville',
        'America/Kentucky/Monticello',
        'America/Indiana/Indianapolis',
        'America/Indiana/Vincennes',
        'America/Indiana/Winamac',
        'America/Indiana/Marengo',
        'America/Indiana/Petersburg',
        'America/Indiana/Vevay',
        'America/Chicago',
        'America/Indiana/Tell_City',
        'America/Indiana/Knox',
        'America/Menominee',
        'America/North_Dakota/Center',
        'America/North_Dakota/New_Salem',
        'America/North_Dakota/Beulah',
        'America/Denver',
        'America/Boise',
        'America/Phoenix',
        'America/Los_Angeles',
        'America/Anchorage',
        'America/Juneau',
        'America/Sitka',
        'America/Metlakatla',
        'America/Yakutat',
        'America/Nome',
        'America/Adak',
        'Pacific/Honolulu',
        'America/Montevideo',
        'Asia/Samarkand',
        'Asia/Tashkent',
        'America/Caracas',
        'Asia/Ho_Chi_Minh',
        'Pacific/Efate',
        'Pacific/Wallis',
        'Pacific/Apia',
        'Africa/Johannesburg'
    ];
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    document.getElementById("select-timezone").innerHTML = "<select id='select-3'multiple><option><select></option></select > ";
    initSelect2($("#select-3"), lang === "en" ? "Timezone 🌎" : "Fuseau Horaire 🌎", aryIannaTimeZones, 1)
    $('head').append('<style type="text/css">.select2-results__options[id*="select-3"] .select2-results__option:hover {background: ' + "#23272A" + ';}</style>');
    // Set selected 
    $('#select-3') //empty select
        .val(timezone) //select option of select2
        .trigger("change"); //apply to select2
}


function closePopup(id) {
    $("#" + id).fadeOut(300);
    setInterval(() => {
        $(".btn").show();
    }, 200);

}

function initSelect2ChannelList(parents, lang, customPlaceholder, max = 8, showUsers = true) {
    var request = new XMLHttpRequest()
    request.open('GET', getUrl(`api/get/channels`, window), true)
    request.onload = function () {
        if (this.status === 404) {
            redirect("SERVERS_SELECTION");
            return;
        }
        const channelsJSON = JSON.parse(this.response);
        const placeholder = customPlaceholder ? customPlaceholder : (lang === "fr" ? "Salons" : "Channels") + " 🎧";
        document.getElementById("select-channels").innerHTML = "<select id='select-1'multiple><option > <select> </option></select > ";
        initSelect2($("#select-1"), placeholder, [], max)
        for (let key in channelsJSON) {
            const text = (parents ? reductText(channelsJSON[key].category, 30, true) + " " + reductText(channelsJSON[key].name, 75) : reductText(channelsJSON[key].name, 75)) + (showUsers ? "<span class='select2-users small'><img class='select2-users-icon' src='/icons/voice.png'><var class='select2-users-text'> " + channelsJSON[key].users + "</var></span>" : "");
            var newOption = new Option(text, key, false, false);
            $('#select-1').append(newOption).trigger('change');
        }
        $('head').append('<style type="text/css">.select2-results__options[id*="select-1"] .select2-results__option:hover {background: ' + "#191a1d" + ';}</style>');
    }
    request.send();
}

function clearSelection() {
    $('#select-1').val([]).trigger('change');
    $('#select-2').val([]).trigger('change');
}

function deleteRequest(type = "attendance") {
    if (type === "attendance") redirect("ATTENDANCE_DELETE", undefined);
    else redirect("POLL_DELETE", undefined);
}

const reductText = function (name, maxLength, separator = false) {
    return name ? (separator ? "(" : "") + (name.length > maxLength ? name.substring(0, maxLength) + "..." : name) + (separator ? ")" : "") : "";
}

function redirect(route, params) {
    var request = new XMLHttpRequest()
    request.open('GET', getUrl(`api/get/url`, window), true)
    request.setRequestHeader("Route", route)
    request.onload = function () {
        const response = JSON.parse(this.response);
        window.location.href = window.location.protocol + "//" + window.location.host + response.route + (params !== undefined ? "?" + params : "");
    }
    request.send();
}

function formatState(state) {
    if (!state.id) {
        return state.text;
    }
    var $state = $(
        '<span class="color-element color-' + state.element.value + '">' + state.text + '</span>'
    );
    return $state;
};

function initSelect2(select, placeholder, data, max) {
    select.select2({
        placeholder: placeholder,
        width: "100%",
        data: data,
        maximumSelectionLength: max,
        templateResult: formatState,
        templateSelection: formatState
    });

    disableBackspace(select);
}


function disableBackspace($select2Obj) {
    $select2Obj
        .parent()
        .find('.select2-selection')
        .on('keydown', '.select2-search--inline', function (evt) {
            var backspaceKey = 8;
            if (evt.which == backspaceKey) {
                var currentSelection = $select2Obj.select2('data').map(function (s) {
                    return s.id
                });
                $select2Obj.val(currentSelection).trigger("change");
                $select2Obj.select2("close");

            }
        })
};

function $_GET(param) {
    var vars = {};
    window.location.href.replace(location.hash, '').replace(
        /[?&]+([^=&]+)=?([^&]*)?/gi, // regexp
        function (m, key, value) { // callback
            vars[key] = value !== undefined ? value : '';
        }
    );

    if (param) {
        return vars[param] ? vars[param] : null;
    }
    return vars;
}

function saveTimezoneCookie() {
    document.cookie = `
        timezone = ${ Intl.DateTimeFormat().resolvedOptions().timeZone }
        ` + `;
        domain = ${ window.location.host };
        path = /`;
}

function askCookies(lang) {
    if (!localStorage.getItem('cookieconsent')) {
        if (lang === "en") {
            document.getElementById("cookies").innerHTML += '<div class="cookieconsent" style="position:fixed;padding:20px;left:0;bottom:0;background-color:#18191c;color:#FFF;text-align:center;width:100%;z-index:99999;">' +
                'Suivix uses cookies to work. By continuing to use this website, you agree to their use.' + " ‎ ‎" +
                '<a href="#" style="color:#CCCCCC;">‎‎‎' + 'I Understand' + '</a></div>';
        } else {
            document.getElementById("cookies").innerHTML += '<div class="cookieconsent" style="position:fixed;padding:20px;left:0;bottom:0;background-color:#18191c;color:#FFF;text-align:center;width:100%;z-index:99999;">' +
                'Suivix a besoin de cookies pour fonctionner correctement et faciliter votre utilisation. En continuant d\'utiliser ce site, vous acceptez leur utilisation.' + " ‎ ‎" +
                '<a href="#" style="color:#CCCCCC;">‎‎‎' + 'J\'ai Compris' + '</a></div>';
        }
        document.querySelector('.cookieconsent a').onclick = function (e) {
            e.preventDefault();
            document.querySelector('.cookieconsent').style.display = 'none';
            localStorage.setItem('cookieconsent', true);
        };
    }
}

function displayChangelog(lang, versiondiv, textdiv) {
    const lastDisplayedVersion = localStorage.getItem('lastDisplayedVersion');
    var request = new XMLHttpRequest()
    request.open('GET', getUrl(`api/get/changelog`, window), true);
    request.onload = function () {
        const json = JSON.parse(this.responseText)
        if (!json.version) return;
        const text = lang === "fr" ? json.fr : json.en;
        const version = json.version;
        if (lastDisplayedVersion === null || parseFloat(lastDisplayedVersion) < parseFloat(version) || !lastDisplayedVersion.includes(".")) {
            versiondiv.innerHTML = version;
            textdiv.innerHTML = text;
            $('#overlay').fadeIn(300);
            $('#close').click(function () {
                localStorage.setItem('lastDisplayedVersion', version);
                closeChangelog();
            });
        }
    }
    request.send();
}

function closeChangelog() {
    $('#overlay').fadeOut(300);
}

function initChoice(language) {
    var request = new XMLHttpRequest()
    request.open('GET', getUrl(`api/get/user`, window), true)
    request.withCredentials = true;
    request.onload = function () {
        const response = JSON.parse(this.response);
        const avatar = response.avatar ? "https://cdn.discordapp.com/avatars/" + response.id + "/" + response.avatar : "https://cdn.discordapp.com/embed/avatars/2.png";
        $(".username").text(response.username);
        $("#user-loader-image").html(`<img class="avatar" src="${avatar}"></div><var class="accountType"></var>`)
        displayAccountType(response);

        const navUser = $(".buttonUser");
        if (navUser.is(":visible")) navUser.html('<img class="smallAvatar buttonSmallIcon" src="' + avatar + '"><p class="buttonUserNormal">' + response.username +
                '</p><p class="buttonUserHover">' +
                (language === "en" ? "Logout" : "Déconnexion") + '</p>')
            .attr("href", "/auth/logout?redirectTo=/");

        $("#user-loader").hide();
        $("#welcome").show();

        $("#support-option").on("click", function () {
            redirect("API_SUPPORT_URL", undefined)
        });
        $("#donate-option").on("click", function () {
            window.open("https://utip.io/mw3y")
        });

        if (response.attendance_request && !response.attendance_request.isExpired) {
            if (language === "en") {
                $("#take-attendance").text("Continue the attendance request in progress");
            } else {
                $("#take-attendance").text("Continuer le suivi en cours");
            }
            $("#attendance-option").on("click", function () {
                redirect("ATTENDANCE_PAGE", undefined)
            });
        } else {
            $("#attendance-option").on("click", function () {
                initServerSelection(language, "attendance")
            });
        }

        if (response.poll_request && !response.poll_request.isExpired) {
            if (language === "en") {
                $("#create-poll").text("Continue creating the poll");
            } else {
                $("#create-poll").text("Continuer de créer le sondage");
            }
            $("#poll-option").on("click", function () {
                redirect("POLL_PAGE", undefined)
            });
        } else {
            $("#poll-option").on("click", function () {
                initServerSelection(language, "poll")
            });
        }


    }
    request.send();

}

function displayAccountType(response) {
    $(".accountType").text(response.account_type.name);
    $(".accountType").css('background-color', response.account_type.color)
    if (response.account_type.type > 1) $(".accountType").show();
}

function initServerSelection(language, type) {
    let redirectTo = "ATTENDANCE_NEWREQUEST";
    if (type === "poll") {
        redirectTo = "POLL_NEWREQUEST";
        $("#attendance-desc").hide();
        $("#poll-desc").show();
        $("#take-attendance").show();
    } else {
        $("#create-poll").show();
    }
    $("#overlay").fadeOut(200);

    let request = new XMLHttpRequest();
    request.open('GET', getUrl(`api/get/user/guilds`, window), true)
    request.withCredentials = true;
    request.onload = function () {
        const response = JSON.parse(this.response);
        const lang = language === "en" ? 0 : 1;
        const add = ["Add Suivix", "Ajouter Suivix"];
        let i = 0;
        let isOnSupport = false;
        //let separator = false;
        for (var k in response) {
            if (response[k].id === "705806416795009225") {
                $("#support").click(function () {
                    redirect(redirectTo, 'guild_id=705806416795009225');
                });
                isOnSupport = true;
                continue;
            };
            if (!response[k].suivix && (response[k].permissions & 0x20) !== 32) continue;
            /*if(!separator && !response[k].suivix) {
                separator = true;
                $(".servers").append('<div class="text-separator">' + (language === "en" ? 'INSTALL SUIVIX' : "INSTALLER SUIVIX") + '</div>')
            }*/
            $(".servers").append('<div class="server-card" id="' + response[k].id + '" suivix="' + response[k].suivix + '">' +
                (response[k].suivix ? "" : '<button' +
                    ' class="add" title="' + add[lang] + '"><i class="fas fa-plus plusIcon"></i><i class="fas fa-angle-right goIcon"></i></button>') +
                '<p class="server-name">' + response[k].name + '<img class="server-icon" src="' +
                (response[k].icon ? `https://cdn.discordapp.com/icons/${response[k].id}/${response[k].icon}.jpg` : "/ressources/unknown-server.png") +
                '"></p>' + '</div>');
            $("#" + response[k].id).click(function () {
                if ($(this).attr('suivix') === "true")
                    redirect(redirectTo, 'guild_id=' + $(this).attr('id'));
                else {
                    redirect(`API_INVITE_URL`, 'guild_id=' + $(this).attr('id'));
                }
            })
            i++;
        }
        if (!isOnSupport) {
            $("#support").html('<button class="add" title="Join Suivix Support Server"><i class="fas fa-arrow-right"></i></button><p class="server-name">Suivix © Support<img class="server-icon" src="/ressources/support-icon.png"></p>')
            $("#support").click(function () {
                redirect(`API_SUPPORT_URL`, undefined);
            });
        }
        $(".load").css("display", "none");
        const height = i === 1 ? i * 53 + 53 : i * 53;
        $(".servers-container").css("height", height > 160 ? 160 : height + "px")
    }
    request.send();

}

function shake() {
    $("#card").effect("shake");
}

function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

function initHomePage(language) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", getUrl("api/get/stats", window), true);
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
            const response = JSON.parse(this.responseText);
            animateValue(document.getElementById("guilds"), 0, response.guilds, 700);
            animateValue(document.getElementById("users"), 0, response.users, 700);
            document.getElementById("version").innerHTML = response.version;
        }
    }
    xmlHttp.send();
    loadUser(language);
    document.getElementById("year").innerHTML = new Date().getFullYear();
}

function loadUser(language) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", getUrl("api/get/user", window), true);
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
            const response = JSON.parse(this.responseText);
            const avatar = response.avatar ? "https://cdn.discordapp.com/avatars/" + response.id + "/" + response.avatar : "https://cdn.discordapp.com/embed/avatars/2.png";
            const navUser = $(".buttonUser");
            if (navUser.is(":visible")) navUser.html('<img class="smallAvatar buttonSmallIcon" src="' + avatar + '"><p class="buttonUserNormal">' + response.username +
                    '</p><p class="buttonUserHover">' +
                    (language === "en" ? "Logout" : "Déconnexion") + '</p>')
                .attr("href", "/auth/logout?redirectTo=/");
            $(".buttonUse").html('<i class="fas fa-chevron-right buttonIcon"></i> ' + (language === "en" ? "Take attendance" : "Faire un suivi"))
        }
    }
    xmlHttp.send();
}

function displaySupportPopup(language) {
    $('#overlay').show();
}