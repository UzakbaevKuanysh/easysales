var appasyncadd = appasyncadd || [];
(function() {
    var app = {},
        am = {},
        self = {};
    var loader = function(an_app) {
        app = an_app;
        am = app.misc;
        app.access = module;
        self = module;
        self.init();
    };
    setTimeout(function() {
        appasyncadd.push(loader);
    }, 0);

    var module = {
        busy: false,
        initActionsForAccessedUsers: function(formSelector = false) {
            if (!formSelector) {
                formSelector = '.js_access_form';
            }
            var fel = $(formSelector);
            if (!fel.length) return;

            var body = fel.find('tbody');
            body.find('.js_option').click(function() {
                if (self.busy) return;
                self.busy = true;
                var _this = this;
                $.fancybox.showLoading();
                am.promiseCmd({
                    method: 'scripts.change_access_for_user',
                    script_id: $(this).data('script_id'),
                    type: $(this).data('type'),
                    user_id: $(this).data('user_id'),
                    role: $(this).data('val')
                }).always(function() {
                    self.busy = false;
                    $.fancybox.hideLoading();
                }).fail(function(err) {
                    alert(Translator.trans('load_rights_error'));
                }).done(function(res) {
                    $(_this).parent().find('.active').removeClass('active')
                    $(_this).addClass('active')
                    self.initListAccessUsers(res.users);
                });
            });


            body.find('.js_remove').click(function(e) {
                e.preventDefault();
                var el = $(this);
                app.get('all').done(function(all) {
                    all.confirm.show(Translator.trans('are_you_sure_remove_access'), function() {
                        if (self.busy) return;
                        self.busy = true;
                        $.fancybox.showLoading();
                        am.promiseCmd({
                            method: 'scripts.remove_accessed_user',
                            script_id: el.data('script_id'),
                            type: el.data('type'),
                            user_id: el.data('user_id')
                        }).always(function() {
                            self.busy = false;
                            $.fancybox.hideLoading();
                        }).fail(function(err) {
                            alert(Translator.trans('load_rights_error'));
                        }).done(function(res) {
                            $('.main' + el.data('user_id') + ' .all_scripts').removeClass('all_scripts').addClass('add_user_all_scripts')
                            el.closest('tr').remove();
                            self.initListAccessUsers(res.users);
                        });
                    });
                });
            });
        },
        getAccessPromiseHtml: function() {
            return [
                '<a tabindex="0" class="access_promise_note" data-toggle="popover" data-content="' +
                Translator.trans('after_logged_user_get_access') + '" ',
                'data-placement="top" data-trigger="focus">',
                '	(' + Translator.trans('user_waiting_registration') + ')',
                '</a>'
            ].join('\n');
        },
        getAccessPendingHtml: function() {
            return [
                '<a tabindex="0" class="access_promise_note" data-toggle="popover" data-content="' +
                Translator.trans('pending_grant_access_tip') + '" ',
                'data-placement="top" data-trigger="focus">',
                '	(' + Translator.trans('pending_grant_access') + ')',
                '</a>'
            ].join('\n');
        },
        initListAccessUsers: function(users, formSelector = false) {
            if (!$.isArray(users)) return;
            if (!formSelector) {
                formSelector = '.js_access_form';
            }
            var fel = $(formSelector);
            if (!fel.length) return;

            var body = fel.find('tbody');
            body.html('');

            if (users.length == 0) {
                body.append('<td colspan="3" style="text-align:center;">' +
                    Translator.trans('no_entries') +
                    '</td>');
            }

            app.get('script').done(function(m) {
                if (m.isHs()) {
                    for (let i = 0; i < users.length; i++) {
                        let u = users[i];
                        body.append([
                            '<tr class="js_accessed_user ' + ((u.excess) ? 'text-muted' : '') + '">',
                            '	<td>' + u.name + (u.type === 'promise' ? ' ' + self.getAccessPromiseHtml() : (u.type === 'pending' ? ' ' + self.getAccessPendingHtml() : '')) +
                            '</td>',
                            '<td>' + (u.email ? u.email : '') + '</td>',
                            '<td>' + ((u.excess) ? '<span class="label label-danger" style="margin-left: 40px;">' + Translator.trans('not_enough_licenses') + '</span> <a style="margin-left: 20px;" href="/billing">' + Translator.trans('buy') + '</a>' : '') + '</td>',
                            '	<td>',
                            `		<ul ${app.script.currentScriptType === 'quiz' ? 'class="hidden"' : ''}>`,
                            '			<li class="js_option' + (u.role === 'ROLE_SCRIPT_READER' ? ' active' : '') + '" data-script_id="' + u.script_id + '"',
                            '				data-user_id="' + u.id + '" data-type="' + u.type + '" data-val="ROLE_SCRIPT_READER">',
                            '				<span class="glyphicon glyphicon-ok"></span> ' + Translator.trans('operator') + '</li>',
                            '			<li class="js_option' + (u.role === 'ROLE_SCRIPT_WRITER' ? ' active' : '') + '" data-script_id="' + u.script_id + '"',
                            '				data-user_id="' + u.id + '" data-type="' + u.type + '" data-val="ROLE_SCRIPT_WRITER">',
                            '				<span class="glyphicon glyphicon-ok"></span> ' + Translator.trans('admin') + '</li>',
                            '		</ul>',
                            '	</td>',
                            '	<td style="text-align:center;">',
                            '		<a href="#" class="js_remove" data-script_id="' + u.script_id + '" data-user_id="' + u.id + '" data-type="' + u.type + '">',
                            '			<span class="glyphicon glyphicon-remove-sign"></span>',
                            '		</a>',
                            '	</td>',
                            '</tr>'
                        ].join(''));
                    }
                } else {
                    for (let i = 0; i < users.length; i++) {
                        let u = users[i];

                        body.append(
                            '<tr class="js_accessed_user">' +
                            '<td>' + u.name + '</td>' +
                            '<td>' + u.email + '</td>' +
                            '<td>' +
                            `<div ${app.script.currentScriptType === 'quiz' ? 'class="hidden"' : ''}>` +
                            '<input class="js_option" type="radio" name="role[' + u.id + ']" data-script_id="' + u.script_id +
                            '" data-user_id="' + u.id + '" data-type="' + u.type + '" data-val="ROLE_SCRIPT_READER" val="" ' +
                            (u.role === 'ROLE_SCRIPT_READER' ? 'checked="checked"' : '') + ' /> ' + Translator.trans('operator') + ' ' +
                            '&nbsp;' +
                            '<input class="js_option" type="radio" name="role[' + u.id + ']" data-script_id="' + u.script_id +
                            '" data-user_id="' + u.id + '" data-type="' + u.type + '" data-val="ROLE_SCRIPT_WRITER" val="" ' +
                            (u.role === 'ROLE_SCRIPT_WRITER' ? 'checked="checked"' : '') + ' /> ' + Translator.trans('admin') + ' ' +
                            '</div>' +
                            '</td>' +
                            '<td style="text-align:center;">' +
                            '<a href="#" class="js_remove" data-script_id="' + u.script_id + '" data-user_id="' + u.id + '" data-type="' + u.type + '">' +
                            '<span class="glyphicon glyphicon-remove"></span></a>' +
                            '</td>' +
                            '</tr>'
                        );
                    }
                }
            });

            $('.access_promise_note').popover();

            self.initActionsForAccessedUsers(formSelector);
        },
        loadAccessUsers: function() {
            var fel = $('.js_access_form');
            if (!fel.length) return;

            var boxel = $('.js_editor');
            if (!boxel.size()) return;

            if (self.busy) return;
            self.busy = true;

            $.fancybox.showLoading();
            am.promiseCmd({
                method: 'scripts.load_accessed_users',
                script_id: boxel.data('id'),
            }).always(function() {
                self.busy = false;
                $.fancybox.hideLoading();
            }).fail(function(err) {
                alert(Translator.trans('read_access_error'));
            }).done(function(res) {
                self.initListAccessUsers(res.users);
            });
        },
        initFormAccess: function() {
            var fel = $('.js_access_form');
            if (!fel.length) return;

            var boxel = $('.js_editor');
            if (!boxel.size()) return;

            fel.submit(function(e) {
                e.preventDefault();

                if (self.busy) return;
                self.busy = true;

                $.fancybox.showLoading();
                am.promiseCmd({
                    method: 'scripts.add_user_access',
                    script_id: boxel.data('id'),
                    email: fel.find('.js_access_email').val(),
                    role: fel.find('.js_access_role').val()
                }).always(function() {
                    self.busy = false;
                    am.clearGenericFormErrors(fel);
                    $.fancybox.hideLoading();
                }).fail(function(err) {
                    am.showGenericFormErrors(fel, err);
                }).done(function(res) {
                    fel.find('.js_access_email').val('');
                    self.initListAccessUsers(res.users);

                    $('.js_user_access_count').text(res.users.length);

                    if (res.isSendedInviteLetter) {
                        app.get('all').done(function(all) {
                            all.message.show(Translator.trans('send_invite_to_user'));
                        });
                    }
                });
            });
        },
        init: function() {
            self.initFormAccess();
            am.on('tab selected', function(data) {
                if (data.args.length) {
                    if (data.args.includes('js_access_box')) {
                        self.loadAccessUsers();
                    }
                }
            })
        }
    };
})();