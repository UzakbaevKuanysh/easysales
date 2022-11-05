var appasyncadd = appasyncadd || [];
(function() {
    var app = {},
        am = {},
        self = {};
    var loader = function(an_app) {
        app = an_app;
        am = app.misc;
        app.user = module;
        self = module;
        self.init();
    };
    setTimeout(function() {
        appasyncadd.push(loader);
    }, 0);

    var module = {
        callLogin: function() {
            $('.js_show_userlogin_form').click();
        },
        role: null,
        isAuthed: false,
        user: null,
        submittingLogin: false,

        captcha: {
            show: function(fel) {
                am.promiseCmd({
                    method: 'user.captcha.get'
                }).done(function(res) {
                    fel.find('.js_captcha_img').attr('src', res.captcha);
                    fel.find('.js_captcha_box').show();
                });
            },
            generate: function(fel) {
                am.promiseCmd({
                    method: 'user.captcha.refresh'
                }).done(function(res) {
                    fel.find('.js_captcha_img').attr('src', res.captcha);
                });
            },
        },
        invite_friends: {
            init: function() {
                var bel = $('#user_invite_friends_link_button');
                if (bel.size() == 0) return;

                var clip = new ZeroClipboard.Client();
                clip.setText($('#user_invite_friends_link').val());
                clip.glue('user_invite_friends_link_button', 'w-friends__mail-personal');
                clip.addEventListener('mouseup', function() {
                    app.all.message.show('Ссылка успешно скопирована');
                });
            }
        },
        account: {
            operations: {
                init: function() {
                    var bel = $('.js_user_account_operations_load_button');
                    if (!bel.size()) return;

                    var ao_box = $('.js_user_account_operations_box');

                    bel.unbind('click').click(function(e) {
                        e.preventDefault();

                        $.fancybox.showLoading();
                        am.promiseCmd({
                            method: 'user.account.load.operations',
                            offset: ao_box.find('li').size()
                        }).always(function() {
                            $.fancybox.hideLoading();
                        }).done(function(res) {
                            $(ao_box).append(res.loaded_html);

                            var cnt = res.count_of_all_operations;
                            if (cnt <= ao_box.find('li').size()) {
                                bel.hide();
                            }
                        });
                    });
                }
            },
            orders: {
                init: function() {
                    var bel = $('.js_user_account_orders_load_button');
                    if (!bel.size()) return;

                    var ao_box = $('.js_user_account_orders_box');

                    bel.unbind('click').click(function(e) {
                        e.preventDefault();

                        $.fancybox.showLoading();
                        am.promiseCmd({
                            method: 'user.account.load.orders',
                            offset: ao_box.find('.user-orders').size()
                        }).always(function() {
                            $.fancybox.hideLoading();
                        }).done(function(res) {
                            $(ao_box).append(res.loaded_html);

                            var cnt = res.count_of_all_orders;
                            if (cnt <= ao_box.find('.user-orders').size()) {
                                bel.hide();
                            }
                        });
                    });

                }
            },
            init: function() {
                self.account.operations.init();
                self.account.orders.init();
            }
        },
        recoveryPassword: {
            init: function() {
                var bel = $('.js_show_user_recovery_password_form');
                // if (!bel.size()) return;
                bel.css('cursor', 'pointer');

                var fel = $('.js_user_recovery_password_form');
                if (!fel.size()) return;
                am.clearGenericFormErrors(fel);

                fel.unbind('submit').submit(function(e) {
                    e.preventDefault();

                    $.fancybox.showLoading();
                    am.promiseCmd({
                        method: 'user.recovery.password',
                        email: fel.find(".js_email").val(),
                        captcha: fel.find('.js_captcha').val()
                    }).always(function() {
                        $.fancybox.hideLoading();
                        am.clearGenericFormErrors(fel);
                        $('.js_success_message').hide();

                        $.fancybox.update();
                    }).done(function(res) {
                        $.fancybox.close();

                        $.fancybox.open($('.js_user_recovery_password_done_form'), {
                            wrapCSS: 'popupSettings',
                            scrolling: 'no',
                            padding: 0,
                            fitToView: false,
                            scrollOutside: true
                        });
                    }).fail(function(err) {
                        var d = err.details;
                        if (d.captchaNeeded) self.captcha.show(fel);

                        am.showGenericFormErrors(fel, err);
                    });
                });

                bel.unbind('click').click(function(e) {
                    e.preventDefault();

                    $.fancybox.open(fel, {
                        wrapCSS: 'popupSettings',
                        scrolling: 'no',
                        padding: 0,
                        fitToView: true,
                        margin: 0,
                        scrollOutside: true,
                        wrapCSS: 'fancybox--closeBtn-only-on-desktop',
                    });
                });


                fel.find('.js_captcha_refresh').click(function(e) {
                    e.preventDefault();

                    self.captcha.generate(fel);
                });
            }
        },
        changePassword: {
            init: function() {
                var fel = $('.js_user_change_password_form');
                if (!fel.size()) return;
                am.clearGenericFormErrors(fel);

                fel.unbind('submit').submit(function(e) {
                    e.preventDefault();

                    $.fancybox.showLoading();
                    am.promiseCmd({
                        method: 'user.change.password',
                        password: fel.find(".js_password").val(),
                        password_again: fel.find(".js_password_again").val()
                    }).always(function() {
                        $.fancybox.hideLoading();
                        am.clearGenericFormErrors(fel);

                        $.fancybox.update();
                    }).done(function(res) {
                        $.fancybox.close();
                    }).fail(function(err) {
                        am.showGenericFormErrors(fel, err);
                    });
                });

                if ($('.js_showed_change_password_form').size()) {
                    $.fancybox.open(fel, {
                        wrapCSS: 'popupSettings',
                        scrolling: 'no',
                        padding: 0,
                        fitToView: false,
                        scrollOutside: true
                    });
                }
            }
        },
        confirmEmail: {
            init: function() {
                if ($('.js_showed_confirm_email_message_form').size()) {
                    app.all.message.show('Спасибо, почта успешно подтверждена');
                }

                var bel = $('.js_send_confirm_email');
                if (!bel.size()) return;

                bel.unbind('click').click(function(e) {
                    e.preventDefault();

                    $.fancybox.showLoading();
                    am.promiseCmd({
                        method: 'user.confirm.email'
                    }).always(function() {
                        $.fancybox.hideLoading();
                    }).fail(function(err) {
                        alert('Ошибка соединения.');
                    });
                });
            }
        },
        login: {
            init: function() {
                var bel = $('.js_show_userlogin_form');
                if (!bel.size()) return;

                var fel = $('.js_user_login_form');
                if (!fel.size()) return;
                am.clearGenericFormErrors(fel);


                fel.unbind('submit').submit(function(e) {
                    e.preventDefault();

                    $.fancybox.showLoading();
                    am.promiseCmd({
                        method: 'user.login',
                        email: fel.find("input[name=email]").val(),
                        password: fel.find("input[name=password]").val(),
                        captcha: fel.find('.js_captcha').val()
                    }).always(function() {
                        $.fancybox.hideLoading();
                        am.clearGenericFormErrors(fel);

                        $.fancybox.update();
                    }).done(function(res) {
                        $.fancybox.close();

                        location.reload();
                    }).fail(function(err) {
                        var d = err.details;
                        if (d.captchaNeeded) self.captcha.show(fel);

                        am.showGenericFormErrors(fel, err);
                    });
                });

                bel.unbind('click').click(function(e) {
                    e.preventDefault();

                    $.fancybox.open($('.js_user_login_register_form'), {
                        scrolling: 'no',
                        fitToView: true,
                        closeClick: false,
                        padding: 0,
                        margin: 0,
                        wrapCSS: 'fancybox--closeBtn-only-on-desktop',
                        helpers: {
                            overlay: {
                                closeClick: false
                            } // prevents closing when clicking OUTSIDE fancybox
                        },
                    });
                    $('#authorization-tab').trigger('click');
                });

                fel.find('.js_captcha_refresh').click(function(e) {
                    e.preventDefault();

                    self.captcha.generate(fel);
                });
            }
        },
        readRole: function() {
            var roleel = $('.js_admin_user');
            if (!roleel.size()) return;

            self.role = roleel.data('role');
        },
        isAdmin: function() {
            return self.role == 'admin';
        },
        init: function() {
            if ($('.js_user_authed').size()) {
                self.isAuthed = true;
            }

            self.login.init();
            self.recoveryPassword.init();
            self.changePassword.init();
            self.confirmEmail.init();
            self.account.init();
            self.invite_friends.init();


            // если требуется авторизоваться
            if (location.hash == '#show_login_page') {
                self.callLogin();

                location.hash = '';
            }
            if ($('.js_showed_recovery_password_form').size()) $('.js_show_user_recovery_password_form').click();

            self.readRole();

            $('.js_partner_offers_refferer').click(function(e) {
                e.preventDefault();

                location.href = $(this).data('href');
            });

            $('.js_need_login').click(function(e) {
                e.preventDefault();

                var el = $(this);

                if (self.isAuthed) {
                    if (el.data('href')) {
                        location.href = el.data('href');
                    } else if (el.prop('href')) {
                        location.href = el.prop('href');
                    }
                } else {
                    self.callLogin();
                }

            });
        }
    };

})();