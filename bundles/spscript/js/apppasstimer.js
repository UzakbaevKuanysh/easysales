var appasyncadd = appasyncadd || [];
(function() {
    var app = {},
        am = {},
        self = {};
    var loader = function(an_app) {
        app = an_app;
        am = app.misc;
        app.passTimer = module;
        self = module;
        self.init();
    };
    setTimeout(function() {
        appasyncadd.push(loader);
    }, 0);

    var module = {
        timer: null,
        time: 0,
        steps: {},
        init: function() {
            am.on('log step', function(e, step, status, cid) {
                if (step.name === 'start') {
                    self.restartTimer();
                    self.steps = {};
                }

                if (Object.keys(self.steps).length < 2 && self.time > 5) {
                    self.restartTimer();
                    self.time += 5;
                }

                self.logStep(step.name);
            });

            am.on('stop script', function(e) {
                self.destroyTimer();
            });
        },

        restartTimer: function() {
            self.time = 0;
            self.destroyTimer();
            self.timer = setInterval(function() {
                self.time++;
            }, 1000);
        },

        destroyTimer: function() {
            if (self.timer)
                clearInterval(self.timer);
        },

        logStep: function(id) {
            self.steps[id] = self.time;
        },

        getStepTime: function(id) {
            return self.steps[id];
        },

        getTime: function() {
            return self.time;
        }
    };

})();