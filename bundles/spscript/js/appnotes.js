var appasyncadd = appasyncadd || [];
(function() {
    var app = {},
        am = {},
        self = {};
    var loader = function(an_app) {
        app = an_app;
        am = app.misc;
        app.notes = module;
        self = module;
        self.init();
    };
    setTimeout(function() {
        appasyncadd.push(loader);
    }, 0);
    var emptyField = false,
        tmp = $('<div></div>');
    var module = {

        formulas: [],
        init: function() {

            self.initTinymce();
            // self.initFormulaTinymce();

            let newNoteModal = $('#show_new_note');
            let editNoteModal = $('#show_edit_note');
            let notesBox = $('.notes_box__items');

            if ($().sorttable) {
                let wrpEl = $('#notes_crud_list_wrapper');
                wrpEl.sortable({
                    stop: function(e, ui) {
                        var sorted = $('#notes_crud_list_wrapper').sortable('toArray', {
                            attribute: 'data-id'
                        });
                        am.promiseCmd({
                            method: 'script.sort_notes',
                            sorted: sorted
                        }).done(function(result) {
                            sorted.forEach(function(key, item) {
                                app.script.view_notes[key].priority = (sorted.length - item);
                            });

                        }).fail(function(err) {
                            console.log(err);
                        });
                    }
                });
                wrpEl.disableSelection();
            }


            $('.js_new_note_modal').click(function() {
                let editor = tinyMCE.get('new_note_content');
                editor.setContent('');
                $('#new_note_name').val('');
                newNoteModal.modal();

                let visibilitySelect = $('#new_note_visibility');
                visibilitySelect.find('option').not('option[value=all]').remove();

                let scriptId = $('.js_scripts_list_box .js_show_script.active').data('id');
                let scriptName = $('.js_selected_script_name').text();

                visibilitySelect.append('<option value="' + scriptId + '">' + scriptName + '</option>');

                $.each(app.script.script_list, function(i, o) {
                    visibilitySelect.append('<option value="' + o.id + '">' + o.name + '</option>');
                });

                app.notes.categories(newNoteModal.find('#new_note_category'), {
                    script_id: scriptId
                });
            });

            $('.js_add_note').click(function() {
                let scriptId = $('.js_scripts_list_box .js_show_script.active').data('id');
                let title = strip_html($('#new_note_name').val());
                let visibility = $('#new_note_visibility').find(':selected').val();
                let category_id = $('#new_note_category').val();

                let editor = tinyMCE.get('new_note_content');
                let content = (editor) ? editor.getContent() : '';

                if (!title || !content) return;

                $.fancybox.showLoading();

                am.promiseCmd({
                    method: 'script.add_note',
                    script_id: scriptId,
                    title: title,
                    content: content,
                    visibility: visibility,
                    category_id: category_id
                }).always(function() {
                    $.fancybox.hideLoading();
                }).done(function(result) {
                    newNoteModal.modal('hide');

                    if (result.notes) {
                        app.script.notes = result.notes;
                    }

                    if (result.view_notes) {
                        app.script.view_notes = result.view_notes;
                    }

                    self.renderList(result.view_notes);
                }).fail(function(err) {
                    console.log(err);
                });
            });

            $('.js_update_note').click(function() {

                var id = $(this).data('id');
                var title = $('#edit_note_name').val();
                var editor = tinyMCE.get('edit_note_content');
                var content = (editor) ? editor.getContent() : '';
                var visibility = $('#edit_note_visibility').find(':selected').val();
                var category_id = $('#edit_note_category').val();


                if (!title || !content) return;

                $.fancybox.showLoading();

                am.promiseCmd({
                    method: 'script.update_note',
                    title: title,
                    id: id,
                    content: content,
                    visibility: visibility,
                    category_id: category_id
                }).always(function() {
                    $.fancybox.hideLoading();
                }).done(function(result) {
                    editNoteModal.modal('hide');

                    if (result.notes) {
                        app.script.notes = result.notes;
                    }

                    if (result.view_notes) {
                        app.script.view_notes = result.view_notes;
                    }

                    self.renderList(result.view_notes);

                }).fail(function(err) {
                    console.log(err);
                });
            });

            notesBox.on('click', '.js_note_remove', function() {

                $.fancybox.showLoading();
                var id = $(this).data('id');
                var me = $(this);

                app.all.confirm.show(Translator.trans('are_you_sure_delete_note'), function() {
                    if (self.busy) return;
                    self.busy = true;

                    $.fancybox.showLoading();
                    am.promiseCmd({
                        method: 'script.remove_note',
                        id: id
                    }).always(function() {
                        self.busy = false;
                        $.fancybox.hideLoading();
                    }).done(function(result) {

                        me.parents('.notes_box__item').remove();
                        if (result.notes) {
                            app.script.notes = result.notes;
                        }

                        if (result.view_notes) {
                            app.script.view_notes = result.view_notes;
                        }

                        $.fancybox.close();
                    }).fail(function(err) {});
                });
            });

            notesBox.on('click', '.js_note_edit', function() {
                var id = $(this).data('id');

                var note = app.script.view_notes[id];

                var visibilitySelect = $('#edit_note_visibility');


                $('#edit_note_name').val(note.title);

                var editor = tinyMCE.get('edit_note_content');
                editor.setContent(note.content);

                editNoteModal.find('.js_update_note').data('id', id);
                editNoteModal.modal();

                app.notes.categories(editNoteModal.find('#edit_note_category'), $(this).closest('li').data('model'));

                visibilitySelect.find('option').not('option[value=all]').remove();

                var scriptId = $('.js_scripts_list_box .js_show_script.active').data('id');
                var scriptName = $('.js_selected_script_name').text();

                visibilitySelect.append('<option value="' + scriptId + '">' + scriptName + '</option>');

                $.each(app.script.script_list, function(i, o) {
                    visibilitySelect.append('<option value="' + o.id + '">' + o.name + '</option>');
                });

                visibilitySelect.find('option[value=' + note.visibility + ']').prop('selected', true);
            });

            $('.js_outnotes_box').on('click', '.outnotes_box-item', function(у) {

                var id = $(this).data('id');
                var box = $('.outnotes_box-view');
                var note = app.script.view_notes[id];

                box.removeClass('hidden');
                box.find('.outnotes_box-title').text(note.title);
                box.find('.outnotes_box-content').html(note.content);

                if ($('.js_outfields_box').is(':visible')) {
                    $('.js_outfields_box').addClass('hidden');
                }

                if ($('.js_starred_box').is(':visible')) {
                    $('.js_starred_box').addClass('hidden');
                }

                $('.view_box_sidebar').css({
                    bottom: '70px'
                });

                $('.js_outnotes_box').find('.outnotes_box-item').addClass('hidden');

                return false;
            });

            $('.outnotes_box-view-close').click(function() {
                $('.outnotes_box-view').addClass('hidden');

                if ($('.js_outfields_box').is('.hidden')) {
                    $('.js_outfields_box').removeClass('hidden');
                }

                if ($('.js_starred_box').is('.hidden')) {
                    $('.js_starred_box').removeClass('hidden');
                }


                app.script.view.renderClosedViewBox();
                $('.js_outnotes_box').find('.outnotes_box-item').removeClass('hidden');
                return false;
            });

            $('.js_outnotes_box-reset').click(function() {

                $(this).hide();
                $('.outnotes_box-search input').val('');
                app.script.view.renderNotesBox();
            });

            $('.outnotes_box-search input').keyup(function() {

                var search = $(this).val();
                app.script.view.renderNotesBox(search);

                if (search) {
                    $('.js_outnotes_box-reset').show();
                } else {
                    $('.js_outnotes_box-reset').hide();
                }
            });

            $('.js_note_save_formula').click(function() {

                var editor = tinyMCE.get('notes_formula');
                var formulaFromEditor = editor.getContent();
                var formula = self.prepareFormulaFromEditor(formulaFromEditor);
                var scriptId = $('.js_scripts_list_box .js_show_script.active').data('id');

                var getField = function() {
                    return app.addField.getFieldPassValue();
                };
                var valid;

                try {
                    eval(formula);
                    valid = true;
                } catch (e) {
                    valid = false;
                }

                if (!valid) {
                    $('.js_notes_formula_error').removeClass('hidden');
                } else {
                    $('.js_notes_formula_error').addClass('hidden');

                    $.fancybox.showLoading();
                    am.promiseCmd({
                        method: 'script.save_formula',
                        formula: formula,
                        script_id: scriptId
                    }).always(function() {
                        $.fancybox.hideLoading();
                    }).done(function() {

                        $('.js_notes_formula_done').removeClass('hidden');
                        window.setTimeout(function() {
                            $('.js_notes_formula_done').addClass('hidden');
                        }, 2000);
                    }).fail(function(err) {
                        console.log(err);
                    });
                }

            });
        },
        categories: function(el, obj) { // создание и редактирование рубрик заметок
            // el -> element select
            // obj -> object script {script_id: int, category_id: int}
            var current_model = obj,
                categories = el,
                that = this;
            categories.empty();
            categories.select2({
                theme: "bootstrap",
                placeholder: Translator.trans('note_category_placeholder'),
                allowClear: true,
                tags: true,
                escapeMarkup: function(markup) {
                    return markup;
                },
                templateResult: function(data) {
                    if (data.isNew) {
                        return data.text;
                    }

                    var $option = $("<span></span>"),
                        $removingOption = $('<span data-category_id="' + data.id + '" class="select2-item-remove">×</span>');

                    $removingOption.on('click', that.onClickToRemoveCategory)
                        .on('mouseup', function(e) {
                            e.stopPropagation();
                        });

                    $option.text(data.text);
                    $option.append($removingOption);

                    return $option;
                },
                createTag: function(tag) {
                    // check if the option is already there
                    found = false;
                    categories.find("option").each(function() {
                        if ($.trim(tag.term).toUpperCase() == $.trim($(this).text()).toUpperCase()) {
                            found = true;
                        }
                    });
                    // if it's not there, then show the suggestion
                    if (!found) {
                        return {
                            id: tag.term,
                            text: tag.term + " (" + Translator.trans('note_category_status_new') + ")",
                            isNew: true
                        };
                    }
                }
            });
            am.promiseCmd({
                method: 'script.get_categories',
                script_id: current_model.script_id
            }).done(function(result) {
                if (result.categories) {
                    $.each(result.categories, function(i, c) {
                        categories.append($('<option/>', {
                            value: i,
                            text: c
                        }));
                    });
                    categories.val(current_model.category_id).trigger('change');
                }
            });
        },
        onClickToRemoveCategory: function(e) {
            var that = e.target,
                categoryId = $(that).data('category_id');

            $.fancybox.showLoading();

            app.all.confirm.show(Translator.trans('are_you_sure_delete_rubric'), function() {
                if (self.busy) return;
                self.busy = true;

                $.fancybox.showLoading();
                am.promiseCmd({
                    method: 'script.delete_category',
                    category_id: categoryId
                }).always(function() {
                    self.busy = false;
                    $.fancybox.hideLoading();
                }).done(function(result) {
                    if (result.status == 'ok') {
                        $(that).closest('li').remove();
                        $('#new_note_category').find('[value=' + categoryId + ']').remove();
                        $('#edit_note_category').find('[value=' + categoryId + ']').remove();
                        $.each(result.note_ids, function(i, v) {
                            $('#note_' + v).find('.span_li_comment_box').empty();
                        });
                    }
                    $.fancybox.close();
                }).fail(function(err) {
                    console.log(err);
                });
            });
        },
        prepareFormulaFromEditor: function(formula) {

            formula = formula.replace(/<p>|<\/p>/g, '');
            var pattern = /<hs class="js_field[^"]*" data-id="(.*?)">.*?<\/hs>/gi;

            return formula.replace(pattern, function(match, fieldId) {
                return 'getField(' + fieldId + ')';
            });
        },
        renderList: function(notes) {
            var $li;
            var box = $('.notes_box__items');
            box.find('.notes_box__item').remove();

            var array = [];
            $.each(notes, function(i, item) {
                array.push(item);
            });

            $.each(array.sort(function(a, b) {
                return b.priority - a.priority;
            }), function(i, o) {
                var otitle = tmp.text(o.title).html();

                var html = '<li id="note_' + o.id + '" class="notes_box__item" data-id="' + o.id + '">' +
                    '<div class="panel panel-default">' +
                    '<div class="panel-header">' +
                    '<h4>' + otitle + '</h4>' +
                    '</div>' +
                    '<div class="panel-body">' + o.content + '</div>' +
                    '<div class="panel-footer">' +
                    '<button class="btn btn-default btn-xs js_note_edit" data-id="' + o.id + '" title="' + Translator.trans('edit_note_title') + '">' +
                    '<span class="glyphicon glyphicon-pencil"></span>' +
                    '</button> ' +
                    '<button class="btn btn-default btn-xs js_note_remove" data-id="' + o.id + '" title="' + Translator.trans('delete_note_title') + '">' +
                    '<span class="glyphicon glyphicon-remove"></span>' +
                    '</button>' +
                    '<span class="pull-right">' +
                    '<span class="span_li_comment_box"></span>' +
                    '<span class="glyphicon glyphicon-menu-hamburger" aria-hidden="true" title="' + Translator.trans('drag_note_title') + '"></span>' +
                    '</span>' +
                    '</div>' +
                    '</div>' +
                    '</li>';

                $li = $(html).data('model', o);
                box.append($li);
                if (o.category) {
                    $li.find('.span_li_comment_box').text(o.category);
                }
            });
        },
        getFormulaValue: function(formula) {

            var appFields = app.addField;
            emptyField = false;
            var getField = function(fieldId) {
                var value = appFields.getFieldPassValue(fieldId);
                if (value == null) emptyField = true;
                return value;
            };
            try {
                var result = eval(formula);
                if (!emptyField) return result
                return null;
            } catch (e) {
                return null;
            }
        },
        buildCondition: function(type, content, value) {

            if (value === null) return false;
            if (isNaN(value)) return false;

            var appFields = app.addField;
            var getField = function(fieldId) {
                return appFields.getFieldPassValue(fieldId);
            };

            if (type == 'between') {
                var expressionArr = [];

                if (typeof content.from != 'undefined') {
                    expressionArr.push('value > ' + content.from);
                }
                if (typeof content.from_inc != 'undefined') {
                    expressionArr.push('value >= ' + content.from_inc);
                }

                if (typeof content.to != 'undefined') {
                    expressionArr.push('value < ' + content.to);
                }

                if (typeof content.to_inc != 'undefined') {
                    expressionArr.push('value <= ' + content.to_inc);
                }

                if (typeof content.expression != 'undefined') {
                    expressionArr.push('(' + content.expression + ')');
                }

                var expression = expressionArr.join(' && ');

                try {
                    return eval(expression);
                } catch (e) {
                    console.log('Expression error', e);
                    return false;
                }
            }

            return false;
        },
        concatArrays: function(arrays) {

            if (!arrays.length) return [];
            var output = [];
            $.each(arrays, function(i, array) {
                $.each(array, function(i, n) {
                    if (output.indexOf(n) == -1) {
                        output.push(n);
                    }
                });
            });

            return output;
        },
        intersectArrays: function(arrays) {

            if (!arrays.length) return [];
            var output = arrays.shift();

            $.each(arrays, function(i, array) {
                output = output.filter(function(n) {
                    return array.indexOf(n) != -1;
                })
            });

            return output;
        },
        getRecommendNotes: function() {

            var notes = [];
            var notesArr = [];
            var mode = 'or';

            $.each(self.formulas, function(i, o) {

                var value = self.getFormulaValue(o.formula);
                console.log('Formula value: ' + value);
                var formulaNotes = [];
                var formulaNotesArr = [];

                $.each(o.conditions, function(i, c) {

                    if (self.buildCondition(c.type, c.content, value)) {
                        formulaNotesArr.push(c.notes);
                    }
                });

                if (mode == 'and') {
                    formulaNotes = self.intersectArrays(formulaNotesArr);
                } else if (mode == 'or') {
                    formulaNotes = self.concatArrays(formulaNotesArr);
                }

                notesArr.push(formulaNotes);
            });

            if (mode == 'and') {
                notes = self.intersectArrays(notesArr);
            } else if (mode == 'or') {
                notes = self.concatArrays(notesArr);
            }

            return notes;
        },
        initTinymce: function() {

            var params = {
                selector: '.note_tinymce',
                menubar: false,
                statusbar: false,
                toolbar: "bold,italic",
                language: $('html').attr('lang'),
                force_br_newlines: false,
                force_p_newlines: true,
                forced_root_block: 'p',
                content_css: '/css/tinymcetextpagestyle.css?v=2',
                valid_elements: 'p[class],a[href],strong/b,div[class|data*],br,ul[class],li[class],dl,dt,table,tbody,thead,td,tr,i,' +
                    'img[src|alt|title|style],em,span[class|data*],h1[class],h2[class],h3[class],h4[class],h5[class],' +
                    'input[class|id|style|name|placeholder|type],label[class],textarea[class|id|style|name|placeholder],' +
                    'select[class|id|style|name|placeholder],hs[class|data*]'
            };

            try {
                tinymce.init(params);
            } catch (e) {}
        },
        initFormulaTinymce: function() {

            var params = {
                selector: '#notes_formula',
                menubar: false,
                statusbar: false,
                toolbar: "bold,italic | cardfields",
                plugins: 'noneditable',
                noneditable_noneditable_class: 'js_non_editable',
                language: $('html').attr('lang'),
                force_br_newlines: false,
                force_p_newlines: true,
                forced_root_block: 'p',
                content_css: '/css/tinymcetextpagestyle.css?v=2',
                valid_elements: 'p[class],a[href],strong/b,div[class|data*],br,ul[class],li[class],dl,dt,table,tbody,thead,td,tr,i,' +
                    'img[src|alt|title|style],em,span[class|data*],h1[class],h2[class],h3[class],h4[class],h5[class],' +
                    'input[class|id|style|name|placeholder|type],label[class],textarea[class|id|style|name|placeholder],' +
                    'select[class|id|style|name|placeholder],hs[class|data*]'
            };

            var cardFields = $('.cardFields');
            if (cardFields.size() && cardFields.data('val') == true) {

                params.setup = function(editor) {

                    editor.addButton('cardfields', {
                        text: Translator.trans('fields'),
                        onclick: app.addField.showAddFieldsFromEditor(editor)
                    });

                    // process node text before put it into editor
                    editor.on('BeforeSetContent', function(e) {
                        e.content = app.addField.replaceFieldsToObjects(e.content);
                    });

                    editor.on('init', function(e) {

                        if (self.formulas) {
                            editor.setContent(self.formulas[0].formula);
                        }
                    });
                }
            }

            am.on('constructor load done', function() {

                try {
                    tinymce.init(params);
                } catch (e) {}
            });
        }
    };

})();