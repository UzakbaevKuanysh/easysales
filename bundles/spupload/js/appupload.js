var appasyncadd = appasyncadd || [];
(function() {
    var app = {},
        am = {},
        self = {};
    var loader = function(an_app) {
        app = an_app;
        am = app.misc;
        app.upload = module;
        self = module;
        app.upload.init();
    };
    setTimeout(function() {
        appasyncadd.push(loader);
    }, 0);

    var module = {
        defaults: {
            autoUpload: true,
            demoMode: false,
            debug: false,
            uploadButtonText: 'Обзор',
            cancelButtonText: 'Отменить',
            failUploadText: 'Загрузка не удалась',
            multipleFileDropNotAllowedMessage: 'Загрузить можно только один файл.'
        },
        submit: function(el, id, fileName) {
            var cb = el.data('upload').cbs.submit;
            if (typeof cb === 'function') cb(el, id, fileName);
        },
        complete: function(el, id, fileName, res) {
            var cb = el.data('upload').cbs.complete;
            if (typeof cb === 'function') cb(el, res, id, fileName);
        },
        error: function(el, err) {
            var cb = el.data('upload').cbs.error;
            if (typeof cb === 'function') cb(el, err);
        },
        worker: function(el, opts) {
            var data = el.data('upload');
            if (typeof data !== 'object' || !data.initialized) {
                if (typeof opts !== 'object') throw 'invalid init options';
                var csrfToken = am.getCsrfToken();
                var qqopts = {
                    element: el.get(0),
                    action: '/upload/by_type_and_id',
                    params: {
                        csrf_token: csrfToken,
                    },
                    uploadButtonText: 'Загрузить фото',
                    onSubmit: function(id, fileName) {
                        self.submit(el, id, fileName);
                    },
                    onComplete: function(id, fileName, res) {
                        self.complete(el, id, fileName, res);
                    },
                    showMessage: function(err) {
                        self.error(el, err);
                    }
                };
                data = {
                    initialized: true,
                    cbs: {},
                    qq: new qq.FileUploader(jQuery.extend(true, {}, self.defaults, qqopts, opts))
                };
                el.data('upload', data);
            }
            if (typeof opts !== 'object') opts = {};
            if (typeof opts.submit === 'function') data.cbs.submit = opts.submit;
            if (typeof opts.complete === 'function') data.cbs.complete = opts.complete;
            if (typeof opts.error === 'function') data.cbs.error = opts.error;
        },
        upload: function(opts) {
            this.each(function() {
                var el = jQuery(this);
                self.worker(el, opts);
            });
            return this;
        },
        init: function() {
            jQuery.fn.extend({
                upload: self.upload
            });
        }
    };

})();