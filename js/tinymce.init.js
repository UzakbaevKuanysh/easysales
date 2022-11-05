var params = {
    target: $('#scriptsElementDescript').get(0),
    menubar: false,
    statusbar: false,
    toolbar: "bold,italic | styleselect cardfields videoBtn | spellchecker | link image imagetools",
    //toolbar: "bold,italic | styleselect cardfields | fullscreen",
    plugins: 'noneditable paste autoresize spellchecker link image imagetools',
    target_list: false,
    default_link_target: "_blank",
    link_title: false,
    //plugins: 'noneditable fullscreen paste',
    noneditable_noneditable_class: 'js_non_editable',
    language: $('html').attr('lang'),
    force_br_newlines: false,
    force_p_newlines: true,
    forced_root_block: 'p',
    //paste_as_text: true,

    paste_auto_cleanup_on_paste: true,
    paste_remove_styles: true,
    paste_remove_styles_if_webkit: true,
    paste_strip_class_attributes: true,

    autoresize_max_height: 500,
    paste_word_valid_elements: "b,strong,i,em,p,br",
    paste_retain_style_properties: "font-weight font-style",

    spellchecker_languages: "Russian=ru,Ukrainian=uk,English=en",
    spellchecker_language: $('html').attr('lang'), // default language
    spellchecker_rpc_url: "//proxy.hyper-script.ru/speller",
    formats: {
        richedit_answer: {
            inline: 'span',
            classes: 'richedit_answer'
        },
        richedit_comment: {
            inline: 'span',
            classes: 'richedit_comment'
        },
        richedit_warning: {
            inline: 'span',
            classes: 'richedit_warning'
        },
        richedit_emotion_funny: {
            inline: 'span',
            classes: 'richedit_emotion_funny'
        },
        richedit_emotion_sly: {
            inline: 'span',
            classes: 'richedit_emotion_sly'
        },
        richedit_emotion_care: {
            inline: 'span',
            classes: 'richedit_emotion_care'
        },
        richedit_emotion_intrigue: {
            inline: 'span',
            classes: 'richedit_emotion_intrigue'
        },
        richedit_emotion_interrogative: {
            inline: 'span',
            classes: 'richedit_emotion_interrogative'
        },
    },
    style_formats: [{
            title: Translator.trans('tinymce_system')
        },
        {
            title: Translator.trans('tinymce_answer'),
            format: 'richedit_answer'
        },
        {
            title: Translator.trans('tinymce_comment'),
            format: 'richedit_comment'
        },
        {
            title: Translator.trans('tinymce_warning'),
            format: 'richedit_warning'
        },
        {
            title: Translator.trans('tinymce_emotion_system')
        },
        {
            title: Translator.trans('tinymce_emotion_funny'),
            format: 'richedit_emotion_funny'
        },
        {
            title: Translator.trans('tinymce_emotion_sly'),
            format: 'richedit_emotion_sly'
        },
        {
            title: Translator.trans('tinymce_emotion_care'),
            format: 'richedit_emotion_care'
        },
        {
            title: Translator.trans('tinymce_emotion_intrigue'),
            format: 'richedit_emotion_intrigue'
        },
        {
            title: Translator.trans('tinymce_emotion_interrogative'),
            format: 'richedit_emotion_interrogative'
        }
    ],
    content_css: '/css/tinymcetextpagestyle.css?v=2',
    valid_elements: 'p[class],a[href],strong/b,div[class|data*],br,ul[class],li[class],dl,dt,table,tbody,thead,td,tr,i,' +
        'img[src|alt|title|style],em,span[class|data*],h1[class],h2[class],h3[class],h4[class],h5[class],' +
        'input[class|id|style|name|placeholder|type],label[class],textarea[class|id|style|name|placeholder],' +
        'select[class|id|style|name|placeholder],hs[class|data*]'
};

params.image_dimensions = false;
params.file_browser_callback = function(ee) {
    var input = $(document.createElement("input"));
    input.attr("type", "file");
    input.trigger("click");
    input.on('change', function(e) {
        var formData = new FormData();
        var id = window.location.hash.substr(3);
        formData.append('file', $(this).get(0).files[0]);
        var csrfToken = jQuery.app.misc.getCsrfToken();
        formData.append('csrf_token', csrfToken);
        formData.append('method', 'script.saveImage');
        formData.append('id', id);
        $.ajax({
                type: "POST",
                processData: false,
                contentType: false,
                url: '/ajax',
                data: formData,
                dataType: 'json',
                beforeSend: function() {

                }
            }).done(function(data) {
                if (data.response) {
                    $('#' + ee).val(data.response.link);
                }
                if (data.msg) {
                    alert(data.msg);
                }
                $(self).val('');
            })
            .error(function(data) {

            });
    })
}

$.fn.toString = function() {
    var out;
    out = [];
    $.each(this, function(k, v) {
        return out.push($(v)[0].outerHTML);
    });
    return out.join("\n");
};
String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};
var cardFields = $('.cardFields');
if (cardFields.size() && cardFields.data('val') == true) {

    params.setup = function(editor) {
        editor.addButton('videoBtn', {
            icon: 'addvideo',
            tooltip: Translator.trans('videoBtn_tooltip'),
            onclick: function() {
                // console.log('VIDEO BTN');
                $.app.addVideo.showAddVideoFromEditor(editor);
            }
        });


        if ($.app) {
            editor.addButton('cardfields', {
                icon: 'addfield',
                tooltip: Translator.trans('fieldsBtn'),
                onclick: function() {
                    $.app.addField.showAddFieldsFromEditor(editor);
                }
            });
        }
        editor.on('NodeChange', function(e) {
            if (e.element.tagName === "IMG" && !e.element.hasAttribute('width')) {
                e.element.setAttribute("width", '300px');
            }
        });
        // process node text before put it into editor
        editor.on('BeforeSetContent', function(e) {
            try {
                if ($(e.content).prop("tagName") == "IMG" && !$(e.content).hasClass('inserted')) {
                    var content = $(e.content);
                    e.content = content.attr('width', 300).addClass('inserted').toString();
                }
            } catch (e) {}
            if ($.app) {
                e.content = $.app.addField.replaceFieldsToObjects(e.content);
                e.content = $.app.addVideo.replaceVideosToObjects(e.content);
            }
        });

        editor.on('FullscreenStateChanged', function(e) {
            if ($('.mce-fullscreen').length) {
                $('.zoom-btns').hide();
            } else {
                $('.zoom-btns').show();
            }
        });
    }
}