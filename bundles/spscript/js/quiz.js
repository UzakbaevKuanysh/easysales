console.log('%c🦕 quiz', 'color: yellow;')

var QUIZ_DOMAIN_URL = 'https://quiz.hyper-script.ru'
// var QUIZ_DOMAIN_URL = 'http://localhost:3000'

var appasyncadd = appasyncadd || [];

(function() {
    var app = {},
        am = {},
        self = {};
    var loader = function(an_app) {
        app = an_app;
        am = app.misc;
        app.libAddQuiz = module;
        self = module;
        self.init();
    };
    setTimeout(function() {
        appasyncadd.push(loader);
    }, 0);

    var busy = false;

    var module = {
        quizUrl: null,
        quizIframeCode: null,
        quizIframeWidth: null,
        quizIframeHeight: null,

        resultModalFocusId: null,
        hook: null,
        uploadImageQuizMode: null,

        resultsData: null,
        oldImageUrlToImageStepSlider: null,

        showPopup: function() {
            let fel = $('#quiz-modal-create');
            fel.find('input[name]').val('')
            am.clearGenericFormErrors(fel);
            $.fancybox.open(fel, {
                autoSize: true,
                helpers: {
                    overlay: {
                        closeClick: false
                    }
                },
            });
        },
        init: function() {
            $('.js_editor .js_menu').click((e) => {
                e.preventDefault()
                var classes = e.target.closest('.js_menu').classList
                if (classes.contains('js_show_quiz_view') || classes.contains('js_show_constructor')) {
                    if (app.script.currentScriptType === 'quiz') {
                        $('.js_design_box').removeClass('hidden')
                    }
                } else {
                    $('.js_design_box').addClass('hidden')
                }
            })

            $(document).on('click', '.hs-quiz-result__copy', e => {
                // console.log('🦕 .hs-quiz-result__copy CLICK')
                e.preventDefault()
                self.quizCopyResult(e.target)
            })

            $('#hs_smenu_quiz_view').click((e) => {
                // console.log('🦕 #hs_smenu_quiz_view CLICK')
                e.preventDefault()
                self.toggleQuizViewTab()
            })

            $(document).on('click', '.hs--quiz-image-to-step__remove', e => {
                var imageContainer = e.currentTarget.parentElement.parentElement
                var imgUrl = imageContainer.children[0].children[0].getAttribute('src')

                var urls = document.getElementById('quizStepImages').value.split(',')
                var fIdx = urls.indexOf(imgUrl)

                var container = document.getElementsByClassName('hs--quiz-image-to-step--stack')[0]

                if (fIdx !== -1) {
                    urls.splice(fIdx, 1)
                    document.getElementById('quizStepImages').value = urls.join()

                    $('#quizStepImages').trigger('change')

                    var html = urls.map(e => self.generateStepImageHtml(e))
                    container.innerHTML = html.join('')
                }

                am.trigger('constructor step image position changed', true)
            })

            $(document).on('click', '.hs--quiz-image-to-step__edit', e => {
                var imageContainer = e.currentTarget.parentElement.parentElement

                self.oldImageUrlToImageStepSlider = imageContainer.children[0].children[0].getAttribute('src')


                document.getElementsByClassName('btn-upload-quiz-image-to-step')[0].click()
            })

            $(document).on('change', '.hs--quiz-result--point__input', (e) => {
                $(`#${e.target.dataset.jsPlumbId}`).data('points', e.target.value ? parseInt(e.target.value, 10) : 0)
                am.trigger('constructor quiz condition points changed', true)
            })

            $(document).on('click', '.btn-upload-quiz-image-to-step', (e) => {
                e.preventDefault()
                self.hook = e.target.parentElement.children[0]
                self.oldImageUrlToImageStepSlider = null
                self.uploadPictureToQuiz(e.target)
            })

            $(document).on('change', 'input[name=quizeAddImageToAnswer]', e => {
                e.preventDefault()
                self.quizeAddImageToAnswer(e.target)
            })

            $(document).on('change', 'input[name=quizIframeWidth]', e => {
                self.quizIframeWidth = e.target.value
                self.generateQuizIframeCode()
            })
            $(document).on('change', 'input[name=quizIframeHeight]', e => {
                self.quizIframeHeight = e.target.value
                self.generateQuizIframeCode()
            })

            $(document).on('click', '#openQuizUrl', e => {
                e.preventDefault()
                self.openQuizUrl()
            });
            $(document).on('click', '#copyQuizUrl', e => {
                e.preventDefault()
                self.copyQuizUrl(e.target)
            });
            $(document).on('click', '#copyQuizIframeCode', e => {
                e.preventDefault()
                self.copyQuizIframeCode(e.target)
            });

            $(document).on('click', '.hs--answer-panel--add-image-to-answer__edit', (e) => {
                e.preventDefault();
                e.target.parentElement.parentElement.parentElement.parentElement.getElementsByClassName('hs--answer-panel--add-image-to-answer__container-image')[0].click();
            });

            $(document).on('click', '.hs--answer-panel--add-image-to-answer__remove', (e) => {
                e.preventDefault();
                self.hook = e.target.parentElement.parentElement.parentElement.parentElement.getElementsByClassName('hs--answer-panel--add-image-to-answer__container-image')[0]
                self.quizSetImageToAnswer('', '')
            });

            $(document).on('click', '.hs--answer-panel--add-new-image-to-answer__edit', (e) => {
                e.preventDefault();
                // console.log('🦕 msg', e.target.parentElement.parentElement.parentElement.parentElement.getElementsByClassName('hs--answer-panel--add-new-image-to-answer__container-image')[0])
                e.target.parentElement.parentElement.parentElement.parentElement.getElementsByClassName('hs--answer-panel--add-new-image-to-answer__container-image')[0].click();
            });

            $(document).on('click', '.hs--answer-panel--add-new-image-to-answer__remove', (e) => {
                e.preventDefault();
                self.hook = e.target.parentElement.parentElement.parentElement.parentElement.getElementsByClassName('hs--answer-panel--add-new-image-to-answer__container-image')[0]
                self.quizSetImageToNewAnswer('', '')
            });

            $(document).on('submit', '#add-result-to-quiz__form', (e) => {
                e.preventDefault();
                self.quizAddResult(e.target);
            });

            $(document).on('click', '.hs-quiz-result__remove', (e) => {
                var id = app.script.currentScriptId
                var resultId = $(e.target).parents('.hs-quiz-result').data('resultId')
                $.fancybox.showLoading()
                $.ajax({
                    type: 'DELETE',
                    url: `/quiz/${id}/results/${resultId}`,
                    async: true,
                    success: response => {
                        self.generateResults()
                        $.fancybox.hideLoading()
                    },
                })
            })

            $(document).on('click', '.hs-quiz-result__edit', (e) => {
                var resultId = $(e.target).parents('.hs-quiz-result').data('resultId')
                self.openQuizResultEditModal($(e.target).parents('.hs-quiz-result'))
                self.resultModalFocusId = resultId
            })

            $(document).on('click', '.hs--answer-panel--add-new-image-to-answer__container-image', (e) => {
                e.preventDefault()
                self.uploadPictureToQuiz(e.target)
            });

            $(document).on('click', '.hs--answer-panel--add-image-to-answer__container-image', (e) => {
                e.preventDefault()
                self.uploadPictureToQuiz(e.target)
            });

            $(document).on('click', '.btn-upload-quiz-background', (e) => {
                e.preventDefault()
                self.hook = e.target.parentElement.children[0]
                self.uploadPictureToQuiz(e.target)
            })

            $(document).on('click', '.quiz-design-upload-image--preview__edit ', (e) => {
                e.preventDefault()
                self.hook = e.target.parentElement.parentElement.parentElement.children[0]
                self.uploadPictureToQuiz(document.getElementsByClassName('quiz-design-upload-image--preview__edit')[0])
            })

            $(document).on('click', '.btn-upload-quiz-background', (e) => {
                e.preventDefault()
                self.hook = e.target.parentElement.children[0]
                self.uploadPictureToQuiz(e.target)
            })

            $(document).on('click', '.quiz-design-upload-image--preview__remove', (e) => {
                e.preventDefault()
                self.hook = e.target.parentElement.parentElement.parentElement.children[0]
                $('#quizBackground').val('')
                $('#quizBackground').trigger('change')
                self.quizSetImageToBackgroundQuiz('', '')
            })

            $(document).on('click', '#upload-picture-to-answer__submit', (e) => {
                e.preventDefault()
                self.submitUploadRemoteImageToAnswer()
            })

            $(document).on('click', '#result-toggle-btn-on', (e) => {
                e.preventDefault()
                $('#result-toggle-btn-off').removeClass('active').removeClass('btn-primary').addClass('btn-default')
                $('#result-toggle-btn-on').addClass('active').addClass('btn-primary')
                var boxel = $('.js_editor')
                if (!boxel.size()) return
                boxel.data('show_quiz_results', true)
                am.trigger('constructor script show_quiz_results changed', true)
            })

            $(document).on('change', 'input[name="designBackgroundColorCustom"]', (e) => {
                e.preventDefault()
                var boxel = $('.js_editor')
                if (!boxel.size()) return
                var d = boxel.data()
                boxel.data('quiz_background', {
                    color: e.target.value,
                    url: d.quiz_background ? d.quiz_background.url : '',
                })
                var designBackgroundColors = document.getElementsByName('designBackgroundColor')
                designBackgroundColors.forEach(e => {
                    e.checked = false
                })
                self.toggleQuizViewTab()
                am.trigger('constructor quiz background changed', true)
            })

            $(document).on('change', 'input#resultButtonName', (e) => {
                e.preventDefault()
                var boxel = $('.js_editor')
                if (!boxel.size()) return
                var d = boxel.data()
                boxel.data('quiz_options', {
                    ...d.quiz_options,
                    resultButtonName: e.target.value ? e.target.value : 'Показать результат'
                })

                resultButtonNamePreview.innerText = e.target.value ? e.target.value : 'Показать результат'

                am.trigger('constructor quiz result button name changed', true)
            })

            $(document).on('change', 'input[name="designBackgroundColor"]', (e) => {
                e.preventDefault()
                var boxel = $('.js_editor')
                if (!boxel.size()) return
                var d = boxel.data()
                boxel.data('quiz_background', {
                    color: e.target.value,
                    url: d.quiz_background ? d.quiz_background.url : '',
                })
                self.toggleQuizViewTab()
                am.trigger('constructor quiz background changed', true)
            })

            $(document).on('change', 'input[name="quizBackground"]', (e) => {
                e.preventDefault()
                var boxel = $('.js_editor')
                if (!boxel.size()) return
                var d = boxel.data()
                boxel.data('quiz_background', {
                    color: d.quiz_background ? d.quiz_background.color : '#ffffff',
                    url: e.target.value,
                })
                self.toggleQuizViewTab()
                am.trigger('constructor quiz background changed', true)
            })

            $(document).on('change', 'input[name="stepImagePosition"]', (e) => {
                e.preventDefault()
                // console.log('🦕 constructor step image position changed')
                am.trigger('constructor step image position changed', true)
            })

            $(document).on('click', '#result-toggle-btn-off', (e) => {
                e.preventDefault()
                $('#result-toggle-btn-on').removeClass('active').removeClass('btn-primary').addClass('btn-default')
                $('#result-toggle-btn-off').addClass('active').addClass('btn-primary')
                var boxel = $('.js_editor')
                if (!boxel.size()) return
                boxel.data('show_quiz_results', false)
                am.trigger('constructor script show_quiz_results changed', false)
            })

            $(document).on('click', '.add-result-to-quiz', (e) => {
                e.preventDefault()
                self.toggleAddResultToQuiz()
                self.resultModalFocusId = null
                var $form = $('#add-result-to-quiz__form')
                $form.find('input[name=title]').val('')
                $form.find('textarea[name=description]').val('')
                $form.find('input[name=pointsFrom]').val('')
                $form.find('input[name=pointsTo]').val('')
                $form.find('input[name=contactsRequired]').prop('checked', false)
            })

            $(document).on('click', '#hs_smenu_result', (e) => {
                e.preventDefault()
                self.generateStepsAndAnswer()
                self.generateResults()
            })

            let fel = $('#quiz-modal-create');
            if (fel.length !== 1) return;

            fel.submit(function(e) {
                e.preventDefault();

                if (busy) return;
                busy = true;

                $.fancybox.showLoading();
                am.clearGenericFormErrors(fel);
                let folder_id = null;
                try {
                    folder_id = app.scriptFolder.currentSelectedFolder.id;
                } catch (e) {

                }
                am.trigger('add script start', [function(data) {
                    let name = fel.find('input[name]').val();
                    am.promiseCmd({
                        method: 'scripts.create',
                        name: name,
                        type: 'quiz',
                        data: data,
                        folder_id: folder_id
                    }).always(function() {
                        busy = false;
                        $.fancybox.hideLoading();
                    }).fail(function(err) {
                        am.showGenericFormErrors(fel, err);
                        $.fancybox.update();
                        am.trigger('add script fail', [err]);
                    }).done(function(res) {
                        $.fancybox.close();
                        try {
                            if (folder_id) {
                                if (!app.scriptFolder.jsonScriptToFolder[folder_id]) {
                                    app.scriptFolder.jsonScriptToFolder[folder_id] = [];
                                }
                                app.scriptFolder.jsonScriptToFolder[folder_id].push({
                                    conversion_count: 0,
                                    icon: "OWNER",
                                    id: res.id,
                                    name: name,
                                    type: 'quiz',
                                    passages_count: 0,
                                    user_access_count: 0
                                })
                            } else {
                                app.scriptFolder.scriptsNoFolder[res.id] = {
                                    conversion_count: 0,
                                    icon: "OWNER",
                                    id: res.id,
                                    name: name,
                                    type: 'quiz',
                                    passages_count: 0,
                                    user_access_count: 0
                                };
                            }
                        } catch (e) {
                            console.log('ERRR', e);
                        }
                        am.trigger('add script done', [res]);
                    });
                }]);
            });
        },
        uploadPictureToQuiz: (target) => {
            let fel = $('#upload-picture-to-answer');
            am.clearGenericFormErrors(fel);
            if (target.classList.contains('btn-upload-quiz-background') ||
                target.classList.contains('quiz-design-upload-image--preview__edit')) {
                console.log('🦕 BACKGROUND')
                self.hook = $('#quizBackground')
                self.uploadImageQuizMode = 'quiz-background'
                $('#upload-picture-to-answer__form input[name="src"]').val('')
                $('#upload-picture-to-answer__form input[name="alt"]').val('')
            } else if (target.classList.contains('btn-upload-quiz-image-to-step')) {
                console.log('🦕 Upload to step')
                self.uploadImageQuizMode = 'quiz-image-to-step'
                $('#upload-picture-to-answer__form input[name="src"]').val('')
                $('#upload-picture-to-answer__form input[name="alt"]').val('')
            } else if (target.classList.contains('hs--answer-panel--add-new-image-to-answer__image') || target.classList.contains('hs--answer-panel--add-new-image-to-answer__container-image')) {
                console.log('🦕 Upload to NEW answer')
                self.hook = target.parentElement
                self.uploadImageQuizMode = 'quiz-image-to-new-answer'
                var image = document.getElementsByClassName('hs--answer-panel--add-new-image-to-answer__image')[0]
                $('#upload-picture-to-answer__form input[name="src"]').val(image.getAttribute('src'))
                $('#upload-picture-to-answer__form input[name="alt"]').val(image.alt)
            } else {
                console.log('🦕 Upload to answer')
                self.hook = target.parentElement
                self.uploadImageQuizMode = 'quiz-image-to-answer'
                var image = self.hook.getElementsByClassName('hs--answer-panel--add-image-to-answer__image')[0]
                $('#upload-picture-to-answer__form input[name="src"]').val(image.getAttribute('src'))
                $('#upload-picture-to-answer__form input[name="alt"]').val(image.alt)
            }
            $.fancybox.open(fel, {
                autoSize: true,
                helpers: {
                    overlay: {
                        closeClick: false
                    }
                },
            });
        },
        toggleAddResultToQuiz: () => {
            let fel = $('#add-result-to-quiz');
            am.clearGenericFormErrors(fel);
            $.fancybox.open(fel, {
                autoSize: true,
                helpers: {
                    overlay: {
                        closeClick: false,
                        locked: false,
                    }
                },
            });
        },
        submitUploadRemoteImageToAnswer: () => {
            var src = $('#upload-picture-to-answer__form input[name="src"]').val()
            var alt = $('#upload-picture-to-answer__form input[name="alt"]').val()
            if (src.length > 8) {
                if (self.uploadImageQuizMode === 'quiz-background') {
                    self.quizSetImageToBackgroundQuiz(src, alt)
                }
                if (self.uploadImageQuizMode === 'quiz-image-to-step') {
                    if (self.oldImageUrlToImageStepSlider) {
                        var imgUrl = self.oldImageUrlToImageStepSlider

                        var urls = document.getElementById('quizStepImages').value.split(',')
                        var fIdx = urls.indexOf(imgUrl)

                        var container = document.getElementsByClassName('hs--quiz-image-to-step--stack')[0]

                        if (fIdx !== -1) {
                            urls.splice(fIdx, 1)
                            document.getElementById('quizStepImages').value = urls.join()

                            var html = urls.map(e => self.generateStepImageHtml(e))
                            container.innerHTML = html.join('')
                        }

                        self.oldImageUrlToImageStepSlider = null
                    }
                    self.quizSetImageToStep(src, alt)
                }
                if (self.uploadImageQuizMode === 'quiz-image-to-new-answer') {
                    self.quizSetImageToNewAnswer(src, alt)
                }
                if (self.uploadImageQuizMode === 'quiz-image-to-answer') {
                    self.quizSetImageToAnswer(src, alt)
                }
                let fel = $('#upload-picture-to-answer');
                $.fancybox.close(fel);
            }
        },
        openQuizResultEditModal: (store) => {
            self.toggleAddResultToQuiz()

            var $form = $('#add-result-to-quiz__form');
            $form.find('input[name=title]').val(store.data('resultTitle'));
            $form.find('textarea[name=description]').val(store.data('resultDescription'));
            $form.find('input[name=pointsFrom]').val(store.data('resultPointsFrom'));
            $form.find('input[name=pointsTo]').val(store.data('resultPointsTo'));
            $form.find('input[name=contactsRequired]').prop('checked', store.data('resultContactsRequired'));
        },
        quizAddResult: (formElement) => {
            var $form = $(formElement),
                title = $form.find('input[name=title]').val(),
                description = $form.find('textarea[name=description]').val(),
                pointsFrom = $form.find('input[name=pointsFrom]').val(),
                pointsTo = $form.find('input[name=pointsTo]').val(),
                contactsRequired = $form.find('input[name=contactsRequired]').is(':checked')

            var data = {
                exactPoints: pointsFrom && (pointsTo && Number(pointsTo) > 0) ? false : true, // это true если очков точное количество а не диапазон
                contactsRequired, // это true если требуется ввести контакты
                pointsFrom: Number(pointsFrom),
                pointsTo: Number(pointsTo),
                title,
                description,
            }

            var id = app.script.currentScriptId
            $.fancybox.showLoading()
            if (self.resultModalFocusId) {
                $.ajax({
                    url: `/quiz/${id}/results/${self.resultModalFocusId}`,
                    type: 'PUT',
                    data: JSON.stringify(data),
                    contentType: 'application/json; charset=utf-8',
                    dataType: 'json',
                    success: response => {
                        self.generateResults();
                        let fel = $('#add-result-to-quiz')
                        $.fancybox.close(fel)
                        $.fancybox.hideLoading()
                    },
                })
            } else {
                $.ajax({
                    url: `/quiz/${id}/results`,
                    type: 'POST',
                    data: JSON.stringify(data),
                    contentType: 'application/json; charset=utf-8',
                    dataType: 'json',
                    success: response => {
                        self.generateResults();
                        let fel = $('#add-result-to-quiz')
                        $.fancybox.close(fel)
                        $.fancybox.hideLoading()
                    },
                })
            }
        },
        quizCopyResult: (target) => {
            var id = app.script.currentScriptId
            // console.log('🦕 target', target.closest('.hs-quiz-result'))

            var $form = $(target.closest('.hs-quiz-result')),
                title = $form.data('resultTitle') + ' - ' + Translator.trans('duplicate'),
                description = $form.data('resultDescription'),
                pointsFrom = $form.data('resultPointsFrom'),
                pointsTo = $form.data('resultPointsTo'),
                contactsRequired = $form.data('resultContactsRequired');

            var data = {
                exactPoints: pointsFrom && (pointsTo && Number(pointsTo) > 0) ? false : true, // это true если очков точное количество а не диапазон
                contactsRequired, // это true если требуется ввести контакты
                pointsFrom: Number(pointsFrom),
                pointsTo: Number(pointsTo),
                title,
                description,
            }

            $.fancybox.showLoading()

            $.ajax({
                url: `/quiz/${id}/results`,
                type: 'POST',
                data: JSON.stringify(data),
                contentType: 'application/json; charset=utf-8',
                dataType: 'json',
                success: response => {
                    self.generateResults();
                    $.fancybox.hideLoading();
                },
            })
        },
        jsonToXstates: (obj) => {
            console.log('🐹 obj', obj)
            let steps = obj.steps.map(e => e.id)
            let connections = obj.connections.map(e => ({
                from: e.source,
                to: e.target
            }))
            let states = {}
            steps.forEach(key => {
                let variants = connections.filter(f => f.from === key)
                if (variants.length > 0) {
                    let events = Object.fromEntries(variants.map(n => [n.to, n.to]))
                    states[key] = {
                        on: { ...events
                        },
                    }
                } else {
                    states[key] = {}
                }
            })
            return states
        },
        generateQuizTempData: () => {
            var boxel = $('.js_editor')
            if (!boxel.size()) return
            let data = boxel.data()
            let fields = app.addField.getFields()
            let xstates = self.jsonToXstates(app.script.constructor.save(app.script.constructor.jsp))
            let finalData = {
                id: app.script.currentScriptId,
                target: data.target,
                name: data.name,
                type: app.script.currentScriptType,
                show_quiz_results: data.show_quiz_results,
                quiz_background: data.quiz_background,
                quiz_results: self.resultsData,
                quiz_options: data.quiz_options,
                ver: data.ver,
                data: {
                    ...app.script.constructor.save(app.script.constructor.jsp),
                    steps: app.script.constructor.save(app.script.constructor.jsp).steps.map(
                        step => ({
                            ...step,
                            text: self.htmlStrToObj(step.text)[0]['_'] || [],
                            images: {
                                position: step.images && step.images.position ?
                                    step.images.position :
                                    'between',
                                urls: step.images && step.images.urls ?
                                    Object.values(step.images.urls) :
                                    [],
                            },
                        }),
                    ),
                    xstates,
                },
                fields,
            }
            return finalData
        },
        elementToObj: (element) => {
            const obj = {
                e: element.tagName.toLowerCase()
            }
            if (element.attributes) {
                for (var i = 0; i < element.attributes.length; i++) {
                    // console.log('🦕 element.attributes[i]', element.attributes[i], element.attributes[i].name)
                    if (element.attributes[i].name !== 'style') {
                        switch (element.attributes[i].name) {
                            case 'class':
                                obj['@c'] = element.attributes[i].value;
                                break;
                            case 'data-id':
                                obj['@d'] = element.attributes[i].value;
                                break;
                            case 'src':
                                obj['@s'] = element.attributes[i].value;
                                break;
                            case 'alt':
                                obj['@a'] = element.attributes[i].value;
                                break;
                            case 'href':
                                obj['@h'] = element.attributes[i].value;
                                break;
                            default:
                                obj[element.attributes[i].name] = element.attributes[i].value;
                        }
                    }
                }
            }
            if (element.childNodes.length > 0) {
                obj['_'] = []
                for (var i = 0; i < element.childNodes.length; i++) {
                    const XML_TEXT_NODE = 3
                    if (element.childNodes[i].nodeType == XML_TEXT_NODE) {
                        obj['_'].push({
                            t: element.childNodes[i].wholeText
                        })
                    } else {
                        obj['_'].push(self.elementToObj(element.childNodes[i]))
                    }
                }
            }
            return obj
        },
        htmlStrToObj: (str) => {
            // console.log('🦕 htmlStrToObj', str)
            var newDiv = document.createElement('div')
            newDiv.innerHTML = str
            return [self.elementToObj(newDiv)]
        },
        toggleQuizViewTab: () => {
            let newChannel = new MessageChannel()
            let tempData = self.generateQuizTempData()
            let iframe = document.getElementById('clientQuiz')
            // console.log('🦕 msg', tempData)
            iframe.contentWindow.postMessage({
                    name: 'getData',
                    time: Date.now(),
                    payload: tempData,
                },
                '*', [newChannel.port2],
            )
        },
        getQuizResult: () => {
            var id = app.script.currentScriptId
            $.ajax({
                type: 'GET',
                url: `/quiz/${id}/results`,
                async: true,
                success: response => {
                    self.resultsData = response.resultSettings
                },
            })
        },
        generateResults: () => {
            var resultTemplate = (r) => (`
        <div class="panel panel-default hs-quiz-result" data-result-id="${r.id}" data-result-title="${r.title}" data-result-description="${r.description}" data-result-points-from="${r.pointsFrom}" data-result-points-to="${r.pointsTo}" data-result-contacts-required="${r.contactsRequired}">
          <div class="panel-heading" style="display: flex; align-items: center;">
            <p style="margin: 0 20px 0 0;">${r.title} (${r.pointsFrom}${(r.pointsFrom || r.pointsFrom == 0) && (r.pointsTo && Number(r.pointsTo) > 0) ? ` - ${r.pointsTo}` : ''}${r.contactsRequired ? ` | <span style="text-transform: lowercase; opacity: .8;">${Translator.trans('quiz_need_contact')}</span>` : ''}) </p>
            <div class="btn-group">
              <button type="button" title="${Translator.trans('copy')}" class="hs-quiz-result__copy btn btn-default btn-xs">
                <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" style="position: relative; top: 2px;" class="iconify iconify--carbon" width="12" height="12" preserveAspectRatio="xMidYMid meet" viewBox="0 0 32 32"><path d="M28 10v18H10V10h18m0-2H10a2 2 0 0 0-2 2v18a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2z" fill="currentColor"></path><path d="M4 18H2V4a2 2 0 0 1 2-2h14v2H4z" fill="currentColor"></path></svg>
              </button>
              <button type="button" title="${Translator.trans('edit')}" class="hs-quiz-result__edit btn btn-default btn-xs">
                <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" style="position: relative; top: 2px;" class="iconify iconify--carbon" width="12" height="12" preserveAspectRatio="xMidYMid meet" viewBox="0 0 32 32"><path d="M2 26h28v2H2z" fill="currentColor"></path><path d="M25.4 9c.8-.8.8-2 0-2.8l-3.6-3.6c-.8-.8-2-.8-2.8 0l-15 15V24h6.4l15-15zm-5-5L24 7.6l-3 3L17.4 7l3-3zM6 22v-3.6l10-10l3.6 3.6l-10 10H6z" fill="currentColor"></path></svg>
              </button>
              <button type="button" title="${Translator.trans('remove')}" class="hs-quiz-result__remove btn btn-default btn-xs">
                <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" style="position: relative; top: 2px;" class="iconify iconify--carbon" width="12" height="12" preserveAspectRatio="xMidYMid meet" viewBox="0 0 32 32"><path d="M12 12h2v12h-2z" fill="currentColor"></path><path d="M18 12h2v12h-2z" fill="currentColor"></path><path d="M4 6v2h2v20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8h2V6zm4 22V8h16v20z" fill="currentColor"></path><path d="M12 2h8v2h-8z" fill="currentColor"></path></svg>
              </button>
            </div>
          </div>
          <div class="panel-body">
            ${r.description}
          </div>
        </div>
      `)

            var id = app.script.currentScriptId
            $.ajax({
                type: 'GET',
                url: `/quiz/${id}/results`,
                async: true,
                success: response => {
                    var results = response.resultSettings
                    self.resultsData = response.resultSettings
                    var resultsHtml = results.map(r => resultTemplate(r)).join('')
                    $('#hs-quiz-results-container').html(resultsHtml)
                },
            })
        },
        generateStepsAndAnswer: () => {
            let scriptData = app.script.constructor.save(app.script.constructor.jsp)
            let steps = scriptData.steps
            let jsPlumbIds = []
            $.each($('.condition'), (idx, el) => {
                jsPlumbIds.push($(el).data('jl').canvas.id)
            })
            let finalData = {
                ...scriptData,
                connections: scriptData.connections.map((con, idx) => {
                    return { ...con,
                        _jsPlumbId: jsPlumbIds[idx]
                    }
                }),
            }
            finalData.steps.forEach(step => {
                step.connections = finalData.connections.filter(con => con.source === step.id)
            })
            finalData.steps.unshift(finalData.steps.splice(finalData.steps.findIndex(item => item.id === 'start'), 1)[0])
            // console.log('🦕 finalData', finalData)

            // GENERATION STEPS

            let connectionTemplate = (con) => (`
        <div class="hs-quiz-quest--variant">
          <div>
            <input data-js-plumb-id="${con._jsPlumbId}" data-connection-id="${con.id}" type="number" class="form-control hs--quiz-result--point__input" value="${con.points || 0}">
          </div>
          <div class="hs-quiz-quest--image-container">
            ${ con.images && con.images.length > 0 && con.images[0].src ? `<img src="${con.images[0].src}">` : `${Translator.trans('no_picture')}`}
          </div>
          <div>
            ${con.condition.trim().length > 0 ? con.condition : `${Translator.trans('text_is_empty')}`}
          </div>
        </div>
      `)

            let checkStepIsHaveConnections = (cons) => {
                if (cons.length > 0) {
                    return `
            <div class="hs-quiz-quest--variant">
              <div>
                <p style="font-size: 12px; color: #adadad; margin: 0px;">${Translator.trans('result__points')}:</p>
              </div>
              <div>
                <p style="font-size: 12px; color: #adadad; margin: 0px;">${Translator.trans('picture')}:</p>
              </div>
              <div>
                <p style="font-size: 12px; color: #adadad; margin: 0px;">${Translator.trans('text')}:</p>
              </div>
            </div>
            ${cons.map(c => connectionTemplate(c)).join('')}
          `
                } else {
                    return Translator.trans('step_answer_is_missing')
                }
            }

            var stepTemplate = (s) => (`
        <div class="panel panel-default hs-quiz-quest">
          <div class="panel-heading">
            <div class="hs-quiz-quest--title">
              ${s.title}
            </div>
            ${s.text.length > 0 ? '<div class="hs-quiz-quest--text">' : ''}
              ${s.text}
            ${s.text.length > 0 ? '</div>' : ''}
          </div>
          <div class="panel-body">
            ${checkStepIsHaveConnections(s.connections)}
          </div>
        </div>
      `)

            var stepHtml = steps.map(s => stepTemplate(s)).join('')
            $('#hs-quiz-quest-container').html(stepHtml)

            // /GENERATION STEPS
        },
        generateQuizUrl: () => {
            // console.log('%c🦕 generateQuizUrl', 'color: green;', app.script.currentScriptId)
            var strQuizId = app.script.currentScriptId.toString()
            var hash = $.md5(strQuizId)
            var url = `${QUIZ_DOMAIN_URL}/${hash}`
            document.getElementById('quizUrl').value = url
            document.getElementById('quizUrlRaw').textContent = url
            self.quizUrl = url
        },
        generateQuizIframeCode: () => {
            // console.log('%c🦕 generateQuizIframeCode', 'color: green;', app.script.currentScriptId)
            var strQuizId = app.script.currentScriptId.toString()
            var hash = $.md5(strQuizId)
            var url = `${QUIZ_DOMAIN_URL}/${hash}`
            var width = self.quizIframeWidth ? `${self.quizIframeWidth}px` : '100%'
            var height = self.quizIframeHeight ? `${self.quizIframeHeight}px` : '100%'
            var iframeCode = `<iframe width="${width}" height="${height}" src="${url}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
            document.getElementById('quizIframeCode').value = iframeCode
            document.getElementById('quizIframeCodeRaw').textContent = iframeCode
            self.quizIframeCode = iframeCode
        },
        clipboard: (target, field) => {
            var selection = window.getSelection()
            var range = document.createRange()
            range.selectNodeContents(target)
            selection.removeAllRanges()
            selection.addRange(range)

            try {
                document.execCommand('copy')
                selection.removeAllRanges()

                var original = field.textContent
                field.textContent = 'Скопировано!'
                field.classList.add('is-success')

                setTimeout(() => {
                    field.textContent = original;
                    field.classList.remove('is-success');
                }, 1200);
            } catch (e) {
                console.error('🦕 clipboard', e)
            }
        },
        copyQuizUrl: (el) => {
            // console.log('%c🦕 copyQuizUrl', 'color: green;', self.quizUrl)
            self.clipboard(document.getElementById('quizUrlRaw'), el)
        },
        copyQuizIframeCode: (el) => {
            // console.log('%c🦕 copyQuizIframeCode', 'color: green;', self.quizIframeCode)
            self.clipboard(document.getElementById('quizIframeCodeRaw'), el)
        },
        openQuizUrl: () => {
            // console.log('%c🦕 openQuizUrl', 'color: green;', self.quizUrl)
            window.open(self.quizUrl)
        },
        quizeAddImageToAnswer: (input) => {
            var csrfToken = jQuery.app.misc.getCsrfToken()

            let id = null
            if (self.uploadImageQuizMode === 'quiz-image-to-answer') {
                id = self.hook.dataset.cid || app.script.currentScriptId
                // console.log('%c🦕 quizeAddImageToAnswer -> id', 'color: green; font-weight: 700;', self.hook.dataset.cid, id)
            } else {
                id = app.script.currentScriptId
            }

            var methods = {
                'quiz-background': 'script.saveBackgroundImage',
                'quiz-image-to-step': 'script.saveNodeImage',
                'quiz-image-to-answer': 'script.saveImage',
                'quiz-image-to-new-answer': 'script.saveNodeImage',
            }

            // console.log('🦕quizeAddImageToAnswer', methods[self.uploadImageQuizMode])

            var fd = new FormData()
            fd.append('file', input.files[0])
            fd.append('method', methods[self.uploadImageQuizMode])
            fd.append('id', id)
            fd.append('csrf_token', csrfToken)

            $.fancybox.showLoading()

            $.ajax({
                url: '/ajax',
                data: fd,
                processData: false,
                contentType: false,
                type: 'POST',
                error: (jqXHR, textStatus, errorThrown) => {
                    console.log('🦕 ajaxError: (jqXHR , textStatus, errorThrown)', jqXHR, textStatus, errorThrown)
                    alert('Не получилось сохранить картинку. Попробуйте позже.')
                    let fel = $('#upload-picture-to-answer');
                    $.fancybox.close(fel);
                    $.fancybox.hideLoading();
                },
                success: response => {
                    if (response.status === 0) {
                        if (self.uploadImageQuizMode === 'quiz-background') {
                            self.quizSetImageToBackgroundQuiz(response.response.link)
                        }
                        if (self.uploadImageQuizMode === 'quiz-image-to-step') {
                            if (self.oldImageUrlToImageStepSlider) {
                                var imgUrl = self.oldImageUrlToImageStepSlider

                                var urls = document.getElementById('quizStepImages').value.split(',')
                                var fIdx = urls.indexOf(imgUrl)

                                var container = document.getElementsByClassName('hs--quiz-image-to-step--stack')[0]

                                if (fIdx !== -1) {
                                    urls.splice(fIdx, 1)
                                    document.getElementById('quizStepImages').value = urls.join()

                                    var html = urls.map(e => self.generateStepImageHtml(e))
                                    container.innerHTML = html.join('')
                                }

                                self.oldImageUrlToImageStepSlider = null
                            }
                            self.quizSetImageToStep(response.response.link)
                        }
                        if (self.uploadImageQuizMode === 'quiz-image-to-answer') {
                            self.quizSetImageToAnswer(response.response.link)
                        }
                        if (self.uploadImageQuizMode === 'quiz-image-to-new-answer') {
                            self.quizSetImageToNewAnswer(response.response.link)
                        }
                        let fel = $('#upload-picture-to-answer');
                        $.fancybox.close(fel);
                        $.fancybox.hideLoading();
                    } else {
                        console.log('🦕 success: (custom errors)', response)
                        var errorsDescriptions = {
                            'File not image': 'Выбранный файл не является изображением.'
                        }
                        alert(errorsDescriptions[`${response.msg}`] || 'Не получилось сохранить картинку. Попробуйте позже.')
                        let fel = $('#upload-picture-to-answer');
                        $.fancybox.close(fel);
                        $.fancybox.hideLoading();
                    }
                }
            })
        },
        quizSetImageToBackgroundQuiz: (src, alt = '') => {
            // console.log('%c🦕 quizSetImageToBackgroundQuiz', 'color: green;')
            if (self.hook) {
                $(self.hook).val(src)
                $(self.hook).trigger('change')

                var designBackground = document.getElementById('quizBackground')
                var designBackgroundPreview = designBackground.parentElement.getElementsByClassName('quiz-design-upload-image--preview')[0].children[0]
                var quizBackgroundPreviewImage = document.getElementById('quizBackgroundPreviewImage')
                var btnAction = document.getElementById('btn-upload-quiz-background')
                if (src) {
                    designBackgroundPreview.classList.remove('hidden')
                    quizBackgroundPreviewImage.src = src
                    btnAction.classList.add('hidden')
                    // console.log('🦕 FIND', designBackgroundPreview)
                } else {
                    designBackgroundPreview.classList.add('hidden')
                    quizBackgroundPreviewImage.src = ''
                    btnAction.classList.remove('hidden')
                }
            } else {
                // console.log('%c🦕 self.hook is null', 'color: red; font-weight: 700;')
            }
        },
        quizSetImageToStep: (src, alt = '') => {
            // console.log('%c🦕 quizSetImageToStep', 'color: green;')
            if (self.hook) {
                var merge = [...$(self.hook).val().split(',').filter(e => typeof e === 'string' && e.trim().length > 0), src]
                $(self.hook).val(merge)
                $(self.hook).trigger('change')
                var html = merge.map(e => self.generateStepImageHtml(e))
                var container = self.hook.parentElement.parentElement.getElementsByClassName('hs--quiz-image-to-step--stack')[0]
                container.innerHTML = html.join('')
                am.trigger('constructor quiz background changed', true)
            } else {
                // console.log('%c🦕 self.hook is null', 'color: red; font-weight: 700;')
            }
        },
        quizSetImageToAnswer: (src, alt = '') => {
            // console.log('%c🦕 quizSetImageToAnswer', 'color: green;')
            if (self.hook) {
                var input = self.hook.getElementsByClassName('hs--answer-panel--add-image-to-answer__input')[0]
                input.dataset.alt = alt
                var image = self.hook.getElementsByClassName('hs--answer-panel--add-image-to-answer__image')[0]
                $(input).val(src)
                $(input).trigger('change')
                image.alt = alt
                image.src = src
            } else {
                console.log('%c🦕 self.hook is null', 'color: red; font-weight: 700;')
            }
        },
        quizSetImageToNewAnswer: (src, alt = '') => {
            // console.log('%c🦕 quizSetImageToNewAnswer', 'color: blue;')
            if (self.hook) {
                var input = self.hook.getElementsByClassName('hs--answer-panel--add-new-image-to-answer__input')[0]
                input.dataset.alt = alt
                var image = self.hook.getElementsByClassName('hs--answer-panel--add-new-image-to-answer__image')[0]
                $(input).val(src)
                $(input).trigger('change')
                image.alt = alt
                image.src = src
            } else {
                console.log('%c🦕 self.hook is null', 'color: red; font-weight: 700;')
            }
        },
        generateStepImageHtml: image => {
            var template = `
        <div class="hs--quiz-image-to-step--item">
          <div>
            <img src="${image}" alf="">
          </div>
          <div class="hs--quiz-image-to-step--actions">
            <button class="hs--quiz-image-to-step__edit btn btn-default btn-xs" title="${Translator.trans('change_picture')}">
              <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" style="position: relative; top: 1px;" class="iconify iconify--carbon" width="12" height="12" preserveAspectRatio="xMidYMid meet" viewBox="0 0 32 32"><path d="M2 26h28v2H2z" fill="currentColor"></path><path d="M25.4 9c.8-.8.8-2 0-2.8l-3.6-3.6c-.8-.8-2-.8-2.8 0l-15 15V24h6.4l15-15zm-5-5L24 7.6l-3 3L17.4 7l3-3zM6 22v-3.6l10-10l3.6 3.6l-10 10H6z" fill="currentColor"></path></svg>
            </button>
            <button class="hs--quiz-image-to-step__remove btn btn-default btn-xs" title="${Translator.trans('remove_picture')}">
              <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" style="position: relative; top: 1px;" class="iconify iconify--carbon" width="12" height="12" preserveAspectRatio="xMidYMid meet" viewBox="0 0 32 32"><path d="M12 12h2v12h-2z" fill="currentColor"></path><path d="M18 12h2v12h-2z" fill="currentColor"></path><path d="M4 6v2h2v20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8h2V6zm4 22V8h16v20z" fill="currentColor"></path><path d="M12 2h8v2h-8z" fill="currentColor"></path></svg>
            </button>
          </div>
        </div>
      `
            return template
        },
        clearIframeSize: () => {
            $('input[name=quizIframeWidth]').val('')
            $('input[name=quizIframeHeight]').val('')
        },
    };
})();