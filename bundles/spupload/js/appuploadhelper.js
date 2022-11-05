var appasyncadd = appasyncadd || [];
(function() {
    var app = {},
        am = {},
        self = {};
    var loader = function(an_app) {
        app = an_app;
        am = app.misc;
        app.uploadHelper = module;
        self = module;
        self.init();
    };
    setTimeout(function() {
        appasyncadd.push(loader);
    }, 0);

    var module = {
        mode: null,
        uzel: null,
        uploadifyByElementImageTypeTypeView: function(element, image, type, type_view, template) {
            if (!template) {
                template = [
                    '<div class="qq-upload-button qq-post-button">',
                    ' <span>{uploadButtonText}</span>',
                    '</div>',
                    '<div class="qq-upload-drop-area"><span>{dragText}</span></div>',
                    '<ul class="qq-upload-list" style="display: none;"></ul>',
                    '<div class="js_upload_response"></div>'
                ].join('\n');
            }

            element.upload({
                uploadButtonText: Translator.trans('upload_helper_upload_button'),
                params: {
                    type: type
                },
                template: template,
                submit: function(el) {
                    $.fancybox.showLoading();
                    var urel = $('.js_upload_response');
                    if (urel.length === 1) urel.text('');
                },
                complete: function(el, res) {
                    $.fancybox.hideLoading();

                    if (res && res.urls && res.token) {
                        var lel = image;
                        lel.prop('src', res.urls[type_view] + '?' + am.generateKey()).data('token', res.token);
                    }
                },
                error: function(el, err) {
                    $.fancybox.hideLoading();

                    var lel = image;
                    lel.prop('src', lel.data('placeholder')).data('token', '');

                    if (err) {
                        var urel = $('.js_upload_response');
                        if (urel.length === 1) {
                            urel.css({
                                color: 'red'
                            }).text(err);
                        } else {
                            alert(err);
                        }
                    }
                }
            });
        },
        uploadifyByTypeAndId: function(els) {
            els.upload({
                action: '/upload/by_type_and_id',
                uploadButtonText: 'image goes here',
                template: [
                    '<div class="add">',
                    ' <div class="qq-upload-button qq-post-button"><i class="ico"></i>',
                    ' <a href="#" class="dotted"><span style="color: #5082C6;">{uploadButtonText}</span></a></div>',
                    ' <div class="qq-upload-drop-area"><span>{dragText}</span></div>',
                    ' <ul class="qq-upload-list" style="display: none;"></ul>',
                    '</div>'
                ].join('\n'),
                submit: function(el) {
                    self.setUploadParams({
                        type: jQuery('.js_obj_type').val(),
                        id: jQuery('.js_obj_id').val()
                    });
                    if (el.hasClass('recipes__block-compose-link')) el.parents('.recipe__step').find('.qq-upload-list').html('');
                },
                complete: function(el, res) {
                    if (!res.success) return;
                    if (typeof res.urls !== 'object') return;
                    var mel = jQuery('.js_upload_response').css({
                        color: 'black'
                    }).html('');
                    var irel = jQuery('.js_images_response').css({
                        color: 'black'
                    }).html('');

                    // for (var ui in res.urls) mel.append(ui+': '+res.urls[ui]+'\n');
                    for (var ui in res.urls) irel.append(ui + ' (' + res.urls[ui] + '):<br /> <img src="' + res.urls[ui] + '?' + am.generateKey() + '" alt="" /><br/><br/>');
                },
                error: function(el, err) {
                    if (typeof err === 'object') err = JSON.stringify(err);
                    jQuery('.js_upload_response').css({
                        color: 'red'
                    }).text(err);
                }
            });
        },
        uploadifyByTypeToTmp: function(els) {
            els.upload({
                action: '/upload/by_type_to_tmp',
                uploadButtonText: 'image goes here',
                template: [
                    '<div class="add">',
                    ' <div class="qq-upload-button qq-post-button"><i class="ico"></i>',
                    ' <a href="#" class="dotted"><span style="color: #5082C6;">{uploadButtonText}</span></a></div>',
                    ' <div class="qq-upload-drop-area"><span>{dragText}</span></div>',
                    ' <ul class="qq-upload-list" style="display: none;"></ul>',
                    '</div>'
                ].join('\n'),
                submit: function(el) {
                    self.setUploadParams({
                        type: jQuery('.js_obj_type').val()
                    });
                    if (el.hasClass('recipes__block-compose-link')) el.parents('.recipe__step').find('.qq-upload-list').html('');
                },
                complete: function(el, res) {
                    if (!res.success) return;
                    if (typeof res.urls !== 'object') return;
                    var mel = jQuery('.js_upload_response').css({
                        color: 'black'
                    }).html('');
                    mel.append('token: ' + res.token + '\n');
                    for (var ui in res.urls) mel.append(ui + ': ' + res.urls[ui] + '\n');
                },
                error: function(el, err) {
                    if (typeof err === 'object') err = JSON.stringify(err);
                    jQuery('.js_upload_response').css({
                        color: 'red'
                    }).text(err);
                }
            });
        },
        setUploadParams: function(params) {
            if (!self.uzel) return;
            var data = self.uzel.data('upload');
            if (!data) return;
            var qq = data.qq;
            if (!qq) return;
            qq.setParams(params);
        },
        init: function() {
            self.uzel = jQuery('.js_upload_zone');
            if (!self.uzel) return;
            self.mode = self.uzel.data('upload_mode');
            if (self.mode == 'by_type_and_id') {
                self.uploadifyByTypeAndId(self.uzel);
            } else if (self.mode == 'by_type_to_tmp') {
                self.uploadifyByTypeToTmp(self.uzel);
            }
        }
    };

})();