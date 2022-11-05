var appasyncadd = appasyncadd || [];
(function() {
    var app = {},
        am = {},
        self = {};
    var loader = function(an_app) {
        app = an_app;
        am = app.misc;
        app.libAddScript = module;
        self = module;
        self.init();
    };
    setTimeout(function() {
        appasyncadd.push(loader);
    }, 0);

    var busy = false;

    var module = {
        showPopup: function() {
            let fel = $('.js_scripts_input_name_for_script');
            am.clearGenericFormErrors(fel);
            $.fancybox.open(fel, {
                autoSize: true,
                helpers: {
                    overlay: {
                        closeClick: false
                    }
                },
            });
        },
        init: function() {
            let fel = $('.js_scripts_input_name_for_script');
            if (fel.length !== 1) return;

            fel.submit(function(e) {
                e.preventDefault();

                if (busy) return;
                busy = true;

                $.fancybox.showLoading();
                am.clearGenericFormErrors(fel);
                let folder_id = null;
                try {
                    folder_id = app.scriptFolder.currentSelectedFolder.id;
                } catch (e) {

                }
                am.trigger('add script start', [function(data) {
                    let name = fel.find('input[name]').val();
                    am.promiseCmd({
                        method: 'scripts.create',
                        name: name,
                        data: data,
                        folder_id: folder_id
                    }).always(function() {
                        busy = false;
                        $.fancybox.hideLoading();
                    }).fail(function(err) {
                        am.showGenericFormErrors(fel, err);
                        $.fancybox.update();
                        am.trigger('add script fail', [err]);
                    }).done(function(res) {
                        $.fancybox.close();
                        try {
                            if (folder_id) {
                                if (!app.scriptFolder.jsonScriptToFolder[folder_id]) {
                                    app.scriptFolder.jsonScriptToFolder[folder_id] = [];
                                }
                                app.scriptFolder.jsonScriptToFolder[folder_id].push({
                                    conversion_count: 0,
                                    icon: "OWNER",
                                    id: res.id,
                                    name: name,
                                    type: 'script',
                                    passages_count: 0,
                                    user_access_count: 0
                                })
                            } else {
                                app.scriptFolder.scriptsNoFolder[res.id] = {
                                    conversion_count: 0,
                                    icon: "OWNER",
                                    id: res.id,
                                    name: name,
                                    type: 'script',
                                    passages_count: 0,
                                    user_access_count: 0
                                };
                            }
                        } catch (e) {
                            console.log('ERRR', e);
                        }
                        am.trigger('add script done', [res]);
                    });
                }]);
            });
        }
    };

})();