var appasyncadd = appasyncadd || [];
(function() {
    var app = {},
        am = {},
        self = {};
    var loader = function(an_app) {
        app = an_app;
        am = app.misc;
        app.quicklinks = module;
        self = module;
        self.init();
    };
    setTimeout(function() {
        appasyncadd.push(loader);
    }, 0);
    var tmp = $('<div></div>');
    var module = {

        init: function() {
            var newQuickLinkModal = $('#show_new_quicklink');
            var quicklinksBox = $('.quicklinks_box__items');
            let wrapper = $('#quicklinks_crud_list_wrapper');
            if ($().sorttable) {
                wrapper.sortable({
                    stop: function(e, ui) {
                        let sorted = wrapper.sortable('toArray', {
                            attribute: 'data-id'
                        });
                        let sorted_quicklinks = [];
                        sorted.forEach(function(item, key) {
                            app.script.view_quicklinks.forEach(function(value) {
                                if (value.id === item) {
                                    sorted_quicklinks.push({
                                        id: value.id,
                                        title: value.title,
                                        sortOrder: key
                                    });
                                }
                            });
                        });
                        app.script.view_quicklinks = sorted_quicklinks;
                        app.script.scripts.updateQuicklinks();
                    }
                });
                wrapper.disableSelection();
            }

            $('.js_new_quicklink_modal').click(function() {
                $('#new_quicklink_name').val('');
                var form = $('#show_new_quicklink');
                var addAnswerInput = $('.js_target_step');
                addAnswerInput.val('');
                form.find('.new_target_hint').hide();
                let errContainer = $('#quick-link-error-message');
                errContainer.hide();
                self.setAutocomplete();
                newQuickLinkModal.modal();
            });

            $('.js_add_quicklink').click(function() {
                let errContainer = $('#quick-link-error-message');
                errContainer.hide();
                let title = strip_html($('#new_quicklink_name').val());
                let id = $('.js_step_target_hidden').val();
                if (!title) {
                    errContainer.show().html(Translator.trans('please_type_quick_link_name'));
                    return;
                }
                if (!id) {
                    errContainer.show().html(Translator.trans('please_select_step'));
                    return;
                }
                app.script.view_quicklinks.push({
                    id: id,
                    title: title,
                    sortOrder: app.script.view_quicklinks.length
                })
                self.renderList(app.script.view_quicklinks);
                app.script.scripts.updateQuicklinks();
                newQuickLinkModal.modal('hide');
            });

            quicklinksBox.on('click', '.js_quicklink_remove', function() {
                $.fancybox.showLoading();
                let id = $(this).data('id');
                let me = $(this);

                app.all.confirm.show(Translator.trans('are_you_sure_delete_quick_link'), function() {

                    me.parents('.quicklinks_box__item').remove();
                    let quick_links = [];
                    app.script.view_quicklinks.forEach(function(value) {
                        if (value.id !== id) {
                            quick_links.push({
                                id: value.id,
                                title: value.title,
                                sortOrder: value.sortOrder
                            });
                        }
                    });
                    app.script.view_quicklinks = quick_links;
                    app.script.scripts.updateQuicklinks();
                    $.fancybox.close();
                });
            });
        },
        hasId: function(id) {
            let has = false;
            app.script.view_quicklinks.forEach(function(value) {
                if (value.id === id) {
                    has = true;
                }
            });
            return has;
        },
        setAutocomplete: function() {
            var searchInput = $('.js_target_step');
            var steps = [];
            let d = app.script.constructor.getJSPContainer();
            $.each(d.find('.step'), function(i, o) {
                let s = $(o);
                let text = (s.data('title')) ? s.data('title') : app.script.constructor.cutText(s.data('text'), 100);
                if (!self.hasId(s.prop('id'))) {
                    steps.push({
                        value: s.prop('id'),
                        label: text.replace(/<\/?[^>]+>/gi, '')
                    });
                }
            });

            try {
                searchInput.autocomplete('destroy');
            } catch (e) {}

            setTimeout(function() {
                searchInput.autocomplete({
                    source: steps,
                    select: function(event, ui) {

                        let input = $(this);
                        let hidden = input.parents('.target_step').find('.js_step_target_hidden');

                        input.val(ui.item.label);
                        hidden.val(ui.item.value);
                        return false;
                    },
                    focus: function(event, ui) {
                        $(this).val(ui.item.label);
                        return false;
                    },
                    change: function() {
                        let input = $(this);
                        let hidden = input.parents('.target_step').find('.js_step_target_hidden');
                        let box = input.parents('.target_step');
                        let hint = box.find('.new_target_hint');

                        if (!hidden.val() && $(this).val()) {
                            hint.find('b').text($(this).val());
                            hint.css('display', 'inline-block');
                        } else {
                            hint.hide();
                        }
                    },
                    response: function(event, ui) {
                        let input = $(this);
                        let box = input.parents('.target_step');
                        let hidden = box.find('.js_step_target_hidden');
                        hidden.val('');
                        let hint = box.find('.new_target_hint');

                        if (!ui.content.length) {
                            hint.find('b').text($(this).val());
                            hint.css('display', 'inline-block');
                        } else {
                            hint.hide();
                        }
                    }
                });
            }, 1000);
        },
        renderList: function(quicklinks) {
            let $li;
            let box = $('.quicklinks_box__items');
            box.find('.quicklinks_box__item').remove();

            let array = [];
            $.each(quicklinks, function(i, item) {
                array.push(item);
            });

            $.each(array, function(i, o) {
                let otitle = tmp.text(o.title).html();

                let html = '<li id="step_' + o.id + '" class="quicklinks_box__item" data-id="' + o.id + '" data-title="' + otitle + '">' +
                    '<div class="panel panel-default">' +
                    '<div class="panel-body">' +
                    '<div class="row">' +
                    '<div class="col-sm-1" style="padding-right: 0;width: 30px;" title="' + Translator.trans('drag_quick_link_title') + '">' +
                    '<span class="glyphicon glyphicon-menu-hamburger" aria-hidden="true"></span>' +
                    '</div>' +
                    '<div class="col-sm-10">' +
                    '<h4 style="margin: 0">' + otitle + '</h4>' +
                    '</div>' +
                    '<div class="col-sm-1 pull-right">' +
                    '<span class="pull-right">' +
                    '<button class="btn btn-default btn-xs js_quicklink_remove" data-id="' + o.id + '" title="' + Translator.trans('delete_quick_link_title') + '">' +
                    '<span class="glyphicon glyphicon-remove"></span>' +
                    '</button>' +
                    '</span>' +
                    '</div>' +
                    '</div>' +
                    '</div>' +
                    '</div>' +
                    '</li>';

                $li = $(html).data('model', o);
                box.append($li);
            });
        }
    };

})();