console.log("appfield_js");
var appasyncadd = appasyncadd || [];
(function() {
    var app = {},
        am = {},
        self = {};
    var loader = function(an_app) {
        app = an_app;
        am = app.misc;
        app.addField = module;
        self = module;
        self.init();
    };
    setTimeout(function() {
        appasyncadd.push(loader);
    }, 0);

    var tmp = $('<div></div>');

    var module = {

        editor: null,
        fields: null,
        staticFields: null,
        init: function() {

            window.onscroll = function() {
                $('.mce-menubtn.mce-active').removeClass('.mce-active').trigger('click');
            };

            var fieldModal = $('#show_add_field');

            var js_find_callback = function() {
                var $btn = $(this);
                var $input = $btn.closest('div').find('input');
                var search = $input.val();
                if (search.length > 0) {
                    fieldModal.find('.js_find_hidden').hide();
                    fieldModal.find('.js_find_result').show();
                } else {
                    fieldModal.find('.js_find_hidden').show();
                    fieldModal.find('.js_find_result').hide();
                }

                if (search.length > 0) {
                    var items = [];
                    $.each(self.fields, function(i, field) {
                        field.full_name = field.name;
                        items.push(field);
                    });
                    $.each(self.getProfileFields(), function(i, field) {
                        field.full_name = field.name;
                        items.push(field);
                    });
                    if (document.crm_fields) {
                        $.each(document.crm_fields, function(i, field) {
                            $.each(field.fields, function(i, entity) {
                                $.each(entity.fields, function(i, f) {
                                    items.push(f);
                                });
                            });

                        });
                    }
                    var items = self.getNamedFields();
                    var fields_in_use = self.getFieldsFromContent(self.editor.getContent());
                    var finddiv = fieldModal.find('.js_find_result');
                    finddiv.empty();
                    finddiv.append($('<ul/>', {
                        class: 'list-unstyled'
                    }));
                    $.each(items.filter(function(obj) {
                        return obj.full_name.match(new RegExp(search, "i"));
                    }), function(i, field) {
                        var text = field.full_name;
                        var is_use = fields_in_use.filter(function(item) {
                            return item === field
                        });
                        if (is_use.length > 0) {
                            text = '<span class="glyphicon glyphicon-ok" aria-hidden="true"></span> ' + text;
                        }

                        var button = $('<li/>').append($('<button/>', {
                                style: 'margin-bottom: 5px',
                                type: 'botton',
                                class: 'btn btn-default',
                                html: text
                            })
                            .data(field)
                            .on('click', function() {
                                var data = $(this).data();

                                if (data.parent) {
                                    fieldModal.find('[href="#tab_new"]').trigger('click');
                                    fieldModal.find('[href="#tab_new_crm_standart"]').trigger('click');
                                    fieldModal.find('[href="#tab_new_crm"]').trigger('click');
                                    var key = data.parent.parent.name;
                                    fieldModal.find('[href="#' + key + '"]').trigger('click');
                                    key = key + '_' + data.parent.name;
                                    fieldModal.find('[href="#' + key + '"]').trigger('click');
                                    key = key + '_' + data.name;
                                    fieldModal.find('.js_' + key).trigger('click');


                                } else if (data.id && (data.id ^ 0) === data.id) {
                                    fieldModal.find('[href="#tab_new"]').trigger('click');
                                    fieldModal.find('[href="#tab_new_other"]').trigger('click');
                                    fieldModal.find('.js_' + data.id).trigger('click');
                                } else {
                                    fieldModal.find('[href="#tab_inuse"]').trigger('click');
                                    fieldModal.find('.js_' + data.id).trigger('click');
                                }

                                $input.val('').trigger('keyup');
                            })
                        );
                        finddiv.find('ul').append(button);
                    });
                }

            };

            fieldModal.on('click', '.js_find', js_find_callback);
            fieldModal.on('keyup', '.js_find_input', js_find_callback);

            $('.js_show_fields').click(function() {
                self.loadFields(function() {
                    self.loadPasses();
                });
            });

            var tab_new_simple_field_addtype = fieldModal.find('.tab_new_simple_field_addtype');
            //===============
            var numberFormula = $('.js_number_formula', tab_new_simple_field_addtype);
            var numberFormulaOptions = $('.js_number_formula_options', tab_new_simple_field_addtype);
            var fieldAddTypeText = $('.field_addtype_text', tab_new_simple_field_addtype);
            var fieldAddTypeNumber = $('.field_addtype_number', tab_new_simple_field_addtype);
            var tabFieldAddTypeNumberFormula = $('#tab_field_addtype_number_formula', tab_new_simple_field_addtype);
            var modalFieldId = $('.js_modal_field_id', fieldModal);

            var js_number_formula_callback = function() {
                var $input = $(this);
                var value = $input.html();
                if ($input[0].selectionStart < value.length) {
                    value = value.substr(0, $input[0].selectionStart);
                    $input.val(value);
                }
                var search = self.getNumberFormulaEnding(value);
                if (search.length > 0 && search.search(new RegExp('^\\d+')) == -1) {
                    tabFieldAddTypeNumberFormula.trigger('spread');
                    var items = self.getNamedFields('number');
                    var fieldId = modalFieldId.val();
                    var context = $input.data('context');
                    if (!context) {
                        context = {
                            fields: {}
                        };
                    }
                    numberFormulaOptions.empty();
                    numberFormulaOptions.append($('<ul/>', {
                        class: 'list-unstyled'
                    }));
                    $.each(items.filter(function(obj) {
                        return obj.full_name.match(new RegExp(search, "i")) &&
                            (!fieldId || (fieldId && obj.id != fieldId));
                    }), function(i, field) {
                        if (field.full_name == search) {
                            context.fields[field.full_name] = field.id;
                        }
                        var button = $('<li/>').append($('<button/>', {
                            style: 'margin-bottom: 5px',
                            type: 'botton',
                            class: 'btn btn-default',
                            html: field.full_name
                        }).on('click', function() {
                            context.fields[field.full_name] = field.id;
                            $input.html($input.html().replace(new RegExp(search + '$'), '') +
                                "<hs class=\"js_field js_non_editable\" data-id=\"" + field.id + "\" contenteditable=\"false\" data-mce-selected=\"1\">" + field.full_name + "</hs>");
                            $input.data('context', context)
                                .trigger('context')
                                .trigger('change')
                                .focus();
                            tabFieldAddTypeNumberFormula.trigger('restore');
                        }));
                        numberFormulaOptions.find('ul').append(button);
                    });
                    $input.data('context', context);
                    $input.trigger('context');
                } else {
                    var valid = self.validateNumberFormula(value, context);
                    if (!valid) {
                        $('.error', tabFieldAddTypeNumberFormula).show();
                        $('.valid', tabFieldAddTypeNumberFormula).hide();
                        return;
                    }
                    $('.valid', tabFieldAddTypeNumberFormula).show();
                    $('.error', tabFieldAddTypeNumberFormula).hide();
                    tabFieldAddTypeNumberFormula.trigger('restore');
                }
            };
            ///================
            tab_new_simple_field_addtype.on('click', 'a', function(e) {
                e.preventDefault();
                tab_new_simple_field_addtype.find('a').removeClass('active');
                $(this).addClass('active');
            });
            fieldModal.on('change', '#field_type', function(e) {
                // tab_new_simple_field_addtype.hide();
                // tab_new_simple_field_addtype.find('a:first').trigger('click');
                $('.field_addtype_list', tab_new_simple_field_addtype).hide();
                numberFormula.html('').data('context', {
                    fields: {}
                }).trigger('change');
                var fieldAddTypeList = null;
                if ($(this).val() === 'text') {
                    // tab_new_simple_field_addtype.show();
                    fieldAddTypeList = fieldAddTypeText;
                } else if ($(this).val() === 'number') {
                    fieldAddTypeList = fieldAddTypeNumber;
                }
                if (fieldAddTypeList) {
                    fieldAddTypeList.show();
                    fieldAddTypeList.find('a:first').trigger('click');
                }
            });
            ///======================
            tabFieldAddTypeNumberFormula.on('spread', function(e) {
                $(this).not('.modal-spread').addClass('modal-spread');
            });
            tabFieldAddTypeNumberFormula.on('restore', function(e) {
                tabFieldAddTypeNumberFormula.removeClass('modal-spread');
                numberFormulaOptions.empty();
            });
            numberFormula.on('input', js_number_formula_callback);
            numberFormula.on('context', function(e) {
                var value = $(this).val();
                var context = $(this).data('context');
                for (var name in context.fields) {
                    if (value.indexOf(name) === -1) {
                        delete context.fields[name];
                    }
                }
                $(this).data('context', context);
                self.setEndOfContenteditable($(this)[0]);
            });
            ///======================

            let fieldVals = $('.js_multilist_values')
            fieldVals.addClass('hidden');
            fieldVals.find(".js_multilist_values_li").remove();

            $('.js_show_add_field').click(function(e) {
                e.preventDefault();
                fieldVals.addClass('hidden');
                fieldVals.find(".js_multilist_values_li").remove();

                self.editor = null;
                fieldModal.find('.js_modal_field_id').val('');
                fieldModal.find('.modal-title').text(Translator.trans('fields'));
                fieldModal.find('.js_add_field').text(Translator.trans('add'));
                fieldModal.modal();

                self.clearAddFieldForm();
            });

            $('#field_is_from_crm').change(function() {
                $('#field_sys_name_wrap')[$(this).is(':checked') ? 'show' : 'hide']();
            });
            $('.js_multilist_add').click(function() {
                var template = $('.js_multilist_values_li_template').clone();
                template.removeClass('js_multilist_values_li_template').addClass('js_multilist_values_li multilist_values_li').removeClass('hidden');
                $('.js_multilist_values_li_template').before(template);
            });
            $(document).on('click', '.js_multilist_remove', function() {
                var btn = $(this);
                setTimeout(function() {
                    btn.closest('.js_multilist_values_li').remove();
                }, 100);
            });
            $('.js_field_type_selector').change(function() {
                if ($(this).val() === 'multilist') {
                    $('.js_multilist_add').click();
                    $('.js_multilist_values').removeClass('hidden');
                } else {
                    $('.js_multilist_values').addClass('hidden');
                    $('.js_multilist_values').find(".js_multilist_values_li").remove();
                }
            });

            $('.js_add_field').click(function(e) {
                e.preventDefault();

                var field_name_for_crm = fieldModal.find('#field_name_for_crm:visible').val();
                if (field_name_for_crm && field_name_for_crm.length > 0) {
                    fieldModal.find('#field_is_from_crm').prop('checked', true);
                    fieldModal.find('#field_sys_name').val(field_name_for_crm);
                }

                var name = strip_html(fieldModal.find('#field_name').val());
                var type = fieldModal.find('#field_type').val();
                var isFromCrm = $('#field_is_from_crm').is(':checked');
                var sysName = fieldModal.find('#field_sys_name').val();
                var scriptId = $('.js_editor').data('id');
                var nodeId = ($.app.script.constructor.selStep) ?
                    $.app.script.constructor.selStep.data('entity_id') : null;
                var key = null;

                var hasErrors = false;

                var options = {};

                var field = fieldModal.find('button:visible').filter(function() {
                    return $(this).hasClass('btn-primary');
                }).data();

                if (field) {
                    key = field.key;
                    if (field.id) {
                        if (self.editor) {
                            if ((field.id ^ 0) === field.id) {
                                self.editor.insertContent(self.replaceFieldsToObjects(self.getFieldLabel(field.id)));
                            } else {
                                self.editor.insertContent('<hs class="js_static_field js_non_editable" data-id="' + field.id + '">' + field.name + '</hs>');
                            }
                        }
                        fieldModal.modal('hide');
                        return;
                    }

                    if (field.options) {
                        options = field.options;
                    }
                }

                var typeOptions = tab_new_simple_field_addtype.find('a.active');
                if (typeOptions.data('option') && type == 'number') {
                    if (!self.validateNumberFormula(numberFormula.html())) {
                        alert('Формула не валидная');
                        return;
                    }
                    options['addtype'] = typeOptions.data('option');
                    options['numberFormula'] = {
                        value: numberFormula.html(),
                        context: self.getContextFieldsFormula(numberFormula.html())
                    };
                }
                var readonly = fieldModal.find('#readonly');
                if (readonly.is(':checked')) {
                    options.readonly = true;
                } else {
                    options.readonly = false;
                }

                var typeOptions = tab_new_simple_field_addtype.find('.field_addtype_list a.active');
                var addtype = typeOptions.data('option');
                if (addtype) {
                    options.addtype = addtype;
                    var addtypeData = typeOptions.data(addtype);
                    if (addtypeData) {
                        options[addtype] = addtypeData;
                    }
                }

                fieldModal.find('.modal-body').find('button.btn-primary:visible').removeClass('btn-primary');

                if (!name) {
                    hasErrors = true;
                    var nameInput = fieldModal.find('#field_name');
                    nameInput.parents('.form-group').addClass('has-error');

                    nameInput.off('keydown').keydown(function() {
                        $(this).parents('.form-group').removeClass('has-error');
                    });
                }

                if (isFromCrm && !sysName) {
                    hasErrors = true;
                    fieldModal.find('#field_sys_name').parents('.form-group')
                        .addClass('has-error')
                        .end()
                        .off('keydown').on('keydown', function() {
                            $(this).parents('.form-group').removeClass('has-error');
                        });
                }

                if (hasErrors) return false;
                if (type === 'multilist') {
                    var options = {};
                    if (isFromCrm) {
                        if (key && key.length > 0) {
                            var indexKeys = key.split(/^(.*?)\_(.*?)\_(.*?)$/).filter(function(v) {
                                return v.length;
                            });
                            var crm = indexKeys[0];
                            var entity = indexKeys[1];
                            var sysname = indexKeys[2];
                            document.crm_fields[crm].fields.forEach(function(value, index) {
                                if (value.name == entity) {
                                    value.fields.forEach(function(val, idx) {
                                        if (val.name == sysname) {
                                            options = val.options;
                                        }
                                    })
                                }
                            })
                        }
                    } else {
                        options['list_values'] = [];
                        $('.js_multilist_values_li').each(function(i, li) {
                            var val = $(li).find('.form-control').val();
                            if (val) {
                                options['list_values'].push(val);
                            }
                        })
                    }

                }
                var fieldId = fieldModal.find('.js_modal_field_id').val();
                if (fieldId) {
                    am.promiseCmd({
                        method: 'script.update_field',
                        id: fieldId,
                        name: name,
                        type: type,
                        is_from_crm: isFromCrm,
                        sys_name: sysName,
                        options: options
                    }).done(function() {
                        fieldModal.modal('hide');
                        self.loadFields(function() {
                            self.loadPasses();
                            app.script.constructor.replaceStepFields();
                        });
                    });
                } else {
                    am.promiseCmd({
                        method: 'script.add_field',
                        script_id: scriptId,
                        node_id: nodeId,
                        name: name,
                        key: key,
                        type: type,
                        is_from_crm: isFromCrm,
                        sys_name: sysName,
                        options: options
                    }).done(function(result) {
                        fieldModal.modal('hide');
                        self.fields[result.id] = result;

                        if (self.editor != null) {
                            self.addFieldToEditor(result);
                            self.loadFields();
                        } else {
                            self.loadFields(function() {
                                self.loadPasses();
                            });
                        }
                    }).fail(function(err) {
                        console.log(JSON.stringify(err));
                    });
                }
            });

            $(document).on('click', '.js_field_remove', function(e) {

                if (!confirm('Вы уверены?')) return;

                e.preventDefault();
                var fieldRow = $(this).parents('th');
                var fieldId = fieldRow.data('id');

                $.fancybox.showLoading();
                am.promiseCmd({
                    method: 'script.delete_field',
                    id: fieldId
                }).always(function() {
                    $.fancybox.hideLoading();
                }).done(function() {
                    self.loadFields(function() {
                        self.loadPasses();
                        app.script.constructor.replaceStepFields();
                    });
                });
            });

            $(document).on('click', '.js_field_edit', function(e) {
                e.preventDefault();
                var fieldRow = $(this).parents('th');
                var fieldId = fieldRow.data('id');
                var field = self.fields[fieldId];
                if (!field) return;
                fieldModal.find('.modal-title').text('Изменить поле');
                fieldModal.find('.js_add_field').text('Сохранить');
                fieldModal.find('.js_modal_field_id').val(fieldId);
                fieldModal.find('#field_name').val(field.name);
                // fieldModal.find('#field_type option[value=' + field.type + ']').attr('selected', 'selected');
                fieldModal.find('#field_type').val(field.type).trigger('change');
                fieldModal.find('#readonly').prop('checked', field.options && field.options.readonly);

                // fieldModal.find('.tab_new_simple_field_addtype').find('a:first').trigger('click');
                // if (field.options && field.options.address) {
                //     fieldModal.find('.tab_new_simple_field_addtype').find('a[data-option=address]').trigger('click');
                // }

                if (field.options) {
                    if (field.options.address) {
                        $('a[data-option=address]', tab_new_simple_field_addtype).trigger('click');
                    } else if (field.options.numberFormula) {
                        $('a[data-option=numberFormula]', tab_new_simple_field_addtype).trigger('click');
                        numberFormula.html(field.options.numberFormula.value)
                        // numberFormula.data('context', field.options.numberFormula.context);
                        numberFormula.trigger('change');
                    }
                }

                let multilistValuesEl = $('.js_multilist_values');
                if (field.type === 'multilist' && field.options && field.options.list_values) {
                    multilistValuesEl.removeClass('hidden');
                    multilistValuesEl.find(".js_multilist_values_li").remove();
                    for (var i = 0; i < field.options.list_values.length; i++) {
                        var val = field.options.list_values[i];
                        var template = $('.js_multilist_values_li_template').clone();
                        template.removeClass('js_multilist_values_li_template').addClass('js_multilist_values_li multilist_values_li').removeClass('hidden');
                        template.find('input').val(val);
                        $('.js_multilist_values_li_template').before(template);
                    }
                } else {
                    multilistValuesEl.addClass('hidden');
                    multilistValuesEl.find(".js_multilist_values_li").remove();
                }

                fieldModal.modal();
                if (self.fields && Object.keys(self.fields).length > 0) {
                    $('a[href="#tab_inuse"]').tab('show');
                } else {
                    $('a[href="#tab_inuse"]').tab('show');
                }
            });

            $(document).on('click', '.js_pass_view', function(e) {
                e.preventDefault();

                var passId = $(this).data('id');
                var passToken = $(this).data('token');
                var modal = $('#show_view_pass');

                $.fancybox.showLoading();

                if (app.script.currentScriptType === 'quiz') {
                    am.analyticsRequest(
                        `api/script/${passId}/passes/${passToken}`, {},
                        function(response) {
                            modal.find('.pass-log div.well').remove();

                            $.each(response.pass, (i, o) => {
                                modal.find('.modal-body .pass-log').append('<div class="well">' + o + '</div>');
                            });

                            modal.find('.js_operator').text('Анонимный пользователь');
                            modal.find('.js_source').text(response.source);

                            modal.modal();

                            $.fancybox.hideLoading();
                            $('.js_fields_excel').button('reset');
                        },
                        function(err) {
                            console.log('🦕 err', err)
                            $.fancybox.hideLoading();
                            $('.js_fields_excel').button('reset');
                        },
                    )
                } else {
                    var data = {
                        method: 'script.get_pass_log',
                        id: passId
                    };
                    if (passToken) {
                        data.token = passToken;
                    }
                    am.promiseCmd(data).always(function() {
                        $.fancybox.hideLoading();
                    }).fail(function(err) {
                        console.log(JSON.stringify(err));
                    }).done(function(result) {
                        modal.find('.pass-log div.well').remove();
                        var text;

                        $.each(result.log, function(i, o) {
                            text = self.replaceFieldsToValues(o, result.fields);
                            text = self.replaceStaticFieldsToValues(text, result.static_fields);
                            modal.find('.modal-body .pass-log').append('<div class="well">' + text + '</div>');
                        });

                        modal.find('.js_operator').text(result.operator);
                        modal.find('.js_source').text(result.source);

                        modal.modal();
                    });
                }
            });

            $('.js_pass_filter').click(function() {
                self.loadPasses();
            });

            $(document).on('click', '.js_load_more button', function() {

                var page = $(this).data('page');
                self.loadPasses(page);
                $(this).data('page', ++page);
            });

            $('.js_fields_excel').click(function(e) {

                e.preventDefault();
                var href = $(this).data('href');
                var scheme = '<div class="passage_scheme_popup" data-passage_scheme="Y">' +
                    '<div ><label class="radio" for="passage_scheme1"><input type="radio" id="passage_scheme1" name="scheme" value="with" checked>' +
                    Translator.trans('passage_scheme_with') + '</label></div>' +
                    '<div ><label class="radio" for="passage_scheme2"><input class="form-check-input" type="radio" id="passage_scheme2" name="scheme" value="without">' +
                    Translator.trans('passage_scheme_without') + '</label></div>' +
                    '</div>';

                app.all.addition.show(Translator.trans('passage_scheme_export'), scheme, function() {

                    var filter = {};

                    if ($('.js_pass_filter_operator').val()) {
                        filter.operator = $('.js_pass_filter_operator').val();
                    }

                    if ($('.js_pass_filter_from').val()) {
                        filter.from = $('.js_pass_filter_from').val();
                    }

                    if ($('.js_pass_filter_to').val()) {
                        filter.to = $('.js_pass_filter_to').val();
                    }
                    var schemeValue = $('[data-passage_scheme="Y"]').find('input[name=scheme]:checked').val();

                    filter.scheme = schemeValue;

                    href += '?' + $.param(filter);

                    window.location = href;
                }, Translator.trans('passage_scheme_download'));
            });

            try {
                $('.datepicker').datepicker({
                    beforeShow: function() {
                        setTimeout(function() {
                            $('.ui-datepicker').css('z-index', 99999999999999);
                        }, 0);
                    }
                });
            } catch (e) {}


        },
        setEndOfContenteditable: function(contentEditableElement) {
            var range, selection;
            if (document.createRange) //Firefox, Chrome, Opera, Safari, IE 9+
            {
                range = document.createRange();
                range.selectNodeContents(contentEditableElement);
                range.collapse(false);
                selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
            } else if (document.selection) //IE 8 and lower
            {
                range = document.body.createTextRange();
                range.moveToElementText(contentEditableElement);
                range.collapse(false);
                range.select();
            }
        },
        hasFieldById: function(fieldId) {
            return !!self.fields[fieldId];

        },
        setFields: function(fields) {
            self.fields = fields;
            self.initFields();
        },
        getFieldValueByName: function(name) {
            for (let field in self.fields) {
                if (self.fields[field].name === name)
                    return self.fields[field].value
            }
            return null;
        },
        setStaticFields: function(fields) {
            self.staticFields = fields;
        },
        getFields: function() {
            return self.fields;
        },

        getFieldsValues: function() {
            return $('.js_view_box  .view_box_sidebar').find('.js_script_field').map(function(i, o) {

                var e = $(o);
                var fieldId = e.attr('name') * 1;
                var field = self.getField(fieldId);

                var values = {
                    id: fieldId
                };
                if (field.options && field.options.address) {
                    var data = e.data();
                    if (data['suggestions'] && data['suggestions']['selection']) {
                        values['address'] = data['suggestions']['selection'];
                    }
                }

                if (field.type === 'checkbox') {
                    values['value'] = (e.is(':checked')) ? 1 : 0;
                } else {
                    values['value'] = e.val();
                }
                return values;
            }).get();
        },

        getField: function(fieldId) {
            return (self.fields[fieldId]) ? self.fields[fieldId] : false;
        },
        getCRMFields: function() {
            return {
                name: {
                    id: 'name',
                    name: Translator.trans('name'),
                    type: 'text'
                },
                lastname: {
                    id: 'lastname',
                    name: Translator.trans('lastname'),
                    type: 'text'
                },
                middlename: {
                    id: 'middlename',
                    name: Translator.trans('middlename')
                },
                company: {
                    id: 'company',
                    name: Translator.trans('company'),
                    type: 'text'
                },
                email: {
                    id: 'email',
                    name: 'Email',
                    type: 'text'
                },
                phone: {
                    id: 'phone',
                    name: Translator.trans('phone'),
                    type: 'text'
                }
            };
        },
        getCRMField: function(fieldId) {
            let crmFields = self.getCRMFields();
            return (crmFields[fieldId]) ? crmFields[fieldId] : null;
        },
        initField: function(field) {
            if (!field.value && field.options && field.type === 'number') {
                if (!field.options.numberFormula) {
                    field.options['numberFormula'] = {
                        value: '',
                        context: {}
                    }
                }
                self.setFieldValue(field.id, self.calcNumberFormula(
                    field.options.numberFormula.value,
                    field.options.numberFormula.context
                ));
                // var context = field.options.numberFormula.context;
                // if (!context) {
                //     return;
                // }
                // $.each(context.fields || [], function(name, id) {
                //     var contextField = self.getField(id);
                //     if (!contextField) {
                //         return;
                //     }
                //     if (!contextField.numberFormulas) {
                //         contextField.numberFormulas = [];
                //     }
                //     if ($.inArray(field.id, contextField.numberFormulas) == -1) {
                //         contextField.numberFormulas.push(field.id);
                //     }
                // });
            }
        },

        getNamedFields: function(type) {
            var namedFields = [];
            $.each(self.fields, function(i, field) {
                if (!type || (type && field.type && field.type === type)) {
                    field.full_name = field.name;
                    namedFields.push(field);
                }
            });
            $.each(self.getProfileFields(), function(i, field) {
                if (!type || (type && field.type && field.type === type)) {
                    field.full_name = field.name;
                    namedFields.push(field);
                }
            });
            if (document.crm_fields) {
                $.each(document.crm_fields, function(i, field) {
                    $.each(field.fields, function(i, entity) {
                        $.each(entity.fields, function(i, f) {
                            if (!type || (type && f.type && f.type === type)) {
                                namedFields.push(f);
                            }
                        });
                    });

                });
            }
            return namedFields;
        },
        getFieldPassValue: function(fieldId) {
            let value = $('input.js_script_field[name=' + fieldId + ']').val();
            return (value) ? value.replace(',', '.').replace(' ', '') : null;
        },
        getProfileFields: function() {
            return {
                name: {
                    id: 'profile_firstname',
                    name: Translator.trans('field_operator_name'),
                    type: 'text'
                },
                lastname: {
                    id: 'profile_lastname',
                    name: Translator.trans('field_operator_lastname'),
                    type: 'text'
                },
                email: {
                    id: 'profile_email',
                    name: Translator.trans('field_operator_email'),
                    type: 'text'
                },
                link: {
                    id: 'profile_link',
                    name: Translator.trans('field_operator_link'),
                    type: 'text'
                }
            };
        },
        getProfileField: function(fieldId) {
            let profileFields = self.getProfileFields();
            return (profileFields[fieldId]) ? profileFields[fieldId] : null;
        },
        loadFields: function(cb, sid) {
            let scriptId;
            if (!sid) {
                scriptId = $('.js_editor').data('id');
            } else {
                scriptId = sid;
            }

            if (!scriptId) return;

            am.promiseCmd({
                method: 'script.get_script_fields',
                id: scriptId
            }).done(function(result) {

                self.fields = result;
                self.initFields();
                if (cb) cb();

            }).always(function() {});
        },
        initFields: function() {
            $.each(self.fields, function(i, f) {
                self.initField(f);
            });
        },
        loadPasses: function(page) {

            page = page || 0;

            var scriptId = $('.js_editor').data('id');
            if (!scriptId) return;

            var passFilterOperatorSelect = $('.js_pass_filter_operator');

            var filter = {};

            if (passFilterOperatorSelect.val()) {
                filter.operator = passFilterOperatorSelect.val();
            }

            if ($('.js_pass_filter_from').val()) {
                filter.from = $('.js_pass_filter_from').val();
            }

            if ($('.js_pass_filter_to').val()) {
                filter.to = $('.js_pass_filter_to').val();
            }

            $('.js_fields_excel').button('loading');

            $.fancybox.showLoading();


            function timeConverter(UNIX_timestamp) {
                var a = new Date(UNIX_timestamp * 1000);
                var months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
                var year = a.getFullYear();
                var month = months[a.getMonth()];
                var date = a.getDate();
                var hour = a.getHours();
                var min = a.getMinutes();
                var sec = a.getSeconds();
                return `${date}.${month}.${year} ${hour}:${min}:${sec}`
            }

            if (app.script.currentScriptType === 'quiz') {
                var SCRIPT_ID = app.script.currentScriptId
                // var SCRIPT_ID = 32643

                // QUIZ
                am.analyticsRequest(
                    `api/script/${SCRIPT_ID}/passes`, {
                        page: page + 1,
                        from: filter.from ? Math.floor(new Date(filter.from.substr(6, 4), filter.from.substr(3, 2) - 1, filter.from.substr(0, 2)).getTime() / 1000) : undefined,
                        to: filter.to ? Math.floor(new Date(filter.to.substr(6, 4), filter.to.substr(3, 2) - 1, filter.to.substr(0, 2)).getTime() / 1000) : undefined,
                    },
                    function(response) {
                        console.log('🦕 response', response)
                        $('.js_passages_count').text((typeof response.count != 'undefined') ? response.count : 0)
                        $('.js_pass_count').removeClass('hidden').find('span').text((typeof response.count != 'undefined') ? response.count : 0);

                        var box = $('.js_fields_box');
                        if (!page) {
                            box.find('.js_passes_table').remove();
                            box.find('.js_load_more').remove();
                            box.append('<table class="table js_passes_table"></table>');
                        }

                        var passBox = $('.js_passes_table');

                        var fields = self.getFieldArray();

                        if (!page) {
                            var thead = `
                  <thead>
                    <tr>
                      <th>${Translator.trans('fields_date')}</th>
                      <th>${Translator.trans('fields_duration')}</th>
                      <th>Имя</th>
                      <th>Телефон</th>
                      <th>Email</th>
                `
                            $.each(fields, (i, field) => {
                                thead += `<th>${field.name}</th>`
                            })
                            thead += `
                      <th></th>
                    </tr>
                  </thead>
                `
                            passBox.append(thead)
                            var tbody = '<tbody id="quiz-logs"></tbody>'
                            passBox.append(tbody)
                        }

                        var tr = ''
                        $.each(response.logs, (i, log) => {
                            var emptyCol = fields.length - log.fields.length > 0 ?
                                fields.length - log.fields.length :
                                0
                            tr += `
                  <tr>
                    <td>${timeConverter(log.timestamp)}</td>
                    <td>${log.duration} ${log.duration > 0 ? Translator.trans('sec') + '.' : ''}</td>
                    ${log.result_fields
                                ? `
                          <td>${log.result_fields.name.value}</td>
                          <td>${log.result_fields.phone.value}</td>
                          <td>${log.result_fields.email.value}</td>
                        `
                                : '<td></td>'.repeat(3)
                            }
                    ${log.fields.map(field => field.type === 'checkbox' ? `<td>${field.value == 1 ? 'Да' : 'Нет'}</td>` : `<td>${field.value}</td>`)}
                    ${'<td></td>'.repeat(emptyCol)}
                    <td>
                      <button class="btn btn-default btn-sm js_pass_view" data-id="${SCRIPT_ID}" data-token="${log.token}"><span class="glyphicon glyphicon-info-sign"></span></button>
                    </td>
                  </tr>
                `
                        })
                        $('#quiz-logs').append(tr)

                        var currentCount = document.getElementById('quiz-logs').childElementCount

                        if (!page && response.count > currentCount) {
                            box.append('<p class="text-center js_load_more">' +
                                '<button class="btn btn-default" data-page="1">' +
                                Translator.trans('pass_load_more') +
                                '</button></p>');
                        }

                        if (response.count <= currentCount) {
                            box.find('.js_load_more').remove()
                        }

                        $.fancybox.hideLoading();
                        $('.js_fields_excel').button('reset');
                    },
                    function(err) {
                        console.log('🦕 err', err)
                        $.fancybox.hideLoading();
                        $('.js_fields_excel').button('reset');
                    },
                )
            } else {
                // SCRIPT
                am.promiseCmd({
                    method: 'script.get_passes',
                    filter: filter,
                    id: scriptId,
                    page: page
                }).always(function() {
                    $.fancybox.hideLoading();
                    $('.js_fields_excel').button('reset');
                }).fail(function(err) {
                    console.log(JSON.stringify(err))
                }).done(function(result) {
                    $('.js_fields_excel').attr('data-href', result.excel);
                    $('.js_fields_excel').data('href', result.excel);
                    $('.js_pass_count').removeClass('hidden').find('span').text((typeof result.count != 'undefined') ?
                        result.count : 0);

                    passFilterOperatorSelect.find('option').remove();
                    passFilterOperatorSelect.append('<option value="">' + Translator.trans('choose_operator') + '</option>');

                    if (result.users) {
                        $.each(result.users, function(i, user) {
                            passFilterOperatorSelect.append('<option ' + ((user.selected) ? ' selected="selected" ' : '') +
                                ' value="' + user.id + '">' + user.name + '</option>');
                        });
                    }

                    var box = $('.js_fields_box');

                    if (!page) {
                        box.find('.js_passes_table').remove();
                        box.append('<table class="table js_passes_table"></table>');
                    }

                    var passBox = $('.js_passes_table');
                    var htmlHead = '<tr class="ui-sortable">' +
                        '<th class="no-sort th-datetime">' + Translator.trans('fields_date') + '</th>' +
                        '<th class="no-sort th-datetime">' + Translator.trans('fields_duration') + '</th>' +
                        '<th class="no-sort">' + Translator.trans('missing_answer') + '</th>';

                    var fields = self.getFieldArray();

                    $.each(fields, function(i, field) {
                        htmlHead += '<th class="js_field_col" data-position="' + field.position + '" data-id="' + field.id + '">';
                        if (result.role === 'ROLE_SCRIPT_WRITER' || result.role === 'ROLE_ADMIN') {
                            htmlHead += '<span class="glyphicon glyphicon-option-vertical js_field_pointer ui-sortable-handle"></span>&nbsp;'
                        }
                        htmlHead += tmp.text(field.name).html();
                        if (result.role === 'ROLE_SCRIPT_WRITER' || result.role === 'ROLE_ADMIN') {
                            htmlHead += '<div class="btn-group js_field_buttons">';
                            if (!field.sys_name) {
                                htmlHead += '<a href="#" class="btn btn-default btn-xs js_field_edit">' +
                                    '<span class="glyphicon glyphicon-pencil"></span></a>';
                            }
                            htmlHead += '<a href="#" class="btn btn-default btn-xs js_field_remove">' +
                                '<span class="glyphicon glyphicon-trash"></span></a>' +
                                '</div>';
                        }

                        htmlHead += '</th>';
                    });

                    htmlHead += '<th class="no-sort"></th>' + '<th class="no-sort"></th></tr>';
                    if (!page) {
                        passBox.find('tr').remove();
                        passBox.append(htmlHead);
                        box.find('.js_load_more').remove();
                    }

                    $.each(result.passes, function(i, pass) {

                        var htmlRow = '<tr>';

                        htmlRow += '<td class="no-sort">' + pass.created + '</td>';
                        htmlRow += '<td class="no-sort">' + pass.duration + (pass.duration > 0 ? ' ' + Translator.trans('sec') + '.' : '') + '</td>';
                        htmlRow += '<td class="no-sort">' + pass.unexpected_issue + '</td>';

                        $.each(fields, function(i, field) {

                            if (pass.fields[field.id]) {

                                if (field.type === 'checkbox') {
                                    htmlRow += '<td>' + ((pass.fields[field.id].value == 1) ? 'Да' : 'Нет') + '</td>';
                                } else {
                                    htmlRow += '<td>' + pass.fields[field.id].value + '</td>';
                                }
                            } else {
                                htmlRow += '<td></td>';
                            }

                        });

                        if (pass.entity_link && pass.entity_link.length) {
                            htmlRow += '<td><a href="' + pass.entity_link + '" target="_blank">' + pass.entity_name + '</a></td>';
                        } else {
                            htmlRow += '<td></td>';
                        }


                        htmlRow += '<td class="w100px no-sort"><button class="btn btn-default btn-sm js_pass_view" data-id="' + pass.id +
                            '"><span class="glyphicon glyphicon-info-sign"></span></button></td></tr>';
                        passBox.append(htmlRow);
                    });

                    if (!page && !result.is_final) {
                        box.append('<p class="text-center js_load_more">' +
                            '<button class="btn btn-default" data-page="1">' +
                            Translator.trans('pass_load_more') +
                            '</button></p>');
                    }

                    if (result.is_final) {
                        box.find('.js_load_more').remove();
                    }

                    var options = {
                        items: '> th:not(.no-sort)',
                        placeholder: 'placeholder',
                        helperCells: null,
                        cancel: '.no-sort',
                        handle: '.js_field_pointer',
                        update: function() {
                            var data = [];
                            $(passBox.find('th.js_field_col')).each(function(index, elem) {
                                var block = $(elem),
                                    newIndex = block.index();

                                block.data('position', (newIndex + 1));
                                data.push({
                                    id: block.data('id'),
                                    position: (newIndex + 1)
                                })
                            });

                            $.fancybox.showLoading();
                            am.promiseCmd({
                                method: 'script.field_save_position',
                                fields: data
                            }).always(function() {
                                $.fancybox.hideLoading();
                            }).fail(function(err) {
                                console.log(JSON.stringify(err));
                            }).done(function(result) {
                                self.fields = result;
                            });
                        }
                    };

                    passBox.sorttable(options).disableSelection();
                });
            }
        },
        getFieldArray: function() {

            var fieldsArr = [];
            $.each(self.fields, function(i, field) {
                fieldsArr.push(field);
            });

            fieldsArr.sort(function(a, b) {

                if (a.position == b.position) return 0;
                return (a.position < b.position) ? -1 : 1;
            });

            return fieldsArr;
        },
        clearAddFieldForm: function() {
            if (self.fields && Object.keys(self.fields).length > 0) {
                $('a[href="#tab_inuse"]').tab('show');
            } else {
                $('a[href="#tab_new"]').tab('show');
            }

            // console.log('FIELDS', self.fields);
            var fieldModal = $('#show_add_field');
            fieldModal.find('.js_find_input').val('').trigger('keyup');
            fieldModal.find('#field_name').val('');
            // fieldModal.find('#field_type').val(fieldModal.find('#field_type').find(':first').val());
            fieldModal.find('#field_type').val(fieldModal.find('#field_type').find(':first').val()).trigger('change');
            fieldModal.find('#field_is_from_crm').prop('checked', false);
            fieldModal.find('#field_sys_name_wrap').hide();
            fieldModal.find('#field_sys_name').val('');
            // fieldModal.find('.tab_new_simple_field_addtype').find('a:first').trigger('click');
            fieldModal.find('#readonly').prop('checked', false);

            // уже используемые поля
            let tab_inuse = fieldModal.find('#tab_inuse>div');
            tab_inuse.empty();
            var fields_in_use = (self.editor ? self.getFieldsFromContent(self.editor.getContent()) : []);
            var ul = $('<ul/>', {
                class: "list-unstyled",
                style: 'margin-top:10px'
            });
            $.each(self.fields, function(i, field) {
                var text = field.name;
                var is_use = fields_in_use.filter(function(item) {
                    return item === field
                });
                if (is_use.length > 0) {
                    text = '<span class="glyphicon glyphicon-ok" aria-hidden="true"></span> ' + text;
                }

                ul.append($('<li/>', {
                    html: $('<button/>', {
                            style: 'margin:2px',
                            type: 'button',
                            class: 'btn btn-default js_' + field.id,
                            html: text
                        })
                        .data(field)
                        .on('click', function() {
                            ul.find('button').removeClass('btn-primary');
                            $(this).addClass('btn-primary');
                        })
                }));
            });
            tab_inuse.append(ul);

            // системные поля
            var tab_new_other = fieldModal.find('#tab_new_other');
            tab_new_other.empty();
            var div = $('<div/>', {
                style: 'margin-top:10px'
            });
            $.each(self.getProfileFields(), function(i, field) {
                div.append($('<button/>', {
                        style: 'margin:2px',
                        type: 'button',
                        class: 'btn btn-default js_' + field.id,
                        text: field.name
                    })
                    .data(field)
                    .on('click', function() {
                        div.find('button').removeClass('btn-primary');
                        $(this).addClass('btn-primary');
                    })
                );
            });
            tab_new_other.append(div);

            // поля из crm
            var crm_fields = document.crm_fields;
            if (!crm_fields) {
                return;
            }
            var tab_new_crm = fieldModal.find('#tab_new_crm_standart');
            if (tab_new_crm.find('button').size()) {
                return;
            }
            tab_new_crm.empty();

            var crm_names_ul = $('<ul/>', {
                style: 'margin-top: 15px',
                class: 'nav nav-tabs',
                role: "tablist"
            });
            var crm_names_div = $('<div/>', {
                class: 'tab-content'
            });
            tab_new_crm.append(crm_names_ul).append(crm_names_div);

            var index = 0;
            $.each(crm_fields, function(i, field) {
                var crm_names_ul2 = $('<ul/>', {
                    style: 'margin-top: 15px',
                    class: 'nav nav-tabs',
                    role: "tablist"
                });
                var crm_names_div2 = $('<div/>', {
                    class: 'tab-content'
                });

                if (!field.name) {
                    return;
                }
                var name_loc = Translator.trans(field.name);
                field.local_name = name_loc;

                var li = $('<li/>', {
                    class: index < 1 ? 'active' : '',
                    role: "presentation"
                }).append($('<a/>', {
                    role: "tab",
                    'data-toggle': "tab",
                    href: '#' + field.name,
                    text: name_loc
                }));
                var lidiv = $('<div/>', {
                    role: "tabpanel",
                    class: (index < 1 ? 'active' : '') + " tab-pane",
                    id: field.name
                });

                crm_names_ul.append(li);
                crm_names_div.append(lidiv);

                lidiv.append(crm_names_ul2).append(crm_names_div2);
                var index2 = 0;
                $.each(field.fields, function(i2, field2) {
                    if (!field2.name) {
                        return;
                    }
                    var key = field.name + '_' + field2.name;
                    var name_loc = Translator.trans(key);
                    field2.local_name = name_loc;
                    field2.parent = field;
                    var li2 = $('<li/>', {
                        class: index2 < 1 ? 'active' : '',
                        role: "presentation"
                    }).append($('<a/>', {
                        role: "tab",
                        'data-toggle': "tab",
                        href: '#' + key,
                        text: name_loc
                    }));
                    var div = $('<div/>', {
                        role: "tabpanel",
                        class: (index2 < 1 ? 'active' : '') + " tab-pane",
                        style: 'margin-top:10px',
                        id: key
                    });

                    $.each(field2.fields, function(i3, field3) {
                        if (!field3.name) {
                            return;
                        }
                        var key = field.name + '_' + field2.name + '_' + field3.name;
                        var name_loc = Translator.trans(key);
                        field3.full_name = field.local_name + ' | ' + field2.local_name + ' | ' + name_loc;
                        field3.local_name = name_loc;
                        field3.parent = field2;
                        field3.key = key;
                        var button = $('<button/>', {
                                style: 'margin:2px',
                                type: 'button',
                                class: 'btn btn-default js_crm_btn js_' + key,
                                text: name_loc
                            })
                            .data(field3);
                        div.append(button);
                    });
                    crm_names_ul2.append(li2);
                    crm_names_div2.append(div);
                    index2++;
                });
                index++;
            });

            // клик по кнопке в списке полей црм
            tab_new_crm.on('click', '.js_crm_btn', function() {
                tab_new_crm.find('button').removeClass('btn-primary');
                $(this).addClass('btn-primary');

                var data = $(this).data();
                fieldModal.find('#field_name').val(data.local_name);
                fieldModal.find('#field_type').val(data.type);
                $('#field_is_from_crm').prop('checked', true);
                fieldModal.find('#field_sys_name').val(data.sysname);
            });
        },
        showAddFieldsFromEditor: function(editor) {

            self.editor = editor;

            var fieldModal = $('#show_add_field');

            fieldModal.find('.js_modal_field_id').val('');
            fieldModal.find('.modal-title').text(Translator.trans('fields'));
            fieldModal.find('.js_add_field').text(Translator.trans('add'));
            $('.js_multilist_values').addClass('hidden');
            $('.js_multilist_values').find(".js_multilist_values_li").remove();

            fieldModal.modal();
            self.clearAddFieldForm();
        },
        // получить список полей в текстовом поле шага
        getFieldsFromContent: function(content) {
            var pattern = /<hs class="(js_static_field|js_field)[^"]*" data-id="(.*?)"[^>]*>([^<]*)<\/hs>/gi;
            var result;
            var field;
            var results = [];
            while ((result = pattern.exec(content)) !== null) {
                var fieldId = result[2];
                // статическое поле
                if (result[1] == 'js_static_field') {
                    $.each(self.getProfileFields(), function(i, item) {
                        if (item.id == fieldId) {
                            field = item;
                        }
                    });
                } else {
                    field = self.fields[parseInt(fieldId, 10)];
                }
                if (field) {
                    results.push(field);
                }
            }
            return results;
        },
        replaceFieldsToValues: function(content, fields) {
            let pattern = /<hs class="js_field[^"]*" data-id="(.*?)"[^>]*><\/hs>/gi;
            let that = this;
            return content.replace(pattern, function(match, fieldId) {
                let field = fields[parseInt(fieldId, 10)];
                if (!field) return '';

                if (field.type === 'checkbox') {
                    return '<span class="field__value">' + ((field.value == 1) ? 'Да' : 'Нет') + '</span>';
                } else {
                    let field_val = that.formatDate(field.value)
                    return '<span class="field__value">' + field_val + '</span>';
                }
            });
        },
        replaceStaticFieldsToValues: function(content, fields) {
            let pattern = /<hs class="js_static_field[^"]*" data-id="(.*?)"[^>]*>([^<]*)<\/hs>/gi;
            return content.replace(pattern, function(match, fieldId, fieldText) {
                if (!fields) return '';

                let field = fields[fieldId];
                if (!field) {
                    return '<hs class="js_static_field js_non_editable" data-id="' + fieldId + '">[ ' +
                        fieldText + ' ]</hs>';
                }

                return '<hs class="js_static_field js_non_editable" data-id="' + fieldId + '">' +
                    field + '</hs>';
            });
        },
        replaceFields: function(content, valueWrapper) {

            valueWrapper = valueWrapper || false;

            var pattern = /<hs class="js_field[^"]*" data-id="(.*?)"[^>]*><\/hs>/gi;
            return content.replace(pattern, function(match, fieldId) {

                if (!self.fields) return '';

                var field = self.fields[parseInt(fieldId, 10)];
                if (!field) return '';

                return '<hs class="js_field js_non_editable" data-id="' + field.id + '">' +
                    self.getFieldHtml(field, valueWrapper) + '</hs>';
            });
        },
        replaceStaticFields: function(content, valueWrapper) {

            var pattern = /<hs class="js_static_field[^"]*" data-id="(.*?)"[^>]*>([^<]*)<\/hs>/gi;
            return content.replace(pattern, function(match, fieldId, fieldText) {

                if (!self.staticFields) return '';

                var field = self.staticFields[fieldId];
                if (!field) {
                    return '<hs class="js_static_field js_non_editable" data-id="' + fieldId + '">[ ' +
                        fieldText + ' ]</hs>';
                }

                return '<hs class="js_static_field js_non_editable" data-id="' + fieldId + '">' +
                    field + '</hs>';
            });
        },
        replaceFieldsToObjects: function(content) {
            var pattern = /<hs class="js_field[^"]*" data-id="(.*?)"[^>]*><\/hs>/gi;
            if (!content) return content;
            return content.replace(pattern, function(match, fieldId) {

                var field = self.fields[parseInt(fieldId, 10)];
                if (!field) return '';

                return '<hs class="js_field js_non_editable" data-id="' + field.id + '">' + field.name + '</hs>';
            });
        },
        backReplaceFieldsInEditor: function(content) {
            content = content.replace(/\r|\n/g, '');
            var linkPattern = /<\s*a\s*href="([\S]*)"\s*>(.*?)<\s*\/\s*a>/gi;
            content = content.replace(linkPattern, function(match, link, title) {
                return '<a href="' + link + '" target="_blank">' + title + '</a>';
            });
            var pattern = /<hs class="js_field[^"]*" data-id="(.*?)">.*?<\/hs>/gi;

            return content.replace(pattern, function(match, fieldId) {
                return self.getFieldLabel(fieldId);
            });
        },
        addFieldToEditor: function(field) {
            self.editor.insertContent(self.getFieldLabel(field.id));
        },
        getFieldLabel: function(fieldId) {
            return '<hs class="js_field js_non_editable" data-id="' + fieldId + '"></hs>';
        },
        setFieldValue: function(fieldId, value) {
            if (self.fields[fieldId]) {
                self.fields[fieldId].value = value;
            }
        },
        getFieldValue: function(fieldId) {
            return self.fields[fieldId] ? self.fields[fieldId].value : null;
        },
        clearFieldValues: function() {
            if (!self.fields) return;
            $.each(self.fields, function(i, field) {
                if (!(!field || (field.options && field.options.numberFormula))) {
                    field.value = '';
                }
            });
        },
        getNumberFormulaEnding: function(value) {
            let match = value
                .match(new RegExp('[^-+*/]+$'));
            return match ? match[0] : '';
        },

        validateNumberFormula: function(value, context) {
            let parts = value.trim();
            if (parts.length == 0) {
                return false;
            }
            parts = value = parts.replaceAll(/<hs.*?>.*?<\/hs>/, 0);
            parts = parts.replaceAll(/[^\d+-/*()]/, '')
            return parts.length === value.length;
        },
        getContextFieldsFormula: function(value) {
            let fields = {};
            value.replace(new RegExp('<hs class="js_field[^"]*" data-id="(.*?)"[^>]*><\\/hs>', 'g'), function(match) {
                var formula = value.match(new RegExp('<hs class="js_field[^"]*" data-id="(.*?)"[^>]*>'));
                if (formula) {
                    if (formula[1] !== undefined) {
                        var fieldId = formula[1];
                        if (self.fields[fieldId]) {
                            fields[fieldId] = self.fields[fieldId]
                        }
                    }
                }
            });
            return fields;
        },
        calcNumberFormula: function(value, context) {
            let hasErrors = false;
            if (!value) return 0;
            let lineFields = value.match(new RegExp('<hs class="js_field[^"]*" data-id="(.*?)"[^>]*>.*?</hs>', 'g'));
            if (lineFields) {
                $.each(lineFields, function(index, field) {
                    let formula = field.match(new RegExp('<hs class="js_field[^"]*" data-id="(.*?)"[^>]*>.*?</hs>'));
                    let match;
                    if (formula[1] !== undefined) {
                        match = parseInt(formula[1]);
                    } else {
                        hasErrors = true;
                        return 'Ошибка!';
                    }
                    if (self.fields[match] === undefined) {
                        hasErrors = true;
                        return 'Ошибка!';
                    }
                    let fieldValue = self.getFieldValue(self.fields[match].id);
                    if (self.fields[match].type === 'number' && self.fields[match].options.numberFormula && self.fields[match].options.numberFormula.value) {
                        fieldValue = self.calcNumberFormula(self.fields[match].options.numberFormula.value)
                    }
                    if (self.fields[match] === undefined) {
                        hasErrors = true;
                        return 'Ошибка!';
                    }
                    if ((self.fields[match] !== undefined) && (fieldValue !== self.fields[match].value)) {
                        fieldValue = self.fields[match].value
                    }
                    if (fieldValue === null) {
                        hasErrors = true;
                        return 'Ошибка!';
                    }
                    if (!fieldValue) {
                        fieldValue = 0;
                    }
                    value = value.replace(field, fieldValue);
                })
            }
            if (hasErrors) {
                return value;
            }
            return self.calcNumberExpression(value);
        },

        calcNumberExpression: function(expr) {
            // eval вызывается только с числовыми выражениями
            expr = expr.replace('Infinity', '0')
            expr = expr.replace(new RegExp('[^-+*/()\\d]', 'g'), '')
            expr = eval(expr);
            return expr;
        },
        is_js_address_loaded: null,
        formatDate: function(field) {
            let field_val = field;
            // format date-time strings
            const regexDate = RegExp('^[0-9]{4}-[0-9]{2}-[0-9]{2}$');
            if (regexDate.test(field_val))
                field_val = field_val + 'T00:00';
            const regex = RegExp('^[0-9]{4}-[0-9]{2}-[0-9]{2}(T[0-9]{2}:[0-9]{2})?$');
            if (regex.test(field_val)) {
                let dt = new Date(field_val);
                field_val = dt.toLocaleString();
            }
            return field_val;
        },
        getFieldHtml: function(field, valueWrapper) {
            valueWrapper = valueWrapper || false;
            let html;

            if (field.type === 'text') {
                html = self.getTextFieldHtml(field);
            } else if (field.type === 'textarea') {
                html = self.getTextareaFieldHtml(field);
            } else if (field.type === 'checkbox') {
                html = self.getCheckboxFieldHtml(field);
            } else if (field.type === 'number') {
                html = self.getNumberFieldHtml(field);
            } else if (field.type === 'date') {
                html = self.getDateFieldHtml(field);
            } else if (field.type === 'datetime-local' || field.type === 'datetime') {
                html = self.getDateTimeFieldHtml(field);
            } else if (field.type === 'multilist') {
                html = self.getMultiListFieldHtml(field);
            }

            if (field.value && valueWrapper && field.type !== 'checkbox') {
                let field_val = this.formatDate(field.value);
                html =
                    '<span class="js_value_wrapper">' +
                    '<span class="field__value">' + field_val + '</span>' +
                    html +
                    '</span>';
            }

            let $html = $('<span>').append(html);
            if (field.type === 'multilist') {
                $html.find('.field__value').hide();
            }
            if (field.options) {
                if (field.options.readonly) {
                    $html.find('input, textarea').prop('readonly', true);
                }
                if (field.options.list_values) {
                    let select = $html.find('select');
                    for (let i = 0; i < field.options.list_values.length; i++) {
                        let optionItem = field.options.list_values[i];
                        let optionVal, optionTitle;
                        if (typeof(optionItem) === "object") {
                            optionTitle = optionItem.value;
                            optionVal = optionItem.id.toString();
                        } else {
                            optionTitle = optionVal = optionItem;
                        }
                        let opt = $('<option>');
                        opt.attr('value', optionVal);
                        console.debug(field, optionVal)
                        if (Array.isArray(field.value)) {
                            let checkValues = [];
                            $.each(field.value, function(iV, vV) {
                                if (vV && vV.enum_id)
                                    checkValues.push(vV.enum_id.toString());
                                else {
                                    try {
                                        checkValues.push(vV.toString());
                                    } catch (e) {
                                        console.error(e)
                                    }
                                }
                            });
                            if (checkValues.includes(optionVal)) {
                                opt.attr('selected', true);
                            } else {
                                opt.attr('selected', false);
                            }
                        } else if (!Array.isArray(field.value) && field.value && field.value.enum_id && field.value.enum_id == optionVal) {
                            opt.attr('selected', true);
                        } else if (!Array.isArray(field.value) && field.value && field.value === optionVal) {
                            opt.attr('selected', true);
                        } else {
                            opt.attr('selected', false);
                        }
                        opt.html(optionTitle);
                        select.append(opt);
                    }
                }
                if (field.options.address) {
                    $html.find('input').addClass('js_address').addClass('field_dadata_address');

                    var suggestions_init = function(address) {
                        if ($.Suggestions === undefined) {
                            return;
                        }
                        address = address || $('.js_address');

                        address.suggestions({
                            token: "4757ac4391ee4ec0c2207d3df3d728729bea3bdc",
                            type: "ADDRESS",
                            deferRequestBy: 200,
                            minChars: 2,
                            width: 500,
                            onSelectNothing: function() {
                                var item = $(this);
                                var name = item.prop('name');

                                $('.js_address').each(function(i, v) {
                                    if (name == $(v).prop('name')) {
                                        item.val('');
                                        var group = $(v).closest('.js_field');
                                        group.removeClass('has-success').addClass('has-error').addClass('has-feedback');
                                        group.find('.form-control-feedback').remove();
                                        $('<span>', {
                                            class: "glyphicon glyphicon-remove form-control-feedback",
                                            'aria-hidden': true
                                        }).insertAfter($(v));
                                        $(v).tooltip('destroy');
                                    }
                                });
                            },
                            onSelect: function(suggestion) {
                                if (suggestion == undefined) {
                                    return;
                                }

                                var data = suggestion.data;
                                var title = '<p style="text-align:left;">Почтовый индекс: ' + (data.postal_code || '') + '<br/>' +
                                    'Регион / район: ' + (data.region_with_type || '') + '<br>' +
                                    'Город / н.п.: ' + (data.city_with_type || '') + '<br>' +
                                    'Район: ' + (data.settlement_with_type || '') + '<br>' +
                                    'Улица: ' + (data.street_with_type || '') + '<br>' +
                                    'КЛАДР: ' + (data.kladr_id || '') + '<br>' +
                                    'ФИАС: ' + (data.fias_id || '') + '</p>';


                                var item = $(this);
                                var name = item.prop('name');
                                var d = item.data('suggestions');
                                d['selection'] = suggestion;
                                $('.js_address').each(function(i, v) {
                                    if (name == $(v).prop('name')) {
                                        var group = $(v).closest('.js_field');
                                        group.find('.form-control-feedback').remove();
                                        group.removeClass('has-error').addClass('has-success').addClass('has-feedback');

                                        var span = $('<span>', {
                                            class: "glyphicon glyphicon-ok form-control-feedback",
                                            'aria-hidden': true
                                        });
                                        $(v).tooltip({
                                                html: true
                                            }).tooltip('hide')
                                            .attr('data-original-title', title);

                                        span.insertAfter($(v));

                                        $(v).data('suggestions', d);
                                    }
                                });
                            },
                        });
                    };

                    if (self.is_js_address_loaded == null) {
                        self.is_js_address_loaded = true;
                        setTimeout(function() {
                            $('head').append('<link rel="stylesheet" type="text/css" href="//cdn.jsdelivr.net/npm/suggestions-jquery@17.10.0/dist/css/suggestions.min.css" />');
                            $.getScript('//cdn.jsdelivr.net/npm/suggestions-jquery@17.10.0/dist/js/jquery.suggestions.min.js', function(data) {
                                suggestions_init();
                            });
                        }, 10);
                    } else {
                        setTimeout(function() {
                            suggestions_init();
                        }, 10);
                    }
                }
            }
            return $html.html();
        },
        encodeHTML: function(s) {
            return String(s)
                .split('&').join('&amp;')
                .split('<').join('&lt;')
                .split('"').join('&quot;')
                .split("'").join('&#39;');
        },
        getTextFieldHtml: function(field) {
            return '<input type="text" class="form-control js_script_field" name="' + field.id + '" placeholder="' +
                field.name + '" value="' + ((field.value) ? this.encodeHTML(field.value) : '') + '" />';
        },
        getTextareaFieldHtml: function(field) {
            return '<textarea rows="5" cols="50" class="form-control js_script_field" name="' + field.id + '" placeholder="' +
                field.name + '">' + ((field.value) ? this.encodeHTML(field.value) : '') + '</textarea>';
        },
        getCheckboxFieldHtml: function(field) {
            return '<span class="checkbox">' +
                '<label><input type="checkbox" class="js_script_field" name="' + field.id + '" ' +
                'value="1" ' + ((field.value) ? 'checked="checked" ' : '') + '/>' + field.name + '</label>' +
                '</span>';
        },
        getNumberFieldHtml: function(field) {
            return '<input type="number" class="form-control js_script_field" name="' + field.id + '" placeholder="' +
                field.name + '" value="' + ((field.value) ? this.encodeHTML(field.value) : '') + '" />';
        },
        getDateFieldHtml: function(field) {
            let val = field.value;
            const regex = RegExp('^[0-9]{4}-[0-9]{2}-[0-9]{2}$');
            if (regex.test(val))
                val = val + 'T00:00';
            return '<input type="datetime-local" class="form-control js_script_field" name="' + field.id + '" placeholder="' +
                field.name + '" title="' + field.name + '" value="' + ((val) ? val : '') + '" />';
        },
        getDateTimeFieldHtml: function(field) {
            return '<input type="datetime-local" class="form-control js_script_field" name="' + field.id + '" placeholder="' +
                field.name + '" title="' + field.name + '" value="' + ((field.value) ? field.value : '') + '" />';
        },
        getMultiListFieldHtml: function(field) {
            let multiple = 'multiple="multiple"';
            if (field.options && field.options.simpleList) {
                multiple = '';
            }
            let html = '<span class="js_script_field_sel2_wrap">' +
                '<select ' + multiple + ' class="form-control js_script_field js_script_field_multilist js_script_field_multilist_' + field.id + '" name="' + field.id + '" placeholder="' +
                field.name + '" title="' + field.name + '">';
            if (field.options && field.options.simpleList) {
                html += '<option>' +
                    // Translator.trans('choice_variable')+
                    '</option>'
            }
            html += '</select></span>';
            return html;
        },
        addCRMField: function(field, editor) {

            am.promiseCmd({
                method: 'script.add_crm_field',
                id: field.id,
                script_id: $('.js_editor').data('id')
            }).done(function(result) {
                self.editor = editor;
                self.loadFields(function() {
                    self.addFieldToEditor(result);
                });
            }).fail(function(err) {
                console.log(JSON.stringify(err));
            });
        },
        getFieldMenu: function(editor) {
            return;
            var menu = [{
                text: Translator.trans('add_field'),
                onclick: function() {
                    self.showAddFieldsFromEditor(editor);
                }
            }];

            var reservedFields = self.getCRMFields();
            var customCrmFields = [];

            var first = false;
            $.each(self.fields, function(i, field) {

                if (typeof field == 'undefined') return;

                if (!field.sys_name) {

                    if (!first) {
                        first = true;
                        menu.push({
                            text: '-'
                        });
                    }

                    menu.push({
                        text: field.name,
                        onclick: function() {
                            editor.insertContent(self.replaceFieldsToObjects(self.getFieldLabel(field.id)));
                        }
                    });
                } else if (!reservedFields[field.sys_name]) {
                    customCrmFields.push(field);
                }
            });

            menu.push({
                text: '-'
            });
            menu.push({
                text: Translator.trans('crm_fields'),
                classes: 'crm-separator'
            });
            $.each(self.getCRMFields(), function(i, field) {
                menu.push({
                    text: field.name,
                    onclick: function() {
                        self.addCRMField(field, editor);
                    }
                })
            });

            // custom crm fields
            if (customCrmFields.length > 0) {
                //menu.push({text: '-'});
                $.each(customCrmFields, function(i, field) {
                    menu.push({
                        text: field.name,
                        onclick: function() {
                            editor.insertContent(self.replaceFieldsToObjects(self.getFieldLabel(field.id)));
                        }
                    });
                });
            }

            // adding into menu profile fields
            menu.push({
                text: Translator.trans('profile_fields'),
                classes: 'crm-separator'
            });
            $.each(self.getProfileFields(), function(i, field) {
                menu.push({
                    text: field.name,
                    onclick: function() {
                        editor.insertContent('<hs class="js_static_field js_non_editable" data-id="' + field.id + '">' + field.name + '</hs>');
                    }
                })
            });

            return menu;
        }
    };

})();