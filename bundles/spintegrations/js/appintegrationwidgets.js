var appasyncadd = appasyncadd || [];
(function() {
    var app = {},
        am = {},
        self = {};
    var loader = function(an_app) {
        app = an_app;
        am = app.misc;
        app.integrationWidgets = module;
        self = module;
        self.init();
    };
    setTimeout(function() {
        appasyncadd.push(loader);
    }, 0);

    var busy = false;

    String.prototype.capitalize = function() {
        return this.charAt(0).toUpperCase() + this.slice(1);
    }


    var module = {
        runningWidgets: null, // свертки подключенных плагинов

        init: function() {
            self.loadData();
        },

        // получает данные JSON, добавляемые при отправке результата скрипта на сервер
        // из всех подключенных к скрипту виджетов и упаковывает в общий JSON.
        getStopScriptData: function() {
            var data = {};
            if (self.runningWidgets && self.runningWidgets.operator) {
                $.each(self.runningWidgets.operator, function(name, v) {
                    if (typeof app['widget' + name.capitalize()] == "object") {
                        if (typeof app['widget' + name.capitalize()].getPassData == 'function') {
                            data[name] = app['widget' + name.capitalize()].getPassData();
                        }
                    }
                });
            }

            return data;
        },

        // отрисовывает контейнеры виджетов в области встраивания интерфейса прохода
        // скрипта, а затем вызывает функции renderPass во всех подлюченных к скрипту виджетах.
        renderPass: function() {
            var start_script = jQuery.Deferred();

            am.on('start script', start_script.resolve);

            var sidebar = $('.view_box_sidebar');
            sidebar.find('.js_render_widgets').remove();
            //clear search widget data
            am.trigger('widget clear previous data');
            if (self.runningWidgets && self.runningWidgets.operator) {
                $.each(self.runningWidgets.operator, function(name, v) {

                    var ajax_done = jQuery.Deferred();
                    am.on('widget load name-' + name, ajax_done.resolve);

                    $.when(start_script, ajax_done).done(function(stop, ajax_done) {
                        try {
                            if (v.visible) {
                                sidebar.append('<div class="js_render_widgets view_box__closed">' +
                                    '<h4>' + Translator.trans('widget_' + name + '_name') + '</h4>' +
                                    '<div id="widgets-operator-' + name + '"></div>' +
                                    '</div>');
                                setTimeout(function() {
                                    $('.view_box_sidebar h4:visible:first').trigger('click');
                                }, 1);
                            }
                            if (typeof app['widget' + name.capitalize()] == "object") {
                                if (typeof app['widget' + name.capitalize()].renderPass == 'function') {
                                    if (v.settings) {
                                        app['widget' + name.capitalize()].settings = v.settings;
                                    }
                                    app['widget' + name.capitalize()].renderPass();
                                }
                            }
                        } catch (e) {
                            console.error(e);
                        }
                    });
                });
                var index = $('.view_box__closed').size() - 1;
                var rate = 40;

                //sidebar.css({'bottom': ((index + 1) * rate) + 70 + 'px'});

                $('.view_box__closed').each(function(i, o) {
                    $(o).css({
                        bottom: (rate * index) + 70 + 'px'
                    });
                    index--;
                });
            }

            var start_constructor = jQuery.Deferred();
            am.on('constructor load done', start_constructor.resolve);

            if (self.runningWidgets && self.runningWidgets.constructor) {
                $.each(self.runningWidgets.constructor, function(name, v) {

                    var ajax_done = jQuery.Deferred();
                    am.on('widget load name-' + name, ajax_done.resolve);

                    $.when(ajax_done, start_constructor).done(function(ajax_done, start_constructor) {
                        try {
                            if (typeof app['widget' + name.capitalize()] == "object") {
                                if (typeof app['widget' + name.capitalize()].renderPass == 'function') {
                                    if (v.settings) {
                                        app['widget' + name.capitalize()].settings = v.settings;
                                    }
                                    app['widget' + name.capitalize()].renderPass();
                                }
                            }
                        } catch (e) {
                            console.error(e);
                        }
                    });
                });
            }

        },

        // загружает во внутреннюю переменную JSON свертки подключенных плагинов
        loadData: function() {
            am.on('promiseCmd done', function(e, req, res) {
                try {
                    if (res && typeof res === 'object' && res.widgets != undefined) {
                        self.runningWidgets = res.widgets;
                        self.loadWidgets();
                    }
                } catch (e) {}
            });
        },

        // подключает файлы script.js всех подключенных к скрипту виджетов при помощи
        // функции jQuery.getScript()
        loadWidgets: function() {
            var locale = $('html').prop('lang');

            if (self.runningWidgets) {
                $.each(self.runningWidgets, function(type, value) {
                    $.each(value, function(widget, value) {

                        var url = '/hsplugins/' + widget + '/js/script.js?v' + Math.random();
                        $.getScript(url, function(data, textStatus, jqxhr) {
                            console.log("Load script " + widget + " was performed.");

                            url = '/hsplugins/' + widget + '/i18n/' + locale + '.json?v' + Math.random();
                            $.get(url, function(data, textStatus, jqxhr) {
                                console.log("Load i18n " + widget + " was performed.");
                                $.each(data, function(i, v) {
                                    Translator.add('widget_' + widget + '_' + i, v, "messages", locale);
                                });

                                am.trigger('widget load name-' + widget);
                            });

                        });

                        url = '/hsplugins/' + widget + '/css/main.css?v' + Math.random();
                        $('head').append('<link rel="stylesheet" href="' + url + '" type="text/css" />');
                    });
                });

                self.renderPass();
            }
        }

    };

})();