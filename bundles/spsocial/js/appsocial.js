var appasyncadd = appasyncadd || [];
(function() {
    var app = {},
        am = {},
        self = {};
    var loader = function(an_app) {
        app = an_app;
        am = app.misc;
        app.social = module;
        self = module;
        self.init();
    };
    setTimeout(function() {
        appasyncadd.push(loader);
    }, 0);

    var module = {
        login: {
            show: function(email, ccdata, lres) {
                var fel = $('.js_user_cc_login_form');
                if (!fel.size()) return;

                fel.find('.js_text_email').text(email);

                fel.find('.js_email').prop('disabled', true).val(email);
                $('#tab_2').trigger('click');

                self.login.init(ccdata, lres);

                $.fancybox.open(fel, {
                    // wrapCSS: 'popupSettings',
                    scrolling: 'no',
                    // padding: 0,
                    // fitToView: false,
                    // scrollOutside: true
                });
            },
            init: function(ccdata, lres) {
                var fel = $('.js_user_cc_login_form');
                if (!fel.size()) return
                am.clearGenericFormErrors(fel);

                fel.unbind('submit').submit(function(e) {
                    e.preventDefault();

                    $.fancybox.showLoading();
                    am.promiseCmd({
                        method: 'user.login',
                        email: fel.find(".js_email").val(),
                        password: fel.find(".js_password").val(),
                        captcha: fel.find('.js_captcha').val(),
                        ccdata: ccdata,
                        lres: lres
                    }).always(function() {
                        $.fancybox.hideLoading();
                        am.clearGenericFormErrors(fel);

                        $.fancybox.update();
                    }).done(function(res) {
                        $.fancybox.close();

                        location.reload();
                    }).fail(function(err) {
                        var d = err.details;
                        if (d.captchaNeeded) app.user.captcha.show(fel);

                        am.showGenericFormErrors(fel, err);
                    });
                });

                fel.find('.js_captcha_refresh').click(function(e) {
                    e.preventDefault();

                    app.user.captcha.generate(fel);
                });
            }
        },
        share: {
            init: function() {
                $('.js_sharer').click(function(e) {
                    e.preventDefault();

                    var sn = $(this).data('sn');
                    var url = $(this).data('url');
                    var title = $(this).data('title');
                    var img = $(this).data('img');
                    var text = $(this).data('text');

                    if (sn === 'vk') {
                        self.share.vkontakte(url, title, img, text);
                    } else if (sn === 'fb') {
                        self.share.facebook(url, title, img, text);
                    } else if (sn === 'tw') {
                        self.share.twitter(url, title);
                    }
                });
            },

            vkontakte: function(purl, ptitle, pimg, text) {
                url = 'http://vk.com/share.php?';
                url += 'url=' + encodeURIComponent(purl);
                url += '&title=' + encodeURIComponent(ptitle);
                url += '&description=' + encodeURIComponent(text);
                url += '&image=' + encodeURIComponent(pimg);
                url += '&noparse=true';
                self.share.popup(url);
            },
            odnoklassniki: function(purl, text) {
                url = 'http://www.odnoklassniki.ru/dk?st.cmd=addShare&st.s=1';
                url += '&st.comments=' + encodeURIComponent(text);
                url += '&st._surl=' + encodeURIComponent(purl);
                self.share.popup(url);
            },
            facebook: function(purl, ptitle, pimg, text) {
                url = 'http://www.facebook.com/sharer.php?s=100';
                url += '&p[title]=' + encodeURIComponent(ptitle);
                url += '&p[summary]=' + encodeURIComponent(text);
                url += '&p[url]=' + encodeURIComponent(purl);
                url += '&p[images][0]=' + encodeURIComponent(pimg);
                self.share.popup(url);
            },
            twitter: function(purl, ptitle) {
                url = 'http://twitter.com/share?';
                url += 'text=' + encodeURIComponent(ptitle);
                url += '&url=' + encodeURIComponent(purl);
                url += '&counturl=' + encodeURIComponent(purl);
                self.share.popup(url);
            },
            mailru: function(purl, ptitle, pimg, text) {
                url = 'http://connect.mail.ru/share?';
                url += 'url=' + encodeURIComponent(purl);
                url += '&title=' + encodeURIComponent(ptitle);
                url += '&description=' + encodeURIComponent(text);
                url += '&imageurl=' + encodeURIComponent(pimg);
                self.share.popup(url);
            },

            popup: function(url) {
                self.clubShare();

                window.open(url, '', 'toolbar=0,status=0,width=626,height=436');
            }
        },
        recipeShare: function() {
            am.promiseCmd({
                method: 'social.recipe_share'
            });
        },
        clubShare: function() {
            am.promiseCmd({
                method: 'social.club_share'
            });
        },
        data: null,
        getData: function() {
            if (!self.data) {
                try {
                    self.data = loadSocialData();
                } catch (e) {}
                if (!self.data) self.data = {};
            }
            return self.data;
        },
        signIn: function(sn, loginRes) {
            am.promiseCmd({
                'method': 'social.sign_in',
                'sn': sn,
                'login_response': loginRes
            }).done(function(res) {
                //alert(JSON.stringify(res));
                window.location.reload();
            }).fail(function(err) {
                //alert(JSON.stringify(err));
            });
        },
        checkUserExistanceOnLogin: function(sn, loginRes, regNeededCb) {
            am.promiseCmd({
                'method': 'social.check_user_existance_on_login',
                'sn': sn,
                'login_response': loginRes
            }).done(function(res) {
                $('.js_login_popup').hide();
                if (res) {
                    window.location.reload();
                } else if (typeof regNeededCb === 'function') {
                    regNeededCb();
                }
            }).fail(function(err) {
                //alert(JSON.stringify(err));
            });
        },
        checkUserExistanceOnBind: function(sn, loginRes, profileRes) {
            am.promiseCmd({
                'method': 'social.check_user_existance_on_bind',
                'sn': sn,
                'login_response': loginRes,
                'profile_response': profileRes
            }).done(function(res) {
                if (!res) return;

                $('.js_social_bind_user_profile[data-sn=' + sn + ']').addClass('selected');
                $('.js_avatar_image').prop('src', res.avatar);
            }).fail(function(err) {
                var d = err.details;
                if (d == 'double_required') app.all.message.show('Этот аккаунт уже привязан к профилю другого пользователя');
            });
        },
        snProfiles: {
            vk: function(lres, callOnSuccess) {
                VK.Api.call('getProfiles', {
                    uids: [lres.session.user.id],
                    fields: ['uid', 'first_name', 'email', 'last_name', 'sex', 'blacklisted', 'bdate', 'photo', 'photo_medium', 'photo_big', 'screen_name', 'bdate', 'city', 'country', 'home_town', 'photo_50', 'photo_100', 'photo_200_orig', 'photo_200', 'photo_400_orig', 'photo_max', 'photo_max_orig', 'online', 'lists', 'domain', 'has_mobile', 'contacts', 'site', 'education', 'universities', 'schools', 'status', 'last_seen', 'followers_count', 'common_count', 'counters', 'occupation'],
                    v: '5.73'
                }, function(pres) {
                    if (!pres || typeof pres !== 'object' || !jQuery.isArray(pres.response) || !pres.response.length) return;
                    pres = pres.response.pop();

                    var data = {
                        'method': 'user.social.register',
                        'sn': 'vk',
                        'slink': lres.session.user.href,
                        'slogin': lres.session.user.domain,
                        'uid': lres.session.user.id,
                        'lres': JSON.stringify(lres),
                        'pres': JSON.stringify(pres),
                        'last_name': pres.last_name,
                        'first_name': pres.first_name,
                        'email': lres.email,
                        'gender': pres.sex == 2 ? 'female' : 'male',
                        'birthday': (function() {
                            if (!pres.bdate) return '';
                            var bre = new RegExp('^(\\d{1,2})\\.(\\d{1,2})\\.(\\d{4})$');
                            var bma = bre.exec(pres.bdate);
                            if (!bma) return '';
                            return JSON.stringify({
                                y: parseInt(bma[3], 10),
                                m: parseInt(bma[2], 10),
                                d: parseInt(bma[1], 10)
                            });
                        })(),
                        'photos': JSON.stringify([pres.photo_big, pres.photo_medium, pres.photo])
                    };

                    lres.pres = JSON.stringify(pres);
                    data.pres = JSON.stringify(pres);

                    if (typeof callOnSuccess === 'function') callOnSuccess(lres, data);
                });
            },
            fb: function(lres, callOnSuccess) {
                FB.api('/me?fields=id,first_name,last_name,picture,birthday,email,gender,hometown,interested_in,location,age_range,favorite_athletes,favorite_teams,inspirational_people,installed,languages,link,locale,middle_name,name,name_format,political,quotes,relationship_status,religion,significant_other,timezone,third_party_id,verified,website,work', function(pres) {
                    if (!pres.email) pres.email = lres.email;

                    var picture = [];
                    FB.api('/' + lres.authResponse.userID + '/picture?width=800&redirect=false', function(pictRes) {
                        if (typeof(pictRes.data.url) == 'undefined') return;

                        var url = pictRes.data.url;
                        picture.push(pictRes.data.url);

                        if (typeof(pres.picture.data.url) != 'undefined') pres.picture.data.url = pictRes.data.url;

                        var data = {
                            'method': 'user.social.register',
                            'sn': 'fb',
                            'slink': pres.link,
                            'slogin': pres.username,
                            'uid': lres.authResponse.userID,
                            'lres': JSON.stringify(lres),
                            'pres': JSON.stringify(pres),
                            'last_name': pres.last_name,
                            'first_name': pres.first_name,
                            'email': pres.email,
                            'gender': pres.sex == 2 ? 'female' : 'male',
                            'birthday': (function() {
                                if (!pres.bdate) return '';
                                var bre = new RegExp('^(\\d{1,2})\\.(\\d{1,2})\\.(\\d{4})$');
                                var bma = bre.exec(pres.bdate);
                                if (!bma) return '';
                                return JSON.stringify({
                                    y: parseInt(bma[3], 10),
                                    m: parseInt(bma[2], 10),
                                    d: parseInt(bma[1], 10)
                                });
                            })(),
                            'photos': JSON.stringify(picture)
                        };

                        lres.pres = JSON.stringify(pres);
                        data.pres = JSON.stringify(pres);

                        if (typeof callOnSuccess === 'function') callOnSuccess(lres, data);
                    });

                });
            },
            tw: function(lres, callOnSuccess) {
                var data = {
                    'method': 'user.social.register',
                    'sn': 'tw',
                    'uid': lres.id_str,
                    'lres': JSON.stringify(lres),
                    'last_name': lres.last_name,
                    'first_name': lres.name,
                    'email': lres.email,
                    'slogin': lres.screen_name,
                    'slink': lres.url,
                    'photos': JSON.stringify([lres.profile_image_url, lres.profile_image_url_https])
                };

                var pres = JSON.stringify(data);
                lres.pres = pres;
                data.pres = pres;

                if (typeof callOnSuccess === 'function') callOnSuccess(lres, data);
            },
            in: function(lres, callOnSuccess) {
                var data = {
                    'method': 'user.social.register',
                    'sn': 'in',
                    'uid': lres.id,
                    'lres': JSON.stringify(lres),
                    'last_name': lres.last_name,
                    'first_name': lres.name,
                    'email': lres.email,
                    'slogin': lres.username,
                    'slink': null,
                    'photos': JSON.stringify(lres.photos)
                };

                var pres = JSON.stringify(data);
                lres.pres = pres;
                data.pres = pres;

                if (typeof callOnSuccess === 'function') callOnSuccess(lres, data);
            }
        },
        bind: {
            vk: {
                login: function() {
                    if (typeof VK !== 'object') return;
                    VK.Auth.login(jQuery.app.social.bind.vk.loginCallback);
                },
                loginCallback: function(lres) {
                    if (typeof lres !== 'object' || lres.status !== 'connected' || typeof lres.session !== 'object') return;

                    self.snProfiles.vk(lres, function(lres, pres) {
                        self.checkUserExistanceOnBind('vk', lres, pres);
                    });
                },
                init: function(data) {
                    if (typeof VK !== 'object') return;
                    VK.init({
                        apiId: data.app_id
                    });
                }
            },
            fb: {
                login: function() {
                    FB.login(jQuery.app.social.bind.fb.loginCallback, {
                        scope: 'email,publish_actions,offline_access'
                    }); //user_birthday,
                },
                loginCallback: function(lres) {
                    if (lres.status !== 'connected' || !lres.authResponse) return;

                    self.snProfiles.fb(lres, function(lres, pres) {
                        self.checkUserExistanceOnBind('fb', lres, pres);
                    });
                },
                init: function(data) {
                    window.fbAsyncInit = function() {
                        FB.init({
                            appId: data.app_id,
                            status: true,
                            cookie: true,
                            xfbml: true
                        });
                    };
                    (function(d) {
                        var js, id = 'facebook-jssdk';
                        if (d.getElementById(id)) {
                            return;
                        }
                        js = d.createElement('script');
                        js.id = id;
                        js.async = true;
                        js.src = "//connect.facebook.net/" + am.getClang() + "/all.js";
                        d.getElementsByTagName('head')[0].appendChild(js);
                    })(document);
                }
            },
            tw: {
                isProcess: false,
                data: {},
                init: function(data) {
                    self.sns.tw.data = data;
                },
                login: function() {
                    self.bind.tw.isProcess = true;

                    var l = window.location;
                    var newWindow = window.open('http://' + l.host + '/social/tw_auth',
                        'name',
                        'width=800,height=600'
                    );
                    if (window.focus) {
                        newWindow.focus();
                    }
                },
                loginCallback: function(lres) {
                    self.bind.tw.isProcess = false;

                    self.snProfiles.tw(lres, function(lres, pres) {
                        self.checkUserExistanceOnBind('tw', lres, pres);
                    });
                },
            },
            in: {
                isProcess: false,
                login: function() {
                    self.bind.in.isProcess = true;

                    var l = window.location;
                    var newWindow = window.open('http://' + l.host + '/social/in_auth',
                        'name',
                        'width=800,height=600'
                    );
                    if (window.focus) newWindow.focus();
                },
                loginCallback: function(lres) {
                    self.bind.in.isProcess = false;

                    self.snProfiles.in(lres, function(lres, pres) {
                        self.checkUserExistanceOnBind('in', lres, pres);
                    });
                },
            },
            init: function() {
                self.bind.vk.init();
                self.bind.fb.init();
                self.bind.tw.init();
                self.bind.in.init();
            }
        },
        sns: {
            errors: {
                check: function(d, callback, data, lres) {
                    var isSearchedError = false;

                    var fel = $('.js_user_refill_email_after_cc_form');
                    am.clearGenericFormErrors(fel);

                    if (typeof d.email != 'undefined') {
                        if (d.email == 'loginRequired') {
                            self.login.show(data.email, data, lres);

                            isSearchedError = true;
                        } else if (d.email == 'RequiredFillEmail') {
                            $.fancybox.open(fel, {
                                scrolling: 'no',
                                padding: 0,
                                fitToView: false,
                                scrollOutside: true
                            });

                            fel.unbind('submit').submit(function(e) {
                                e.preventDefault();

                                var email = fel.find(".js_email").val();

                                $.fancybox.showLoading();
                                am.promiseCmd({
                                    method: 'user.refill.email.after.cc',
                                    email: email,
                                    captcha: fel.find(".js_captcha").val()
                                }).always(function() {
                                    $.fancybox.hideLoading();
                                    am.clearGenericFormErrors(fel);

                                    $.fancybox.update();
                                }).done(function(res) {
                                    $.fancybox.close();

                                    callback(email);
                                }).fail(function(err) {
                                    var d = err.details;

                                    if (d.captchaNeeded) app.user.captcha.show(fel);
                                    else if (d.loginRequired) self.login.show(email, data, lres);

                                    am.showGenericFormErrors(fel, err);
                                });
                            });

                            isSearchedError = true;
                        }
                    }

                    return isSearchedError;
                }
            },
            tw: {
                data: {},
                init: function(data) {
                    self.sns.tw.data = data;
                },
                login: function() {
                    var l = window.location;
                    var newWindow = window.open('http://' + l.host + '/social/tw_auth',
                        'name',
                        'width=800,height=600'
                    );
                    if (window.focus) newWindow.focus();
                },
                loginCallback: function(lres) {
                    self.snProfiles.tw(lres, function(lres, data) {

                        self.checkUserExistanceOnLogin('tw', lres, function() {
                            am.promiseCmd(data).done(function(res) {
                                location.href = '/';
                            }).fail(function(err) {
                                var d = err.details;

                                var res = app.social.sns.errors.check(d, function(email) {
                                    lres.email = email;
                                    self.sns.tw.loginCallback(lres);
                                }, data, lres);

                                if (!res) alert(JSON.stringify(err));
                            });
                        });

                    });
                },
            },
            gp: {
                data: {},
                res: null,
                init: function(data) {
                    self.sns.gp.data = data;
                },
                login: function() {
                    var l = window.location;
                    var newWindow = window.open('https://accounts.google.com/o/oauth2/auth' +
                        '?redirect_uri=http%3A%2F%2F' + l.host + '/social/gp_auth' +
                        '&response_type=code' +
                        '&client_id=' + self.sns.gp.data.app_id +
                        '&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile',
                        'name',
                        'width=800,height=600'
                    );
                    if (window.focus) {
                        newWindow.focus();
                    }
                },
                processLogin: function() {
                    var gp = jQuery.app.social.sns.gp;
                    if (!gp.res) return;
                    var lres = gp.res.lres;
                    var pres = gp.res.pres;
                    self.checkUserExistanceOnLogin('gp', lres, function() {
                        var fel = am.arrayToForm({
                            'sn': 'gp',
                            'lres': JSON.stringify(lres),
                            'pres': JSON.stringify(pres),
                            'last_name': pres.family_name,
                            'first_name': pres.given_name,
                            'email': pres.email,
                            'photos': JSON.stringify([pres.picture])
                            /*'gender': pres.gender,
                            'birthday': (function(){
                            	if (!pres.birthday) return '';
                            	var bre = new RegExp('^(\\d\\d)/(\\d\\d)/(\\d{4})$');
                            	var bma = bre.exec(pres.birthday);
                            	if (!bma) return '';
                            	return JSON.stringify({y: parseInt(bma[3], 10), m: parseInt(bma[1], 10), d: parseInt(bma[2], 10)});
                            })()
                            */
                        }, {
                            action: '/user/register'
                        });
                        fel.submit();
                    });
                },
                loginCallback: function(res) {
                    var gp = jQuery.app.social.sns.gp;
                    gp.res = res;
                    setTimeout(function() {
                        gp.processLogin();
                    }, 100);
                }
            },
            fb: {
                login: function() {
                    FB.login(jQuery.app.social.sns.fb.loginCallback, {
                        scope: 'email'
                    }); //,user_birthday
                },
                loginCallback: function(lres) {
                    if (lres.status !== 'connected' || !lres.authResponse) return;

                    self.snProfiles.fb(lres, function(lres, data) {

                        self.checkUserExistanceOnLogin('fb', lres, function() {
                            am.promiseCmd(data).done(function(res) {
                                location.reload();
                            }).fail(function(err) {
                                var d = err.details;

                                var res = self.sns.errors.check(d, function(email) {
                                    lres.email = email;
                                    self.sns.fb.loginCallback(lres);
                                }, data, lres);

                                if (!res) alert(JSON.stringify(err));
                            });
                        });
                    });
                },
                init: function(data) {
                    window.fbAsyncInit = function() {
                        FB.init({
                            appId: data.app_id,
                            status: true,
                            cookie: true,
                            xfbml: true
                        });
                    };
                    (function(d) {
                        var js, id = 'facebook-jssdk';
                        if (d.getElementById(id)) {
                            return;
                        }
                        js = d.createElement('script');
                        js.id = id;
                        js.async = true;
                        js.src = "//connect.facebook.net/" + am.getClang() + "/all.js";
                        d.getElementsByTagName('head')[0].appendChild(js);
                    })(document);
                }
            },
            in: {
                login: function() {
                    var l = window.location;
                    var newWindow = window.open('http://' + l.host + '/social/in_auth',
                        'name',
                        'width=800,height=600'
                    );
                    if (window.focus) newWindow.focus();
                },
                loginCallback: function(lres) {
                    self.snProfiles.in(lres, function(lres, data) {

                        self.checkUserExistanceOnLogin('in', lres, function() {
                            am.promiseCmd(data).done(function(res) {
                                location.href = '/';
                            }).fail(function(err) {
                                var d = err.details;

                                var res = app.social.sns.errors.check(d, function(email) {
                                    lres.email = email;
                                    self.sns.in.loginCallback(lres);
                                }, data, lres);

                                if (!res) alert(JSON.stringify(err));
                            });
                        });

                    });
                },
            },
            vk: {
                login: function() {
                    if (typeof VK !== 'object') return;
                    VK.Auth.login(jQuery.app.social.sns.vk.loginCallback);
                },
                loginCallback: function(lres) {
                    if (typeof lres !== 'object' || lres.status !== 'connected' || typeof lres.session !== 'object') return;

                    self.snProfiles.vk(lres, function(lres, data) {

                        self.checkUserExistanceOnLogin('vk', lres, function() {
                            am.promiseCmd(data).done(function(res) {
                                location.reload();
                            }).fail(function(err) {
                                var d = err.details;

                                var res = self.sns.errors.check(d, function(email) {
                                    lres.email = email;
                                    self.sns.vk.loginCallback(lres);
                                }, data, lres);

                                if (!res) alert(JSON.stringify(err));
                            });
                        });
                    });
                },
                init: function(data) {
                    if (typeof VK !== 'object') return;
                    VK.init({
                        apiId: data.app_id
                    });
                }
            },
            mm: {
                logged_in: false,
                profileCallback: function(pres) {
                    if (!jQuery.isArray(pres)) return;
                    pres = pres.pop();
                    if (!pres || typeof pres !== 'object') return;
                    mailru.connect.getLoginStatus(function(lres) {
                        self.checkUserExistanceOnLogin('mm', lres, function() {
                            var fel = am.arrayToForm({
                                'sn': 'mm',
                                'lres': JSON.stringify(lres),
                                'pres': JSON.stringify(pres),
                                'last_name': pres.last_name,
                                'first_name': pres.first_name,
                                'email': pres.email,
                                'gender': pres.sex ? 'female' : 'male',
                                'birthday': (function() {
                                    if (!pres.birthday) return '';
                                    var bre = new RegExp('^(\\d{1,2})\\.(\\d{1,2})\\.(\\d{4})$');
                                    var bma = bre.exec(pres.birthday);
                                    if (!bma) return '';
                                    return JSON.stringify({
                                        y: parseInt(bma[3], 10),
                                        m: parseInt(bma[2], 10),
                                        d: parseInt(bma[1], 10)
                                    });
                                })()
                            }, {
                                action: '/user/register'
                            });
                            fel.submit();
                        });
                    });
                },
                login: function() {
                    var mm = jQuery.app.social.sns.mm;
                    if (mm.logged_in) {
                        mailru.common.users.getInfo(function(res) {
                            mm.profileCallback(res);
                        });
                    } else {
                        mailru.connect.logout();
                        setTimeout(function() {
                            mailru.connect.login();
                        }, 1000);
                    }
                },
                init: function(data) {
                    if (typeof mailru !== 'object') return;
                    var mm = jQuery.app.social.sns.mm;
                    mailru.loader.require('api', function() {
                        mailru.connect.init(data.app_id, data.app_private);
                        mailru.events.listen(mailru.connect.events.login, function(session) {
                            mailru.connect.getLoginStatus(function(res) {
                                if (res.is_app_user == '1') {
                                    mm.logged_in = true;
                                    mailru.common.users.getInfo(function(res) {
                                        mm.profileCallback(res);
                                    });
                                } else {
                                    window.location.reload();
                                }
                            });
                        });
                        mailru.connect.getLoginStatus(function(res) {
                            if (res.is_app_user == '1') mm.logged_in = true;
                        });
                    });
                }
            },
            od: {
                data: {},
                code: null,
                login: function() {
                    var od = jQuery.app.social.sns.od;
                    var l = window.location;
                    ODKL.Oauth2(jQuery('.js_call_sn_auth[data-sn="od"]').get(0), od.data.app_id, 'VALUABLE ACCESS', l.protocol + '//' + l.host + '/social/od_auth');
                },
                processLogin: function() {
                    var od = jQuery.app.social.sns.od;
                    if (!od.code) return;
                    am.promiseCmd({
                        'method': 'social.get_od_profile',
                        'code': od.code
                    }).done(function(lres) {
                        self.checkUserExistanceOnLogin('od', lres, function() {
                            var fel = am.arrayToForm({
                                'sn': 'od',
                                'lres': JSON.stringify(lres),
                                'pres': '',
                                'last_name': lres.last_name,
                                'first_name': lres.first_name,
                                'email': '',
                                'gender': lres.gender,
                                'birthday': (function() {
                                    if (!lres.birthday) return '';
                                    var bre = new RegExp('^(\\d{4})-(\\d\\d)-(\\d\\d)$');
                                    var bma = bre.exec(lres.birthday);
                                    if (!bma) return '';
                                    return JSON.stringify({
                                        y: parseInt(bma[1], 10),
                                        m: parseInt(bma[2], 10),
                                        d: parseInt(bma[3], 10)
                                    });
                                })(),
                                'photos': JSON.stringify([lres.pic_2, lres.pic_1])
                            }, {
                                action: '/user/register'
                            });
                            fel.submit();
                        });
                    });
                },
                loginCallback: function(code) {
                    var od = jQuery.app.social.sns.od;
                    od.code = code;
                    setTimeout(function() {
                        od.processLogin();
                    }, 100);
                },
                init: function(data) {
                    var od = jQuery.app.social.sns.od;
                    od.data = data;
                }
            }
        },
        init: function() {
            $('.js_call_sn_auth').click(function() {
                var sn = jQuery(this).data('sn');

                if (typeof self.sns[sn] === 'object' && typeof self.sns[sn].login === 'function') self.sns[sn].login();
                return false;
            });

            $('.js_social_bind_user_profile').click(function() {
                var sn = jQuery(this).data('sn');

                if (typeof self.bind[sn] === 'object' && typeof self.bind[sn].login === 'function') self.bind[sn].login();
                return false;
            });
            /*
            			am.promiseCmd({method: 'social.get_data'}).done(function(res){
            				self.data = res.data;
            				var data = self.getData();

            				for (var si in data) {
            					var sn = data[si];
            					if (sn.app_id && typeof self.sns[si] === 'object' && typeof self.sns[si].init === 'function') {
            						self.sns[si].init(sn);
            						self.bind[si].init(sn);
            					}
            				}
            			});

            			self.share.init();*/
        }
    };
})();