console.log("appscript_folder");
var appasyncadd = appasyncadd || [];
(function() {
    var app = {},
        am = {},
        self = {};
    var loader = function(an_app) {
        app = an_app;
        am = app.misc;
        app.scriptFolder = module;
        self = module;
        self.init();
    };
    setTimeout(function() {
        appasyncadd.push(loader);
    }, 0);
    var module = {
        folderChain: [],
        currentFolder: null,
        folderSelectedChain: [],
        currentSelectedFolder: null,
        currentScript: null,
        indexStore: 0,
        folders: [],
        foldersChain: [],
        jsonScriptToFolder: [],
        scriptsNoFolder: [],
        jsonScripts: {},
        allFolders: [],
        activeAccessFolder: 0,
        init: function() {
            self.folders = folders
            self.jsonScriptToFolder = jsonScriptToFolder
            self.scriptsNoFolder = scriptsNoFolder
            self.jsonScripts = json_scripts
            self.initEvents();
            self.renderDropdownMenu();
        },
        initEvents: function() {
            $(document).on('click', '.js_new_folder_script', function(e) {
                e.preventDefault();
                $('#scriptsFolderNameFormError').val('');
                $('.action-menu ul').removeClass('action-active');
                var fel = $('.js_scripts_input_name_for_folder_script');
                am.clearGenericFormErrors(fel);
                $.fancybox.open(fel, {
                    // scrolling: 'no',
                    minWidth: 330,
                    // fitToView: true,
                    // closeClick: false,
                    autoSize: true,
                    helpers: {
                        overlay: {
                            closeClick: false
                        }
                    },
                });
            });
            $(document).on('click', '#hs_add_folder_script_form_button', function(e) {
                var fel = $('.js_scripts_input_name_for_folder_script');
                $.fancybox.showLoading();
                am.clearGenericFormErrors(fel);
                e.preventDefault();
                e.stopPropagation();
                let name = fel.find('input[name]').val();
                am.promiseCmd({
                    method: 'scripts.createFolder',
                    name: name,
                    parent_id: self.currentSelectedFolder != null ? self.currentSelectedFolder.id : null
                }).always(function() {
                    $.fancybox.hideLoading();
                }).fail(function(err) {
                    am.showGenericFormErrors(fel, err);
                }).done(function(res) {
                    res.__children = [];
                    var newFolder = res;
                    if (self.currentSelectedFolder != null) {
                        self.currentSelectedFolder.__children.push(newFolder);
                        var ul = $('.menu_folders .dropdown.move-folder[data-id="' + self.currentSelectedFolder.id + '"] > ul');
                        if (ul.length === 0) {
                            ul = $('<ul>', {
                                class: 'dropdown-menu'
                            });
                            $('.menu_folders .dropdown.move-folder[data-id="' + self.currentSelectedFolder.id + '"]').append(ul);
                        }
                    } else {
                        var ul = $('.menu_folders > ul');
                        self.folders.push(newFolder);
                    }
                    var li = $('<li>', {
                            class: 'dropdown move-folder',
                            'data-id': res.id
                        })
                        .append($('<a>', {
                            class: 'folder-item',
                            'data-id': res.id,
                            text: name
                        }));
                    ul.append(li);
                    $('.script_folder_list_row').append(self.renderListFolder(newFolder));
                    $.fancybox.close();
                });
            });
            $(document).on('click', '.folder-delete', function() {
                var id = $(this).data('id');
                if (!confirm(Translator.trans('delete_folder') + '?')) {
                    return;
                }
                am.promiseCmd({
                    method: 'scripts.deleteFolder',
                    id: id,
                }).always(function() {}).fail(function(err) {}).done(function(res) {});
                document.location.reload(true);
            });
            $(document).on('click', '.folder-edit', function(e) {
                e.preventDefault();
                var modal = $('.js_edit_name_folder');
                $('.action-menu ul').removeClass('action-active');
                $('input', modal).data('id', $(this).data('id')).val($(this).attr('title'));
                $.fancybox.open(modal);
            });
            $(document).on('click', '#hs_edit_folder_name', function(e) {
                e.preventDefault();
                e.stopPropagation();
                var fel = $('.js_edit_name_folder');
                $.fancybox.showLoading();
                var id = fel.find('input[name]').data('id');
                var name = fel.find('input[name]').val();
                am.clearGenericFormErrors(fel);
                am.promiseCmd({
                    method: 'scripts.editFolder',
                    name: name,
                    id: id
                }).always(function() {
                    $.fancybox.hideLoading();
                }).fail(function(err) {}).done(function(res) {
                    $('.js_show_folder_script[data-id="' + id + '"] h4')
                        .text(name)
                        .prepend($('<span>', {
                            class: 'glyphicon glyphicon-folder-close folder-item-icon'
                        }));
                    $.fancybox.close();
                });
            });
            $(document).on('click', '.action-menu > span', function(e) {
                e.preventDefault();
                e.stopPropagation();
                var ul = $(this).parent().find('ul');
                if (ul.hasClass('action-active')) {
                    $('.action-active').removeClass('action-active');
                } else {
                    $('.action-active').removeClass('action-active');
                    $(this).parent().find('ul').addClass('action-active');
                }
            });
            $(document).on('click', '.action-menu-script .dropdown-toggle', function() {
                $('.action-active').removeClass('action-active');
                self.currentScript = $(this).parent().data('id');
            });
            $(document).on('click', '.action-menu-folder span', function() {
                $(this).parent().find('ul').html('')
                    .append($('<li>', {
                            class: 'folder-edit',
                            'data-id': $(this).data('id'),
                            title: $(this).attr('title')
                        }).text(' ' + Translator.trans('edit_folder_name'))
                        .prepend($('<span>', {
                            class: 'glyphicon glyphicon-pencil'
                        })))
                    .append($('<li>', {
                            class: 'folder-delete',
                            'data-id': $(this).data('id')
                        }).text(' ' + Translator.trans('delete_folder'))
                        .prepend($('<span>', {
                            class: 'glyphicon glyphicon-remove'
                        })))
                    .append($('<li>', {
                            class: 'folder-access',
                            'data-id': $(this).data('id')
                        }).text(' ' + Translator.trans('access_folder'))
                        .prepend($('<span>', {
                            class: 'glyphicon glyphicon-lock'
                        })));
            });
            $(document).on('click', '.script_list_row span.move-folder', function(e) {
                e.preventDefault();
                e.stopPropagation();
                var _this = this;
                if (self.currentFolder == null) {
                    $.each(self.folders, function(index, folder) {
                        if ($(_this).data('id') == folder.id) {
                            self.currentFolder = folder;
                            return false;
                        }
                    })
                    self.folderChain.push(folders);
                } else {
                    self.folderChain.push(self.currentFolder.__children);
                    $.each(self.currentFolder.__children, function(index, folder) {
                        if ($(_this).data('id') == folder.id) {
                            self.currentFolder = folder;
                            return false;
                        }
                    })
                }
                var ul = $(_this).parent().parent().parent().find('ul');
                ul.find('li:not(.back)').remove();
                $.each(self.currentFolder.__children, function(index, folder) {
                    var li = $('<li>', {
                        class: 'move-folder',
                        'data-id': folder.id,
                        text: folder.name
                    });
                    if (folder.__children.length > 0) {
                        li.append($('<span>', {
                            class: 'move-folder',
                            text: ' > ',
                            'data-id': folder.id
                        }))
                    }
                    ul.append(li);
                });
            });
            $(document).on('click', 'li.move-folder', function(e) {
                var _this = this;
                e.preventDefault();
                e.stopPropagation();
                if (confirm(Translator.trans('move') + '?')) {
                    if (!self.currentScript) {
                        self.currentScript = parseInt(location.hash.substr(3));
                    }
                    am.promiseCmd({
                        method: 'scripts.moveToFolder',
                        script_id: self.currentScript,
                        folder_id: $(_this).data('id')
                    }).always(function() {}).fail(function(err) {}).done(function(res) {
                        if (self.currentSelectedFolder != null) {
                            self.jsonScriptToFolder[self.currentSelectedFolder.id] = self.jsonScriptToFolder[self.currentSelectedFolder.id].filter(function(val) {
                                return val.id != self.currentScript;
                            });
                        }
                        if (!self.jsonScriptToFolder[$(_this).data('id')])
                            self.jsonScriptToFolder[$(_this).data('id')] = [];
                        self.jsonScriptToFolder[$(_this).data('id')].push(self.jsonScripts[self.currentScript]);
                        if (self.scriptsNoFolder[self.currentScript])
                            delete self.scriptsNoFolder[self.currentScript];
                        self.renderFolders();
                        self.renderScripts();
                    });
                }
            });
            $(document).mouseup(function(e) {
                var div = $(".script__item")
                if (!div.is(e.target) && div.has(e.target).length === 0) {
                    $('.action-menu > ul').removeClass('action-active')
                }
            });
            $(document).on('click', '.js_show_script', function() {
                self.currentScript = $(this).data('id');
            });
            $(document).on('click', '.js_show_folder_script', function(e) {
                var _this = this;
                if (self.currentSelectedFolder == null) {
                    $.each(self.folders, function(index, folder) {
                        if ($(_this).data('id') == folder.id) {
                            self.currentSelectedFolder = folder;
                            return false;
                        }
                    })
                } else {
                    self.folderSelectedChain.push(self.currentSelectedFolder);
                    $.each(self.currentSelectedFolder.__children, function(index, folder) {
                        if ($(_this).data('id') == folder.id) {
                            self.currentSelectedFolder = folder;
                            return false;
                        }
                    })
                }
                self.renderFolders();
                self.renderScripts();
            });
            $(document).on('click', '.breadcrumb a', function() {
                parentLength = $(this).data('parent-length');
                parentHome = $(this).data('home');
                $('.script_folder_list_row').html('');

                try {
                    if (self.folderSelectedChain && self.folderSelectedChain.length && self.folderSelectedChain.length > 0) {
                        self.currentSelectedFolder = self.folderSelectedChain[self.folderSelectedChain.length - parentLength];
                        self.folderSelectedChain.length = self.folderSelectedChain.length - parentLength;
                    } else {
                        throw new Exception();
                    }
                } catch (e) {
                    self.currentSelectedFolder = null;
                }

                if (parentHome) {
                    self.folderSelectedChain = [];
                }

                self.renderFolders();
                self.renderScripts();
            });
            $(document).on('input', '#js_scripts_search', function() {
                self.search();
            });
            $(document).on('click', '.folder-access', function() {
                self.activeAccessFolder = $(this).data('id');
                self.loadAccessModal();
                $('.action-active').removeClass('action-active')
                $('#access_folder').modal('show');
            });

            $(document).on('click', '.add_user_all_scripts', function() {
                $('#access_folder .js_access_email').val($(this).data('user_email'));
                $('.js_add_access_folder_user').trigger('click');
            })

            $(document).on('click', '.js_add_access_folder_user', function() {
                let fel = $('#access_folder');
                $.fancybox.showLoading();
                am.promiseCmd({
                    method: 'scripts.add_user_access_folder',
                    folder_id: self.activeAccessFolder,
                    email: fel.find('.js_access_email').val(),
                    role: fel.find('.js_access_role').val()
                }).always(function() {
                    self.busy = false;
                    am.clearGenericFormErrors(fel);
                }).fail(function(err) {
                    am.showGenericFormErrors(fel, err);
                    $.fancybox.hideLoading();
                }).done(function(res) {
                    fel.find('.js_access_email').val('');
                    self.renderAccessedUsers(res.users, res.allScripts);
                    $('.js_user_access_count').text(res.users.length);
                    $.fancybox.hideLoading();
                });
            });
            $(document).on('click', '.js_remove_all_scripts_in_folder', function() {
                var fel = $('#access_folder');
                if (!confirm('Удалить доступ ко всем скриптам в этой папке?')) {
                    return;
                }
                $.fancybox.showLoading();
                fel.find('.scriptuser' + $(this).data('user_id')).each(function() {
                    var el = $(this).find('.js_remove');
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
            })
        },
        renderListFolder: function(folder) {
            var rootDiv = $('<div>', {
                    class: "col-md-2 script__item"
                })
                .append(
                    $('<div>', {
                        class: "action-menu action-menu-folder",
                        title: folder.name,
                        'data-id': folder.id
                    })
                    .append($('<span>', {
                        class: "action-init",
                        title: folder.name,
                        'data-id': folder.id,
                        text: '...'
                    }))
                    .append($('<ul>'))
                )

            var div = $('<div>', {
                    class: "panel panel-default js_show_folder_script",
                    'data-id': folder.id,
                    title: folder.name
                })
                .append(
                    $('<div>', {
                        class: "panel-header",
                        title: folder.name,
                        'data-id': folder.id
                    })
                    .append($('<h4>', {
                        class: "action-init",
                        title: folder.name,
                        'data-id': folder.id,
                        text: folder.name
                    }).prepend('<span class="glyphicon glyphicon-folder-close folder-item-icon"></span>'))
                )
            rootDiv.append(div);
            return rootDiv;

        },
        clear: function() {
            self.folderChain = [];
            self.currentFolder = null;
        },
        renderFolders: function() {
            $('.breadcrumb').html('');
            $('.currentFolder').html('');
            $('.script_folder_list_row').html('');
            if (self.currentSelectedFolder) {
                $('.hs-breadcrumbs').show();
                $.each(self.currentSelectedFolder.__children, function(index, folder) {
                    $('.script_folder_list_row').append(self.renderListFolder(folder))
                });
                $('.currentFolder').html(self.currentSelectedFolder.name);

                if (self.folderSelectedChain.length > 0) {
                    $('.breadcrumb').append($('<li>').prepend($('<a>', {
                        href: '#',
                        text: Translator.trans('my_scripts'),
                        'data-parent-length': self.folderSelectedChain.length + 1,
                        'data-home': true
                    })));
                    $.each(self.folderSelectedChain, function(index, folder) {
                        parentLength = self.folderSelectedChain.length - index;
                        $('.breadcrumb').append($('<li>').prepend($('<a>', {
                            href: '#',
                            text: folder.name,
                            'data-parent-length': parentLength
                        })));
                    });
                } else {
                    $('.breadcrumb').append($('<li>').prepend($('<a>', {
                        href: '#',
                        text: Translator.trans('my_scripts'),
                        'data-parent-length': 1,
                        'data-home': true
                    })));
                }

                $('.breadcrumb').append($('<li>', {
                    class: 'active',
                    text: self.currentSelectedFolder.name
                }));
            } else {
                $('.hs-breadcrumbs').hide();
                $.each(self.folders, function(index, folder) {
                    $('.script_folder_list_row').append(self.renderListFolder(folder))
                });
            }
            self.search();
        },
        renderScripts: function() {
            $('.js_list_box .script_list_row').html('');
            if (self.currentSelectedFolder != null) {
                if (self.jsonScriptToFolder[self.currentSelectedFolder.id]) {
                    app.script.scripts.initScriptsList(self.jsonScriptToFolder[self.currentSelectedFolder.id])
                }
            } else {
                app.script.scripts.initScriptsList(self.scriptsNoFolder)
            }
            self.renderDropdownMenu();
            self.search();
        },
        renderDropdownMenu: function() {
            if (self.folders.length > 0) {
                $('.action-menu-script .action-init').each(function() {
                    $(this).html($('.js_script_menu_dropdown').html());
                });
            }
        },
        search: function() {
            var value = $('#js_scripts_search').val();
            $('.script__item-found').removeClass('script__item-found');
            $('.script_list_row .script__item').removeClass('hidden');
            $('.script_list_row .js_show_folder_script').removeClass('hidden');
            if (!value) return;
            if (value.length == 0) {
                return;
            }
            $('.script_list_row .script__item').addClass('hidden');
            $('.script_list_row .js_show_folder_script').addClass('hidden');
            $.each(self.jsonScripts, function(index, script) {
                if (script.name.toLowerCase().indexOf(value.toLowerCase()) !== -1 || script.id == value) {
                    $('.script_list_row .js_show_script[data-id="' + script.id + '"]').closest('.script__item').addClass('script__item-found');
                    $('.script_list_row .js_show_script[data-id="' + script.id + '"]').closest('.script__item').removeClass('hidden');
                }
            })
            self.searchInFolders(value)
        },
        searchInFolders(search, folder = false) {
            if (!folder) {
                $.each(folders, function(index, folder) {
                    $.each(self.jsonScriptToFolder[folder.id], function(i, script) {
                        if (script.name.toLowerCase().indexOf(search.toLowerCase()) !== -1 || script.id == search) {
                            $('.script_list_row .js_show_folder_script[data-id="' + folder.id + '"]').closest('.script__item').addClass('script__item-found')
                                .removeClass('hidden');
                        }
                    })
                    if (self.searchInFolders(search, folder)) {
                        $('.script_list_row .js_show_folder_script[data-id="' + folder.id + '"]').closest('.script__item').addClass('script__item-found')
                            .removeClass('hidden');
                    }
                })
            } else {
                var isFind = false;
                $.each(folder.__children, function(index, folder) {
                    if (self.jsonScriptToFolder[folder.id])
                        $.each(self.jsonScriptToFolder[folder.id], function(i, script) {
                            if (script.name.toLowerCase().indexOf(search.toLowerCase()) !== -1 || script.id == search) {
                                isFind = true;
                                $('.script_list_row .js_show_folder_script[data-id="' + folder.id + '"]').closest('.script__item').addClass('script__item-found')
                                    .removeClass('hidden');
                            }
                        })
                    if (self.searchInFolders(search, folder)) {
                        isFind = true;
                        $('.script_list_row .js_show_folder_script[data-id="' + folder.id + '"]').closest('.script__item').addClass('script__item-found')
                            .removeClass('hidden');
                    }
                })
                return isFind;
            }
        },
        getAccessPendingHtml: function() {
            return [
                ' <a tabindex="0" class="access_promise_note" data-toggle="popover" data-content="' +
                Translator.trans('pending_grant_access_tip') + '" ',
                'data-placement="top" data-trigger="focus">',
                '	(' + Translator.trans('pending_grant_access') + ')',
                '</a>'
            ].join('\n');
        },
        renderAccessedUsers(users, allScripts) {
            let body = $('#access_folder tbody').html('');
            $.each(users, function(user_id, userData) {
                body.append([
                    '<tr class="js_accessed_user active main' + user_id + '" data-user-id="' + user_id + '">',
                    '	<td>' + userData.user.name + '</td>',
                    '   <td>' + (userData.user.email ? userData.user.email : '') + '</td>',
                    '	<td>',
                    '	</td>',
                    '	<td style="text-align:center;">',
                    (userData.scripts.length === allScripts.length ? '<span style="margin-right: 15px;" data-user_email="' + userData.user.email + '" data-user_id="' + user_id + '" data-folder="' + self.activeAccessFolder + '" title="' + Translator.trans('access_granted_to_all_scripts') + '" class="glyphicon glyphicon-ok all_scripts"></span>' : '<span style="margin-right: 15px;" data-user_email="' + userData.user.email + '" data-user_id="' + user_id + '" data-folder="' + self.activeAccessFolder + '" title="' + Translator.trans('grant_access_to_every_script_in_this_folder') + '" class="glyphicon glyphicon-ok add_user_all_scripts"></span>'),
                    '<a href="#" class="js_remove_all_scripts_in_folder" title="' + Translator.trans('revoke_access_to_every_script_in_this_folder') + '" data-user_id="' + user_id + '" data-folder="' + self.activeAccessFolder + '"><span class="glyphicon glyphicon-remove-sign"></span></a>',
                    '	</td>',
                    '</tr>'
                ].join(''));

                $.each(userData.scripts, function(idx, script) {
                    let bodyScripts = $('<tr>', {
                        class: ((userData.user.excess) ? 'js_accessed_user text-muted' : 'js_accessed_user')
                    }).addClass('scriptuser' + user_id);
                    bodyScripts.append($('<td>', {
                        html: script.script_name + (script.type === "pending" ? self.getAccessPendingHtml() : '')
                    }))
                    bodyScripts.append($('<td>', {
                        html: '<ul> ' +
                            '<li class="js_option' + (script.role === 'ROLE_SCRIPT_READER' ? ' active' : '') + '" data-script_id="' + script.script_id + '" ' +
                            'data-user_id="' + script.id + '" data-type="' + script.type + '" data-val="ROLE_SCRIPT_READER"> ' +
                            '<span class="glyphicon glyphicon-ok"></span> ' +
                            Translator.trans('operator') + '</li> ' +
                            '<li class="js_option' + (script.role === 'ROLE_SCRIPT_WRITER' ? ' active' : '') + '" data-script_id="' + script.script_id + '"' +
                            ' data-user_id="' + script.id + '" data-type="' + script.type + '" data-val="ROLE_SCRIPT_WRITER"> ' +
                            '<span class="glyphicon glyphicon-ok"></span>' +
                            Translator.trans('admin') + '</li> ' +
                            '</ul>'
                    }))
                    bodyScripts.append($('<td>', {
                        html: ((script.excess) ? '<span class="label label-danger" style="margin-left: 40px;">' + Translator.trans('not_enough_licenses') + '</span> <a style="margin-left: 20px;" href="/billing">' + Translator.trans('buy') + '</a>' : '')
                    }))
                    bodyScripts.append($('<td>', {
                        html: '<a href="#" class="js_remove" data-script_id="' + script.script_id + '" data-user_id="' + user_id + '" data-type="' + script.type + '"><span class="glyphicon glyphicon-remove-sign"></span></a>'
                    }))
                    body.append(bodyScripts)
                })
            })
            app.access.initActionsForAccessedUsers('#access_folder');
        },
        loadAccessModal() {
            let fel = $('#access_folder');
            $.fancybox.showLoading();
            fel.find('tbody').html('');
            am.promiseCmd({
                method: 'scripts.get_access_folder',
                folder_id: self.activeAccessFolder,
            }).always(function() {

            }).fail(function(err) {
                $.fancybox.hideLoading();
            }).done(function(res) {
                fel.find('.js_access_email').val('');
                self.renderAccessedUsers(res.users, res.allScripts);
                $.fancybox.hideLoading();
            });
        },
        deleteScript(id) {
            delete self.scriptsNoFolder[id];
            delete self.jsonScripts[id];
            $.each(self.jsonScriptToFolder, function(folderId, scripts) {
                $.each(scripts, function(index, script) {
                    if (script.id == id) {
                        delete self.jsonScriptToFolder[folderId][index];
                    }
                })
            })
        }
    }
})();