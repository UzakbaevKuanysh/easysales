var appasyncadd = appasyncadd || [];
(function() {
    var app = {},
        am = {},
        self = {};
    var loader = function(an_app) {
        app = an_app;
        am = app.misc;
        app.integration = module;
        self = module;
        self.init();
    };
    setTimeout(function() {
        appasyncadd.push(loader);
    }, 0);

    var busy = false;

    var module = {
        // добавление удаление плагина скрипта
        crud: {
            getTemplate: function(form) {
                var template = form.find('.js_plugin_template').clone();
                template.removeClass('js_plugin_template').removeClass('hidden');
                //template.find('input').prop('required', "required");

                return template;
            },
            getField: function(widget_name, name, params) {
                var field = $('<input/>', {
                    type: params.type
                });
                if (params.type == 'select') {
                    field = $('select');
                }

                field.prop('name', name);
                field.prop('id', 'id_' + params.name);
                field.addClass('form-control');

                if (params.required) {
                    field.prop('required', 'required');
                }

                if (params.value) {
                    field.val(params.value);
                }

                var div = $('<div>', {
                        class: 'form-group'
                    })

                    .append($('<label>', {
                        for: 'id_' + params.name,
                        text: Translator.trans('widget_' + widget_name + '_' + params.name)
                    }))
                    .append(field)
                    .append($('<div>', {
                        class: 'js_' + name + '_error'
                    }))

                ;

                return div;
            },
            init: function() {
                var form = $('.js_script_plugins');

                // открыли плагин
                form.on('click', '.js_plugin_open', function() {

                });
                form.on('submit', self.crud.saveHandler);

                $('.js_show_integration').on('click', self.crud.openPageHandler);
            },
            openPageHandler: function(e) {
                if (busy) return;

                var form = $('.js_script_plugins');
                var locale = $('html').prop('lang');
                if (!form.length) return;

                busy = true;
                $.fancybox.showLoading();

                form.find('a:not(.js_plugin_template)').remove();
                am.promiseCmd({
                    method: 'integrations.get_plugins',
                    script_id: $('.js_editor').data('id')
                }).always(function() {
                    busy = false;
                    $.fancybox.hideLoading();
                }).fail(function(err) {}).done(function(res) {

                    if (res.plugins && res.plugins.length) {
                        $('.integration-tabs a[href=#plugins]').closest('li').removeClass('hidden');
                    }

                    $.each(res.plugins, function(i, val) {

                        $.get("/hsplugins/" + val.name + "/i18n/" + locale + ".json", function(data, textStatus, jqxhr) {

                            $.each(data, function(i, v) {
                                Translator.add('widget_' + val.name + '_' + i, v, "messages", locale);
                            });

                            var widget = val.manifest.widget;
                            var template = self.crud.getTemplate(form);

                            if (val.install) {
                                template.find('h4').find('.install').removeClass('hidden');
                            }

                            template.find('h4').find('span:first').html(Translator.trans('widget_' + val.name + '_name'));
                            template.find('.list-group-item-text').html(Translator.trans('widget_' + val.name + '_short_description'));
                            template.data('data', val);
                            template.appendTo(form);
                            template.on('click', self.crud.openPageInstallPluginHandler);
                        });
                    });
                });
            },
            openPageInstallPluginHandler: function(event) {
                event.preventDefault();
                var item = $(this);
                var data = item.data('data');
                var manifest = data['manifest'];
                var widget = manifest.widget;
                var settings = manifest.settings;


                var felpi = $('.js_scripts_plugins_install');
                felpi.find('.js_btn_install').text(Translator.trans('integration.install'));
                felpi.find('.js_settings').empty();
                felpi.find('.js_btn_remove').remove();
                felpi.find('.js_settings').closest('div.js_params').addClass('hidden');

                if (data['install']) {
                    felpi.find('.js_btn_install').text(Translator.trans('integration.update'));
                    $('<button>', {
                        class: 'btn btn-danger js_btn_remove',
                        text: Translator.trans('integration.uninstall'),
                        name: 'remove',
                        type: 'submit'
                    }).insertAfter(
                        felpi.find('.js_btn_install')
                    );
                }

                var form = felpi.find('form');
                form.off('submit').on('submit', function(e) {
                    e.preventDefault();

                    var is_remove = false;
                    var btn = form.find("button[type=submit]:focus");
                    if (btn.hasClass('js_btn_remove')) {
                        is_remove = true;
                    }

                    if (!is_remove && !felpi.find('.js_settings').closest('div.js_params').is(':visible')) {
                        var settings_count = 0;
                        $.each(settings, function(field_name, v) {
                            settings_count++;

                            if (data['values'][field_name] != undefined) {
                                v.value = data['values'][field_name];
                            }
                            felpi.find('.js_settings').append(self.crud.getField(data.name, field_name, v));
                        });
                        if (settings_count > 0) {
                            felpi.find('.js_settings').closest('div.js_params').removeClass('hidden');
                            $.fancybox.update(felpi);
                            return;
                        }
                    }

                    var scriptID = $('.js_editor').data('id');

                    if (busy) return;
                    busy = true;

                    $.fancybox.showLoading();
                    am.promiseCmd({
                        method: 'integrations.set_plugin',
                        script_id: scriptID,
                        plugin_id: data.id,
                        remove: is_remove,
                        settings: form.serializeArray(),
                    }).always(function() {
                        busy = false;
                        $.fancybox.hideLoading();
                    }).fail(function(err) {}).done(function(res) {
                        $.fancybox.close();
                        $('.integration-tabs a[href=#plugins]').trigger('click');
                    });
                });

                felpi.find('.js_header').html(Translator.trans('widget_' + data.name + '_name'));
                felpi.find('.js_description').html(Translator.trans('widget_' + data.name + '_description'));

                $.fancybox.open(felpi);
            },
        },


        init: function() {
            self.crud.init();
        },

    };

})();