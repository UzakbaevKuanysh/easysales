var appasyncadd = appasyncadd || [];
(function() {
    var app = {},
        am = {},
        self = {};
    var loader = function(an_app) {
        app = an_app;
        am = app.misc;
        app.userregister = module;
        self = module;
        self.init();
    };
    setTimeout(function() {
        appasyncadd.push(loader);
    }, 0);

    var module = {
        init: function() {
            var bel = $('.js_show_userregister_form');
            if (!bel.size()) return;

            var fel = $('.js_user_register_form');
            if (!fel.size()) return;

            fel.submit(function(e) {
                e.preventDefault();

                $.fancybox.showLoading();
                am.promiseCmd({
                    method: 'user.register',
                    email: fel.find("input[name='email']").val(),
                    rules_agreement: fel.find("input[name='rules_agreement']").prop('checked'),
                    password: fel.find("input[name='password']").val(),
                    promocode: fel.find("input[name='promocode']").val(),
                    channel_referer: $.cookie('channel_referer'),
                    channel_url: $.cookie('channel_url'),
                    //name: fel.find("input[name='name']").val(),
                    //phone: fel.find("input[name='phone']").val(),
                    captcha: fel.find('.js_captcha').val()
                }).always(function() {
                    $.fancybox.hideLoading();
                    am.clearGenericFormErrors(fel);

                    $.fancybox.update();
                }).done(function(res) {
                    $.fancybox.close();
                    $.removeCookie('cri', {
                        path: '/'
                    });
                    window.location.reload();
                }).fail(function(err) {
                    if (err.details && err.details.captchaNeeded) app.user.captcha.show(fel);

                    am.showGenericFormErrors(fel, err);
                });
            });

            bel.click(function(e) {
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
                $('#registration-tab').trigger('click');
            });

            fel.find('.js_captcha_refresh').click(function(e) {
                e.preventDefault();

                app.user.captcha.generate(fel);
            });

            if ($('.js_showed_register_form').size()) {
                $.cookie('cri', $('.js_showed_register_form').data('cri'), {
                    path: '/',
                    expires: 1000
                });

                bel.click();
            }

        }
    };

})();