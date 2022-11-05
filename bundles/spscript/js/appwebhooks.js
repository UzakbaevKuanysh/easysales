var appasyncadd = appasyncadd || [];
(function() {
    var app = {},
        am = {},
        self = {};
    var loader = function(an_app) {
        app = an_app;
        am = app.misc;
        app.webooks = module;
        self = module;
        self.init();
    };
    setTimeout(function() {
        appasyncadd.push(loader);
    }, 0);

    var busy = false;

    var module = {
        // добавление удаление вебхуха скрипта
        crud: {
            getTemplate: function(form) {
                var template = form.find('.js_webhook_template').clone();
                template.removeClass('js_webhook_template').removeClass('hidden');
                template.find('input').prop('required', "required");

                return template;
            },

            init: function() {
                var form = $('.js_form_script_webhooks');


                // add hook btn
                form.on('click', 'a[href=#add]', function(e) {
                    e.preventDefault();

                    var item = $(this);

                    var template = self.crud.getTemplate(form);

                    template.insertBefore(item.closest('.form-group'));
                });

                form.on('click', '.js_webhook_remove', function(e) {
                    e.preventDefault();

                    var item = $(this);

                    item.closest('.form-group').remove();
                });

                form.on('submit', self.crud.saveHandler);

                $('.integration-tabs a[href=#webhooks]').on('click', self.crud.openPageHandler);

                // сбрасываем таб интеграций на первый элемент при переходе на интеграции
                $('.js_show_integration').on('click', function() {
                    $('.integration-tabs a:first').tab('show');
                });

                form.on('blur', 'input', function(e) {
                    var formgroup = $(this).closest('.form-group');
                    formgroup.removeClass('has-error');
                    formgroup.find('.help-block').remove();

                    if ($(this).val().length > 0) {
                        if (!this.checkValidity()) {
                            $(this).closest('.form-group').addClass('has-error');
                            $('<span>', {
                                class: "help-block",
                                text: 'Некорректный URL'
                            }).insertAfter($(this).closest('.input-group'));
                        }
                    }
                });

                $('body').on('click', '.addStepWebHook', function() {
                    var template = self.crud.getTemplate(form);
                    template.find('input').attr('name', 'stepWebHook[' + $(this).data('id') + '][]');
                    $(template).insertBefore(this)
                })
            },

            saveHandler: function(e) {
                e.preventDefault();

                var form = $(this).closest('form');


                if (busy) return;
                busy = true;
                $.fancybox.showLoading();
                am.promiseCmd({
                    method: 'scripts.set_web_hooks',
                    script_id: $('.js_editor').data('id'),
                    urls: form.serializeArray(),
                }).always(function() {
                    busy = false;
                    $.fancybox.hideLoading();
                }).fail(function(err) {}).done(function(res) {
                    if (res.webhooks != undefined) {
                        self.pass.runningWebHooks = res.webhooks;
                    }
                });
            },

            openPageHandler: function(e) {
                if (busy) return;

                var form = $('.js_form_script_webhooks');
                if (!form.length) return;

                form.find('.js_webhook:not(.js_webhook_template)').remove();
                if (self.pass.runningWebHooks) {
                    $.each(self.pass.runningWebHooks, function(i, v) {
                        var template = self.crud.getTemplate(form);
                        template.find('input').val(i);
                        template.insertBefore(form.find('a[href=#add]').closest('.form-group'));
                    });
                }
                var stepWebHooks = $('#stepWebHooks');
                stepWebHooks.html('');
                if (self.pass.currentScript && self.pass.currentScript.data != undefined) {
                    $.each(self.pass.currentScript.data.connections, function(index, value) {
                        stepWebHooks.append($('<p>').append($('<strong>', {
                            text: value.condition
                        })));
                        var WebHooks = $('<div>', {
                            'data-id': value.target
                        });
                        if (self.pass.currentScript.step_web_hooks[value.target] != undefined) {
                            $.each(self.pass.currentScript.step_web_hooks[value.target], function(i, v) {
                                var template = self.crud.getTemplate(form);
                                template.find('input').attr('name', 'stepWebHook[' + value.target + '][]');
                                template.find('input').val(v)
                                stepWebHooks.append(template);
                            })
                        }
                        stepWebHooks.append($('<a>', {
                            text: Translator.trans('webhook_script_btn_add'),
                            class: 'addStepWebHook',
                            'data-id': value.target
                        }))
                    })
                }
            },
        },

        pass: {
            runningWebHooks: null,
            currentScript: null,
            widgets: null,
            init: function() {
                am.on('stop script', function() {
                    var stop = jQuery.Deferred();
                    var ajax_done = jQuery.Deferred();

                    am.on('stop script', stop.resolve);
                    am.on('promiseCmd done', ajax_done.resolve);

                    $.when(stop, ajax_done).done(function(stop, ajax_done) {
                        var params = ajax_done[1];
                        delete params['csrf_token'];
                        delete params['apikey'];
                        delete params['key'];
                        delete params['method'];
                        params['event'] = 'stop script';

                        try {
                            if (self.pass.widgets && self.pass.widgets.operator) {
                                $.each(self.pass.widgets.operator, function(name, wData) {
                                    if (typeof app['widget' + name.capitalize()] == "object") {
                                        if (typeof app['widget' + name.capitalize()].getWebhooks == 'function') {
                                            let hooks = app['widget' + name.capitalize()].getWebhooks();
                                            if (self.pass.runningWebHooks) {
                                                let data = self.pass.runningWebHooks;
                                                self.pass.runningWebHooks = Object.assign(data, hooks);
                                            } else {
                                                self.pass.runningWebHooks = hooks;
                                            }
                                        }
                                    }
                                });
                            }
                            if (self.pass.runningWebHooks !== undefined && Object.keys(self.pass.runningWebHooks).length > 0) {
                                for (let hook in self.pass.runningWebHooks) {
                                    if (window.amocrm_account_id) {
                                        //run webhook
                                        $.ajax({
                                            type: "POST",
                                            url: hook,
                                            data: ajax_done[1],
                                            headers: {
                                                "X-Account": window.amocrm_account_id,
                                            },
                                        });
                                    } else {
                                        $.post(hook, ajax_done[1]);
                                    }
                                }
                            }
                        } catch (e) {}
                    });
                });

                am.on('promiseCmd done', function(e, req, res) {
                    try {
                        if (res && typeof res === 'object' && res.web_hooks != undefined) {
                            self.pass.runningWebHooks = res.web_hooks;
                        }
                        if (res && typeof res === 'object' && res.widgets != undefined) {
                            self.pass.widgets = res.widgets;
                        }
                        if (res && typeof res === 'object' && res.data != undefined && res.data.connections != undefined) {
                            if (!self.pass.currentScript) {
                                self.pass.currentScript = res;
                            } else {
                                self.pass.currentScript.data = res.data;
                            }
                        }
                    } catch (e) {}
                });
            },
        },

        step: {
            init: function() {}
        },

        init: function() {

            self.crud.init();
            self.pass.init();
            self.step.init();
        },

    };
})();