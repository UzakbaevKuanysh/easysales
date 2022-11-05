var appasyncadd = appasyncadd || [];
(function() {
    var app = {},
        am = {},
        self = {};
    var loader = function(an_app) {
        app = an_app;
        am = app.misc;
        app.feedback = module;
        self = module;
        self.init();
    };
    setTimeout(function() {
        appasyncadd.push(loader);
    }, 0);

    var module = {
        init: function() {
            var fel = $('.js_feedback_form');
            if (!fel.size()) return;

            var nel = fel.find('input[name=name]');
            var eel = fel.find('input[name=email]');
            var mel = fel.find('input[name=phone]');
            var message = fel.find('textarea[name=message]');

            fel.submit(function(e) {
                e.preventDefault();

                $.fancybox.showLoading();
                am.promiseCmd({
                    method: 'feedback.send',
                    name: nel.val(),
                    email: eel.val(),
                    phone: mel.val(),
                    message: message.val()
                }).always(function() {
                    $.fancybox.hideLoading();
                    am.clearGenericFormErrors(fel);
                }).done(function(res) {
                    fel.hide();

                    $.fancybox.open($('.js_feedback_form_repeat'), {
                        scrolling: 'no',
                        padding: [40, 30, 40, 30]
                    });

                    nel.val('');
                    eel.val('');
                    mel.val('');
                    message.val('');
                }).fail(function(err) {
                    am.showGenericFormErrors(fel, err);
                });
            });

            $('.js_show_feedback_form').click(function(e) {
                e.preventDefault();

                $.fancybox.open(fel, {
                    scrolling: 'no',
                    padding: [40, 30, 40, 30]
                });
            });

            $('.js_feedback_repeat_button').click(function(e) {
                e.preventDefault();

                $('.js_feedback_form_repeat').hide();
                $.fancybox.open(fel, {
                    scrolling: 'no',
                    padding: [40, 30, 40, 30]
                });
            });
        }
    };
})();