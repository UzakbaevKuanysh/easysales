var appasyncadd = appasyncadd || [];
(function() {
    var app = {},
        am = {},
        self = {};
    var loader = function(an_app) {
        app = an_app;
        am = app.misc;
        app.keyCall = module;
        self = module;
        self.init();
    };
    setTimeout(function() {
        appasyncadd.push(loader);
    }, 0);

    var module = {
        PrintLn: function(str) {
            if (typeof str in {
                    'number': 0,
                    'boolean': 0
                }) str = str.toString();
            if (typeof str !== 'string') return;
            str = str.replace(/\n/g, '<br />');
            var id = 'kcpldi' + Math.floor(Math.random() * 1000000000) + 'a' + (new Date().getTime()) + 'z';
            $('body').append([
                '<div id="' + id + '" class="kcpldc" style="position: fixed; z-index: 1005001; left: 0px; top: 0px;',
                ' background: white; opacity: 0.9; font-family: \'Courier New\', Courier, monospace;',
                ' font-size: 16px; font-weight: bold;">' + str + '</div>'
            ].join('\n'));
            var line = $('body > #' + id);
            var align = function() {
                var top = 100;
                $('body > .kcpldc').each(function() {
                    var o = $(this);
                    o.offset({
                        left: 100,
                        top: top
                    });
                    top += o.height();
                });
            };
            align();
            var hide = function() {
                setTimeout(function() {
                    line.fadeOut(200, function() {
                        line.remove();
                        align();
                        var cb = $('body > .kcpldc').eq(0).data('selfRemoveCb');
                        if (typeof cb === 'function') cb();
                    });
                }, Math.max(2000, Math.min(str.length * 100, 10000)));
            };
            line.data('selfRemoveCb', hide);
            if ($('body > .kcpldc').length === 1) hide();
        },
        handlers: [],
        buffer: '',
        bufferMaxLength: 20,
        isListening: false,
        startListening: function() {
            if (self.isListening) return;
            self.isListening = true;
            jQuery(document).on('keypress.keyCall', function(e) {
                var last = e.which === 13 ? 32 : e.which;
                self.buffer += String.fromCharCode(last);
                if (self.buffer.length > self.bufferMaxLength) self.buffer = self.buffer.substr(-self.bufferMaxLength);
                if (last === 32) {
                    var stackTop = self.getStack().pop();
                    for (var i = 0; i < self.handlers.length; i++) {
                        var name = self.handlers[i].name;
                        if (stackTop === name) {
                            var cb = self.handlers[i].cb;
                            if (typeof cb === 'function') {
                                e.preventDefault();
                                cb(self.getStack());
                            }
                        }
                    }
                }
            });
            if (!self.handlers.length) self.stopListening();
        },
        stopListening: function() {
            jQuery(document).off('keypress.keyCall');
            self.isListening = false;
        },
        find: function(name) {
            for (var i = 0; i < self.handlers.length; i++) {
                if (self.handlers[i].name === name) return {
                    i: i,
                    h: self.handlers[i]
                };
            }
            return null;
        },
        add: function(name, cb) {
            if (typeof name === 'string' && typeof cb === 'function') {
                self.multiNameAdd(name, cb);
            } else if (typeof name === 'object') {
                for (var ni in name) {
                    var cb = name[ni];
                    if (typeof cb === 'function') self.multiNameAdd(ni, cb);
                }
            }
            return self;
        },
        multiNameAdd: function(name, cb) {
            if (typeof name !== 'string' || !name || name.length > self.bufferMaxLength || typeof cb !== 'function') return false;
            var arr = name.split(' ');
            if (!arr.length) return false;
            for (var ai = 0; ai < arr.length; ai++) self.singleNameAdd(arr[ai], cb);
            return true;
        },
        singleNameAdd: function(name, cb) {
            if (typeof name !== 'string' || !name || name.length > self.bufferMaxLength || typeof cb !== 'function') return false;
            var hnd = self.find(name);
            if (hnd) {
                hnd.h.cb = cb;
            } else {
                self.handlers.push({
                    name: name,
                    cb: cb
                });
            }
            if (self.handlers.length) self.startListening();
            return true;
        },
        remove: function(name) {
            if (typeof name !== 'string' || !name || name.length > self.bufferMaxLength) return self;
            var hnd = self.find(name);
            if (!hnd) return self;
            self.handlers.splice([hnd.i], 1);
            if (!self.handlers.length) self.stopListening();
            return self;
        },
        getStack: function() {
            var arr = self.buffer.split(' ');
            var res = [];
            for (var ai = 0; ai < arr.length; ai++)
                if (arr[ai].length) res.push(arr[ai]);
            return res;
        },
        init: function() {
            self.stopListening();
            if (self.handlers.length) self.startListening();
        }
    };

})();