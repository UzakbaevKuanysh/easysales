var appasyncadd = appasyncadd || [];
(function() {
    var app = {},
        am = {},
        self = {};
    var loader = function(an_app) {
        app = an_app;
        am = app.misc;
        app.all = module;
        self = module;
        self.init();
    };
    setTimeout(function() {
        appasyncadd.push(loader);
    }, 0);

    var module = {
        confirm: {
            show: function(message, callback) {
                var fel = $('.js_confirm_form');
                if (!fel.length) return;

                fel.find('.js_message').html(message);

                $.fancybox.open(fel);

                fel.find('.js_ok').unbind('click.all_confirm').on('click.all_confirm', function(e) {
                    e.preventDefault();
                    if (typeof callback === 'function') callback();
                    $.fancybox.close();
                });

                fel.find('.js_cancel').unbind('click.all_confirm').on('click.all_confirm', function(e) {
                    e.preventDefault();
                    $.fancybox.close();
                })
            }
        },
        message: {
            show: function(message, callback) {
                var fel = $('.js_message_form');
                if (!fel.length) return;

                fel.find('.js_message').text(message);

                $.fancybox.open(fel, {
                    beforeClose: function() {
                        if (typeof callback === 'function') callback();
                    }
                });

                fel.find('.js_ok').click(function(e) {
                    e.preventDefault();

                    $.fancybox.close();
                })
            }
        },
        addition: {
            show: function(message, afterContent, callback, buttonText = 'Ok') {
                var fel = $('.js_message_form'),
                    $mess = fel.find('.js_message'),
                    $after = fel.find('.after'),
                    $button = fel.find('.js_ok');

                if (!fel.length) return;
                $button.attr("type", "submit");
                $mess.text(message);
                if ($after.length === 0) {
                    $mess.after('<div class="after"></div>');
                    $after = fel.find('.after');
                }
                $after.html(afterContent);
                $button.text(buttonText);

                $.fancybox.open(fel);

                $button.off().click(function(e) {
                    e.preventDefault();
                    if (typeof callback === 'function') callback();
                    $.fancybox.close();
                })
            }
        },
        init: function() {
            am.on('promiseCmd done', function(e, req, res) {
                if (res && typeof res === 'object' && $.isArray(res.ymCounterCalls)) {
                    $.each(res.ymCounterCalls, function(i, o) {
                        if ($.isArray(o) && o.length > 0) {
                            try {
                                var method = o[0];
                                var args = $.isArray(o[1]) ? o[1] : [];
                                yaCounter28051731[method].apply(yaCounter28051731, args);
                            } catch (e) {}
                        }
                    });
                }
            });

            if (!$.cookie('channel_set')) {
                $.cookie('channel_referer', document.referrer);
                $.cookie('channel_url', window.location.href);
                $.cookie('channel_set', true);
            }
        }
    };
})();