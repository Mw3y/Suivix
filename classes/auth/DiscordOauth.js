/*
 * Copyright (c) 2020, MΛX! Inc.  All rights reserved.
 * Copyrights licensed under the GNU General Public License v3.0.
 * See the accompanying LICENSE file for terms.
 */
var OAuth2Strategy = require('passport-oauth2'),
    OAuth2RefreshTokenStrategy = require('passport-oauth2-middleware').Strategy,
    passport = require('passport');


/**
 * Initialize the authentification system for Suivix
 */
function init() {
    var refreshStrategy = new OAuth2RefreshTokenStrategy({
        refreshWindow: 20, // Time in seconds to perform a token refresh before it expires
        userProperty: 'ticket', // Active user property name to store OAuth tokens
        authenticationURL: '/login', // URL to redirect unathorized users to
        callbackParameter: 'callback' //URL query parameter name to pass a return URL
    });

    passport.serializeUser(function(user, done) {
        done(null, user);
    });
    passport.deserializeUser(function(obj, done) {
        done(null, obj);
    });

    passport.use('main', refreshStrategy); //Main authorization strategy that authenticates
    //user with OAuth access token
    //and performs a token refresh if needed

    var oauthStartegy = new OAuth2Strategy({
            authorizationURL: 'https://discord.com/oauth2/authorize?client_id=' + Config.DISCORD_CLIENT_ID + '&scope=' + Config.DISCORD_OAUTH_SCOPES + "&prompt=none",
            tokenURL: 'https://discord.com/api/oauth2/token',
            clientID: Config.DISCORD_CLIENT_ID,
            clientSecret: Config.DISCORD_CLIENT_SECRET,
            callbackURL: '/auth/callback',
            passReqToCallback: false //Must be omitted or set to false in order to work with OAuth2RefreshTokenStrategy
        },
        refreshStrategy.getOAuth2StrategyCallback() //Create a callback for OAuth2Strategy
    );

    passport.use('oauth', oauthStartegy); //Strategy to perform regular OAuth2 code grant workflow
    refreshStrategy.useOAuth2Strategy(oauthStartegy); //Register the OAuth strategy

    return passport;
}

module.exports = {
    init: init
}