console.log("appscript");
function strip_html(html)
{
    var tmp = document.createElement("DIV");
    tmp.innerHTML = html;

    var tmp2 = document.createElement("DIV");
    tmp2.innerHTML = tmp.textContent || tmp.innerText || "";

    return tmp2.textContent || tmp2.innerText || "";
}

function CutString(string,limit){
    // temparary node to parse the html tags in the string
    this.tempDiv = document.createElement('div');
    this.tempDiv.id = "TempNodeForTest";
    this.tempDiv.innerHTML = string;
    $(this.tempDiv).find("a").attr("target","_blank");
    // while parsing text no of characters parsed
    this.charCount = 0;
    this.limit = limit;

}
CutString.prototype.cut = function(){
    var newDiv = document.createElement('div');
    this.searchEnd(this.tempDiv, newDiv);
    return newDiv.innerHTML;
};

CutString.prototype.searchEnd = function(parseDiv, newParent){
    var ele;
    var newEle;
    for(var j=0; j< parseDiv.childNodes.length; j++){
        ele = parseDiv.childNodes[j];
        // not text node
        if(ele.nodeType != 3){
            newEle = ele.cloneNode(true);
            // if($(newEle).is('a')) {
            //     $(newEle).attr("target","_blank");
            // }
            newParent.appendChild(newEle);
            if(ele.childNodes.length === 0)
                continue;
            newEle.innerHTML = '';
            var res = this.searchEnd(ele,newEle);
            if(res)
                return res;
            else{
                continue;
            }
        }

        // the limit of the char count reached
        if(ele.nodeValue.length + this.charCount >= this.limit){
            newEle = ele.cloneNode(true);
            newEle.nodeValue = ele.nodeValue.substr(0, this.limit - this.charCount);
            newParent.appendChild(newEle);
            return true;
        }
        newEle = ele.cloneNode(true);
        newParent.appendChild(newEle);
        this.charCount += ele.nodeValue.length;
    }
    return false;
};

function cutHtmlString($string, $limit){
    var output = new CutString($string,$limit);
    return output.cut();
}

var appasyncadd = appasyncadd || [];
(function(){
    var app = {}, am = {}, self = {};
    var loader = function(an_app){
        app = an_app;
        am = app.misc;
        app.script = module;
        self = module;
        self.init();
    };
    setTimeout(function(){ appasyncadd.push(loader); }, 0);

    var busy, edit, jsp = null, tmp = $('<div></div>');
    const desk = undefined || [];
    var module = {
        isCtrlPressed: false,
        justDrugged: false,
        copyStepsBuffer: {
            get: function () {
                if (localStorage.getItem('copyStepsBuffer') === null) {
                    return [];
                }

                return JSON.parse(localStorage.getItem('copyStepsBuffer'));
            },
            add: function (item) {
                var all =  self.copyStepsBuffer.get();

                var obj = $(item).data();
                obj.pos = $(item).position();
                obj.id = $(item).prop('id');

                var connections = [];
                $($.merge([], jsp.getAllConnections())).filter(function (index, oo) {
                    return $(oo.source).prop('id') == obj.id
                }).each(function (index, oo) {
                    var connection = {};
                    connection.sourceId = oo.sourceId;
                    connection.targetId = oo.targetId;
                    connection.answer = {label: '', data: {}};


                    var answer = oo.getOverlay('label').getElement();
                    if (answer) {
                        answer = $(answer);
                        var answerText = answer.data('text');

                        connection.answer.label = self.constructor.cutText(answerText, 50)+self.constructor.getLinkRemoveHtml();
                        connection.answer.data  = answer.data();
                        delete connection.answer.data.jl;
                    }

                    connections.push(connection);

                });
                obj.connections = connections;

                all.push(obj);
                localStorage.setItem('copyStepsBuffer', JSON.stringify(all));
            },
            remove: function () {
                localStorage.removeItem('copyStepsBuffer');
            }
        },
        role: null,
        script_list: [],
        fields: [],
        issues: [],
        stepWebHooks: [],
        view_notes: [],
        view_quicklinks: [],
        documents: [],
        issuesCountByNodes: [],
        crossScript: false,
        _isHs: null,
        currentScriptId: null,
        currentScriptType: null,
        steps: null,
        starred: {
            data: [],
            _shrinkString: function (string, len = 40) {
                let ret = string;
                if (ret.length > len) {
                    let trimmedString = ret.substr(0, len);
                    ret = trimmedString.substr(0, Math.min(trimmedString.length, trimmedString.lastIndexOf(" ")));
                    ret = ret + " ...";
                }
                if (ret.trim() === "")
                    ret = Translator.trans('default_step_title')
                return ret;
            },
            itemHtml: function (id, title, withControls = true) {
                return '<li class="js_starred_item" data-id="' + id + '">' +
                    '<div>' +
                    '<a href="#" data-id="' + id + '">' + title + '</a>' +
                    (withControls ? '<span class="starred-eye-icon glyphicon glyphicon-eye-open" title="' + Translator.trans('show_hide_starred') + '"></span>' : '') +
                    (withControls ? '<span class="starred-drag-icon glyphicon glyphicon-resize-vertical" title="' + Translator.trans('drag_to_reorder') + '"></span>' : '') +
                    '</div>' +
                    '</li>';
            },
            _getItemCategory(id) {
                let cat = this.data.filter((g) => Array.isArray(g.s) ? g.s.includes(id) : null);
                if (!cat || (Array.isArray(cat) && cat.length === 0)) return null;
                return cat[0].n;
            },
            _getStepTitle: function (id, steps=null) {
                let ret = '';

                if (steps) {
                    let filtered = steps.filter(step => step.id === id);
                    if (filtered.length) {
                        let step = filtered[0];
                        if (step.title && step.title.trim().length > 0)
                            ret = strip_html(step.title);
                        else
                            ret = strip_html(step.text);
                    }
                }
                else {
                    ret = $('#' + id).find('.text').text();
                }
                ret = this._shrinkString(ret, 35);

                return ret;
            },
            clearBox: function () {
                let ul = $(".js_starred_list_sorting");
                ul.html("");
            },
            renderBox: function () {
                this.bindStarredEvents();

                let ul = $(".js_starred_list_sorting");
                ul.html("");

                this.data.forEach(function (group, index) {
                    if (!group.s || !Array.isArray(group.s)) {
                        group.s = [];
                    }
                    let itemsUl = '<ul class="starred-group-items">';

                    group.s.forEach(function (item) {
                        let title = self.starred._getStepTitle(item)
                        itemsUl += self.starred.itemHtml(item, title);
                    });
                    itemsUl += '</ul>';
                    //if (group.s.length > 0)
                    ul.append('<li data-id="' + group.n + '" class="js_starred_group" data-sorting="' + index + '"><div><a href="#" class="group-fold">' + group.n + "</a></div>" + itemsUl + "</li>");

                });

                $.each($('.js_starred_list_sorting .js_starred_group'), function (index, el) {
                    let others = Translator.trans('step_category.others');
                    if (("" + $(el).data("id")) !== others)
                        $(el).children('div').append('<span class="starred-edit-block"><a href="#" class="starred-edit" title="'+Translator.trans('starred_edit')+'"><span class="glyphicon glyphicon-edit"></span></a>' +
                            '<a href="#" class="starred-remove" title="'+Translator.trans('starred_remove')+'"><span class="glyphicon glyphicon-remove"></span></a></span>');
                    $(el).children('div').append('<span class="starred-drag-icon glyphicon glyphicon-resize-vertical" title="'+Translator.trans('drag_to_reorder')+'"></span>');
                });

                $.each($('.js_starred_list_sorting .js_starred_item'), function(i, e){
                    let stepId = $(e).data('id');
                    // let filtered = self.steps.filter(step => step.id === stepId);

                    let starred = false;
                    // if (filtered.length > 0) {
                    //     starred = filtered[0].is_starred;
                    // } else {
                        starred = $('#' + stepId).hasClass('is_starred');
                    // }
                    self.starred.setDisabled($(e), !starred);
                });
                let isAdmin = self.role === 'ROLE_SCRIPT_WRITER' || self.role === 'ROLE_ADMIN';
                if(isAdmin)
                    self.starred._bindSortables();
            },
            _bindSortables: function () {
                let ul = $(".js_starred_list_sorting");
                let ulItems = $(".starred-group-items");
                try{
                    ul.sortable('destroy');
                    ulItems.sortable('destroy');
                }catch (e) {
                }
                ul.sortable({
                    connectWith: '.js_starred_list_sorting',
                    stop: function (e, ui) {
                        self.starred.refreshSorting();
                    }
                });
                ulItems.sortable({
                    connectWith: '.starred-group-items',
                    stop: function (e, ui) {
                        self.starred.refreshSorting();
                    }
                });
            },
            setDisabled: function (itemEl, disabled) {
                if (disabled) {
                    itemEl.find('.starred-eye-icon').addClass('glyphicon-eye-close').removeClass('glyphicon-eye-open');
                    itemEl.addClass('disabled');
                } else {
                    itemEl.find('.starred-eye-icon').removeClass('glyphicon-eye-close').addClass('glyphicon-eye-open');
                    itemEl.removeClass('disabled');
                }
            },
            bindStarredEvents: function () {
                // search
                $('.js_favorites_content > .input-group > .js_starred_search').off().on('change keyup', function () {
                    self.starred.search($(this));
                });

                $("#js_create_cat_btn").off().click(function (e) {
                    e.preventDefault();

                    app.get('all').done(function (all) {
                        let input = '<input type="text" class="form-control" style="margin-bottom: 10px" id="add_starred_group_input">';
                        all.addition.show(Translator.trans('add_starred_group_message'), input, function () {
                            let newName = $('#add_starred_group_input').val();
                            self.starred.data.push({
                                n: newName,
                                s: []
                            });
                            self.starred.renderBox();
                            self.starred.onDataChanged();
                            am.trigger("constructor starred category added");
                        });
                    });
                });

                let ul = $(".js_starred_list_sorting");
                ul.off();
                // item click
                ul.on('click', '.js_starred_item a', function (e) {
                    e.preventDefault();
                    let stepId = $(this).data('id');
                    let stepEl = $('#' + stepId);
                    //if(stepEl.hasClass("sel")) return;
                    self.constructor.onStepDeselected();
                    self.constructor.onStepSelected(stepEl);
                    $('.js_constructor_box').show();
                    $('.js_view_box').hide();
                    $('.js_scripts_action_view').addClass('open').removeClass('active');
                    $('.js_show_constructor').addClass('active');

                    $('html, body').animate({
                        scrollTop: stepEl.offset().top - 150,
                        scrollLeft: stepEl.offset().left - 350
                    }, 300);
                });

                //enabled/disabled
                ul.on('click', '.starred-eye-icon', function (e) {
                    e.preventDefault();
                    let itemEl = $(this).closest('.js_starred_item');
                    let isStarred = itemEl.hasClass('disabled');
                    self.starred.setDisabled(itemEl, !isStarred);

                    let id = itemEl.data("id");
                    let s = $('#' + id);
                    s.data('is_starred', isStarred);
                    s.data('starred_text', '');
                    s[isStarred ? 'addClass' : 'removeClass']('is_starred');
                    am.trigger('constructor step is_starred changed', [s]);
                });

                ul.on('click', '.group-fold', function (e) {
                    e.preventDefault();
                    $(this).closest('.js_starred_group').find('.starred-group-items').toggleClass('folded');
                    $(this).toggleClass('folded');
                });

                // group edit
                ul.on('click', '.starred-edit', function (e) {
                    e.preventDefault();
                    let groupLi = $(this).parents('.js_starred_group');
                    let category = "" + groupLi.data("id");
                    app.get('all').done(function (all) {
                        let input = '<input type="text" class="form-control" style="margin-bottom: 10px" id="rename_starred_group_input" value="'+category+'">';
                        all.addition.show(Translator.trans('rename_starred_group_message'), input, function () {
                            let newName = $('#rename_starred_group_input').val();
                            self.starred.data.map((g) => {
                                if (g.n === category) {
                                    g.n = newName;
                                }
                            });
                            groupLi.attr("data-id", newName);
                            groupLi.data("id", newName);
                            groupLi.children('div').children('a').text(newName);
                            self.starred.onDataChanged();
                            am.trigger("constructor starred category renamed");
                        });
                    });
                });

                // group delete
                ul.on('click', '.starred-remove', function (e) {
                    e.preventDefault();
                    let groupLi = $(this).parents('.js_starred_group');
                    let category = "" + groupLi.data("id");
                    app.get('all').done(function (all) {
                        all.confirm.show(Translator.trans('confirm_remove_starred_group') + " \"" + category + "\"?", function () {
                            let gsToRemove = self.starred.data.filter((g) => g.n === category);
                            if(Array.isArray(gsToRemove))
                                gsToRemove = gsToRemove[0];
                            else
                                return ;
                            // move steps to others
                            let others = Translator.trans('step_category.others');
                            self.starred.data.map((g) => {
                                if (g.n === others) {
                                    if(gsToRemove.s && $.isArray(gsToRemove.s))
                                    gsToRemove.s.forEach((s) => {
                                        g.s.push(s);
                                    });
                                }
                            });
                            self.starred.data = self.starred.data.filter((g) => g.n !== category);
                            self.starred.onDataChanged();
                            groupLi.remove();
                            am.trigger("constructor starred category removed", [category]);
                            self.starred.renderBox();
                        });
                    });
                });
            },
            refreshSorting: function () {
                let ul = $(".js_starred_list_sorting");
                let newData = [];
                $.each(ul.find('.js_starred_group'), function (index, el) {
                    let group = "" + $(el).data("id");
                    let steps = []
                    $.each($(el).find('.js_starred_item'), function (idx, s) {
                        steps.push("" + $(s).data("id"));
                    });
                    newData.push({
                        "n": group,
                        "s": steps
                    });
                });
                if (JSON.stringify(this.data) !== JSON.stringify(newData)) {
                    this.data = newData;
                    self.starred.onDataChanged();
                    am.trigger("constructor starred order changed");
                }
            },
            remove: function (steps) {
                $.each(steps, function (idx, jel) {
                    let sId = jel.attr("id");
                    self.starred.data.map((g) => {
                        g.s = g.s.filter(s => sId !== s);
                    });
                    $('.js_starred_item[data-id=' + sId + ']').remove();
                });
                self.starred.onDataChanged();
            },
            add: function (steps) {
                let others = Translator.trans('step_category.others');
                $.each(steps, function (idx, jel) {
                    let id = $(jel).attr("id");

                    if (self.starred.data.filter((g) => g.n === others).length < 1) {
                        //add new cat if not exist
                        self.starred.data.push({
                            "n": others,
                            "s": []
                        });

                        let ul = $(".js_starred_list_sorting");
                        let title = $(jel).find(".text").text();
                        ul.append('<li data-id="' + others + '" ' +
                            'class="js_starred_group" data-sorting="0"><div>' +
                            '<a href="#" class="group-fold">' + others + '</a><span class="starred-edit-block"><a href="#" class="starred-edit"><span class="glyphicon glyphicon-edit"></span></a>' +
                            '<a href="#" class="starred-remove"><span class="glyphicon glyphicon-remove"></span></a></span></div>' +
                            '<span class="starred-drag-icon glyphicon glyphicon-resize-vertical"></span>' +
                            '<ul class="starred-group-items"></ul>' +
                            "</li>");
                    }

                    self.starred.data.map((g) => {
                        if (g.n === others) {
                            g.s.push(id);
                        }
                    });
                    $.each($('.js_starred_group>div>a'), function (idx, el) {
                        if ($(el).text().includes(others)) {
                            let ul = $(el).parents('.js_starred_group').find('.starred-group-items');
                            let title = $(jel).find(".text").text();
                            ul.append(self.starred.itemHtml(id, title));
                        }
                    });
                    self.starred.onDataChanged();
                    self.starred._bindSortables();
                })
            },
            change: function (steps) {
                $.each(steps, function (idx, jel) {
                    let id = $(jel).attr("id");
                    let title = $(jel).find(".text").text();
                    title = self.starred._shrinkString(title, 35);
                    $('.js_starred_item[data-id=' + id + ']>div>a').text(title);

                    let newCategory = $(jel).data('category');
                    let oldCategory = self.starred._getItemCategory(id);
                    if (newCategory && newCategory !== oldCategory) {
                        if (self.starred.data.filter((g) => g.n === newCategory).length < 1) {
                         //add new cat if not exist
                            self.starred.data.push({
                                "n": newCategory,
                                "s": []
                            });
                        }

                        self.starred.data.map((g) => {
                            if (g.n === oldCategory) {
                                let idx = g.s.indexOf(id);
                                if (idx > -1) {
                                    g.s.splice(idx, 1);
                                }
                            }
                            if (g.n === newCategory) {
                                if(!g.s)
                                    g.s = [];
                                g.s.push(id);
                            }
                        });

                        self.starred.renderBox();
                    }
                    self.starred.onDataChanged();
                })
            },
            search: function (el) {
                let q = el.val().toLowerCase().trim();
                let parent = el.parents('.js_starred_box, .js_favorites_content');
                let js_starred = parent.find('.js_starred_item');
                let js_starred_group = parent.find('.js_starred_group');
                if (q === "") {
                    js_starred.show();
                    js_starred_group.show();
                    return;
                }
                let steps = self.steps;
                let desk = $('.js_desk');

                if(desk.is(":visible")) { //search within constructor steps if latter is visible
                    steps = desk.find('.step').map(function (i, o) {
                        let s = $(o);
                        let id = s.prop('id');
                        let newText = app.addField.backReplaceFieldsInEditor(s.data('text'));
                        newText = app.addVideo.backReplaceVideosInEditor(newText);
                        return {
                            id: id,
                            title: s.data('title'),
                            text: newText
                        };
                    }).get();
                }

                let filtered = steps.filter(step => {
                    if ((!step.text || (step.text.trim() === "")) && (!step.title || (step.title.trim() === "")))
                        return Translator.trans('default_step_title').toLowerCase().includes(q);
                    return (step.text && step.text.toLowerCase().includes(q)) || (step.title && step.title.toLowerCase().includes(q));
                });
                js_starred.hide();
                js_starred_group.hide();
                filtered.forEach(s => {
                    let stEl = parent.find('.js_starred_item[data-id=' + s.id + ']');
                    let p = stEl.parents('.js_starred_group');
                    p.show();
                    p.find('.folded').removeClass('folded');
                    stEl.show();
                });
            },
            deselect() {
                let fav_box = $('.js_favorites_content');
                fav_box.find('.js_starred_item').removeClass('selected');
            },
            select(steps) {
                if(!self.isCtrlPressed) {
                    this.deselect();
                }
                let fav_box = $('.js_favorites_content');
                $.each(steps, function (idx, jel) {
                    let id = $(jel).attr("id");
                    fav_box.find('.js_starred_item[data-id=' + id + ']').addClass('selected');
                });
            },
            selectOperator(stepId) {
                let fav_box = $('.js_starred_box');
                fav_box.find('.js_starred_item').removeClass('selected');
                fav_box.find('.js_starred_item[data-id=' + stepId + ']').addClass('selected');
            },
            onDataChanged() {

                self.starred.search($('.js_favorites_box .js_starred_search'));
                // drop empty cats
                // this.data = this.data.filter((g) => Array.isArray(g.s) && g.s.length > 0);
                //
                // // hide empty cats
                // $('.js_starred_group').hide();
                // this.data.forEach(g => {
                //     $('.js_starred_group[data-id=\'' + g.n + '\']').show();
                // })
            },
        },
        isHs: function() {
            if (self._isHs === null) {
                let b = $('body');
                self._isHs = b.hasClass('hs');
                b.removeClass('hs');
            }
            return self._isHs;
        },
        moveSelectedSteps: function(parentStep, moveX, moveY) {
            jsp.clearDragSelection();

             $.each(desk.find('.step.sel'), function (index, selStep) {
                 jsp.addToDragSelection(selStep);
             });
        },
        deleteSelectedSteps: function() {
            let selSteps = desk.find('.step.sel');
            if(confirm(Translator.trans('confirm_deleting_steps'))) {
                $.each(selSteps, function (index, selStep) {
                    if($(selStep).attr('id') !== 'start') {
                        var par = $(selStep);
                        jsp.remove(par);
                        desk.data('last_id', null);
                        am.trigger('constructor step removed', [par]);
                    }
                });
                self.constructor.onStepDeselected();
            }
        },

        copySteps: function() {

            self.copyStepsBuffer.remove();
            var selSteps = desk.find('.step.sel');
            if(selSteps.length > 0) {
                $.each(selSteps, function(index,selStep) {
                    self.copyStepsBuffer.add(selStep);
                });
            }
        },
        pasteSteps: function(target) {
            var targetStep;

            if(target !== undefined && target !== null) {
                targetStep = target;
                self.constructor.onStepSelected(targetStep);
            } else {
                targetStep = self.constructor.selStep;
            }

            if(targetStep === undefined || targetStep == null) {
                return;
            }

            var addedStep = function (step, target) {
                var stepItem = step;

                var par = target;
                var pos = par.position();
                var freePos = [
                    pos.left + par.width() + 100 + (stepItem.pos.left - coords.left),
                    pos.top + par.height() + 100 + (stepItem.pos.top - coords.top),
                ];
                //var freePos = self.constructor.getFreePos(pos.left + par.width() + 100, pos.top + par.height() + 100);
                var s = self.constructor.addStep(jsp, {
                    id: self.constructor.generateId(desk),
                    is_goal: stepItem.is_goal,
                    is_user_sort: stepItem.is_user_sort,
                    is_starred: stepItem.is_starred,
                    starred_text: stepItem.starred_text,
                    title: stepItem.title, text: stepItem.text,
                    left: freePos[0] - 40,
                    top: freePos[1] - 29,
                });

                newSources[stepItem.id] = $(s).prop('id');

                am.trigger('constructor step added', [s]);
            };

            var newSources = {};

            var coords = {left: 9999999, top: 9999999};
            $.each(self.copyStepsBuffer.get(), function(index,stepItem) {
                var pos = stepItem.pos;
                coords.left = Math.min(coords.left, pos.left);
                coords.top = Math.min(coords.top, pos.top);
            });


            $.each(self.copyStepsBuffer.get(), function(index,stepItem) {
                addedStep(stepItem, targetStep);
            });

            $.each(self.copyStepsBuffer.get(), function (index, val) {
                var stepItem = val;

                $(stepItem.connections).filter(function (index, oo) {
                    return $(self.copyStepsBuffer.get()).filter(function(index,stepItem2) {
                            return stepItem2.id == oo.targetId;
                        }).length;
                }).each(function (index, oo) {
                    var newConnection = jsp.connect({source: newSources[oo.sourceId], target: newSources[oo.targetId] });

                    jsp.repaintEverything();
                    var map = self.constructor.getCircleMap(70);
                    if (desk.width() < map.rightEdge + 100) desk.width(map.rightEdge + 100);
                    if (desk.height() < map.bottomEdge + 100) desk.height(map.bottomEdge + 100);

                    if (self.constructor.doShowTryPattern) {
                        self.constructor.showTryPattern(self.constructor.showCircleMap(70).ctx, pos.left+par.width()+100, pos.top+par.height()+100);
                    }

                    var answer = oo.answer;
                    if (answer) {
                        jl = newConnection.getOverlay('label');
                        jl.setLabel(answer.label);
                        $(jl.getElement()).data(answer.data);
                        self.constructor.addConditionStatusClasses();
                        self.constructor.addConditionImageClasses();
                    }

                });
            });

            self.copyStepsBuffer.remove();
        },

        pasteStepsWithChildrens: function (target) {
            if(target !== undefined) {
                var targetStep = target;
                self.constructor.onStepSelected(targetStep);
            } else {
                var targetStep = self.constructor.selStep;
            }
            if(targetStep === undefined || targetStep == null) {
                return;
            }

            var newConnections = {};

            var addedStep = function (step, target, answer, allconnections) {
                var stepItem = step;

                var par = target;
                var pos = par.position();
                var freePos = self.constructor.getFreePos(pos.left+par.width()+100, pos.top+par.height()+100);
                var s = self.constructor.addStep(jsp, {
                    id: self.constructor.generateId(desk),
                    is_goal: stepItem.is_goal,
                    is_user_sort: stepItem.is_user_sort,
                    is_starred: stepItem.is_starred,
                    starred_text: stepItem.starred_text,
                    title: stepItem.title, text: stepItem.text,
                    left: freePos[0] - 40,
                    top: freePos[1] - 29,
                });

                var newConnection = jsp.connect({source: par, target: s});

                jsp.repaintEverything();
                //self.constructor.onStepSelected(s);
                var map = self.constructor.getCircleMap(70);
                if (desk.width() < map.rightEdge + 100) desk.width(map.rightEdge + 100);
                if (desk.height() < map.bottomEdge + 100) desk.height(map.bottomEdge + 100);

                if (self.constructor.doShowTryPattern) {
                    self.constructor.showTryPattern(self.constructor.showCircleMap(70).ctx, pos.left+par.width()+100, pos.top+par.height()+100);
                }


                if (answer) {
                    answer = $(answer);
                    var answerText = answer.data('text');

                    jl = newConnection.getOverlay('label');
                    jl.setLabel(self.constructor.cutText(answerText, 50)+self.constructor.getLinkRemoveHtml());
                    $(jl.getElement()).data(answer.data());
                    self.constructor.addConditionStatusClasses();
                    self.constructor.addConditionImageClasses();
                }

                am.trigger('constructor step added', [s]);

                var getTargetConnections = $(allconnections).filter(function (index, oo) {
                    return $(oo.source).prop('id') == stepItem.id;
                });

                $.each(getTargetConnections, function (index, o) {
                    var $clone = $(o.target).clone( true );
                    var answer = o.getOverlay('label').getElement();

                    if (typeof newConnections[o.id] == 'undefined') {
                        newConnections[o.id] = true;

                        var step = $clone.data();
                        step.pos = $clone.position();
                        step.id = $clone.prop('id');
                        addedStep(step, s, answer, allconnections);
                    }
                });
            };

            var allconnections = $.merge([], jsp.getAllConnections());

            $.each(self.copyStepsBuffer.get(), function(index,stepItem) {
                addedStep(stepItem, targetStep, null, allconnections);
            });


            self.copyStepsBuffer.remove();
        },

        view: {
            updateScriptStatistic: function(scriptId) {
                am.analyticsRequest('api/stat',{scriptId: scriptId},function(curResponse) {
                    $('.js_conversion_count').text(am.naturalize(curResponse.conversion));
                    $('.js_passages_count').text(curResponse.runs_count);
                });
            },
            setProgress: function(percent) {
                percent = Math.min(100, am.naturalize(percent));
                $('.progressBar .progressPercent').text(percent);
                $('.progressBar .progressLineFill').width(Math.round($('.progressBar .progressLineBack').width() * percent / 100));
            },
            nlToArray: function(str) {
                if (typeof str === 'number') str = str.toString();
                if (typeof str !== 'string') str = '';
                str = str.trim();
                var arr = str.split('\n');
                if (arr.length === 1) return str;
                return arr;
            },
            convertScript: function(data) {
                if (!data || !data.steps || !Array.isArray(data.steps)) {
                    throw 'Некорректные данные';
                }

                var hash = {};
                var list = [];
                $.each(data.steps, function(i, o){
                    if (!o.id) {
                        throw 'Некорректный шаг в данных';
                    }
                    hash[o.id] = {name: o.id, is_starred: o.is_starred, starred_text: o.starred_text, starred_sorting: o.starred_sorting,
                        text: self.view.nlToArray(o.text), buttons: [], is_goal: o.is_goal, is_user_sort: o.is_user_sort};
                    list.push(hash[o.id]);
                });
                if (data.connections && Array.isArray(data.connections)) {
                    $.each(data.connections, function(i, o){
                        if (!o.source || !o.target || typeof o.condition !== 'string') {
                            throw 'Некорректная связь в данных';
                        }
                        var s = o.source;
                        var t = o.target;
                        if (!hash[s] || !hash[t]) {
                            throw 'Некорректная связь в данных';
                        }
                        hash[s].buttons.push({state: t, text: o.condition, id: o.id, status: o.status});
                    });
                }
                return self.view.setNodeDistances(list);
            },
            setNodeDistances: function(data) {
                if (!Array.isArray(data) || data.length < 1) return data;
                var Node = function(id) {
                    this.id = id;
                    this.distanceFromStart = null;
                    this.distanceToEnd = null;
                    this.parents = [];
                    this.children = [];
                };
                var start = null;
                var net = {};
                $.each(data, function(i, o){
                    net[o.name] = new Node(o.name);
                    if (o.name === 'start') {
                        start = net[o.name];
                    }
                });
                if (!start) {
                    start = data[0];
                }
                $.each(data, function(i, o){
                    if (!Array.isArray(o.buttons)) return;
                    $.each(o.buttons, function(i, b) {
                        net[o.name].children.push(net[b.state]);
                        if ($.inArray(net[o.name], net[b.state].parents) < 0) {
                            net[b.state].parents.push(net[o.name]);
                        }
                    });
                });
                var ends = [];
                $.each(net, function(i, o){
                    if (o.children.length < 1) {
                        ends.push(o);
                    }
                });
                var updateDistance = function(waveFrontNodes, distProp, listProp, dist, waveName) {
                    if (waveFrontNodes.length < 1) return;
                    var nextWaveFrontNodes = [];
                    $.each(waveFrontNodes, function(i, o){
                        if (o['wave'+waveName+'passed']) return;
                        o['wave'+waveName+'passed'] = true;
                        o[distProp] = dist;
                        nextWaveFrontNodes = nextWaveFrontNodes.concat(o[listProp]);
                    });
                    updateDistance(nextWaveFrontNodes, distProp, listProp, dist + 1, waveName);
                };
                updateDistance([start], 'distanceFromStart', 'children', 0, 'start');
                updateDistance(ends, 'distanceToEnd', 'parents', 0, 'ends');
                $.each(net, function(i, o){
                    if (o.distanceFromStart === null) {
                        o.distanceFromStart = 0;
                    }
                    if (o.distanceToEnd === null) {
                        o.distanceToEnd = Infinity;
                    }
                });
                $.each(data, function(i, o){
                    var fromStart = net[o.name].distanceFromStart;
                    var total = fromStart + net[o.name].distanceToEnd;
                    o.progress = total > 0 ? Math.round(fromStart / total * 1000) / 10 : 0;
                });
                return data;
            },

            appendUnexpectedBoxToLogItem: function(id) {

                var box = $('.log').find('.item[data-id=' + id + ']');
                var html = '<div class="unexpected_answer_box">' +
                    '<textarea class="form-control unexpected_answer_input" data-id="' + id + '" placeholder="' +
                    Translator.trans('what_user_say') + '"></textarea>' +
                    '<p class="text-muted"><small>' + Translator.trans('unexpected_help_hint_in_end') + '</small></p></div>';

                box.append(html);
            },

            // render and show step in operators view
            logStep: function (step, status, cid) {
                am.trigger('log step', [step, status, cid]);
                //If step from other script
                let matches = step.name.match(/^(\d+)_(s\d+|start)/);
                if (matches) {
                    let scriptId = matches[1],
                        stepName = matches[2];

                    //self.view.stopScriptAndSaveLog('cross', true);

                    busy = true;
                    $.fancybox.showLoading();

                    $('.log .item').addClass('previous-item');
                    self.crossScript = true;
                    am.promiseCmd({
                        method: 'scripts.load_without_external_scripts',
                        id: scriptId
                    }).done(function (result) {
                        busy = false;
                        $.fancybox.hideLoading();
                        $.each(result.step_web_hooks, function (step) {
                            self.stepWebHooks.push(step)
                        });
                        let fields = result.fields;
                        $.each(fields, function (i, field) {
                            let val = app.addField.getFieldValueByName(field.name);
                            if (val) {
                                field.value = val;
                            }
                        });
                        app.addField.setFields(fields);
                        if (result.view_notes) {
                            self.view_notes = result.view_notes;
                        }
                        self.view.launchScript(result.id, result.ver, result.name, result.data, result.target, stepName);
                    }).fail(function (err) {
                        busy = false;
                        self.view.stopScriptAndSaveLog('cross');
                    });

                    return;
                }
                this.renderStepContent(step, status, cid);

            },
            renderStepContent(step, status, cid){
                cid = cid || '';

                var lel = $('.log');
                var isAdmin = self.role === 'ROLE_SCRIPT_WRITER' || self.role === 'ROLE_ADMIN';

                lel.find('.unexpected_answer').remove();
                var buttonsIsArray = step.buttons && Array.isArray(step.buttons);
                var isGoal = (step.is_goal)?1:0;
                var isUserSort = (step.is_user_sort)?1:0;
                var html = [
                    '<div class="item" ' +
                    'data-cid="' + cid + '" ' +
                    'data-id="'+step.name+'" ' +
                    'data-is_goal="'+isGoal+'" ' +
                    'data-is_user_sort="'+isUserSort+'" ' +
                    'data-script=\'' + JSON.stringify({id: self.view.runningScriptId, ver: self.view.runningScriptVer}) + '\' ' +
                    'data-is_end="'+(buttonsIsArray && step.buttons.length > 0 ? 'n' : 'y')+'">',
                    '<div class="counter">'+(lel.find('.item').length+1)+' ></div>',
                    '<div class="text">'+(Array.isArray(step.text) ? step.text.join(' ') : step.text) + '</div>',
                    ((isAdmin && !self.crossScript) ? '<p class="btn-edit-step"><button data-step="' + step.name + '" ' +
                        'class="btn btn-default btn-xs js_edit_step_from_view">' +
                        '<span class="glyphicon glyphicon-pencil"></span>&nbsp;' +
                        '<span class="text-muted">' + Translator.trans('change_in_designer') + '</span></button></p>' : ''),
                    (buttonsIsArray ? $.map(step.buttons, function(b){
                        // <span class="glyphicon glyphicon-arrow-right"></span>
                        return $('<button/>', {
                            class: 'set_state btn' + (b.status === 'positive' ? ' btn-success' : '') +
                                (b.status === 'negative' ? ' btn-danger' : '') +
                                (b.status !== 'positive' && b.status !== 'negative' ? ' btn-default state-button-default' : ''),
                            html: (b.text ? b.text : '...'),
                        }).attr({
                            'data-id': (b.id ? b.id : ''),
                            'data-target': b.target,
                            'data-state': (b.state ? b.state : 'no_state_defined'),
                        }).get(0).outerHTML;

                    }).join('') : ''),
                    (step.progress && step.progress >= 100 ?
                        '	<button class="talk_is_over btn btn-primary" style="margin: 5px;">' + Translator.trans('conversation_complete') + '</button>' :
                        '   <button class="unexpected_answer btn btn-default" data-id="' + (step.name) + '">' + Translator.trans('answer_missing') + '</button>'),
                    '</div>'
                ].join('\n');
                lel.find('.item').fadeTo(0, 0.5);
                // replace field patterns to fields
                html = app.addField.replaceFields(html, true);
                html = app.addField.replaceStaticFields(html, true);
                html = app.addVideo.replaceVideos(html, true);
                lel.append(html);
                lel.find('.js_script_field_multilist').each(function(index,select) {
                    var placeholder = $(this).attr('placeholder');
                    $(this).select2({
                        width: '196px',
                        placeholder: placeholder
                    });
                });
                let targetHeight = $('.script-target').is(":visible") ? 40 : 0;
                lel.scrollTop(lel.get(0).scrollHeight - lel.find('.item:last-child').get(0).scrollHeight - 40 - targetHeight);

                $('.js_view_box .progressBar .talk_is_over')[step.progress && step.progress >= 100 ? 'hide' : 'show']();
                self.starred.selectOperator(step.name);
            },
            testProgressBar: function() {
                var pr = 0;
                var pi = setInterval(function(){
                    self.view.setProgress(pr++);
                    if (pr > 100) clearInterval(pi);
                }, 100);
            },
            testLogHeight: function() {
                for (var i = 0; i < 50; i++) {
                    $('.log').append('<div>'+i+' '+Math.random()+'</div>');
                }
            },
            openAndLaunchScript: function(id, ver, name, data, target) {
                self.view.lastOpenData = [id, ver, name, data, target];

                var vbel = $('.js_view_box');
                vbel.find('.js_starred_search').val('');
                vbel.find('.log').html('<div class="heading item" style="display: none;">' +
                    '<h2></h2><button class="set_state btn btn-success" data-state="start">Начать</button></div>');
                vbel.find('.progressPercent').text(0);
                vbel.find('.progressLineFill').width(0);

                self.view.launchScript(id, ver, name, data, target);
            },
            lastOpenData: [],
            reopenAndLaunchScript: function() {
                self.view.openAndLaunchScript.apply(self.view, self.view.lastOpenData);
            },
            runningScriptId: null,
            runningScriptVer: null,
            setState: function (script, button, cid, f, nextState) {
                if (script && script.id != self.view.runningScriptId) {
                    busy = true;
                    $.fancybox.showLoading();
                    am.promiseCmd({
                        method: 'scripts.load_without_external_scripts',
                        id: script.id
                    }).done(function (result) {
                        busy = false;
                        $.fancybox.hideLoading();

                        // console.log('SET FIELDS 2', res.fields);
                        app.addField.setFields(result.fields);
                        self.view.launchScript(result.id, result.ver, result.name, result.data, result.target, button.data('state'), cid);
                    }).fail(function (err) {
                        busy = false;
                        self.view.stopScriptAndSaveLog('cross');
                    });
                } else {
                    f.to(nextState, {cid: cid});
                }

                if ($.inArray(nextState, self.stepWebHooks) > -1) {
                    let script_ids = [];
                    let log = $('.log .item').map(function (i, o) {
                        let s = $(o);
                        let script = s.data('script');
                        if (script_ids.indexOf(script.id) < 0) {
                            script_ids.push(script.id);
                        }
                        return {id: s.data('id'), cid: s.data('cid'), script: s.data('script')};
                    }).get();

                    let fields = app.addField.getFieldsValues();
                    am.promiseCmd({
                        method: 'scripts.send_step_webhook',
                        id: script.id,
                        step: nextState,
                        fields: fields,
                        log: log
                    }).done(function (result) {
                    }).fail(function (err) {
                    });
                }
            },
            launchScript: function(id, ver, name, data, target, toState, cid) {
                if (!self.crossScript) {
                    self.fields = app.addField.getFields();
                }
                // if (data.starred) {
                //     self.starred.data = data.starred;
                // }
                toState = toState || null;
                cid = cid || null;

                $('.log .heading h2').text(name);
                $('.log .heading').show();

                if (target) {
                    $('.script-target').show().find('.target-content').text(target);
                }
                else {
                    $('.script-target').hide();
                }

                var f = new app.Fsm();
                f.disableToCheck();
                f.addState('init', {
                    name: 'init', off: function () {
                        $('.log .heading').remove();
                    }
                });
                var steps = null;
                try {
                    steps = self.view.convertScript(data);
                } catch (e) {
                    alert('Что-то пошло не так при запуске скрипта, попробуйте перезагрузить страницу');
                    return;
                }
                self.steps = data.steps;

                $.each(steps, function(i, s){
                    f.addState(s.name, {
                        name: s.name,
                        on: function(data){

                            var cid;
                            if (typeof data != 'undefined') {
                                cid = data.cid;
                            }

                            self.view.logStep(s, this.next, cid);
                            self.view.setProgress(s.progress ? s.progress : 0);
                        }
                    });
                });
                self.view.renderStarredBox(data);
                if (!self.crossScript) {
                    app.addField.clearFieldValues();
                }
                f.init('init');
                self.view.fsm = f;
                let vbel = $('.js_view_box');
                vbel.on('click', '.js_edit_step_from_view', function (e) {
                    e.preventDefault();
                    let stepId = $(this).data('step');
                    let stepEl = $('#' + stepId);
                    self.constructor.onStepSelected(stepEl);
                    $('.js_constructor_box').show();
                    $('.js_view_box').hide();
                    $('.js_scripts_action_view').addClass('open').removeClass('active');
                    $('.js_show_constructor').addClass('active');

                    $('html, body').animate({
                        scrollTop: stepEl.offset().top - 150,
                        scrollLeft: stepEl.offset().left - 20
                    }, 300);
                   am.trigger('tab selected', ['js_constructor_box']);
                });

                vbel.unbind('click.setState').on('click.setState', '.item .set_state, button.set_state', function (e) {
                    e.preventDefault();
                    let button = $(this);
                    let par = button.parents('.item').first();
                    if (!par.is($('.log .item').last())) {
                        par.nextAll().remove();
                    }
                    let nextState = button.data('state');
                    if (!nextState || busy) {
                        return;
                    }
                    button.addClass('visited');
                    let cid = button.data('id');
                    let script = par.data('script');
                    self.view.setState(script, button, cid, f, nextState);
                });
                vbel.on('click.setState', '.js_starred_item>div>a', function (e) {
                    e.preventDefault();
                    let button = $(this);
                    let par = button.parents('.item').first();
                    if (!par.is($('.log .item').last())) {
                        par.nextAll().remove();
                    }
                    let nextState = button.data('id');
                    if (!nextState || busy) {
                        return;
                    }

                    let script = par.data('script');
                    self.view.setState(script, button, "starred", f, nextState);
                });

                vbel.unbind('keyup.jsField change.jsField click.jsField')
                    .on('keyup.jsField change.jsField click.jsField', '.js_script_field', function(){

                        $('.js_view_box .js_field').removeClass('active');
                        $(this).parents('.js_field').addClass('active');

                        var value = $(this).val();
                        var fieldId = $(this).parents('.js_field').data('id');
                        var field = app.addField.getField(fieldId);

                        if (!field) return;
                        app.addField.setFieldValue(fieldId, value);

                        if (field.type === 'checkbox') {
                            app.addField.setFieldValue(fieldId, (($(this).is(':checked')) ? 1 : 0));

                            var checkboxes = $('.js_view_box .js_field[data-id=' + fieldId + ']').not('.active').find('.js_script_field');
                            if ($(this).is(':checked')) {
                                checkboxes.prop('checked', true);
                            }
                            else {
                                checkboxes.prop('checked', false);
                            }
                        }
                        else if(field.type === 'multilist') {
                            $('.js_view_box .js_field[data-id=' + fieldId + ']').not('.active').find('.js_script_field').val(value).trigger('change.select2');
                        }
                        else {
                            let elnactive = $('.js_view_box .js_field[data-id=' + fieldId + ']').not('.active');
                            elnactive.find('.js_script_field').val(value);
                            elnactive.find('.field__value').text(value);
                            // пересчет полей с формулами
                            if (field.type === 'number') {
                                $.each(app.addField.getFields(), function (id, fieldFormulas) {
                                    if (fieldFormulas.type === 'number'
                                        && fieldFormulas.options.numberFormula
                                        && fieldFormulas.options.numberFormula.value
                                        && fieldFormulas.options.numberFormula.value.indexOf('data-id="' + field.id + '"') !== -1) {
                                        let nffValue = app.addField.calcNumberFormula(
                                            fieldFormulas.options.numberFormula.value
                                        );
                                        app.addField.setFieldValue(fieldFormulas.id, nffValue);
                                        let fField = $('.js_view_box .js_field[data-id=' + fieldFormulas.id + ']').not('.active');
                                        fField.find('.js_script_field').val(nffValue);
                                        fField.find('.field__value').text(nffValue);
                                    }
                                });
                            }
                        }

                        self.view.renderNotesBox($('.js_outnotes_box .outnotes_box-search input').val());
                    });

                $('.js_view_box .progressBar .talk_is_over').show();

                self.view.runningScriptId = id;
                self.view.runningScriptVer = ver;

                if (self.isHs() && !toState) {
                    f.to('start');
                }
                else if (toState) {
                    if (cid) {
                        f.to(toState, {cid: cid});
                    } else {
                        f.to(toState);
                    }

                }

                self.view.renderFieldsBox();
                self.view.renderNotesBox();

                $('.js_render_widgets, .js_starred_box, .js_outfields_box, .js_outnotes_box').removeClass('view_box__closed');
                $('.outnotes_box-search input').val('');

                var issetStarred = true;//$('.js_starred_box').find('button').size();
                var issetFields = $('.js_outfields_box').find('div, .js_field').size();
                var issetNotes = $('.js_outnotes_box').find('.outnotes_box-item').size();

                $('.js_render_widgets').addClass('view_box__closed');
                if (issetStarred) {

                    if (issetNotes) {
                        $('.js_outnotes_box').addClass('view_box__closed');
                    }

                    if (issetFields) {
                        $('.js_outfields_box').addClass('view_box__closed');
                    }
                }
                else if (issetFields) {
                    if (issetNotes) {
                        $('.js_outnotes_box').addClass('view_box__closed');
                    }
                }

                if (!issetStarred && !issetFields && !issetNotes) {
                    $('.view_box_sidebar').hide();
                }

                self.view.renderClosedViewBox();

                am.trigger('start script');
                try {
                    self.view.updateScriptStatistic(id);
                } catch (e) {

                }
            },
            renderFieldsBox: function() {
                var box = $('.js_outfields_box');
                box.find('div,hs').remove();

                var fields = app.addField.getFieldArray();
                if (fields.length === 0) {
                    box.hide();
                }
                else {
                    box.show();
                }

                $.each(fields, function(i, field) {

                    if (field.type === 'checkbox') {
                        box.append('<hs class="js_field" data-id="' + field.id + '">' +
                            app.addField.getFieldHtml(field) + '</hs>');
                    }
                    else {
                        box.append('<div class="form-group"><hs class="js_field" data-id="' + field.id + '">' +
                            app.addField.getFieldHtml(field) + '</hs>' + '</div>');
                    }

                });
                box.find('.js_script_field_multilist').each(function(index, select) {
                    var placeholder = $(this).attr('placeholder');
                    $(this).select2({
                        width: '196px',
                        placeholder: placeholder
                    });
                });
            },
            renderStarredBox: function(data) {
                let box = $('.js_starred_box');
                box.parent('.view_box_sidebar').show();
                box.hide();
                let ul = $(".js_starred_list_operator");
                ul.find('.js_starred_group').remove();
                ul.html("");
                box.find('.js_starred_search').val('');
                let stepsStarred = data.starred;
                if (!stepsStarred.length) {
                    return;
                }
                ul.off('click', '.group-fold').on('click', '.group-fold', function (e) {
                    e.preventDefault();
                    $(this).closest('.js_starred_group').find('.starred-group-items').toggleClass('folded');
                    $(this).toggleClass('folded');
                });
                stepsStarred.forEach(function (group, index) {
                    if (group.s && Array.isArray(group.s)) {
                        let ss = group.s.filter(s => {
                            let starred = false;
                            data.steps.forEach(function (step) {
                                if (step.name === s || step.id === s) {
                                    starred = step.is_starred;
                                }
                            });
                            return starred;
                        });

                        let itemsUl = '<ul class="starred-group-items">';

                        ss.forEach(function (item) {
                            let title = self.starred._getStepTitle(item, data.steps)
                            itemsUl += self.starred.itemHtml(item, title, false);
                        });
                        itemsUl += '</ul>';
                        if (ss.length > 0)
                            ul.append('<li data-id="' + group.n + '" class="js_starred_group" data-sorting="' + index + '"><div><a class="group-fold" href="#">' + group.n + "</a></div>" + itemsUl + "</li>");
                    }
                });

                box.show();
                $('.js_starred_box > .input-group > .js_starred_search').off().on('change keyup', function () {
                    self.starred.search($(this));
                });
            },
            renderNotesBox: function(search) {

                search = search || null;

                var recommendNotes = app.notes.getRecommendNotes();

                var box = $('.js_outnotes_box');
                box.show();
                box.find('.outnotes_box-item').remove();
                box.find('.outnotes_box-ul').remove();
                if (typeof self.view_notes != 'object' || self.view_notes.length === 0) {
                    box.hide();
                    return;
                }


                var array = [];
                $.each(self.view_notes, function (i, item) {
                    item.style = null;
                    if ($.inArray(item.id, recommendNotes) != -1) {
                        item.priority = 999999 + item.priority;
                        item.style = 'font-weight: bold';
                    }
                    array.push(item);
                });
                var view_notes_sorted = array.sort(function (a, b) {
                    return b.priority - a.priority;
                });
                if (search) {
                    view_notes_sorted = $(view_notes_sorted).filter(function (i, o) {
                        if (o.title.toLowerCase().indexOf(search.toLowerCase()) == -1 &&
                            o.content.toLowerCase().indexOf(search.toLowerCase()) == -1) {
                            return;
                        }
                        return true;
                    });
                }

                var categories = [];
                var categories_other = [];
                $.each(view_notes_sorted, function(j, o) {
                    var ids = categories.map(function (value){return value.id});
                    if (o.category_id && $.inArray(o.category_id, ids) < 0) {
                        categories.push({id: o.category_id, text: o.category, childs: []});
                    }
                    ids = categories.map(function (value){return value.id});
                    var cat = $.inArray(o.category_id, ids);
                    if (cat>-1) {
                        categories[cat].childs.push(o);
                    } else {
                        categories_other.push(o);
                    }
                });

                $(categories_other).each(function (k, v) {
                    var div = $('<div/>', {class: "outnotes_box-item", text: v.title, style: v.style}).data('id', v.id);
                    box.append(div);
                });

                var ul = $('<ul/>', {class: 'outnotes_box-ul'});
                $(categories).each(function (k, v) {
                    var li = $('<li/>').on('click',  '.category_show, .glyphicon', function () {
                        var libox = $(this).closest('li');
                        libox.find('span.glyphicon').toggleClass('glyphicon-chevron-down');
                        libox.find('li').toggle();
                    });
                    var ul2 = li
                        .append('<span class="glyphicon glyphicon-chevron-right" aria-hidden="true"></span>')
                        .append($('<span>', {text: v.text, class:'category_show'}))
                        .append($('<ul/>')).find('ul');
                    $(v.childs).each(function (k2, v2) {
                        var div = $('<div/>', {style: 'margin-left:10px;' + v2.style, class: "outnotes_box-item", text: v2.title}).data('id', v2.id);
                        ul2.append($('<li/>').append(div).hide());
                    });
                    ul.append(li);
                });
                box.append(ul);

                $('.outnotes_box-recommend').hide();
                $('.outnotes_box-other').addClass('hidden');
            },
            stopScriptAndSaveLog: function(endButton, onlySave, sync) {

                am.trigger('stop script');

                onlySave = onlySave || false;

                sync = sync || false;

                if (busy) return;
                if (!self.view.runningScriptId || !self.view.runningScriptVer) {
                    alert('Скрипт не запущен');
                    return;
                }
                busy = true;
                $.fancybox.showLoading();
                var outcome = 'unknown';
                if (endButton === 'cross') {
                    outcome = 'ok';
                }
                else if (endButton === 'leave') {
                    outcome = 'forced_interruption';
                }
                else if (endButton.hasClass('talk_is_over')) {
                    var ls = $('.log .item').last();
                    if (ls.length > 0) {
                        if (ls.data('is_end') === 'y') {
                            outcome = 'ok';
                        } else {
                            outcome = 'forced_interruption';
                        }
                    } else {
                        outcome = 'forced_interruption';
                    }
                } else if (endButton.hasClass('unexpected_answer')) {
                    outcome = 'unexpected_answer';
                }

                var script_ids = [];
                var log = $('.log .item').map(function(i, o){
                    var s = $(o);
                    var isgoal = s.data('is_goal');
                    var isusersort = s.data('is_user_sort');
                    var script = s.data('script');
                    if (script_ids.indexOf(script.id) < 0 ) {
                        script_ids.push(script.id);
                    }
                    //if (s.is('.previous-item')) return;
                    return {id: s.data('id'), cid: s.data('cid'), script: s.data('script'), isgoal: isgoal, isusersort: isusersort};
                }).get();

                var fields = app.addField.getFieldsValues();

                var unexpected = $('.log').find('.unexpected_answer_input').map(function(i, o) {

                    var e = $(o);
                    return {
                        id: e.data('id'),
                        value: strip_html(e.val()),
                        token: $.md5(e.data('id') + 'u' + (Math.floor(Math.random() * (10000 - 1000 + 1)) + 1000) + (new Date()).getTime())
                    }
                }).get();
                if (unexpected.length > 0) {
                    outcome = 'unexpected_answer';
                }

                if (!onlySave) {
                    self.crossScript = false;
                }

                var sendSync = function(data, onlySaveFunc) {
                    data.csrf_token = am.getCsrfToken();
                    $.ajax({
                        type: 'POST',
                        url: '/ajax',
                        async: false,
                        data: data
                    });
                }

                var sendAsync = function(data, onlySaveFunc) {
                    am.promiseCmd(data).always(function(){
                        busy = false;
                        $.fancybox.hideLoading();

                        if (!onlySaveFunc) {
                            self.view.runningScriptId = null;
                            self.view.runningScriptVer = null;
                        }
                    }).fail(function(err){
                        console.log(err);
                    }).done(function(res){

                        // old logic
                        if (res.issues) {
                            self.issues = res.issues;
                            self.steps = res.data.steps;
                            self.scripts.initIssuesCount(self.issues);
                            self.scripts.initIssuesByNodes();


                            $.each(self.issues, function(i, o) {

                                var issuesCount = 0;
                                if (typeof self.issuesCountByNodes[o.node] != 'undefined') {
                                    issuesCount = self.issuesCountByNodes[o.node];
                                }

                                var step = $('#' + o.node);
                                step.find('.step_unresolved_issues').text(issuesCount);

                                if (issuesCount) {
                                    step.find('.step_unresolved_issues').show();
                                }
                            });
                        }

                        if (!onlySaveFunc) {
                            if(res.fields !== undefined) {
                                app.addField.setFields(self.fields);
                            }
                            self.view.reopenAndLaunchScript();
                        }
                    });
                }

                var send = sync ? sendSync : sendAsync;

                var script_save_log_func = function (scr_id, scr_ver, logs, duration, onlySaveFunc) {
                    var token = $.md5(scr_id + 'p' + (Math.floor(Math.random() * (10000 - 1000 + 1)) + 1000) + (new Date()).getTime());
                    var data = {
                        method: 'script.save_log',
                        id: scr_id,
                        token: token,
                        ver: scr_ver,
                        outcome: outcome,
                        log: logs,
                        fields: fields,
                        unexpected: unexpected,
                        duration: duration,
                        widgets: (app.integrationWidgets? app.integrationWidgets.getStopScriptData(): [])
                    };
                    send(data, onlySaveFunc);
                    return token;
                };

                var scripts_tokens = [];
                if (script_ids.length) {
                    for(var i=0; i<script_ids.length; i++) {
                        var script_id = script_ids[i];
                        var script_ver = null;
                        var logbyscr = $.map(log, function(o, i){
                            if (script_id != o.script.id) {
                                return;
                            }
                            script_ver = o.script.ver;
                            return o;
                        });

                        var onlySaveScr = onlySave;
                        var duratinonScr = app.passTimer.getTime();
                        if (i==0 && script_ids.length>1) {
                            onlySaveScr = true;
                        }

                        if (i>0) {
                            duratinonScr = 0;
                        }

                        var scr_token = script_save_log_func(script_id, script_ver, logbyscr, duratinonScr, onlySaveScr);
                        scripts_tokens.push({id: scripts_tokens, token: scr_token});
                    }
                }

                if (unexpected.length > 0) {
                    var pass_log_token = scripts_tokens[0].token;

                    // new logic
                    var operator_first_name =  app.addField.staticFields['profile_firstname'];
                    var operator_last_name =  app.addField.staticFields['profile_lastname'];
                    var operator_email =  app.addField.staticFields['profile_email'];

                    var operator_full_name =
                        operator_first_name || operator_last_name
                            ? operator_first_name + (operator_last_name ? ' ' + operator_last_name : '')
                            : operator_email;

                    var cur_date = new Date();
                    $.each(unexpected, function(i, o) {
                        self.issues.push({
                            node: o.id,
                            content: o.value,
                            datetime: am.dateFormat(cur_date.getDate()) + '.' + am.dateFormat(cur_date.getMonth() + 1) + '.' + am.dateFormat(cur_date.getFullYear(), true) + ' ' + am.dateFormat(cur_date.getHours()) + ':' + am.dateFormat(cur_date.getMinutes()),
                            username: operator_full_name,
                            status: 'unresolved',
                            token: o.token,
                            pass_log_token: pass_log_token
                        });
                    });
                    self.scripts.initIssuesCount(self.issues);
                    self.scripts.initIssuesByNodes();

                    $.each(self.issues, function(i, o) {

                        var issuesCount = 0;
                        if (typeof self.issuesCountByNodes[o.node] != 'undefined') {
                            issuesCount = self.issuesCountByNodes[o.node];
                        }

                        var step = $('#' + o.node);
                        step.find('.step_unresolved_issues').text(issuesCount);

                        if (issuesCount) {
                            step.find('.step_unresolved_issues').show();
                        }
                    });
                }
            },

            renderClosedViewBox: function() {

                var index = $('.view_box__closed').size() - 1;
                var rate = 40;

                $('.view_box_sidebar').css({'bottom': ((index + 1) * rate) + 70 + 'px'});

                $('.view_box__closed').each(function(i, o){
                    $(o).css({bottom: (rate * index) + 70 + 'px'});
                    index--;
                });
            },

            hasChanges: function() {
               return this.fsm && this.fsm.getState() !== 'start';
            },
            fsm: null,
            init: function() {

                $('.js_view_box').on('click', '.talk_is_over', function(e){

                    $('.progressBar').show();
                    e.preventDefault();

                    var unexpectedInputs = $('.unexpected_answer_input');
                    var filled = true;

                    $.each(unexpectedInputs, function(i, o) {

                        if (!$(o).val()) {
                            filled = false;
                        }
                    });

                    if (filled) {
                        self.view.stopScriptAndSaveLog($(this));
                    }
                    else {

                        $('.log .item').hide();
                        $('.view_box_sidebar').hide();
                        $('.progressBar').hide();
                        $('.script-target').hide();
                        $('.unexpected_answer_box .text-muted small').hide();

                        if (!$('.log').find('.js_unexpected_end').size()) {
                            $('.log').append('<button class="btn btn-primary talk_is_over js_unexpected_end">' +
                                Translator.trans('save') + '</button>');
                        }

                        if (!$('.log').find('.js_unexpected_hint').size()) {
                            $('.log').prepend('<div class="js_unexpected_hint"><h3>' +
                                Translator.trans('unexpected_help_hint') + '</h3></div>');
                        }

                        $.each(unexpectedInputs, function(i, o) {

                            var e = $(o);
                            var item = e.parents('.item');

                            if (e.val() === '' || !e.val()) {
                                item.show();
                                item.css({opacity: 1});
                                item.find('.js_edit_step_from_view').hide();
                                item.find('.set_state').hide();
                            }
                        });

                        $('.log').scrollTop(0);
                    }

                });
                $('.log').on('click', '.item .unexpected_answer', function(e){
                    e.preventDefault();
                    self.view.appendUnexpectedBoxToLogItem($(this).data('id'));
                    $(this).hide();
                });
                $('.log').on('click', '.item .field__value', function(){

                    var input = $(this).parents('.js_field').find('.js_script_field');
                    var me = $(this);
                    input.show();
                    input.focus();
                    me.hide();
                    input.on('blur', function(){
                        me.text(input.val());
                        me.show();
                        input.hide();
                    });
                });

                $(document).on('dblclick', '.step_other_script', function() {
                    var id = $(this).attr('id');
                    if (!id) return false;

                    var matches = id.match(/^(\d+)_(s\d+|start)/);
                    if (matches) {

                        var scriptId = matches[1];
                        if (scriptId) {
                            $('.js_show_script[data-id="' + scriptId + '"]').click();
                        }
                    }
                });

                $(document).on('click', '.no-click', function(e){
                    e.preventDefault();
                    e.stopPropagation();
                });
                $(document).on('input', '.detail-search', function(e){
                    var search = $(this).val().toLowerCase().trim();
                    console.log(search)
                    var ul = $(this).closest('ul');
                    if(search.length < 2){
                        ul.find('li').show();
                        return;
                    }
                    ul.find('li:not(".no-search")').each(function(index, li){
                        if($(this).text().toLowerCase().trim().indexOf(search) === -1){
                            $(this).hide();
                        }else{
                            $(this).show()
                        }
                    });
                })

                $('.view_box_sidebar')
                    .on('click', '.js_render_widgets h4, .js_starred_box h4, .js_outfields_box h4, .js_outnotes_box h4',
                        function () {

                            let box = $(this).parent('div');
                            let issetStarred = true;//$('.js_starred_box').find('button').size();
                            let issetFields = $('.js_outfields_box').find('div, .js_field').size();
                            let issetNotes = $('.js_outnotes_box').find('.outnotes_box-item').size();

                            if (box.is('.view_box__closed')) {
                                $('.js_render_widgets').addClass('view_box__closed');

                                if (issetNotes) {
                                    $('.js_outnotes_box').addClass('view_box__closed');
                                }

                                if (issetStarred) {
                                    $('.js_starred_box').addClass('view_box__closed');
                                }

                                if (issetFields) {
                                    $('.js_outfields_box').addClass('view_box__closed');
                                }

                                box.removeClass('view_box__closed');
                            }

                            self.view.renderClosedViewBox();
                        });
            }
        },
        /*************************************************************************/
        constructor: {
            starredSorting: {},
            getJSPContainer: function(){
                return $(jsp.getContainer())
            },
            init: function() {
                (function( func ) {
                    $.fn.addClass = function() {
                        func.apply( this, arguments );
                        this.trigger('classChanged');
                        return this;
                    }
                })($.fn.addClass);

                (function( func ) {
                    $.fn.removeClass = function() {
                        func.apply( this, arguments );
                        this.trigger('classChanged');
                        return this;
                    }
                })($.fn.removeClass);
                $('.js_favorites_box').on('classChanged', function () {
                    if ($(this).hasClass('open')) {
                        if (self.currentScriptType === 'script') {
                          $('.js_constructor_box').addClass('fav-offset');
                        }
                    } else {
                        $('.js_constructor_box').removeClass('fav-offset');
                    }
                });
                var boxel = $('.js_editor');
                if (!boxel.size()) return;

                busy = false;
                self.busy = busy;

                edit = $('.js_edit');
                if (edit.length !== 1) return;
                self.edit = edit;

                desk = $('.js_desk');
                if (desk.length !== 1) return;
                self.desk = desk;

                jsp = jsPlumb.getInstance({
                    Endpoint: ['Dot', {radius: 2}],
                    HoverPaintStyle: {strokeStyle: '#2b99d2', lineWidth: 2},
                    ConnectionOverlays: [
                        ['Arrow', {location: 1, id: 'arrow', length: 10, foldback: 0.5, width: 10}],
                        ['Label', {label: '-', location: 0.5, id: 'label', cssClass: 'condition', events:{
                            click: function(o, e){
                                self.constructor.onStepSelected($(o.component.source), true);
                                self.constructor.highlightCondition($(o.getElement()).prop('id'));

                            }
                        }}]
                    ],
                    DragOptions : {
                        containment:false
                    },
                    Container: desk
                });
                // if (!jsp.isDragFilterSupported()) return;
                self.constructor.jsp = jsp;

                // jsp.bind('click', function(c) {
                //     jsp.detach(c);
                //     if (!self.constructor.selStep) return;
                //     var s = self.constructor.selStep;
                //     if (c.sourceId !== s.prop('id')) return;
                //     self.constructor.showStepLinks(s);
                // });

                jsp.bind('connectionDetached', function(info) {
                    am.trigger('constructor condition removed', [info.connection]);
                });

                jsp.bind('connection', function(info) {
                    am.trigger('constructor condition added', [info.connection]);
                    var jl = info.connection.getOverlay('label');
                    var l = $(jl.getElement());
                    l.data('jl', jl).data('placeholder', self.constructor.addStepOpts.defaultCondition);
                    l.data('jl', jl).data('text', self.constructor.addStepOpts.defaultCondition);
                    jl.setLabel(self.constructor.addStepOpts.defaultCondition+self.constructor.getLinkRemoveHtml());
                    if (!self.constructor.selStep) return;
                    var s = self.constructor.selStep;
                   // if (info.sourceId !== s.prop('id')) return;
                    self.constructor.showStepLinks(s);
                });

                var step = 0.1;
                $('.js_zoom_plus').click(function(e){

                    e.preventDefault();
                    var c = $('.js_desk');
                    var zoom = 1;

                    var matrix = c.css('transform').match(/(-?[0-9\.]+)/g);
                    if (matrix) {
                        zoom = matrix[0];
                    }

                    c.css('transform', 'scale(' + (parseFloat(zoom) + step) + ')');
                    c.css('transform-origin', '0 0');

                    jsp.setZoom(parseFloat(zoom) + step);

                    if ($('.call_script_tour').is('.active')) {
                        $.app.scriptTour.highlightFirstUndoneGoal();
                    }
                });

                $('.js_zoom_minus').click(function(e) {
                    e.preventDefault();
                    var c = $('.js_desk');
                    var zoom = 1;

                    var matrix = c.css('transform').match(/(-?[0-9\.]+)/g);
                    if (matrix) {
                        zoom = matrix[0];
                    }

                    c.css('transform', 'scale(' + (parseFloat(zoom) - step) + ')');
                    c.css('transform-origin', '0 0');

                    jsp.setZoom(parseFloat(zoom) - step);

                    if ($('.call_script_tour').is('.active')) {
                        $.app.scriptTour.highlightFirstUndoneGoal();
                    }
                });

                $('.js_zoom_reset').click(function(e){
                    e.preventDefault();
                    var c = $('.js_desk');
                    c.css('zoom', 1);
                    c.css('transform', 'scale(1)');
                    c.css('transform-origin', '0 0');
                    jsp.setZoom(1);

                    if ($('.call_script_tour').is('.active')) {
                        $.app.scriptTour.highlightFirstUndoneGoal();
                    }
                });
                $('.auto-sidebar .title-auto').on('click', function(){

                    var sidebar = $(this).parents('.auto-sidebar');

                    sidebar.addClass('auto-sidebar-open');
                    $(this).parents('.js_edit').find('.step-settings').hide();

                    sidebar.find('.title-issues').hide();
                    sidebar.find('.title-fast').hide();
                    sidebar.find('.content-issues').hide();
                    sidebar.find('.title-separator').hide();
                    sidebar.find('.content-auto').show();
                    am.trigger('auto-sidebar tab_changed', ['content-auto']);
                    sidebar.find('.content-fast').hide();
                });
                $('.auto-sidebar .title-fast').on('click', function(){

                    var sidebar = $(this).parents('.auto-sidebar');

                    sidebar.addClass('auto-sidebar-open');
                    $(this).parents('.js_edit').find('.step-settings').hide();

                    sidebar.find('.title-issues').hide();
                    sidebar.find('.title-auto').hide();
                    sidebar.find('.content-issues').hide();
                    sidebar.find('.title-separator').hide();
                    sidebar.find('.content-auto').hide();
                    sidebar.find('.content-fast').show();
                    am.trigger('auto-sidebar tab_changed', ['content-fast']);
                    self.constructor.initSortFastStep();
                });
                $(document).on('click', '.windowOpen', function(e){
                    e.preventDefault();
                    window.open($(this).attr('href'), "", "width=600,height=600");
                })
                $('.auto-sidebar .js_add_answer_cancel').click(function(){

                    var sidebar = $(this).parents('.auto-sidebar');
                    sidebar.find('.content-issues').show();
                    sidebar.find('.content-resolve-issue').hide();
                });

                $('.js_design_box .title-design').on('click', (e) => {
                  e.preventDefault();
                  var parentEl = e.target.parentElement.parentElement
                  parentEl.classList.add('open')
                })

                $('.js_design_box .close').on('click', (e) => {
                  e.preventDefault();
                  var parentEl = e.target.parentElement.parentElement.parentElement
                  parentEl.classList.remove('open')
                })

                $('.auto-sidebar .title-issues').on('click', function(){

                    var sidebar = $(this).parents('.auto-sidebar');
                    var box = sidebar.find('.content-issues');

                    sidebar.addClass('auto-sidebar-open');
                    $(this).parents('.js_edit').find('.step-settings').hide();

                    sidebar.find('.title-auto').hide();
                    sidebar.find('.title-fast').hide();
                    sidebar.find('.content-auto').hide();
                    sidebar.find('.content-fast').hide();
                    sidebar.find('.title-separator').hide();
                    sidebar.find('.content-resolve-issue').hide();
                    box.show();
                    am.trigger('auto-sidebar tab_changed', ['content-issues']);

                    var step = self.constructor.selStep;
                    var id = step.attr('id');

                    box.find('.issue-box').remove();

                    $.each(self.issues, function(i, o) {

                        if (o.node == id) {

                            var html = '<div class="issue-box">' +
                                '<div class="issue-box__content">' + o.content + '</div>' +
                                '<div class="issue-box__user">' + o.username + '</div>' +
                                '<div class="issue-box__date">' + o.datetime + '</div>' +
                                '<div class="clearfix"></div>' +
                                '<div class="issue-box__btns">' +
                                '<button data-node="' + o.node + '" data-id="' + o.id + '"' + (o.token ? ' data-token="' + o.token + '"' : '') +' type="button" class="btn btn-default btn-sm js_issue_resolve">' + Translator.trans('resolve_issue') + '</button>&nbsp;' +
                                '<button data-node="' + o.node + '" data-id="' + o.id + '"' + (o.token ? ' data-token="' + o.token + '"' : '') +' type="button" class="btn btn-default btn-sm js_issue_ignore">' + Translator.trans('ignore_issue') + '</button>&nbsp;' +
                                '<button class="btn btn-default btn-sm js_pass_view pull-right" data-id="'+o.pass_id+'" data-token="'+o.pass_log_token+'"><span class="glyphicon glyphicon-info-sign"/></button>'+
                                '</div>' +
                                '</div>';

                            box.append(html);
                        }
                    });
                    self.constructor.initSortFastStep();
                    $('.js_faststep_list_sorting').disableSelection();
                });

                $(document).on('click', '.js_issue_ignore', function() {

                    var me = $(this);
                    var id = $(this).data('id');
                    var token = $(this).data('token');
                    $.fancybox.showLoading();

                    var data = {
                        method: 'script.ignore_issue',
                        id: id
                    };
                    if (token)
                        data.token = token;

                    am.promiseCmd(data).always(function(){
                        $.fancybox.hideLoading();
                    }).done(function(){

                        me.parents('.issue-box').remove();

                        $.each(self.issues, function(i, o) {

                            if (o && o.id == id) {
                                self.issues.splice(i, 1);
                            }
                        });

                        self.scripts.initIssuesCount(self.issues);
                        self.scripts.initIssuesByNodes();

                        var issuesCount = self.constructor.selStep.find('.step_unresolved_issues');
                        var newCount = parseInt(issuesCount.text()) - 1;
                        issuesCount.text(newCount);

                        if (!newCount) issuesCount.hide();

                    }).fail(function(err){
                        console.log(err);
                    });

                });

                $('.js_resolve_issue_form .js_add_answer_done').click(function() {

                    var id = $(this).data('id');
                    var token = $(this).data('token');
                    var form = $('.auto-sidebar .js_resolve_issue_form');
                    var answerText = strip_html(form.find('textarea').val());
                    var targetId = form.find('.js_answer_target_hidden').val();
                    var scriptTargetId = form.find('.js_answer_script_target_hidden').val();
                    var targetScriptId = form.find('.js_answer_script_target_hidden').data('script-id');
                    var newNodeText = strip_html(form.find('.js_target_add_answer').val());
                    var chooseScriptIsOpen = form.find('.js_show_link_script').is('.active');
                    var status = form.find('.js_answer_status.active').data('status');

                    var sourceStep = self.constructor.selStep;
                    var newConnection, jl, pos, freePos, s;

                    var resolveIssue = function() {
                        $.fancybox.showLoading();

                        var data = {
                            method: 'script.resolve_issue',
                            id: id
                        };

                        if (token)
                            data.token = token;

                        am.promiseCmd(data).always(function(){
                            $.fancybox.hideLoading();
                        }).done(function(){
                            if (!token)
                                $('.js_issue_resolve[data-id=' + id + ']').parents('.issue-box').remove();
                            else
                                $('.js_issue_resolve[data-token=' + token + ']').parents('.issue-box').remove();

                            $.each(self.issues, function(i, o) {

                                if (o && (o.id == id || (token && o.token == token))) {
                                    self.issues.splice(i, 1);
                                }
                            });

                            self.scripts.initIssuesCount(self.issues);
                            self.scripts.initIssuesByNodes();

                            var issuesCount = self.constructor.selStep.find('.step_unresolved_issues');
                            var newCount = parseInt(issuesCount.text()) - 1;
                            issuesCount.text(newCount);

                            if (!newCount) issuesCount.hide();

                        }).fail(function(err){
                            console.log(err);
                        });
                    };

                    if (answerText && !scriptTargetId && !chooseScriptIsOpen && (targetId || newNodeText)) {

                        if (!targetId && newNodeText) {
                            pos = sourceStep.position();
                            freePos = self.constructor.getFreePos(pos.left + sourceStep.width() + 100, pos.top + sourceStep.height() + 100);
                            s = self.constructor.addStep(jsp, {
                                id: self.constructor.generateId(desk), is_goal: false, is_user_sort: false,
                                is_starred: true, starred_text: '', starred_sorting: 0, title: newNodeText, text: '', left: freePos[0] - 40, top: freePos[1] - 29
                            });
                            newConnection = jsp.connect({source: sourceStep, target: s});
                            jsp.repaintEverything();
                            jl = newConnection.getOverlay('label');
                            jl.setLabel(self.constructor.cutText(answerText, 50) + self.constructor.getLinkRemoveHtml());
                            $(jl.getElement()).data('text', answerText).data('status', status);
                            self.constructor.showStepLinks(sourceStep);
                            self.constructor.addConditionStatusClasses();
                            self.constructor.addConditionImageClasses();
                            am.trigger('constructor step added', [s]);
                        } else {
                            newConnection = jsp.connect({source: sourceStep, target: $('#' + targetId)});
                            jl = newConnection.getOverlay('label');
                            jl.setLabel(self.constructor.cutText(answerText, 50) + self.constructor.getLinkRemoveHtml());
                            $(jl.getElement()).data('text', answerText).data('status', status);
                            self.constructor.showStepLinks(sourceStep);
                            self.constructor.addConditionStatusClasses();
                            self.constructor.addConditionImageClasses();
                        }

                        form.find('textarea').val('');

                        form.find('.script_target_box').addClass('hidden');
                        form.find('.js_show_link_script').removeClass('active');
                        form.find('.js_target_add_answer').val('');
                        form.find('.new_target_hint').hide();
                        $('.auto-sidebar .content-resolve-issue').hide();
                        $('.auto-sidebar .content-issues').show();

                        resolveIssue();
                    }

                    //Create link to other script
                    else if (answerText && scriptTargetId) {

                        if (!$('#' + targetScriptId + '_' + scriptTargetId).size()) {
                            pos = sourceStep.position();
                            freePos = self.constructor.getFreePos(pos.left+sourceStep.width()+100, pos.top+sourceStep.height()+100);

                            var node;
                            if (scriptTargetId && targetScriptId) {
                                node = self.script_list[targetScriptId].nodes[scriptTargetId];
                            }

                            s = self.constructor.addStep(jsp, {
                                id: targetScriptId + '_' + scriptTargetId,
                                is_goal: false,
                                is_user_sort: false,
                                is_starred: true,
                                starred_text: '',
                                title: node.title,
                                text: node.text,
                                left: freePos[0] - 40,
                                top: freePos[1] - 29,
                                otherScript: true
                            });
                        }
                        else {
                            s = $('#' + targetScriptId + '_' + scriptTargetId);
                        }

                        newConnection = jsp.connect({source: sourceStep, target: s});
                        jsp.repaintEverything();

                        jl = newConnection.getOverlay('label');
                        jl.setLabel(self.constructor.cutText(answerText, 50)+self.constructor.getLinkRemoveHtml());
                        $(jl.getElement()).data('text', answerText).data('status', status);
                        self.constructor.showStepLinks(sourceStep);
                        self.constructor.addConditionStatusClasses();
                        self.constructor.addConditionImageClasses();

                        form.find('textarea').val('');
                        form.find('.script_target_box').addClass('hidden');

                        form.find('.script_target_box').addClass('hidden');
                        form.find('.js_show_link_script').removeClass('active');
                        form.find('.js_target_add_answer').val('');
                        form.find('.new_target_hint').hide();
                        $('.auto-sidebar .content-resolve-issue').hide();
                        $('.auto-sidebar .content-issues').show();

                        resolveIssue();
                    }
                });

                $(document).on('click', '.js_issue_resolve', function() {

                    var id = $(this).data('id');
                    var token = $(this).data('token');
                    var node;

                    $.each(self.issues, function(i, o) {
                        if (o.id == id || (token && o.token == token)) {
                            node = o;
                        }
                    });

                    if (!node) return;

                    $('.auto-sidebar .content-issues').hide();

                    var resolveIssueBox = $('.auto-sidebar .content-resolve-issue');
                    // reset form parameters
                    resolveIssueBox.find('.js_add_answer_done').removeData('token');
                    resolveIssueBox.find('.js_answer_status').removeClass('active');

                    resolveIssueBox.show();
                    resolveIssueBox.find('.js_answer_label').val(node.content);
                    resolveIssueBox.find('.js_add_answer_done').data('id', id);
                    if (token)
                        resolveIssueBox.find('.js_add_answer_done').data('token', token);

                    var form = $('.auto-sidebar .js_resolve_issue_form');
                    form.find('.js_target_add_answer').val('');
                    form.find('.new_target_hint').hide();

                    var searchInput = $('.js_target_add_answer');
                    var steps = [];
                    var d = $(jsp.getContainer());
                    $.each(d.find('.step'), function(i, o) {
                        var s = $(o);
                        var text = (s.data('title')) ? s.data('title') : self.constructor.cutText(s.data('text'), 100);
                        steps.push({value: s.prop('id'), label: text.replace(/<\/?[^>]+>/gi, '')});
                    });

                    try {
                        searchInput.autocomplete('destroy');
                    }
                    catch (e) {}

                    searchInput.autocomplete({
                        source: steps,
                        select: function(event, ui) {

                            var input = $(this);
                            var hidden = input.parents('.target_box').find('.js_answer_target_hidden');

                            input.val(ui.item.label);
                            hidden.val(ui.item.value);
                            return false;
                        },
                        focus: function(event, ui) {
                            $(this).val(ui.item.label);
                            return false;
                        },
                        change: function() {
                            var input = $(this);
                            var hidden = input.parents('.target_box').find('.js_answer_target_hidden');
                            var box = input.parents('.target_box');
                            var hint = box.find('.new_target_hint');

                            if (!hidden.val() && $(this).val()) {
                                hint.find('b').text($(this).val());
                                hint.css('display', 'inline-block');
                            }
                            else {
                                hint.hide();
                            }
                        },
                        response: function(event, ui) {

                            var input = $(this);
                            var box = input.parents('.target_box');
                            var hidden = box.find('.js_answer_target_hidden');
                            hidden.val('');
                            var hint = box.find('.new_target_hint');

                            if (!ui.content.length) {
                                hint.find('b').text($(this).val());
                                hint.css('display', 'inline-block');
                            }
                            else {
                                hint.hide();
                            }
                        }
                    });
                });

                $('.auto-sidebar .close').on('click', function(){

                    var sidebar = $(this).parents('.auto-sidebar');

                    sidebar.removeClass('auto-sidebar-open');
                    $(this).parents('.js_edit').find('.step-settings').show();

                    sidebar.find('.title-issues').show();
                    sidebar.find('.title-auto').show();
                    sidebar.find('.content-issues').hide();
                    sidebar.find('.content-auto').hide();
                    sidebar.find('.content-fast').hide();
                    sidebar.find('.title-separator').show();
                    sidebar.find('.title-fast').show();
                    // sidebar.find('.title-search-geo').show();
                    // sidebar.find('.content-search-geo').hide();
                    am.trigger('auto-sidebar tab_close', []);
                });

                $('.js_show_add_amo_task').on('click', function(){
                    $('.add_amo_task_form').slideDown(100);
                });

                $('.js_hide_add_amo_task').on('click', function(){
                    $('.add_amo_task_form').slideUp(100);
                });

                $('.js_add_amo_task').on('click', function(e){

                    e.preventDefault();

                    var step = self.constructor.selStep;
                    var tasks = step.data('tasks');
                    var box = $(this).parents('.add_amo_task_form');
                    var date = box.find('input[name=date]').val();
                    var content = box.find('textarea[name=content]').val();

                    tasks.push({date: date, content: content});
                    step.data('tasks', tasks);

                    step['addClass']('is_tasks');
                    am.trigger('constructor step task changed', [step]);
                    $('.add_amo_task_form').slideUp(100);

                    var taskBox = $('#step-tasks');
                    var html = '<li data-index="' + (tasks.length-1) + '">' +
                        '<p>' + content + '</p><small class="text-muted">' + date + ' дн.</small>' +
                        '<span class="close">&times;</span>' +
                        '</li>';
                    taskBox.append(html);
                });

                $('#step-tasks').on('click', 'li .close', function(){

                    var box = $(this).parents('li');
                    var index = box.data('index');
                    var step = self.constructor.selStep;
                    var tasks = step.data('tasks');

                    var newTasks = [];
                    $.each(tasks, function(i,t){
                        if (i != index) {
                            newTasks.push(t);
                        }
                    });

                    step.data('tasks', newTasks);
                    box.remove();

                    step[newTasks.length ? 'addClass' : 'removeClass']('is_tasks');
                    am.trigger('constructor step task changed', [step]);
                });

                self.constructor.reset(jsp);

                desk.click(function(e){
                    if ($(e.target).hasClass('js_desk')) self.constructor.onStepDeselected();
                });

                desk
                .on('click', '.step', function () {
                    if (self.justDrugged && !desk.find('.step').hasClass('sel')) {
                        self.justDrugged = false
                        return
                    }
                    let s = $(this);
                    $('.js_design_box').removeClass('open');
                    if (desk.find('.step').hasClass('sel')) {
                        if(!self.isCtrlPressed) {
                            self.constructor.onStepDeselected();
                        }
                    }
                    if (s.hasClass('sel')) {
                        self.constructor.onStepDeselected();
                    } else {
                        self.constructor.onStepSelected(s);
                    }

                })
                .on('click', '.step .step_unresolved_issues', function(e) {
                    e.stopPropagation();
                    $('.js_design_box').removeClass('open');
                    let s = $(this).parents('.step');
                    self.constructor.onStepSelected(s, null, function() {
                        $('.auto-sidebar .title-issues').click();
                    });

                })
                .on('click', '.step .remove', function(e){
                    e.stopPropagation();
                    $('.js_design_box').removeClass('open');
                    let el = $(this);
                    if (el.hasClass('act')) {
                        let par = el.parents('.step').first();

                        jsp.remove(par);
                        desk.data('last_id', null);
                        self.constructor.onStepDeselected();
                        am.trigger('constructor step removed', [par]);
                    } else {
                        el.addClass('act');
                        setTimeout(function(){
                            el.removeClass('act');
                        }, 1500);
                    }
                })
                .on('click', '.step .add_step', function(e){
                    e.stopPropagation();
                    $('.js_design_box').removeClass('open');
                    let par = $(this).parents('.step').first();
                    let pos = par.position();
                    let freePos = self.constructor.getFreePos(pos.left+par.width()+100, pos.top+par.height()+100);
                    let s = self.constructor.addStep(jsp, {id: self.constructor.generateId(desk), is_goal: false, is_user_sort: false,
                        is_starred: true, starred_text: '', title: Translator.trans('default_step_title'), text: '', left: freePos[0] - 40, top: freePos[1] - 29});
                    jsp.connect({source: par, target: s});
                    jsp.repaintEverything();
                    self.constructor.onStepSelected(s);

                        let map = self.constructor.getCircleMap(70);
                        if (desk.width() < map.rightEdge + 100) desk.width(map.rightEdge + 100);
                        if (desk.height() < map.bottomEdge + 100) desk.height(map.bottomEdge + 100);

                        if (self.constructor.doShowTryPattern) {
                            self.constructor.showTryPattern(self.constructor.showCircleMap(70).ctx, pos.left + par.width() + 100, pos.top + par.height() + 100);
                        }

                        am.trigger('constructor step added', [s]);
                    })
                    .on('click', '.condition_remove', function (e) {
                        let el = $(this);
                        if (el.hasClass('act')) {
                            let id = el.parents('.condition').first().prop('id').trim();
                            if (!id) return;
                            $.each(jsp.getConnections(), function (i, o) {
                                if ($(o.getOverlay('label').canvas).prop('id') === id) {
                                    jsp.detach(o);
                                    self.constructor.onStepDeselected();
                                }
                            });
                        } else {
                            el.addClass('act');
                            setTimeout(function () {
                                el.removeClass('act');
                            }, 1500);
                        }
                    })
                    .tooltip({
                        selector: '[data-toggle="tooltip"]',
                        delay: {show: 500, hide: 100},
                        container: '.js_desk'
                    });

                $('form.no-submit').submit(function(e){
                    e.preventDefault();
                });

                let scriptsElementCategory = $('#scriptsElementCategory');
                scriptsElementCategory.select2({
                    theme: "bootstrap",
                    tags: true,
                    createTag: function (params) {
                        let term = $.trim(params.term);

                        if (term === '') {
                            return null;
                        }

                        return {
                            id: term,
                            text: term,
                            newTag: true // add additional parameters
                        }
                    }
                });

                edit.find('.is_goal').on('change', function(){
                    if (!self.constructor.selStep) return;
                    var s = self.constructor.selStep;
                    var isGoal = !!edit.find('.is_goal').prop('checked');
                    s.data('is_goal', isGoal);
                    s[isGoal ? 'addClass' : 'removeClass']('is_goal');
                    am.trigger('constructor step is_goal changed', [s]);
                });

                edit.find('.is_user_sort').on('change', function(){
                    if (!self.constructor.selStep) return;
                    var s = self.constructor.selStep;
                    var isUserSort = !edit.find('.is_user_sort').prop('checked');
                    s.data('is_user_sort', isUserSort);
                    s[isUserSort ? 'addClass' : 'removeClass']('is_user_sort');
                    am.trigger('constructor step is_user_sort changed', [s]);
                });

                /*
                edit.find('.is_starred').on('click', function(){
                    if (!self.constructor.selStep) return;
                    var s = self.constructor.selStep;
                    var me = $(this);
                    var isStarred;

                    if ($(this).is('.active')) {
                        me.removeClass('active')
                            .removeClass('glyphicon-star')
                            .addClass('glyphicon-star-empty');
                        isStarred = false;

                        s.data('is_starred', isStarred);
                        s.data('starred_text', '');
                        s[isStarred ? 'addClass' : 'removeClass']('is_starred');
                        am.trigger('constructor step is_starred changed', [s]);
                    }
                    else {
                        me.addClass('active')
                            .removeClass('glyphicon-star-empty')
                            .addClass('glyphicon-star');

                        isStarred = true;

                        var starredBox = me.parents('.starred-node').find('.starred-text');
                        var input = starredBox.find('input');
                        starredBox.show();
                        input.focus();
                        input.unbind('blur').on('blur', function(){
                            starredBox.hide();
                            if (!input.val()) {
                                me.removeClass('active')
                                    .removeClass('glyphicon-star')
                                    .addClass('glyphicon-star-empty');
                                isStarred = false;
                            }
                            else {
                                s.data('starred_text', strip_html(input.val()));
                            }

                            s.data('is_starred', isStarred);
                            let lastStarred = 0;
                            if (isStarred) {
                                self.view_quicklinks.forEach(function (value) {
                                    if (lastStarred < value.sortOrder) {
                                        lastStarred = value.sortOrder;
                                    }
                                });
                                s.data('starred_sorting', lastStarred + 1);
                            }
                            s[isStarred ? 'addClass' : 'removeClass']('is_starred');
                            am.trigger('constructor step is_starred changed', [s]);
                        });
                    }
                });*/
                edit.find('#quizStepImages').on('change', (e) => {
                  if (!self.constructor.selStep) return;
                  var s = self.constructor.selStep;
                  var strArr = e.target.value
                  var arr = strArr.split(',').filter(e => typeof e === 'string' && e.trim().length > 0)
                  var d = s.data()

                  s.data('images', {
                    urls: arr,
                    position: d.images ? d.images.position : 'between',
                  })

                  // console.log('🦕 arr', s.data('images'))
                  self.constructor.addStepImageClasses();
                })

                edit.find('input[name=stepImagePosition]').on('change', (e) => {
                  if (!self.constructor.selStep) return;
                  var s = self.constructor.selStep;
                  var d = s.data()
                  s.data('images', {
                    urls: d.images ? d.images.urls : [],
                    position: e.target.value,
                  })
                })


                edit.find('.title').on('change keyup', function(){
                    if (!self.constructor.selStep) return;
                    var s = self.constructor.selStep;
                    var title = edit.find('#scriptsElementTitle').val().trim();

                    var editor = tinyMCE.get('scriptsElementDescript');
                    var text = (editor) ? editor.getContent() : '';
                    s.data('title', title);

                    if (title) {
                        s.find('.text').text(self.constructor.cutText(title));
                    } else {
                        s.find('.text').html(self.constructor.cutText(text));
                    }
                    jsp.repaintEverything();
                    am.trigger('constructor step title changed', [s]);
                });

                edit.find('#scriptsElementCategory').on('select2:select', function (e) {
                    if (!self.constructor.selStep) return;
                    let s = self.constructor.selStep;
                    let category = e.params.data.id;
                    s.data('category', category);
                    am.trigger('constructor step category changed', [s]);
                });

                app.get('addField').done(function() {

                    try {
                        tinymce.init(params);
                    } catch (e) {
                        return;
                    }

                    var editor = tinyMCE.get('scriptsElementDescript');

                    if (editor) {

                        editor.on('change keyup', function(){

                            if (!self.constructor.selStep) return;
                            var s = self.constructor.selStep;
                            var text = editor.getContent();
                            s.data('text', text);
                            var title = s.data('title');

                            if (typeof title === 'string') title = title.trim();
                            if (title) {
                                s.find('.text').text(self.constructor.cutText(title));
                            } else {
                                s.find('.text').html(self.constructor.cutText(text));
                            }
                            jsp.repaintEverything();
                            am.trigger('constructor step text changed', [s]);
                        });
                    }
                });


                edit.on('focus', '.link textarea.js_answer_label, .link input, .link button', function(){
                    self.constructor.highlightCondition($(this).parents('.link').first().data('cid'), true);
                }).on('blur', '.link textarea.js_answer_label, .link input, .link button', function(){
                    self.constructor.darkenConditions();
                }).on('change keyup', '.link textarea.js_answer_label', function(){

                    if (!self.constructor.selStep) return;
                    var s = self.constructor.selStep;
                    var text = strip_html($(this).val().trim());

                    $(this).parents('.link').find('h4.panel-title a').text(text);

                    var cond = $('#'+$(this).parents('.link').first().data('cid'));
                    cond.data('text', text).data('jl').setLabel(self.constructor.cutText(text, 50)+self.constructor.getLinkRemoveHtml());
                    $('.set_state[data-id=' + cond.data('id') + ']').text(text);

                    jsp.repaintEverything();
                    am.trigger('constructor condition text changed', [cond]);
                });

                edit.on('click', '.js_answer_status', function() {
                    var status = $(this).data('status');
                    $(this).closest('.answer_status').find('.js_answer_status').removeClass('active');
                    $(this).addClass('active');
                    if (status === 'positive')
                        $(this).closest('.link').addClass('link_positive').removeClass('link_negative link_normal');
                    if (status === 'negative')
                        $(this).closest('.link').addClass('link_negative').removeClass('link_positive link_normal');
                    if (status === 'normal')
                        $(this).closest('.link').addClass('link_normal').removeClass('link_positive link_negative');

                    var cond = $('#'+$(this).parents('.link').first().data('cid'));
                    cond.data('status', status);
                    self.constructor.addConditionStatusClasses();
                    $('.set_state[data-id=' + cond.data('id') + ']').data('status', status);
                    am.trigger('constructor condition text changed', [cond]);
                });

                edit.on('change', '.hs--answer-panel--add-image-to-answer__input', (e) => {
                  var image = e.target.value
                  var alt = e.target.dataset.alt

                  var cond = $('#'+$(e.target).parents('.link').first().data('cid'));

                  if (image) {
                    var outputData = {
                      src: image,
                      options: {
                        position: 'top',
                        alt
                      },
                    }

                    cond.data('images', [outputData]);
                    $('.set_state[data-id=' + cond.data('id') + ']').data('images', [outputData]);
                    am.trigger('constructor step image changed', [cond]);
                  } else {
                    cond.removeData('images');
                    $('.set_state[data-id=' + cond.data('id') + ']').removeData('images');
                    am.trigger('constructor step image changed', [cond]);
                  }

                  self.constructor.addConditionImageClasses();
                })
            },
            addConditionStatusClasses: function() {
                $('.condition').each( function(i) {
                    $(this).removeClass('condition-positive condition-negative condition-normal');
                    if ($(this).data('status') === 'positive' || $(this).data('status') === 'negative')
                        $(this).addClass('condition-' + $(this).data('status'));
                });
            },
            addStepImageClasses: function() {
              $('.step').each( function(i) {
                $(this).removeClass('step-have-image');
                var images = $(this).data('images');
                // console.log('🦕 images', images)
                if (images && images.urls && images.urls.length > 0) {
                  $(this).addClass('step-have-image');
                }
              });
            },
            addConditionImageClasses: function() {
              $('.condition').each( function(i) {
                $(this).removeClass('condition-have-image');
                var images = $(this).data('images');
                if (images && images.length > 0) {
                  $(this).addClass('condition-have-image');
                }
              });
            },
            getTextInputHtml: function() {
                return [
                    '<div class="inp" data-type="text">',
                    '	<div>',
                    '		<span class="inp_handle">Текстовое поле</span>',
                    '		<button title="удалить это текстовое поле" class="btn btn-sm btn-default js_rm_inp">',
                    '			<span class="glyphicon glyphicon-minus"></span>',
                    '		</button>',
                    '	</div>',
                    '	<textarea class="form-control" placeholder="Название/описание поля"></textarea>',
                    '</div>'
                ].join('');
            },
            getSelectInputHtml: function() {
                return [
                    '<div class="inp" data-type="select">',
                    '	<div>',
                    '		<span class="inp_handle">Выпадающий список</span>',
                    '		<button title="удалить этот выпадающий список" class="btn btn-sm btn-default js_rm_inp">',
                    '			<span class="glyphicon glyphicon-minus"></span>',
                    '		</button>',
                    '		<button title="добавить вариант ответа" class="btn btn-sm btn-default js_add_opt">',
                    '			<span class="glyphicon glyphicon-plus-sign"></span>',
                    '		</button>',
                    '	</div>',
                    '	<textarea class="form-control" placeholder="Название/описание выпадающего списка"></textarea>',
                    '	<div class="options"></div>',
                    '</div>'
                ].join('');
            },
            addSelectOption: function(sel) {
                sel.append([
                    '<div class="opt form-inline">',
                    '	<span class="opt_handle"><span class="glyphicon glyphicon-move"></span></span>',
                    '	<input class="form-control" value="" placeholder="Вариант ответа" />',
                    '	<button title="удалить опцию" class="btn btn-sm btn-default js_rm_opt" style="display: none;">',
                    '		<span class="glyphicon glyphicon-minus"></span>',
                    '	</button>',
                    '</div>'
                ].join('\n'));
                return self.constructor.updateSelectOptionsRmButtons(sel);
            },
            updateSelectOptionsRmButtons: function(sel) {
                var opts = sel.find('.opt');
                opts.find('.js_rm_opt')[opts.length > 1 ? 'show' : 'hide']();
                return self.constructor;
            },
            refreshSortable: function() {
                edit.find('.inputs').sortable('refresh');
                edit.find('.inputs .inp[data-type="select"] .options').each(function() {
                    var sel = $(this);
                    if (sel.sortable('instance')) {
                        sel.sortable('destroy');
                    }
                    sel.sortable({
                        containment: 'parent',
                        handle: '.opt_handle',
                        update: function() {
                            self.constructor.saveInputs();
                        }
                    });
                });
                return self.constructor;
            },
            saveInputs: function() {
                if (!self.constructor.selStep) return;
                var s = self.constructor.selStep;
                var inputData = edit.find('.inputs .inp').map(function(i, o){
                    var inp = $(o);
                    var type = inp.data('type');
                    var res = {
                        type: type,
                        title: inp.find('textarea').val()
                    };
                    if (type === 'select') {
                        res.options = inp.find('.options .opt input').map(function(i, o){
                            return $(o).val();
                        }).get();
                    } else if (type !== 'text') {
                        //alert('unknown node input type ('+type+') encountered');
                        throw 'unknown node input type ('+type+') encountered';
                    }
                    return res;
                }).get();
                s.data('inputs', inputData);
                return self.constructor;
            },
            reset: function (j) {
                self.constructor.addStepOpts.enableAll();
                self.constructor.load(jsp, {
                    "steps": [{
                        "id": "start",
                        "title": Translator.trans('first_step_example_title'),
                        "text": Translator.trans('first_step_example'),
                        "left": 301,
                        "top": 20,
                        "is_starred": true
                    }],
                    "starred": [
                        {
                            "n": Translator.trans('step_category.others'),
                            "s": ["start"]
                        },
                        {
                            "n": Translator.trans('step_category.greeting'),
                            "s": []
                        },
                        {
                            "n": Translator.trans('step_category.qualification'),
                            "s": []
                        },
                        {
                            "n": Translator.trans('step_category.programming'),
                            "s": []
                        },
                        {
                            "n": Translator.trans('step_category.info_gathering'),
                            "s": []
                        },
                        {
                            "n": Translator.trans('step_category.product_presentation'),
                            "s": []
                        },
                        {
                            "n": Translator.trans('step_category.objections'),
                            "s": []
                        },
                        {
                            "n": Translator.trans('step_category.deal_confirmation'),
                            "s": []
                        },
                        {
                            "n": Translator.trans('step_category.upsell'),
                            "s": []
                        },
                        {
                            "n": Translator.trans('step_category.next_step_planning'),
                            "s": []
                        },
                    ],
                    "connections": []
                });
            },
            updateStepStarredSorting: function(j, starredSorting) {
                $('.js_scripts_action_save').show();
                var d = $(j.getContainer());
                var sort = {};
                d.find('.step').map(function(i, o){
                        var s = $(o);
                        var id = s.prop('id');
                        s.data('starred_sorting', starredSorting[id]);
                        sort[id] = starredSorting[id]
                    });
                self.constructor.starredSorting = sort;
            },
            save: function(j) {
                let d = $(j.getContainer());

                return {
                    starred: self.starred.data,
                    target: d.data('target'),
                    desk: {width: d.width(), height: d.height()},
                    steps: d.find('.step').map(function(i, o){
                        let s = $(o);
                        let id = s.prop('id');
                        if (!id) throw 'step has no id, impossible to save it';
                        let inp = s.data('inputs');
                        if (!Array.isArray(inp)) inp = [];
                        let pos = s.position();
                        let newText = app.addField.backReplaceFieldsInEditor(s.data('text'));
                        newText = app.addVideo.backReplaceVideosInEditor(newText);

                        var urls = (s.data('images').urls && (s.data('images').urls.length > 0)) ? s.data('images').urls : []

                        return {
                            id: id,
                            is_goal: s.data('is_goal'),
                            is_user_sort: s.data('is_user_sort'),
                            is_starred: s.data('is_starred'),
                            starred_text: s.data('starred_text'),
                            images: {
                              urls: urls.length > 0 ? Object.fromEntries(urls.map((e, idx) => [idx, e])) : null,
                              position: s.data('images').position || 'between',
                            },
                            title: s.data('title'),
                            starred_sorting: self.constructor.starredSorting[id] !== undefined ? self.constructor.starredSorting[id] : s.data('starred_sorting'),
                            text: newText,
                            inputs: inp,
                            left: pos.left,
                            top: pos.top,
                            tasks: s.data('tasks'),
                            other_script: s.data('other_script')
                        };
                    }).get(),
                    connections: $.map(j.getConnections(), function(o){
                        var $el = $(o.getOverlay('label').getElement());
                        return {
                            source: o.sourceId,
                            target: o.targetId,
                            images: $el.data('images'),
                            points: $el.data('points'),
                            sort: $el.data('sort'),
                            condition: $el.data('text'),
                            id: $el.data('id'),
                            status: $el.data('status')
                        };
                    })
                };
            },
            getCircleMap: function(opts) {
                var ri = 0;
                if (typeof opts === 'number' && isFinite(opts)) ri = opts;
                opts = $.extend({}, opts);
                if (typeof opts.radiusIncrement === 'number' && isFinite(opts.radiusIncrement)) ri = opts.radiusIncrement;
                var rightEdge = 0, bottomEdge = 0;
                var map = desk.find('.step').map(function(i, o){
                    var s = $(o);
                    var pos = s.position();
                    var w = s.outerWidth();
                    var h = s.outerHeight();
                    var r = Math.ceil(Math.sqrt(w * w + h * h) / 2) + ri;
                    var x = Math.round(pos.left + w / 2);
                    var y = Math.round(pos.top + h / 2);
                    rightEdge = Math.max(rightEdge, x + r);
                    bottomEdge = Math.max(bottomEdge, y + r);
                    return {x: x, y: y, r: r};
                }).get();
                return {map: map, rightEdge: rightEdge, bottomEdge: bottomEdge};
            },
            showCircleMap: function(opts) {
                $('.map_canvas').remove();
                var w = desk.width();
                var h = desk.height();
                var can = $([
                    '<canvas width="'+w+'" height="'+h+'" class="map_canvas" ',
                    'style="position: absolute; opacity: 0.5;"></canvas>'
                ].join(''));
                $('.js_constructor_box').before(can);
                can.width(w).height(h).offset(desk.offset());
                var ctx = can.get(0).getContext('2d');
                $.each(self.constructor.getCircleMap(opts).map, function(i, o) {
                    ctx.beginPath();
                    ctx.fillStyle = '#F8F';
                    ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2, true);
                    ctx.fill();
                });
                return {ctx: ctx};
            },
            showTryPattern: function(ctx, x, y) {
                for (var i = 0; i <= 50; i++) {
                    var steps = Math.floor(i / 2) + 1;
                    var dx = (- (i + 1) % 2 * (i % 4 - 1)) * 20;
                    var dy = (i % 2 * ((i + 1) % 4 - 1)) * 20;
                    for (var s = 0; s < steps; s++) {
                        x = x + dx;
                        y = y + dy;
                        ctx.beginPath();
                        ctx.fillStyle = '#00F';
                        ctx.arc(x, y, 2, 0, Math.PI * 2, true);
                        ctx.fill();
                    }
                }
            },
            dist: function(x1, y1, x2, y2) {
                var dxp = Math.pow(x1 - x2, 2);
                var dyp = Math.pow(y1 - y2, 2);
                return Math.sqrt(dxp + dyp);
            },
            hasMapCollisions: function(map, x, y) {
                for (var i = 0; i < map.length; i++) {
                    if (self.constructor.dist(x, y, map[i].x, map[i].y) < map[i].r) {
                        return true;
                    }
                }
                return false;
            },
            getFreePos: function(x, y) {
                var map = self.constructor.getCircleMap(70);
                if (!self.constructor.hasMapCollisions(map.map, x, y)) return [x, y];
                for (var i = 0; i <= 50; i++) {
                    var steps = Math.floor(i / 2) + 1;
                    var dx = (- (i + 1) % 2 * (i % 4 - 1)) * 20;
                    var dy = (i % 2 * ((i + 1) % 4 - 1)) * 20;
                    for (var s = 0; s < steps; s++) {
                        x = x + dx;
                        y = y + dy;
                        if (!self.constructor.hasMapCollisions(map.map, x, y)) return [x, y];
                    }
                }
                return [map.rightEdge, map.bottomEdge];
            },
            getLinkRemoveHtml: function() {
                return '<div class="condition_remove"><div class="condition_remove_inner">' +
                    Translator.trans('remove') + '</div></div>';
            },
            replaceStepFields: function() {
                var d = $(jsp.getContainer());
                d.find('.step').each(function(i, o){

                    var element = $(o).find('.text');
                    var elementHtml = element.html();
                    elementHtml = app.addField.replaceFieldsToObjects(app.addField.backReplaceFieldsInEditor(elementHtml));
                    elementHtml = app.addVideo.replaceVideosToObjects(app.addVideo.backReplaceVideosInEditor(elementHtml));
                    element.html(elementHtml);
                });
            },
            getStepHtml: function(id, isGoal, isStarred, otherScript, isTasks, title, text, left, top, opts, isUserSort) {
                if(isUserSort === undefined) {
                    isUserSort = false;
                }
                var content = self.constructor.cutText(title ? title : (text ? text : ''));

                content = app.addField.replaceFieldsToObjects(content);
                content = app.addVideo.replaceVideosToObjects(content);

                if (otherScript) {
                    content = content.replace(/<p><\/p>/g, '');
                }

                opts = $.extend({}, opts);
                stats = $.extend({}, opts.stats);

                let isOkStat = function(name) {
                    let s = stats[name];
                    return typeof s === 'number' || typeof s === 'string';
                };

                if (otherScript) {
                    opts.noAdd = true;
                }

                var issuesCount = 0;
                if (typeof self.issuesCountByNodes[id] != 'undefined') {
                    issuesCount = self.issuesCountByNodes[id];
                }

                return [
                    '<div class="step'+(isGoal ? ' is_goal' : '') + (isStarred ? ' is_starred' : '') + (isUserSort ? ' is_user_sort' : '') +
                    (otherScript ? ' step_other_script' : '') +
                    (isTasks ? ' is_tasks' : '') +'" id="'+id+'" style="left: '+left+'px; top: '+top+'px;">',
                    '<div class="text">'+content+'</div>',
                    '<div class="link_start" data-toggle="tooltip" data-placement="auto left" title="' + Translator.trans('move_to_connect_step') + '"'+(opts.noLink ? ' style="display: none;"' : '')+'></div>',
                    (opts.noRemove ? '' : '<div class="remove"><div class="remove_inner">' + Translator.trans('remove') + '</div></div>'),
                    (opts.noAdd ? '' : '<div class="add_step"></div>'),
                    (isOkStat('end_with_unexpected_answer_count') && isOkStat('end_forcefully_interrupted_count') ? [
                        '<div class="stat_info">',
                        '	<span class="stat_success_answer_color" title="' + Translator.trans('stat_success_answer_title') + '">' + (stats.been_reached_count_orig?stats.been_reached_count_orig:0) + '</span> / ',
                        '	<span class="stat_unexpected_answer_color" title="' + Translator.trans('stat_unexpected_answer_title') + '">' + stats.end_with_unexpected_answer_count + '%</span> / ',
                        '	<span class="stat_ended_by_client_color" title="' + Translator.trans('stat_ended_by_client_title') + '">' + stats.end_forcefully_interrupted_count + '%</span> / ',
                        '	<span class="stat_passes_by_step_color" title="' + Translator.trans('stat_passes_by_step_title') + '">' + parseFloat(stats.passes_by_step_count).toFixed(2) + '%</span>',
                        '</div>'
                    ].join('\n') : ''),
                    '<div title="Не указан текст шага" class="no-text-error"><span class="glyphicon glyphicon-exclamation-sign"></span></div>',
                    '<div class="starred"><span data-toggle="tooltip" data-placement="auto right" title="' + Translator.trans('disabled_quick_link') + '" class="is_starred glyphicon glyphicon-eye-close"></span></div>',
                    '<div class="tasks"><span class="is_starred glyphicon glyphicon-play"></span></div>',
                    '<div class="label label-danger step_unresolved_issues" ' + ((issuesCount) ? '': 'style="display:none;"') + ' title="' + Translator.trans('missing_answer') + '">' + issuesCount + '</div>',
                    '</div>'
                ].join('\n');
            },
            addStepOpts: {
                noRemove: false,
                noAdd: false,
                noDrag: false,
                noLink: false,
                defaultCondition: Translator.trans('step_answer_example'),
                disableAll: function() {
                    self.constructor.addStepOpts.noRemove = true;
                    self.constructor.addStepOpts.noAdd = true;
                    self.constructor.addStepOpts.noDrag = true;
                    self.constructor.addStepOpts.noLink = true;
                    self.constructor.addStepOpts.defaultCondition = '';
                },
                enableAll: function() {
                    self.constructor.addStepOpts.noRemove = false;
                    self.constructor.addStepOpts.noAdd = false;
                    self.constructor.addStepOpts.noDrag = false;
                    self.constructor.addStepOpts.noLink = false;
                    self.constructor.addStepOpts.defaultCondition = Translator.trans('step_answer_example');
                }
            },
            addStep: function(j, s) {
                var d = $(j.getContainer());
                var isGoal = false;
                var isStarred = false;
                var otherScript = false;
                var isUserSort = false;
                if (s.is_goal && (s.is_goal === true || s.is_goal === 'true' || s.is_goal === 1 || s.is_goal === '1')) {
                    isGoal = true;
                }
                if (s.is_user_sort && (s.is_user_sort === true || s.is_user_sort === 'true' || s.is_user_sort === 1 || s.is_user_sort === '1')) {
                    isUserSort = true;
                }
                if (s.is_starred && (s.is_starred === true || s.is_starred === 'true' || s.is_starred === 1 || s.is_starred === '1')) {
                    isStarred = true;
                }
                if (s.otherScript && (s.otherScript === true || s.otherScript === 'true' || s.otherScript === 1 || s.otherScript === '1')) {
                    otherScript = true;
                }
                var isTasks = !!(s.tasks && s.tasks.length);
                d.append(
                    self.constructor.getStepHtml(
                        s.id, isGoal, isStarred, otherScript, isTasks, s.title, s.text,
                        s.left, s.top, {
                            noRemove: s.id === 'start' || self.constructor.addStepOpts.noRemove,
                            noAdd: self.constructor.addStepOpts.noAdd,
                            noLink: self.constructor.addStepOpts.noLink,
                            stats: s.stats
                        }, isUserSort
                    )
                );
                var step = d.find('#'+s.id);
                step.data('entity_id', s.entity_id);
                step.data('tasks', (s.tasks) ? s.tasks : []);
                step.data('is_goal', isGoal);
                step.data('is_starred', isStarred);
                step.data('is_user_sort', isUserSort);
                step.data('starred_text', s.starred_text);
                step.data('starred_sorting', s.starred_sorting);
                step.data('title', s.title ? s.title : '');
                step.data('text', s.text ? s.text : '');
                step.data('images', s.images ? s.images : '');
                step.data('inputs', Array.isArray(s.inputs) ? s.inputs : []);
                step.data('other_script', otherScript);

                if (s.top > (d.height() + 125)) {
                    d.height(s.top + 125);
                }
                if (s.left > (d.width() + 125)) {
                    d.width(s.left + 125);
                }

                if (!s.text) {
                    step.find('.no-text-error').show();
                }
                else {
                    step.find('.no-text-error').hide();
                }

                if (!self.constructor.addStepOpts.noDrag) {
                    j.draggable(step, {
                        _opts: {
                            deskBR: 0,
                            element: null,
                            $html: null,
                            scrollOffset: 20,
                            scrollSpeed: 10,
                            parent: null,
                            parentTopMargin: 0,
                            parentLeftMargin: 0,
                            rightBoxW: 0
                        },
                        constrain: function (pos) {
                            if (pos[0] <= 0 && pos[1] <= 0)
                                return [0, 0];
                            if (pos[0] <= 0)
                                return [0, pos[1]];
                            if (pos[1] <= 0)
                                return [pos[0], 0];
                            return pos;
                        },
                        filter: '.remove, .add_step',
                        start: (params) => {
                            params.drag.params._opts.element = $(params.el);

                            let sel2 = desk.find('.step.sel').length;
                            if (sel2 < 2) {
                                desk.find('.step').not(params.drag.params._opts.element).removeClass('sel');
                            }
                            params.drag.params._opts.$html = $('html');
                            params.drag.params._opts.parent = $('.js_constructor_box');

                            params.drag.params._opts.parentTopMargin = parseInt(params.drag.params._opts.parent.css('margin-top'));
                            params.drag.params._opts.parentLeftMargin = parseInt(params.drag.params._opts.parent.css('margin-left'));
                            let _w = $('.js_settings_box:visible').width();
                            params.drag.params._opts.rightBoxW = parseInt(_w ? _w : 0);
                            self.moveSelectedSteps(null, null, null);
                        },
                        drag: (params) => {
                            let x = params.pos[0];
                            let y = params.pos[1];
                            let o = params.drag.params._opts;

                            o.deskBR = desk[0].getBoundingClientRect();
                            if (x + o.element.width() + 42 >= o.deskBR.width) {
                                desk.css({width: o.deskBR.width + 100 + 'px'});
                            }
                            if (y + o.element.height() + 42 >= o.deskBR.height) {
                                desk.css({height: o.deskBR.height + 100 + 'px'});
                            }
                            const currScrollTop = o.$html.scrollTop();
                            const currScrollLeft = o.$html.scrollLeft();

                            //scroll vertical
                            if(params.el.getBoundingClientRect().bottom > (window.innerHeight - o.parentTopMargin - o.scrollOffset - 20)) {
                                o.$html.scrollTop(currScrollTop + o.scrollSpeed);
                            }
                            if (y  < (currScrollTop + o.scrollOffset + 20)) {
                                o.$html.scrollTop(currScrollTop - o.scrollSpeed);
                            }

                            //scroll horizontal
                            if(params.el.getBoundingClientRect().right > (window.innerWidth - o.parentLeftMargin - o.scrollOffset - o.rightBoxW)) {
                                o.$html.scrollLeft(currScrollLeft + o.scrollSpeed);
                            }
                            if (x < (currScrollLeft + o.scrollOffset)) {
                                o.$html.scrollLeft(currScrollLeft - o.scrollSpeed);
                            }
                        },

                        stop: function(ev, ui) {
                            self.justDrugged = true
                            am.trigger('constructor step moved', [step, ev, ui]);
                            j.repaintEverything();
                        }
                    });
                }
                j.makeTarget(step, {
                    dropOptions: {hoverClass: 'dragHover'},
                    anchor: 'Continuous',
                    allowLoopback: false
                });
                j.makeSource(step, {
                    filter: '.link_start',
                    anchor: 'Continuous',
                    connector: ['StateMachine', {curviness: 20}],
                    connectorStyle: {strokeStyle: '#5c96bc', lineWidth: 2, outlineColor: 'transparent', outlineWidth: 4}
                });
                return step;
            },
            generateId: function(d) {
                var id = am.naturalize(d.data('last_id'));
                if (id > 0) {
                    d.data('last_id', ++id);
                    return 's'+id;
                }
                d.find('.step').each(function(i, o){
                    var ma = /^s(\d+)$/.exec($(o).prop('id'));
                    if (ma) {
                        id = Math.max(id, am.naturalize(ma[1]));
                    }
                });
                d.data('last_id', ++id);
                return 's'+id;
            },
            unload: function(j) {
                var d = $(j.getContainer());
                d.find('.step').each(function(i, o){
                    j.remove($(o));
                });
                self.starred.data = [];
                self.constructor.onStepDeselected();
            },
            load: function(j, data, skipUnload) {
                if (!skipUnload) {
                    self.constructor.unload(j);
                }
                let d = $(j.getContainer());

                if (data.desk && data.desk.width && data.desk.height) {
                    d.width(data.desk.width);
                    d.height(data.desk.height);
                } else {
                    d.width(800);
                    d.height(600);
                }

                j.doWhileSuspended(function() {
                    if (!Array.isArray(data.steps)) return;
                    $.each(data.steps, function(i, o){
                        self.constructor.addStep(j, o);
                    });

                    if (!Array.isArray(data.connections)) return;
                    $.each(data.connections, function (i, o) {
                        var c = j.connect({source: d.find('#' + o.source), target: d.find('#' + o.target)});
                        var jl = c.getOverlay('label');
                        jl.setLabel(self.constructor.cutText(o.condition, 50) + self.constructor.getLinkRemoveHtml());
                        $(jl.getElement()).data('text', o.condition);
                        $(jl.getElement()).data('status', o.status);
                        $(jl.getElement()).data('id', o.id);
                        $(jl.getElement()).data('images', o.images);
                        $(jl.getElement()).data('points', o.points);
                    });
                });
                j.repaintEverything();
                self.constructor.addConditionStatusClasses();
                self.constructor.addConditionImageClasses();
                self.constructor.addStepImageClasses();
                if (data.starred) {
                    self.starred.data = data.starred;
                }
            },
            onStepSelected: function(s, skipFocus, cb) {
                cb = cb || null;
                if (s.is('.step_other_script')) {
                    return;
                }
                if(!self.isCtrlPressed) {
                    desk.find('.step').not(s).removeClass('sel');
                }
                s.addClass('sel');
                var settingShow = true;
                self.constructor.selStep = s;
                var selSteps = desk.find('.step.sel');
                var stepSetting = edit.find(".step-settings");
                var multiStepSetting = edit.find(".multistep-setting");
                if(selSteps.length > 1) {
                    multiStepSetting.find(".js_multistep_count").html(selSteps.length);
                    stepSetting.hide();
                    multiStepSetting.show();
                    settingShow = false;
                } else {
                    stepSetting.show();
                    multiStepSetting.hide();
                }
                edit.find('.is_goal').prop('checked', !!s.data('is_goal')).prop('disabled', false);
                // var isStarred = edit.find('.is_starred');
                // if (s.data('is_starred')) {
                //     isStarred.addClass('active').removeClass('glyphicon-star-empty').addClass('glyphicon-star');
                // }
                // else {
                //     isStarred.removeClass('active').addClass('glyphicon-star-empty').removeClass('glyphicon-star');
                // }
                edit.find('.is_user_sort').prop('checked', !s.data('is_user_sort')).prop('disabled', false);

                let title = s.data('title');
                if (typeof title === 'number') title = title.toString();
                if (typeof title !== 'string') title = '';
                title = title.trim();
                edit.find('.title').val(title).prop('disabled', false);
                edit.find('.starred-text input').val(s.data('starred_text'));
                edit.find('.text').val(s.data('text')).prop('disabled', false);

                var boxel = $('.js_editor');
                if (!boxel.size()) return;

                // console.log('🦕 SELECTED', s.data(), '\n\n', boxel.data())

                var imagesContainer = document.getElementsByClassName('hs--quiz-image-to-step--stack')[0]
                var imagesPositions = document.getElementsByName('stepImagePosition')

                if (s.data('images') && s.data('images').urls) {
                  var { images } = s.data()
                  edit.find('#quizStepImages').val(images.urls)
                  app.get('libAddQuiz').done(l => {
                    var imagesHtml = images.urls.map(url => l.generateStepImageHtml(url))
                    imagesContainer.innerHTML = imagesHtml.join('')
                  })
                } else {
                  edit.find('#quizStepImages').val('')
                  imagesContainer.innerHTML = ''
                }

                if (s.data('images') && s.data('images').position) {
                  for(var i = 0; i < imagesPositions.length; i++) {
                    imagesPositions[i].checked = imagesPositions[i].value === s.data('images').position
                  }
                } else {
                  for(var i = 0; i < imagesPositions.length; i++) {
                    imagesPositions[i].checked = i === 0
                  }
                }

                let starredCat = self.starred.data.filter((g) => {
                    if (g.s && Array.isArray(g.s)) {
                        return g.s.includes(s.attr('id'))
                    }
                    return null;
                });
                if (starredCat && starredCat.length > 0) {
                    edit.find('#scriptsElementCategory').val(starredCat[0].n).trigger('change');
                } else {
                    edit.find('#scriptsElementCategory').val(Translator.trans('step_category.others')).trigger('change');
                }

                tinyMCE.execCommand('mceRemoveEditor', false, 'scriptsElementDescript');
                tinyMCE.init(params);
                var editor = tinyMCE.get('scriptsElementDescript');
                if (editor) {

                    var id = s.attr('id');
                    var noTextError = s.find('.no-text-error');
                    var stepText = s.find('.text');
                    var stepLogItem = $('.log .item[data-id=' + s.attr('id') + '] .text');

                    editor.setContent(s.data('text'));

                    editor.on('PastePreProcess', function (e) {
                        //REMOVE DONT HAVE FIELD IN SCRIPT FROM TEXT
                        var originContent = e.content;
                        var pattern = /<hs class="js_field[^"]*" data-id="(.*?)"[^>]*>[^<]*<\/hs>/gi;
                        originContent = originContent.replace(pattern, function(match, fieldId) {
                            if(!app.addField.hasFieldById(fieldId)) {
                                return '';
                            }
                            return match;
                        });
                        e.content = originContent;
                    });

                    editor.on('setcontent change input', function() {

                        var text = editor.getContent();
                        text = text.replaceAll("<img", "<img width=\"300\"")
                        if (self.constructor.selStep == null) return;
                        if (self.constructor.selStep.attr('id') != id) return;
                        s.data('text', text);

                        var title = s.data('title');

                        if (!text) {
                            noTextError.show();
                        }
                        else {
                            noTextError.hide();
                        }

                        if (typeof title === 'string') title = title.trim();
                        if (title) {
                            stepText.text(self.constructor.cutText(title));
                        } else {
                            stepText.html(self.constructor.cutText(text));
                        }

                        var html = app.addField.replaceFields(app.addField.backReplaceFieldsInEditor(text), true);
                        html = app.addVideo.replaceVideos(app.addVideo.backReplaceVideosInEditor(html), true);
                        html = app.addField.replaceStaticFields(html, true);

                        stepLogItem.html(html);

                        am.trigger('constructor step text changed', [s]);
                    });
                }

                self.constructor.showStepLinks(s);
                self.constructor.showStepTasks(s);
                if (!skipFocus) {
                    edit.find('.text').focus();
                }
                $('.js_settings_box').show();

                $('.js_design_box').addClass('is-focus');

                am.trigger('constructor step selected', [s]);
                $('.js_add_answer_form').hide();
                $('.js_add_answer').show();
                let autoSideBar = $('.auto-sidebar');
                autoSideBar.find('.title-auto').show();
                autoSideBar.find('.title-issues').show();
                autoSideBar.find('.content').hide();
                autoSideBar.find('.title-separator').show();
                if(settingShow) {
                    $('.step-settings').show();
                }
                autoSideBar.removeClass('auto-sidebar-open');

                if (cb) {
                    cb();
                }
            },
            onStepDeselected: function() {
                desk.find('.step').removeClass('sel');

                $.each(jsp.getAllConnections(), function (i, o) {
                    var opt = {strokeStyle: '#5c96bc'};
                    o.setHoverPaintStyle(opt);
                    o.setPaintStyle(opt);
                });

                self.constructor.selStep = null;
                edit.find('.is_goal').prop('checked', false).prop('disabled', true);
                edit.find('.is_user_sort').prop('checked', true).prop('disabled', true);
                // edit.find('.is_starred').removeClass('active').removeClass('glyphicon-star').addClass('glyphicon-star-empty');
                edit.find('.starred-text input').val('');
                edit.find('.title').val('').prop('disabled', true);
                edit.find('.text').val('').prop('disabled', true);
                edit.find('.auto-sidebar').removeClass('auto-sidebar-open');
                edit.find('.step-settings').show();
                edit.find('.auto-sidebar .add_amo_task_form').hide();
                edit.find('.add_amo_task_form input, .add_amo_task_form textarea').val('');
                edit.find('.links').empty();
                self.constructor.darkenConditions();
                $('.js_settings_box').hide();
                $('.js_design_box').removeClass('is-focus');
                am.trigger('constructor step deselected');
                tinyMCE.execCommand('mceRemoveEditor', false, 'scriptsElementDescript');
            },
            showStepTasks: function(step) {

                var tasks = step.data('tasks');
                var box = $('#step-tasks');
                box.find('li').remove();
                if (!tasks.length) return;

                $.each(tasks, function(i, t) {
                    var content = '<li data-index="' + i + '">' +
                        '<p>' + t.content + '</p><small class="text-muted">' + t.date+ ' дн.</small>' +
                        '<span class="close">&times;</span>' +
                        '</li>';
                    box.append(content);
                });
            },
            highlightCondition: function(conditionHtmlId, skipFocus) {
                var cid = conditionHtmlId;
                var c = desk.find('#'+cid);
                desk.find('.condition').not(c).removeClass('sel');
                c.addClass('sel');
                if (!skipFocus) {

                    var link = edit.find('.link[data-cid="'+cid+'"]');
                    link.find('.panel-collapse').collapse('toggle');
                    link.find('textarea.js_answer_label').focus();

                    link.find('.panel-collapse').on('shown.bs.collapse', function(){
                        $('.js_edit').scrollTo(link.find('h4'), 200);
                    });

                }
                am.trigger('constructor condition selected', [c]);
            },
            darkenConditions: function() {
                desk.find('.condition').removeClass('sel');
                am.trigger('constructor condition deselected');
            },
            getLinkHtml: function(
              htmlId,
              text,
              placeholder,
              targetId,
              targetText,
              cid,
              status,
              direction,
            ) {

                text = text || '';

                var status_class = '';

                var iconInfo = ['<div class="btn-group" data-toggle="tooltip" data-placement="left" title="' + Translator.trans('icon_info_drag') + '">',
                '<span class="btn btn-xs" type="button" style="margin-top: -3px; background-color: #f5f5f5;">',
                '<span class="glyphicon glyphicon-menu-hamburger"></span></span></div>'].join('\n');

                var glyphiconClass = 'glyphicon-step-forward',
                    js_answer = 'js_answer_forward';

                if(direction === 'backward'){
                    glyphiconClass = 'glyphicon-step-backward';
                    js_answer = 'js_answer_backward';
                    iconInfo = '';
                }
                if (status === 'positive')
                    status_class = 'link_positive';
                if (status === 'negative')
                    status_class = 'link_negative';

                let answerImage = ''
                let answerAlt= ''
                if (images !== null && images.length > 0) {
                  answerImage = images[0].src
                  answerAlt = images[0].options?.alt || ''
                }

                var isShowFieldAddImageToAnswer = self.currentScriptType === 'quiz'

                var fieldAddImageToAnswer = `
                  <div class="hs--answer-panel--add-image-to-answer" style="margin-top: 5px;">
                    <div>
                      <span>${Translator.trans('picture')}</span>
                      <div class="hs--answer-panel--add-image-to-answer__container">
                        <div class="hs--answer-panel--add-image-to-answer__container-image" data-cid="${cid}">
                          <input type="text" id="imageInput${htmlId}" data-alt="${answerAlt}" class="hs--answer-panel--add-image-to-answer__input">
                          <p>${Translator.trans('upload_picture')}</p>
                          <img src="${answerImage}" alt="${answerAlt}" class="hs--answer-panel--add-image-to-answer__image">
                        </div>
                        <div class="hs--answer-panel--add-image-to-answer__container__button-group">
                          <div>
                            <button class="hs--answer-panel--add-image-to-answer__edit btn btn-default btn-xs">
                              <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" style="position: relative; top: 1px;" class="iconify iconify--carbon" width="12" height="12" preserveAspectRatio="xMidYMid meet" viewBox="0 0 32 32"><path d="M2 26h28v2H2z" fill="currentColor"></path><path d="M25.4 9c.8-.8.8-2 0-2.8l-3.6-3.6c-.8-.8-2-.8-2.8 0l-15 15V24h6.4l15-15zm-5-5L24 7.6l-3 3L17.4 7l3-3zM6 22v-3.6l10-10l3.6 3.6l-10 10H6z" fill="currentColor"></path></svg>

                              <span>${Translator.trans('change_picture')}</span>
                            </button>
                          </div>
                          <div>
                            <button class="hs--answer-panel--add-image-to-answer__remove btn btn-default btn-xs">
                              <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" style="position: relative; top: 1px;" class="iconify iconify--carbon" width="12" height="12" preserveAspectRatio="xMidYMid meet" viewBox="0 0 32 32"><path d="M12 12h2v12h-2z" fill="currentColor"></path><path d="M18 12h2v12h-2z" fill="currentColor"></path><path d="M4 6v2h2v20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8h2V6zm4 22V8h16v20z" fill="currentColor"></path><path d="M12 2h8v2h-8z" fill="currentColor"></path></svg>

                              <span>${Translator.trans('remove_picture')}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                `;

                // new render code
                var template = `
                  <div class="link ${status_class ? ' '+status_class : ''}" data-cid="${htmlId}" data-id="${cid}">
                    <div class="panel panel-default">
                      <div class="panel-heading" role="tab" id="heading${htmlId}">
                        <h4 class="panel-title">
                          <a role="button" data-toggle="collapse" data-parent="#accordion" href="#collapse${htmlId}"  aria-expanded="true" aria-controls="collapse${htmlId}">
                            ${text}
                          </a>
                          <div class="btn-group pull-right" ${direction !== 'backward' ? 'style="margin-top: -15px;"' : ''}>
                            ${iconInfo}
                            <button class="btn btn-default btn-xs ${js_answer}" type="button">
                              <span class="glyphicon ${glyphiconClass}"></span>
                            </button>
                            <button class="btn btn-default btn-xs js_answer_remove" type="button">
                              <span class="glyphicon glyphicon-trash"></span>
                            </button>
                          </div>
                          <div class="clearfix"></div>
                        </h4>
                      </div>
                      <div id="collapse${htmlId}" class="panel-collapse collapse" role="tabpanel" aria-labelledby="heading${htmlId}">
                        <div class="panel-body">
                          <textarea id="hs_rp_answer_heading_field_${htmlId}" ${placeholder ? `placeholder="${placeholder}"`: ''} class="form-control js_answer_label" style="margin-bottom:5px;">${placeholder == text ? '' : text }</textarea>
                          <div class="form-group">
                            <span>${Translator.trans('select_step')}</span>
                            <div class="target_box">
                              <input type="text" class="form-control js_answer_target" value="${targetText}" />
                              <input class="js_answer_target_hidden" id="target${cid}" type="hidden" value="${targetId}" />
                              <span class="new_target_hint"><span class="glyphicon glyphicon-info-sign"></span>&nbsp;${Translator.trans('will_create_new_step')}<b></b></span>
                            </div>
                          </div>
                          <div class="answer_status">
                            <div>${Translator.trans('answer_status')}</div>
                            <div class="btn-group" role="group" aria-label="">
                              <button type="button" class="btn btn-default js_answer_status${status === 'positive' ? ' active' : ''}" data-status="positive">
                                ${Translator.trans('answer_status_positive')}
                              </button>
                              <button type="button" class="btn btn-default js_answer_status${status !== 'positive' && status !== 'negative' ? ' active' : ''}" data-status="normal">
                                ${Translator.trans('answer_status_normal')}
                              </button>
                              <button type="button" class="btn btn-default js_answer_status${status === 'negative' ? ' active' : ''}" data-status="negative">
                                ${Translator.trans('answer_status_negative')}
                              </button>
                              </div>
                            </div>
                            ${isShowFieldAddImageToAnswer ? fieldAddImageToAnswer : ''}
                            <button id="hs_rp_answer_form_submit_btn_${htmlId}" class="btn btn-default js_save_answer" type="button">
                              ${ Translator.trans('save')}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                `;

              return template;
            },
            showStepInputs: function(s) {
                var iel = edit.find('.inputs').empty();
                var inputData = s.data('inputs');
                if (Array.isArray(inputData)) {
                    $.each(inputData, function(i, o) {
                        if (o.type === 'text') {
                            iel.append(self.constructor.getTextInputHtml()).find('.inp').last().find('textarea').val(o.title);
                        } else if (o.type === 'select' && Array.isArray(o.options)) {
                            var oel = iel.append(self.constructor.getSelectInputHtml()).find('.inp').last().find('textarea').val(o.title).end().find('.options');
                            $.each(o.options, function(i, o){
                                self.constructor.addSelectOption(oel);
                                oel.find('input').last().val(o);
                            });
                        }
                    });
                }
                self.constructor.refreshSortable();
            },
            showStepLinks: function(s) {
                var l = edit.find('.links').empty();
                var pts = jsp.getEndpoints(s);

                if (!Array.isArray(pts)) return;
                var links = [];
                var backLinks = [];
                var d = $(jsp.getContainer());

                var steps = [];
                var stepsById = [];



                $.each(jsp.getConnections({source:s.prop('id')}), function (i, o) {
                    var opt = {strokeStyle: 'red'};
                    o.setHoverPaintStyle(opt);
                    o.setPaintStyle(opt);
                    $(o.connector.svg).css('z-index', 11);
                });

                $.each(d.find('.step'), function(i, o) {
                    var s = $(o);
                    var text = (s.data('title')) ? s.data('title') : self.constructor.cutText(s.data('text'));
                    steps.push({value: s.prop('id'), label: (text) ? text.replace(/<\/?[^>]+>/gi, '') : ''});
                    stepsById[s.prop('id')] = (text) ? text.replace(/<\/?[^>]+>/gi, '') : '';
                });

                $.each(pts, function(i, o){
                    $.each(o.connections, function(i, o){
                        if (o.targetId === s.prop('id')) {
                            backLinks.push({label: o.getOverlay('label'), target: o.sourceId, cid: o.id, direction: 'backward'});
                        } else if (o.sourceId === s.prop('id')) {
                            links.push({label: o.getOverlay('label'), target: o.targetId, cid: o.id, direction: 'forward'});
                        }
                    });
                });
                var tempLinks = l,
                    addToLinks = function(i, o){
                        var label = o.label;
                        var id = $(label.getElement()).prop('id'),
                            text = $(label.getElement()).data('text'),
                            placeholder = $(label.getElement()).data('placeholder') || null,
                            status = $(label.getElement()).data('status')
                            images = $(label.getElement()).data('images') || null;

                        var currentType =

                        tempLinks.append(
                          self.constructor.getLinkHtml(
                            id,
                            text,
                            placeholder,
                            o.target,
                            stepsById[o.target],
                            o.cid,
                            status,
                            o.direction,
                            images,
                          )
                        );

                        if (images !== null && images.length > 0) {
                          var answerImage = images[0].src
                          $(`#imageInput${id}`).val(answerImage)
                        }
                    };
                $.each(links, addToLinks);
                tempLinks = edit.find('.links_back').empty();
                $.each(backLinks, addToLinks);

                if ($().sorttable) {

                    l.sortable({
                        stop: function( e, ui ) {
                            var newConnections = [];
                            var sourceByTarget = {};
                            var sorted = l.sortable('toArray', { attribute: 'data-id'});
                            $(sorted).each(function (sindex, targetId) {
                                $.each(jsp.getConnections(), function(i, o) {
                                    if (o.id === targetId) {

                                        $(o.getOverlay('label').getElement()).data('sort', (sorted.length-sindex));
                                        newConnections.push({
                                            source: o.sourceId,
                                            target: o.targetId,
                                            data: $(o.getOverlay('label').getElement()).data()
                                        });
                                        if(sourceByTarget[o.sourceId] === undefined){
                                            sourceByTarget[o.sourceId] = [o.targetId];
                                        } else{
                                            sourceByTarget[o.sourceId].push(o.targetId);
                                        }
                                    }
                                });
                            });
                            $.each(sourceByTarget, function(sourceId, targetIds){
                                $.each(jsp.getConnections({source:sourceId}), function(i, o) {
                                    if(targetIds.indexOf(o.targetId) !== -1){
                                        jsp.detach(o);
                                    }
                                });
                            });
                            $(newConnections).each(function (i, o) {
                                var newC = jsp.connect({source: o.source, target: o.target});

                                var $data = o.data;
                                var jl = newC.getOverlay('label');
                                $(jl.getElement()).data($data);

                                var answerText = strip_html($data.text);
                                jl.setLabel(self.constructor.cutText(answerText, 50)+self.constructor.getLinkRemoveHtml());
                                self.constructor.showStepLinks(self.constructor.selStep);
                            });
                            if(edit.find('.is_user_sort').prop('checked')) {
                                edit.find('.is_user_sort').trigger('click');
                            }
                            am.trigger('constructor has changes');
                        }
                    });
                    l.disableSelection();

                    edit.off('click', '.js_answers_sort').on('click', '.js_answers_sort', function (e) {
                        e.preventDefault();

                        var links = l.find('.link');
                        links.sort(function(a, b){
                            var $a = $(a).find('.js_answer_label').text().toUpperCase();
                            var $b =  $(b).find('.js_answer_label').text().toUpperCase();

                            return $a.localeCompare($b);
                        });
                        l.html(links);
                        l.sortable('option','stop')(null, {});
                        l.sortable('refresh');
                    });
                }

                setTimeout(function() {
                    $('.js_answer_target').autocomplete({
                        source: steps,
                        select: function (event, ui) {

                            var input = $(this);
                            var hidden = input.parents('.target_box').find('.js_answer_target_hidden');

                            input.val(ui.item.label);
                            hidden.val(ui.item.value);

                            return false;
                        },
                        change: function () {
                            var input = $(this);
                            var hidden = input.parents('.target_box').find('.js_answer_target_hidden');
                            var box = input.parents('.target_box');
                            var hint = box.find('.new_target_hint');

                            if (!hidden.val() && $(this).val()) {
                                hint.find('b').text($(this).val());
                                hint.css('display', 'inline-block');
                            }
                            else {
                                hint.hide();
                            }
                        },
                        focus: function (event, ui) {
                            $(this).val(ui.item.label);
                            return false;
                        },
                        response: function (event, ui) {

                            var input = $(this);
                            var box = input.parents('.target_box');
                            var hidden = box.find('.js_answer_target_hidden');
                            var hint = box.find('.new_target_hint');
                            hidden.val('');

                            if (!ui.content.length) {
                                hint.find('b').text($(this).val());
                                hint.css('display', 'inline-block');
                            }
                            else {
                                hint.hide();
                            }
                        }
                    });
                }, 1000);

                if (links.length > 1) {
                    edit.find('.js_answers_sort').show();
                    edit.find('.js_answers_user_sort').show();
                } else {
                    edit.find('.js_answers_sort').hide();
                    edit.find('.js_answers_user_sort').hide();
                }

                if (links.length > 0) {
                    edit.find('.js_answers').show();
                } else {
                    edit.find('.js_answers').hide();
                }

                edit.find('.js_answers_back').hide();
                if (backLinks.length > 0) {
                    edit.find('.js_collapse_answer_back').show()
                        .find('.glyphicon').removeClass('glyphicon-menu-up').addClass('glyphicon-menu-down');
                } else {
                    edit.find('.js_collapse_answer_back').hide();
                }

            },
            cutText: function(text, lim) {
                if (!text) return text;
                lim = am.naturalize(lim);
                if (lim < 1) lim = 100;
                if (text.length > lim + 3) {
                    var cutObj = new CutString(text, lim);
                    text = cutObj.cut() + '...';
                }
                return text;
            },
            selStep: null,
            initSortFastStep: function(){
                try{
                    $('.js_faststep_list_sorting').sortable('destroy');
                }catch (e) {
                    console.log('sortable not init');
                }
                $('.js_faststep_list_sorting').sortable({
                    stop: function( e, ui ) {
                        self.scripts.refreshSortingStarredList();
                    }
                });
            }
        },
        /*************************************************************************/
        scripts: {
            processed: false,
            doSaveButtonGlimmering: false,
            startSaveButtonGlimmering: function() {
                if (self.scripts.doSaveButtonGlimmering) return;
                self.scripts.doSaveButtonGlimmering = true;
                var n = 0, c = ['btn-success', 'js_scripts_action_save_btn_alarm'];
                var fn = function() {
                    $('.js_scripts_action_save').switchClass(c[n], c[(n + 1) % 2], 1000, function(){
                        n = (n + 1) % 2;
                        if (n === 0 && !self.scripts.doSaveButtonGlimmering) return;
                        fn();
                    });
                };
                fn();
            },
            stopSaveButtonGlimmering: function() {
                self.scripts.doSaveButtonGlimmering = false;
            },
            showSaveFatalErrorModal: function(id, target, data, script, error) {
                $('#hs_script_serialized_backup').text(self.scripts.getSerializedBackup(id, target, data, script, error));
                $('#show_save_fatal_error').modal({keyboard: false, backdrop: false});
            },
            getSerializedBackup: function(id, target, data, script, error) {
                var arr = {
                    id: id,
                    error_time: new Date().toLocaleString(),
                    script: script,
                    error: error,
                    user_email: $('#js_user_info').data('email'),

                    target: target,
                    data: data
                };
                return btoa(unescape(encodeURIComponent(JSON.stringify(arr))));
            },
            saveDraft: function() {
                let boxel = $('.js_editor');
                if (!boxel.length) return;

                am.jwt.jwtRequest(
                        draftsApiUrl + 'api/save',
                        'post',
                        {
                            id: boxel.data('id'),
                            target: boxel.data('target'),
                            data: self.constructor.save(jsp)
                        }
                    );
            },
            refreshSortingStarredList: function() {
                var i = 0;
                var sortingArray = [];
                $(".js_faststep_list_sorting li").each(function() {
                        $(this).data("sorting", i);
                        var id = $(this).data("id");
                        sortingArray[id] = i;
                        i++;
                    });

                    self.constructor.updateStepStarredSorting(jsp, sortingArray);
            },
            updateStarredList: function() {
                let boxel = $('.js_editor');
                if (!boxel.length) return;
              /*  let data = self.constructor.save(jsp),
                    starredSteps = [],
                    sortingArray = [],
                    steps = data['steps'];
                for (let i = 0; i < steps.length; i++) {
                    if (steps[i]['is_starred']) {
                        starredSteps[steps[i]["id"]] = steps[i]["starred_text"];
                        sortingArray.push([steps[i]["id"], steps[i]["starred_sorting"]]);
                    }
                }
                sortingArray.sort(function (a, b) {
                    return a[1] - b[1];
                });
                let ul = $(".js_faststep_list_sorting");
                ul.html("");
                sortingArray.forEach(function (item) {
                    ul.append('<li data-id="' + item[0] + '" class="list-group-item" data-sorting="' + item[1] + '">' + starredSteps[item[0]] + "</li>");
                })*/

                //new HSS-815, remove above ^
                let data = boxel.data('data');
                let ul = $(".js_starred_list_sorting");
                ul.html("");
                let starredArray = data['starred'];
                starredArray.forEach(function (group, index) {
                    ul.append('<li data-id="' + group.n + '" class="list-group-item" data-sorting="' + index + '">' + group.n + "</li>");
                });
            },
            updateQuicklinks: function() {
                self.steps.forEach(function (step) {
                    step.is_starred = false;
                    step.starred_sorting = 0;
                    self.view_quicklinks.forEach(function (value) {
                        if(step.id === value.id){
                            step.is_starred = true;
                            step.starred_sorting = value.sortOrder;
                            step.starred_text = value.title;
                        }
                    });
                });


                let sortingArray = [];
                self.view_quicklinks.forEach(function (value, key) {
                    sortingArray[value.id] = key;
                });

                self.constructor.updateStepStarredSorting(jsp, sortingArray);

                let d = $(jsp.getContainer());
                d.find('.step').map(function (i, o) {
                    let s = $(o);
                    let id = s.prop('id');
                    s.data('starred_sorting', sortingArray[id]);
                    let isStarred = sortingArray[id] !== undefined;
                    if (isStarred != s.data('is_starred')) {
                        s.data('is_starred', isStarred);
                        s[isStarred ? 'addClass' : 'removeClass']('is_starred');
                        if (isStarred) {
                            let starredText = '';
                            self.view_quicklinks.forEach(function (value, key) {
                                if (value.id === id) {
                                    starredText = value.title;
                                }
                            });
                            s.data('starred_text', starredText)
                        }
                        am.trigger('constructor step is_starred changed', [s]);
                    }
                });
            },
            init: function() {
                var boxel = $('.js_editor');
                if (!boxel.size()) return;

                am.on('add script start', function(e, callbackToPassScriptDataTo){
                    if (!jsp) self.constructor.init();
                    self.constructor.reset(jsp);
                    if (typeof callbackToPassScriptDataTo === 'function') {
                        callbackToPassScriptDataTo(self.constructor.save(jsp));
                    }
                }).on('add script done', function (e, res) {
                    $('.js_editor').data('id', res.id);
                    // self.scripts.initScriptsList(res.scripts);
                    app.scriptFolder.renderFolders();
                    app.scriptFolder.renderScripts();
                    $('.js_scripts_list_box .js_show_script[data-id=' + res.id + ']').click();
                }).on('tab selected', function (data) {
                    let favBox = $('.js_favorites_box');
                    favBox.hide();
                    if (data.args.length) {
                        if (data.args.includes('js_constructor_box')) {
                            favBox.show();
                            var shouldOpen = localStorage.getItem('favorites_box_open');
                            var isHidden = $('.js_favorites_box').hasClass('hidden')
                            if (shouldOpen === null || shouldOpen === "true" && !isHidden) {
                                favBox.addClass('open');
                            }
                        }
                        if (data.args.includes('js_view_box')) {
                            $('#chatra').hide();
                        }
                    }
                });

                // $(document).on('keyup', '#js_scripts_search', function(e) {
                //     var search = $(this).val();
                //     $('.script__item .panel-header h4').closest('.script__item').removeClass('script__item-found');
                //     if (search.length > 0)
                //         $('.script__item .panel-header h4[data-normalized*=\''+search.toLowerCase()+'\']').closest('.script__item').addClass('script__item-found');
                // });

                $(document).on('click', '.js_new_script',function(e){
                    e.preventDefault();
                    $('#scriptsNameFormError').val('');
                    //$('.js_scripts_edit_box').show();
                    app.get('libAddScript').done(function(l){l.showPopup()});
                });

                /**
                 * обработка нажатия на кнопку создания квиза
                 */
                $(document).on('click', '#quiz-btn-create',function(e){
                  e.preventDefault();
                  $('#scriptsNameFormError').val('');
                  //$('.js_scripts_edit_box').show();
                  app.get('libAddQuiz').done(function(l){l.showPopup()});
                });

                $(document).on('click', '.js_new_quiz',function(e){
                    e.preventDefault();
                    $('#scriptsNameFormError').val('');
                    //$('.js_scripts_edit_box').show();
                    app.get('libAddQuiz').done(function(l){l.showPopup()});
                });



                $('.js_rename_script').click(function(e){
                    e.preventDefault();
                    $('#scriptsRenameFormError').val($('.js_selected_script_name').text());
                    $('#rename_script_id').val($('.js_editor').data('id'));
                    $.fancybox.open($('.js_scripts_rename_script'));
                });

                $('.js_copy_script').click(function(e){
                    e.preventDefault();
                    $.fancybox.open($('.js_scripts_copy_script'));
                });

                $('.js_scripts_rename_script form').submit(function(e){

                    e.preventDefault();
                    var name = $('#scriptsRenameFormError').val();
                    var scriptID = $('#rename_script_id').val();

                    if (self.busy) return;
                    self.busy = true;

                    $.fancybox.showLoading();

                    am.promiseCmd({
                        method: 'scripts.rename',
                        id: scriptID,
                        name: name
                    }).always(function(){
                        self.busy = false;
                        $.fancybox.hideLoading();
                    }).done(function(res){
                        if ($('.js_list_box').css('display') === 'none') {
                            $('.js_selected_script_name').text(name);
                        }
                        $('.js_show_script[data-id=' + scriptID + '] h4').text(name);
                        $.fancybox.close();
                    }).fail(function(err){
                        console.log(err);
                    });
                });

                $('.js_script_target').on('change, keyup', function(){

                    var value = $(this).val();
                    boxel.data('target', value);
                    am.trigger('constructor has changes');
                });

                $('.js_scripts_copy_script form').submit(function(e){

                    e.preventDefault();
                    var name = $('#scriptsCopyFormError').val();
                    var scriptID = $('.js_editor').data('id');

                    if (self.busy) return;
                    self.busy = true;

                    $.fancybox.showLoading();

                    am.promiseCmd({
                        method: 'scripts.copy',
                        id: scriptID,
                        name: name
                    }).always(function(){
                        self.busy = false;
                        $.fancybox.hideLoading();
                    }).done(function(res){

                        am.cUrl.setAnchorParam('s', res.id);
                        if ('localStorage' in window && window['localStorage'] !== null) {
                            window.localStorage.setItem('current_script', res.id);
                        }

                        var expires = new Date(new Date().getTime()+3600 * 24 * 1000).toUTCString();
                        document.cookie = 'crnscrd='+res.id+'; Expires='+expires+'; Path=/';

                        setTimeout(function(){
                            window.location.reload();
                        }, 10);
                    }).fail(function(err){
                        console.log(err);
                    });
                });

                $('.js_scripts_action_delete').click(function(e){
                    e.preventDefault();

                    app.get('all').done(function(all){
                        var msg = self.currentScriptType === 'script'
                          ? Translator.trans('are_you_sure_delete_script')
                          : Translator.trans('are_you_sure_delete_quiz');
                        all.confirm.show(msg, function(){
                            if (self.busy) return;
                            self.busy = true;

                            var boxel = $('.js_editor');
                            if (!boxel.size()) return;

                            $.fancybox.showLoading();
                            am.promiseCmd({
                                method: 'script.delete',
                                id: boxel.data('id')
                            }).always(function(){
                                self.busy = false;
                                $.fancybox.hideLoading();
                            }).done(function(res){
                                am.cUrl.removeAnchorParam('s');

                                if (!res.scripts.length && self.isHs()) window.location.href = '/add_script';
                                app.scriptFolder.deleteScript(boxel.data('id'));
                                // self.scripts.initScriptsList(res.scripts);
                                app.scriptFolder.renderFolders();
                                app.scriptFolder.renderScripts();
                                self.constructor.reset(jsp);

                                boxel.find('.js_scripts_edit_box').hide();
                                $('.js_box').hide();

                                $.fancybox.close();

                                if (self.isHs()) {
                                    $('.js_scripts_list .js_show_script').first().click();
                                }
                            }).fail(function(err){
                            });
                        });
                    });

                });

                $('.js_scripts_action_save').click(function(e){

                    var c = $('.js_desk');
                    var zoom = 1;

                    var matrix = c.css('transform').match(/(-?[0-9\.]+)/g);
                    if (matrix) {
                        zoom = matrix[0];
                    }

                    c.css('transform', 'scale(' + (parseFloat(1)) + ')');
                    c.css('transform-origin', '0 0');
                    jsp.setZoom(1);

                    e.preventDefault();

                    var boxel = $('.js_editor');
                    if (!boxel.length) return;

                        if (busy) return;
                        busy = true;

                    am.trigger('constructor save started');

                    let tabResultIsOpen = $('#hs_smenu_result').parent().hasClass('active')

                    $('.js_show_constructor').trigger('click');

                    $.fancybox.showLoading();
                    am.promiseCmd({
                      method: 'scripts.update',
                      id: boxel.data('id'),
                      target: boxel.data('target'),
                      show_quiz_results: boxel.data('show_quiz_results'),
                      quiz_background: boxel.data('quiz_background'),
                      quiz_options: boxel.data('quiz_options'),
                      data: self.constructor.save(jsp),
                    }).always(function(){
                        c.css('transform', 'scale(' + (parseFloat(zoom)) + ')');
                        c.css('transform-origin', '0 0');
                        jsp.setZoom(1);
                        busy = false;
                        if (self.currentScriptType === 'quiz' && tabResultIsOpen) {
                          $('#hs_smenu_result').trigger('click');
                        }
                        $.fancybox.hideLoading();
                    }).done(function(res){
                        boxel.data('id', res.id);
                        boxel.data('ver', res.ver);
                        $.fancybox.close();
                        am.trigger('constructor has no changes');
                        am.trigger('constructor save finished');
                    }).fail(function(err){
                        self.scripts.showSaveFatalErrorModal(boxel.data('id'),
                            boxel.data('target'),
                            self.constructor.save(jsp),
                            boxel.data(), err);
                        console.log(err);
                    });
                });

                $('.js_scripts_action_view').click(function(e){
                    e.preventDefault();

                    // if ($(this).is('.open')) {
                    //     $(this).removeClass('open');
                    //     $('.js_box').hide();
                    //     $('.js_settings_box').hide();
                    //     $('.js_view_box').show();
                    //     return;
                    // }

                    $('.progressBar').show();
                    $('.js_settings_box').hide();
                    $('.js_design_box').removeClass('is-focus');
                    $('.zoom-btns').removeClass('settings_box_open');
                    var boxel = $('.js_editor');
                    if (boxel.length !== 1) return;

                    var sebel = $('.js_scripts_edit_box');
                    if (sebel.length < 1) return;

                    var data = boxel.data('data');
                    if (self.role === 'ROLE_SCRIPT_WRITER' || self.role === 'ROLE_ADMIN') {
                        data = self.constructor.save(jsp);
                    }

                    if (self.view.hasChanges()) {
                        self.view.stopScriptAndSaveLog('leave');
                    }

                    self.view.openAndLaunchScript(boxel.data('id'), boxel.data('ver'), boxel.data('name'),
                        data, boxel.data('target'));

                    $('.js_box').hide();
                    $('.js_view_box').show();

                    am.trigger('tab selected', ['js_view_box']);
                });

                $('.js_show_constructor').click(function(){
                    app.addField.clearFieldValues();

                    $(this).find('.js_show_constructor_title').removeClass('js_show_constructor_title_inactive');
                    $('.js_show_notes').removeClass('js_show_notes_active');
                    //$('.js_show_quick_links').removeClass('js_show_quick_links_active');
                });

                self.scripts.initShowScriptButtons();
                self.scripts.initTabs();

                (function(){

                    var currentScript = am.cUrl.getAnchorParam('s');
                    if ('localStorage' in window && window['localStorage'] !== null && currentScript == null) {
                        currentScript = window.localStorage.getItem('current_script');
                    }
                    if (currentScript && currentScript !== 'null' && document.referrer.split('/')[3] !== '') {
                        $('.js_scripts_list .js_show_script[data-id='+currentScript+']').click();

                    } else {
                        if (self.isHs()) {
                            $('.js_back_to_list').click();
                        }
                    }
                })();

                (function(){
                    var conversion_box = $('.js_conversion_box');
                    conversion_box.find('.select2').select2({
                        theme: "bootstrap"
                    });

                    var statJsp = null;
                    var statDesk = $('.js_stat_desk');
                    var statBox = $('.js_stats_box');
                    var busy = false;
                    var vss = $('.version_stats_sel');
                    var uss = $('.user_stats_sel');
                    let fdf = $('.js_stats_filter_from');
                    let fdt = $('.js_stats_filter_to');

                    if(!fdf.val()) {
                        let dt = new Date();
                        dt.setDate(dt.getDate()-3);
                        fdf.datepicker({
                            defaultDate: dt
                        }).datepicker('setDate', dt);
                    }
                    if(!fdt.val()) {
                        let dt = new Date();
                        fdt.datepicker({
                            defaultDate: dt
                        }).datepicker('setDate', dt);
                    }
                    vss.on('change', function () {
                        $('.js_show_conversion').trigger('click', [vss.val(), uss.val(), fdf.val(), fdt.val()]);
                    });
                    uss.on('change', function () {
                        $('.js_show_conversion').trigger('click', [vss.val(), uss.val(), fdf.val(), fdt.val()]);
                    });
                    fdf.on('change', function () {
                        $('.js_show_conversion').trigger('click', [vss.val(), uss.val(), fdf.val(), fdt.val()]);
                    });
                    fdt.on('change', function () {
                        $('.js_show_conversion').trigger('click', [vss.val(), uss.val(), fdf.val(), fdt.val()]);
                    });


                    $('.js_show_conversion').click(function(e, maybeVer, maybyOperator, filterFrom, filterTo) {
                        e.preventDefault();
                        if (busy) return;
                        let id = am.naturalize($('.js_scripts_list .js_show_script.active').data('id'));
                        if (id < 1) return;
                        let ver = undefined;
                        if (am.naturalize(maybeVer) > 0) ver = am.naturalize(maybeVer);

                        let operator = undefined;
                        if (am.naturalize(maybyOperator) > 0) operator = am.naturalize(maybyOperator);

                        let dt = new Date();
                        if (filterTo === undefined) {
                            filterTo = ("0" + dt.getDate()).slice(-2) + "." + ("0" + (dt.getMonth() + 1)).slice(-2) + "." + dt.getFullYear();
                        }
                        if (filterFrom === undefined) {
                            dt.setDate(dt.getDate() - 3);
                            filterFrom = ("0" + dt.getDate()).slice(-2) + "." + ("0" + (dt.getMonth() + 1)).slice(-2) + "." + dt.getFullYear();
                        }
                        let start = filterFrom.split(".");
                        filterFrom = start[2] + "-" + start[1] + "-" + start[0];

                        let end = filterTo.split(".");
                        filterTo = end[2] + "-" + end[1] + "-" + end[0];

                        let btnExcel = $('.js_stats_to_excel');
                        btnExcel.addClass('hidden');
                        if (filterFrom.length > 5 && filterTo.length > 5) {
                            btnExcel.removeClass('hidden');
                        }

                        btnExcel.button('loading');


                        busy = true;
                        if (statJsp instanceof jsPlumbInstance) {
                            statJsp.reset();
                        }

                        let analytics_tabs = $('.script_tabs_analytics');
                        // показываем первый таб при клике по меню аналитики
                        analytics_tabs.find('a:first').tab('show');

                        analytics_tabs.on('shown.bs.tab', function (e) {
                            $('.up_version_stats_sel').trigger('change');
                        });

                        statJsp = jsPlumb.getInstance({
                            Endpoint: ['Dot', {radius: 2}],
                            HoverPaintStyle: {strokeStyle: '#2b99d2', lineWidth: 2},
                            ConnectionOverlays: [
                                ['Arrow', {location: 1, id: 'arrow', length: 10, foldback: 0.5, width: 10}],
                                ['Label', {label: '-', location: 0.5, id: 'label', cssClass: 'condition'}]
                            ],
                            Container: statDesk
                        });
                        self.constructor.unload(statJsp);

                        $.fancybox.showLoading();
                        self.view.updateScriptStatistic(id);
                        analytics_tabs.find('li').addClass('disabled');
                        vss.prop('disabled', true);
                        uss.prop('disabled', true);
                        statDesk.find('.js_stats_notice').remove();
                        am.promiseCmd({
                            method: 'script.get_stats',
                            id: id,
                            ver: ver,
                            operator: operator,
                            filter_from: filterFrom,
                            filter_to: filterTo
                        }).always(function(){
                            btnExcel.button('reset');
                            btnExcel.prop('href',
                                '/scripts/' + id +
                                '/pass_stats_' + (ver !== undefined?ver:0) +
                                '_' + (operator !== undefined?operator:0) +
                                '_' + filterFrom.replace(/\./g,'-') +
                                '_' + filterTo.replace(/\./g,'-') +
                                '.xls'
                            );

                            busy = false;
                            $.fancybox.hideLoading();
                        }).done(function(res){
                            // am.analyticsRequest('api/stat',{scriptId: id},function(curResponse) {
                            //     // console.log('UPDATE STATISTICS');
                            //     $('.js_conversion_count').text(am.naturalize(curResponse.conversion));
                            //     $('.js_passages_count').text(curResponse.runs_count);
                            // });
                            // $('.js_editor .js_conversion_count').text(am.naturalize(res.script_stats.conversion));
                            // $('.js_editor .js_passages_count').text(res.script_stats.runs_count);
                            self.constructor.addStepOpts.disableAll();
                            self.constructor.load(statJsp, res.node_stats, true);
                            self.constructor.addStepOpts.enableAll();
                            analytics_tabs.find('li').removeClass('disabled');
                            vss.empty();
							$.each(res.versions, function(i, o) {
								vss.append('<option value="'+o+'">'+o+'</option>');
							});
							if (res.versions.length > 1) {
								vss.val(res.ver).prop('disabled', false);
							}
                            uss.empty();
                            uss.append($('<option/>', {text:Translator.trans('all_operators')}));
                            $.each(res.operators, function(i, o) {
                                uss.append($('<option/>', {value: o.id, text:o.name, selected: o.selected}));
                            });
                            uss.prop('disabled', false);
                            let depStats = res.script_stats;
                            if (!isNaN(res.ver)) depStats = res.ver_stats;
                            let runsCount = am.naturalize(depStats.runs_count);
                            $.each(['runs_count', 'runs_with_unexpected_answer_count', 'runs_forcefully_interrupted_count',
                                'runs_achieved_goal_count'], function (i, o) {
                                let cnt = am.naturalize(depStats[o]);
                                let per = runsCount > 0 ? (Math.round(cnt / runsCount * 100 * 10) / 10) : 0;
                                statBox.find('.stat_' + o).find('.count').text(cnt).end().find('.percent').text(per);
                            });

							/*
							var workerList = $('#script_tab_productivity').find('.worker_list').empty();
                            var workerHead = statBox.find('.worker_list_head');
                            workerHead.hide();

                            workerHead.show();
                            $.each(res.worker_stats, function(i, o) {
                                workerList.append([
                                    '<div>'+o.name,
                                    ' = ' + (o.runs_achieved_goal_count),
                                    '/' + o.runs_count + ' ' + Translator.trans('calls') + ' ',
                                    ' (' + Math.round( o.conversion * 10 ) / 10 + '%)',
                                    '</div>'
                                ].join(''));
                            });
                            */

                            if (typeof res.notice === 'string') {
								statDesk.append('<div class="js_stats_notice">'+Translator.trans(res.notice)+'</div>');
							}
						});
                    });



                    (function () {
                        var vssu = $('.up_version_stats_sel');
                        var ussu = $('.up_user_stats_sel');

                        vssu.on('change', function(){
                            up_show_conversion(vssu.val(), ussu.val());
                        });

                        ussu.on('change', function(){
                            up_show_conversion(vssu.val(), ussu.val());
                        });

                        function up_show_conversion(maybeVer, maybyOperator) {

                            var id = am.naturalize($('.js_scripts_list .js_show_script.active').data('id'));
                            if (id < 1) return;
                            var ver = undefined;
                            if (am.naturalize(maybeVer) > 0) ver = am.naturalize(maybeVer);
                            var operator = undefined;
                            if (am.naturalize(maybyOperator) > 0) operator = am.naturalize(maybyOperator);
                            busy = true;

                            $.fancybox.showLoading();
                            vssu.prop('disabled', true);
                            ussu.prop('disabled', true);
                            am.promiseCmd({
                                method: 'script.get_stats',
                                id: id,
                                ver: ver,
                                operator: operator,
                            }).always(function(){
                                busy = false;
                                $.fancybox.hideLoading();
                            }).done(function(res){
                                vssu.empty();
                                $.each(res.versions, function(i, o) {
                                    vssu.append('<option value="'+o+'">'+o+'</option>');
                                });
                                if (res.versions.length > 1) {
                                    vssu.val(res.ver).prop('disabled', false);
                                }
                                ussu.empty();
                                ussu.append($('<option/>', {text:Translator.trans('all_operators')}));
                                $.each(res.operators, function(i, o) {
                                    ussu.append($('<option/>', {value: o.id, text:o.name, selected: o.selected}));
                                });
                                ussu.prop('disabled', false);

                                var workerList = $('#script_tab_productivity').find('.worker_list').empty();
                                var workerHead = statBox.find('.worker_list_head');
                                workerHead.show();
                                $.each(res.worker_stats, function(i, o) {
                                    workerList.append([
                                        '<div>'+o.name,
                                        ' = '+am.naturalize(o.runs_achieved_goal_count),
                                        '/'+am.naturalize(o.runs_count) + ' ' + Translator.trans('calls') + ' ',
                                        ' ('+am.naturalize(Math.round(o.conversion))+'%)',
                                        '</div>'
                                    ].join(''));
                                });
                            });
                        };

                    })();

                    $('.script_tabs_analytics a[data-toggle="tab"]').on('show.bs.tab', function (e) {
                        if ($(this).closest('li').hasClass('disabled')) {
                            e.preventDefault();
                            return false;
                        }
                        var $target = $(e.target); // newly activated tab
                        if ($target.prop('hash') == '#script_tab_dynamics') {
                            $('.js_dynamic_filter').trigger('click');
                            return;
                        }
                        if ($target.prop('hash') == '#script_tab_conversion_to_goals') {
                            $('.js_conversion_to_goals_filter').trigger('click');
                            return;
                        }
                    });

                    $('.js_conversion_to_goals_filter').on('click', function(e) {
                        var $item = $(this);
                        e.preventDefault();
                        if (busy) return;
                        var id = am.naturalize($('.js_scripts_list .js_show_script.active').data('id'));
                        if (id < 1) return;
                        busy = true;
                        $.fancybox.showLoading();
                        am.promiseCmd({
                            method: 'script.get_stat_goals',
                            id: id,
                            user: $('.js_conversion_to_goals_filter_operator').val(),
                            date_from: $('.js_conversion_to_goals_filter_from').val(),
                            date_to: $('.js_conversion_to_goals_filter_to').val(),
                            ver: $('.js_version_conversion_to_goals').val(),
                        }).always(function(){
                            busy = false;
                            $.fancybox.hideLoading();
                        }).done(function(res){
                            var dates = res.dates;
                            var users = res.users;
                            var versions = res.versions;
                            var ver = res.ver;
                            var stats = res.stats;

                            $('.js_conversion_to_goals_filter_from').val(dates.from);
                            $('.js_conversion_to_goals_filter_to').val(dates.to);

                            var $operator = $('.js_conversion_to_goals_filter_operator');
                            $operator.on('change', function () {
                                $item.trigger('click');
                            });
                            $operator.empty();
                            $operator.append(
                                $('<option>', {text: Translator.trans('choose_operator')})
                            );
                            users.forEach(function (user, i) {
                                $operator.append(
                                    $('<option>', {text: user.name, value: user.id, selected: user.selected})
                                );
                            });

                            var $version = $('.js_version_conversion_to_goals');
                            $version.prop('disabled', false);
                            $version.on('change', function () {
                                $item.trigger('click');
                            });
                            $version.empty();
                            versions.forEach(function (v, i) {
                                $version.append(
                                    $('<option>', {text: v, value: v, selected: ver == v})
                                );
                            });



                            var box = $('#script_tab_conversion_to_goals');

                            box.find('.js_conversion_to_goals_table').remove();
                            box.append('<table class="table js_conversion_to_goals_table"></table>');

                            var passBox = $('.js_conversion_to_goals_table');
                            var htmlHead = '<tr class="ui-sortable">' +
                                '<th class="no-sort th-datetime">' + Translator.trans('goal') + '</th>' +
                                '<th class="no-sort th-datetime">' + Translator.trans('conversion') + '</th>' +
                                '<th class="no-sort">' + Translator.trans('runs') + '</th>';

                            passBox.find('tr').remove();
                            passBox.append(htmlHead);

                            $.each(stats, function(i, pass) {
                                var htmlRow = '<tr>';

                                htmlRow += '<td class="no-sort">' + pass.name + '</td>';
                                htmlRow += '<td class="no-sort">' + Math.round((pass.cnt>0 && pass.goals>0 ? (pass.goals / pass.cnt) * 100 : 0 )) + '%</td>';
                                htmlRow += '<td class="no-sort">' +  pass.goals + '</td>';

                                htmlRow += '</tr>';

                                passBox.append(htmlRow);
                            });
                        });
                    });



                    $('.js_dynamic_filter').on('click', function(e) {
                        var $item = $(this);
                        e.preventDefault();
                        if (busy) return;
                        var id = am.naturalize($('.js_scripts_list .js_show_script.active').data('id'));
                        if (id < 1) return;
                        busy = true;
                        $.fancybox.showLoading();
                        am.promiseCmd({
                            method: 'script.get_stat_dynamics',
                            id: id,
                            user: $('.js_dynamic_filter_operator').val(),
                            date_from: $('.js_dynamic_filter_from').val(),
                            date_to: $('.js_dynamic_filter_to').val(),
                        }).always(function(){
                            busy = false;
                            $.fancybox.hideLoading();
                        }).done(function(res){
                            var dates = res.dates;
                            var users = res.users;
                            var stats = res.stats;

                            $('.js_dynamic_filter_from').val(dates.from);
                            $('.js_dynamic_filter_to').val(dates.to);

                            var $operator = $('.js_dynamic_filter_operator');
                            $operator.on('change', function () {
                                $item.trigger('click');
                            });
                            $operator.empty();
                            $operator.append(
                                $('<option>', {text: Translator.trans('choose_operator')})
                            );
                            users.forEach(function (user, i) {
                                $operator.append(
                                    $('<option>', {text: user.name, value: user.id, selected: user.selected})
                                );
                            });


                            var color_success = '#74e374';
                            var color_nosuccess = '#e37474';

                            var categories  = [];
                            var series      = [];
                            var series_duration      = [];
                            var series_successful    = [];
                            var series_no_successful = [];
                            var series_relation      = [];
                            var series_pie           = [];
                            var user_stat            = {};
                            var user_stat_duration   = {};
                            var user_stat_successful = {};
                            var user_stat_no_successful = {};
                            var user_stat_relation      = {};
                            var summ = {
                                type: 'spline',
                                name: Translator.trans('analytics_dynamic_cnt_release'),
                                data: []
                            };
                            var stat_summ_relation = {
                                name: Translator.trans('analytics_dynamic_cnt_successful'),
                                color: color_success,
                                data: []
                            };
                            var stat_summ_norelation = {
                                name: Translator.trans('analytics_dynamic_cnt_no_successful'),
                                color: color_nosuccess,
                                data: []
                            };


                            var date22 = new Date(2017,7,23);
                            stats.forEach(function(stat, i) {
                                var is_goal_visible = true;
                                var date = new Date(stat.date);
                                if (date.getTime() < date22.getTime()) {
                                    is_goal_visible = false;
                                }

                                categories.push(stat.date);
                                var sum = 0;
                                var sum_success = 0;
                                stat.users.forEach(function(user, v) {
                                    if (!user_stat[user.user_name]) {
                                        user_stat[user.user_name] = {
                                            type: 'column',
                                            name: user.user_name,
                                            data: []
                                        };
                                        user_stat_duration[user.user_name] = {
                                            name: user.user_name,
                                            data: []
                                        };
                                        user_stat_successful[user.user_name] = {
                                            name: user.user_name,
                                            data: []
                                        };
                                        user_stat_no_successful[user.user_name] = {
                                            name: user.user_name,
                                            data: []
                                        };
                                        user_stat_relation[user.user_name] = {
                                            name: user.user_name,
                                            data: []
                                        };
                                    }
                                    sum += user.cnt;
                                    user_stat_duration[user.user_name]['data'].push(user.duration);
                                    user_stat[user.user_name]['data'].push(user.cnt);

                                    sum_success += (is_goal_visible?user.successful:0);
                                    user_stat_successful[user.user_name]['data'].push((is_goal_visible?user.successful:0));
                                    user_stat_no_successful[user.user_name]['data'].push((is_goal_visible?(user.cnt - user.successful):0));
                                });

                                summ['data'].push(sum);

                                stat_summ_relation['data'].push(is_goal_visible?sum_success:0);
                                stat_summ_norelation['data'].push(is_goal_visible?(sum - sum_success):0);
                            });

                            var sum = 0;
                            stat_summ_relation['data'].forEach(function (value, i) {
                                sum += value;
                            });
                            series_pie.push({name: Translator.trans('analytics_dynamic_cnt_successful'), color: color_success, y: sum});
                            sum = 0;
                            stat_summ_norelation['data'].forEach(function (value, i) {
                                sum += value;
                            });
                            series_pie.push({name: Translator.trans('analytics_dynamic_cnt_no_successful'), color: color_nosuccess, y: sum});

                            series_relation.push(stat_summ_relation);
                            series_relation.push(stat_summ_norelation);

                            $.each(user_stat_duration, function(i, user) {
                                series_duration.push(user);
                            });
                            $.each(user_stat, function(i, user) {
                                series.push(user);
                            });
                            series.push(summ);
                            $.each(user_stat_successful, function(i, user) {
                                series_successful.push(user);
                            });
                            $.each(user_stat_no_successful, function(i, user) {
                                series_no_successful.push(user);
                            });


                            Highcharts.chart('chart_div_cnt', {
                                title: {
                                    text: Translator.trans('analytics_dynamic_cnt_pass_head')
                                },
                                yAxis: {
                                    title: {
                                        text: Translator.trans('analytics_dynamic_cnt_release')
                                    },
                                },
                                xAxis: {
                                    categories: categories
                                },
                                series: series,
                                credits: {
                                    enabled: false
                                },
                            });

                            Highcharts.chart('chart_div_duration', {
                                chart: {
                                    type: 'column'
                                },
                                title: {
                                    text: Translator.trans('analytics_dynamic_cnt_hours')
                                },
                                xAxis: {
                                    categories: categories,
                                    crosshair: true
                                },
                                yAxis: {
                                    min: 0,
                                    title: {
                                        text: Translator.trans('analytics_dynamic_duration_release')
                                    }
                                },
                                tooltip: {
                                    headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
                                    pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                                        '<td style="padding:0"><b>{point.y:.1f} h</b></td></tr>',
                                    footerFormat: '</table>',
                                    shared: true,
                                    useHTML: true
                                },
                                plotOptions: {
                                    column: {
                                        pointPadding: 0.2,
                                        borderWidth: 0
                                    }
                                },
                                series: series_duration,
                                credits: {
                                    enabled: false
                                },
                            });

                            Highcharts.chart('chart_div_successful', {
                                chart: {
                                    type: 'areaspline'
                                },
                                title: {
                                    text: Translator.trans('analytics_dynamic_cnt_successful')
                                },
                                xAxis: {
                                    categories: categories,
                                },
                                yAxis: {
                                    title: {
                                        text: Translator.trans('analytics_dynamic_cnt_successful_yAxis_title')
                                    }
                                },
                                tooltip: {
                                    shared: true
                                },
                                plotOptions: {
                                    areaspline: {
                                        fillOpacity: 0.5
                                    }
                                },
                                series: series_successful,
                                credits: {
                                    enabled: false
                                },
                            });

                            Highcharts.chart('chart_div_no_successful', {
                                chart: {
                                    type: 'areaspline'
                                },
                                title: {
                                    text: Translator.trans('analytics_dynamic_cnt_no_successful')
                                },
                                xAxis: {
                                    categories: categories,
                                },
                                yAxis: {
                                    title: {
                                        text: Translator.trans('analytics_dynamic_cnt_no_successful_yAxis_title')
                                    }
                                },
                                tooltip: {
                                    shared: true
                                },
                                plotOptions: {
                                    areaspline: {
                                        fillOpacity: 0.5
                                    }
                                },
                                series: series_no_successful,
                                credits: {
                                    enabled: false
                                },
                            });

                            Highcharts.chart('chart_div_successful_relation', {
                                chart: {
                                    type: 'areaspline'
                                },
                                title: {
                                    text: Translator.trans('analytics_dynamic_call_ratio_title')
                                },
                                xAxis: {
                                    categories: categories,
                                    tickmarkPlacement: 'on',
                                    title: {
                                        enabled: false
                                    }
                                },
                                yAxis: {
                                    title: {
                                        text: Translator.trans('analytics_dynamic_cnt_release')
                                    }
                                },
                                tooltip: {
                                    pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y:,.0f}</b><br/>',
                                    split: true
                                },
                                plotOptions: {
                                    areaspline: {
                                        fillOpacity: 0.4
                                    },
                                    area: {
                                        stacking: 'percent',
                                        lineColor: '#ffffff',
                                        lineWidth: 1,
                                        marker: {
                                            lineWidth: 1,
                                            lineColor: '#ffffff'
                                        }
                                    }
                                },
                                series: series_relation,
                                credits: {
                                    enabled: false
                                },
                            });

                            Highcharts.chart('chart_div_successful_relation_pie', {
                                chart: {
                                    plotBackgroundColor: null,
                                    plotBorderWidth: null,
                                    plotShadow: false,
                                    type: 'pie'
                                },
                                title: null,
                                tooltip: {
                                    pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
                                },
                                plotOptions: {
                                    pie: {
                                        allowPointSelect: true,
                                        cursor: 'pointer',
                                        dataLabels: {
                                            enabled: false
                                        },
                                        showInLegend: false
                                    }
                                },
                                series: [{
                                    name: Translator.trans('analytics_dynamic_call_ratio_title'),
                                    colorByPoint: true,
                                    data: series_pie
                                }],
                                credits: {
                                    enabled: false
                                },
                            });
                        });
                    });

                    // задает фильтр по дате в фильтре динамики
                    $('.js_dynamic_filter_date a').on('click', function () {
                        var $item = $(this),
                            type = $item.data('type'),
                            from = $('.js_dynamic_filter_from'),
                            to = $('.js_dynamic_filter_to'),
                            button = $('.js_dynamic_filter');

                        var dates = getInterval(type);

                        from.val(dates[0]);
                        to.val(dates[1]);
                        button.trigger('click');

                        function getInterval(interval) {
                            var end_date = new Date;
                            switch(interval) {
                                case 'today':
                                case 'week':
                                case 'month':

                                    break;
                                case 'yesterday':
                                    day = end_date.getDate();
                                    day = day - 1;
                                    end_date.setDate(day);
                                    break;
                            }

                            var begin_date = new Date;
                            switch(interval) {
                                case 'today':
                                    break;
                                case 'week':
                                    day = begin_date.getDate();
                                    day = day - 6;
                                    begin_date.setDate(day);
                                    break;
                                case 'month':
                                    begin_date.setDate(1);
                                    break;
                                case 'yesterday':
                                    day = begin_date.getDate();
                                    day = day - 1;
                                    begin_date.setDate(day);
                                    break;
                            }
                            return Array(date2string(begin_date), date2string(end_date));
                        }

                        function date2string(date) {
                            var day = date.getDate().toString();

                            if(day.length < 2)
                                day = "0" + day;

                            var month = date.getMonth();
                            month = month+1;
                            month = month.toString();
                            if(month.length < 2)
                                month = "0" + month;

                            return day + "." + month + "." + date.getFullYear();

                        }
                    });

                    var step = 0.1;
                    $('.js_stat_zoom_plus').click(function(e){

                        e.preventDefault();
                        var c = statDesk;
                        var zoom = 1;

                        var matrix = c.css('transform').match(/(-?[0-9\.]+)/g);
                        if (matrix) {
                            zoom = matrix[0];
                        }

                        c.css('transform', 'scale(' + (parseFloat(zoom) + step) + ')');
                        c.css('transform-origin', '0 0');

                        jsp.setZoom(parseFloat(zoom) + step);

                        if ($('.call_script_tour').is('.active')) {
                            $.app.scriptTour.highlightFirstUndoneGoal();
                        }
                    });

                    $('.js_stat_zoom_minus').click(function(e) {
                        e.preventDefault();
                        var c = statDesk;
                        var zoom = 1;

                        var matrix = c.css('transform').match(/(-?[0-9\.]+)/g);
                        if (matrix) {
                            zoom = matrix[0];
                        }

                        c.css('transform', 'scale(' + (parseFloat(zoom) - step) + ')');
                        c.css('transform-origin', '0 0');

                        jsp.setZoom(parseFloat(zoom) - step);

                        if ($('.call_script_tour').is('.active')) {
                            $.app.scriptTour.highlightFirstUndoneGoal();
                        }
                    });

                    $('.js_stat_zoom_reset').click(function(e){

                        e.preventDefault();
                        var c = statDesk;
                        c.css('zoom', 1);
                        c.css('transform', 'scale(1)');
                        c.css('transform-origin', '0 0');
                        jsp.setZoom(1);

                        if ($('.call_script_tour').is('.active')) {
                            $.app.scriptTour.highlightFirstUndoneGoal();
                        }
                    });
                })();


                $('.js_menu').click(function(){
                    var c = $(this);
                    if(c.hasClass('js_scripts_action_view')) {
                        $('#intercom-container').hide();
                    } else {
                        $('#intercom-container').show();
                    }
                    if (c.hasClass("js_show_constructor")) {
                        $(".toggle-constructor-submenu").show();
                    } else {
                        $(".toggle-constructor-submenu").hide();
                    }
                    var $menu = $('.js_menu');
                    var $menuBlur = $menu.filter('.active');
                    $menu.not(c).removeClass('active');
                    c.addClass('active');
                    if ($menuBlur.hasClass('js_scripts_action_view')
                        && self.view.hasChanges()
                    ) {
                        self.view.stopScriptAndSaveLog('leave');
                    }
                });

                $(document).on('click', '.js_answer_remove', function() {

                    if (!confirm('Вы уверены?')) return;
                    var id = $(this).parents('.link').data('cid');
                    if (!id) return;
                    $.each(jsp.getConnections(), function(i, o) {
                        if ($(o.getOverlay('label').canvas).prop('id') === id) {
                            jsp.detach(o);
                            self.constructor.showStepLinks(self.constructor.selStep);
                        }
                    });
                });

                $(document).on('click', '.js_answer_backward', function(){

                    var cid = $(this).parents('.link').data('id');
                    var sourceId;

                    $.each(jsp.getConnections(), function(i, o) {
                        if (o.id == cid) {
                            sourceId = o.sourceId;
                        }
                    });

                    if (sourceId) {
                        var step = $('#' + sourceId);
                        step.click();
                    }
                });

                $(document).on('click', '.js_answer_forward', function(){

                    var cid = $(this).parents('.link').data('id');
                    var targetId;

                    $.each(jsp.getConnections(), function(i, o) {
                        if (o.id == cid) {
                            targetId = o.targetId;
                        }
                    });

                    if (targetId) {
                        var step = $('#' + targetId);
                        step.click();
                    }
                });

                $(document).on('click', '.js_save_answer', function(){
                    var answerBox = $(this).parents('.link');
                    var isAnswerBackward = answerBox.find('.js_answer_backward').length > 0;
                    var connectionId = answerBox.data('id');
                    var targetId = $('#target' + connectionId).val();
                    var answerText = strip_html(answerBox.find('.js_answer_label').val());
                    var newNodeText = strip_html(answerBox.find('.js_answer_target').val());
                    if (answerText.trim().length<1) {
                        answerText = self.constructor.addStepOpts.defaultCondition;
                    }
                    var sourceStep = self.constructor.selStep;
                    var newConnection;
                    var connData;

                    $.each(jsp.getConnections({source:sourceStep.prop('id')}), function(i, o) {
                        if (o.id == connectionId) {
                            if (!targetId && newNodeText) {
                                var pos = sourceStep.position();
                                var freePos = self.constructor.getFreePos(pos.left+sourceStep.width()+100, pos.top+sourceStep.height()+100);
                                var s = self.constructor.addStep(jsp, {id: self.constructor.generateId(desk), is_goal: false, is_user_sort: false,
                                    is_starred: true, starred_text: '', title: newNodeText, text: '', left: freePos[0] - 40, top: freePos[1] - 29});
                                connData = $(o.getOverlay('label').getElement()).data();
                                connData.text = answerText;
                                newConnection = {
                                    source: sourceStep,
                                    target: s,
                                    data: connData,
                                };
                            }
                            else if (o.targetId != targetId) {
                                var targetStep = $('#' + targetId);
                                connData = $(o.getOverlay('label').getElement()).data();
                                connData.text = answerText;
                                if(isAnswerBackward){
                                    newConnection = {
                                        source: targetStep,
                                        target: sourceStep,
                                        data: connData,
                                    };
                                }else{
                                    newConnection = {
                                        source: sourceStep,
                                        target: targetStep,
                                        data: connData,
                                    };
                                }
                            } else {
                                newConnection = {
                                    source: o.sourceId,
                                    target: o.targetId,
                                    data: $(o.getOverlay('label').getElement()).data(),
                                }
                            }
                        } else {
                            newConnection = {
                                source: o.sourceId,
                                target: o.targetId,
                                data: $(o.getOverlay('label').getElement()).data(),
                            }
                        }
                        jsp.detach(o);
                        var newJSPConnection = jsp.connect({
                            source: newConnection.source,
                            target: newConnection.target
                        });
                        var jl = newJSPConnection.getOverlay('label');
                        jl.setLabel(self.constructor.cutText(newConnection.data.text, 50)+self.constructor.getLinkRemoveHtml());
                        $(jl.getElement()).data(newConnection.data);
                        self.constructor.addConditionStatusClasses();
                        self.constructor.addConditionImageClasses();
                        self.constructor.addStepImageClasses();
                    });
                    jsp.repaintEverything();
                    self.constructor.showStepLinks(sourceStep);
                    $(this).parents('.panel-collapse').collapse('toggle');
                });

                var setCurrentScriptAutocomplete = function() {

                    var searchInput = $('.js_target_add_answer');
                    var steps = [];
                    var d = $(jsp.getContainer());
                    $.each(d.find('.step'), function(i, o) {
                        var s = $(o);
                        var text = (s.data('title')) ? s.data('title') : self.constructor.cutText(s.data('text'), 100);
                        steps.push({value: s.prop('id'), label: text.replace(/<\/?[^>]+>/gi, '')});
                    });

                    try {
                        searchInput.autocomplete('destroy');
                    }
                    catch (e) {}


                    var ua = window.navigator.userAgent;
                    var msie = ua.indexOf("MSIE ");
                    setTimeout(function() {
                        searchInput.autocomplete({
                            source: steps,
                            select: function (event, ui) {

                                var input = $(this);
                                var hidden = input.parents('.target_box').find('.js_answer_target_hidden');

                                input.val(ui.item.label);
                                hidden.val(ui.item.value);
                                return false;
                            },
                            focus: function (event, ui) {
                                $(this).val(ui.item.label);
                                return false;
                            },
                            change: function () {
                                var input = $(this);
                                var hidden = input.parents('.target_box').find('.js_answer_target_hidden');
                                var box = input.parents('.target_box');
                                var hint = box.find('.new_target_hint');

                                if (!hidden.val() && $(this).val()) {
                                    hint.find('b').text($(this).val());
                                    hint.css('display', 'inline-block');
                                }
                                else {
                                    hint.hide();
                                }
                            },
                            response: function (event, ui) {

                                var input = $(this);
                                var box = input.parents('.target_box');
                                var hidden = box.find('.js_answer_target_hidden');
                                hidden.val('');
                                var hint = box.find('.new_target_hint');

                                if (!ui.content.length) {
                                    hint.find('b').text($(this).val());
                                    hint.css('display', 'inline-block');
                                }
                                else {
                                    hint.hide();
                                }
                            }
                        });
                    }, 1000);
                };

                $('.js_add_answer').click(function() {

                    $(this).hide();
                    var form = $('.js_add_answer_form');

                    $('#imageInputNewImage').val('');
                    $('.hs--answer-panel--add-new-image-to-answer__image').attr({
                      src: '',
                      alt: '',
                    });

                    var addAnswerInput = $('.js_target_add_answer');
                    addAnswerInput.val('');
                    form.find('.new_target_hint').hide();

                    setCurrentScriptAutocomplete();

                    form.show(0, function() {
                        form.find('.js_answer_label').focus();
                        $('.js_edit').scrollTo(form.find('.js_add_answer_done'), 100);
                    });

                    $('.script_target_box').addClass('hidden');
                    $('.js_show_link_script').removeClass('active');
                });

                $('.js_show_link_script').click(function() {

                    var me = $(this);
                    var scriptTargetSelect = $('.js_target_scripts');
                    var scriptTargetBox = $('.script_target_box');

                    if (me.is('.active')) {

                        scriptTargetBox.addClass('hidden');
                        me.removeClass('active');

                        setCurrentScriptAutocomplete();
                    }
                    else {

                        me.addClass('active');

                        scriptTargetSelect.find('option').remove();
                        scriptTargetSelect.append('<option value="">' + Translator.trans('choose_script') + '</option>');

                        $.each(self.script_list, function(i, o) {
                            var html = '<option value="' + o.id + '">' + o.name + '</option>';
                            scriptTargetSelect.append(html);
                        });
                        scriptTargetBox.removeClass('hidden');
                        scriptTargetSelect.focus();
                    }
                });

                $('.js_target_scripts').change(function() {
                    var scriptId = $(this).val();
                    var searchInput = $('.js_target_add_answer');

                    if (!boxel.size()) return;

                    if (scriptId) {

                        var hidden = searchInput.parents('.target_box').find('.js_answer_script_target_hidden');
                        hidden.data('script-id', scriptId);

                        searchInput.autocomplete({
                            source: function (request, response) {
                                am.promiseCmd({
                                    method: 'script.nodes_find',
                                    search: request.term,
                                    script_id: scriptId,
                                }).done(function(result){
                                    var source = [];
                                    $.each(result.nodes, function(i, node) {
                                        var text = (node.title) ? node.title : self.constructor.cutText(node.text, 100);
                                        source.push({data: node, value: node.name, label: (text) ? text.replace(/<\/?[^>]+>/gi, '') : ''});
                                    });
                                    response(source);
                                });
                            },
                            select: function(event, ui) {
                                searchInput.val(ui.item.label);
                                hidden.val(ui.item.value);
                                if (typeof self.script_list[scriptId].nodes == 'undefined') {
                                    self.script_list[scriptId].nodes = {};
                                }
                                self.script_list[scriptId].nodes[ui.item.value] = ui.item.data;
                                return false;
                            },
                            focus: function(event, ui) {
                                $(this).val(ui.item.label);
                                return false;
                            },
                            change: function() {

                                var box = searchInput.parents('.target_box');
                                var hint = box.find('.new_target_hint');
                                hint.hide();
                            },
                            response: function(event, ui) {
                                var box = searchInput.parents('.target_box');
                                hidden.val('');
                                var hint = box.find('.new_target_hint');
                                hint.hide();
                            }
                        });
                    }
                    else {
                        setCurrentScriptAutocomplete();
                    }
                });

                $('.js_add_answer_form .js_add_answer_done').click(function(){

                    var form = $('.js_add_answer_form');
                    var answerText = strip_html(form.find('textarea').val());
                    var targetId = $('#targetAddAnswer').val();
                    var scriptTargetId = $('#scriptTargetAddAnswer').val();
                    var targetScriptId = $('#scriptTargetAddAnswer').data('script-id');
                    var newNodeText = strip_html(form.find('.js_target_add_answer').val());
                    var chooseScriptIsOpen = $('.js_show_link_script').is('.active');
                    var status = form.find('.js_answer_status.active').data('status');
                    var imageSrc = $('#imageInputNewImage').val()
                      ? $('#imageInputNewImage').val()
                      : null;

                    var sourceStep = self.constructor.selStep;
                    var newConnection, jl, pos, freePos, s;

                    if (answerText && !scriptTargetId && !chooseScriptIsOpen && (targetId || newNodeText)) {

                        if (!targetId && newNodeText) {
                            pos = sourceStep.position();
                            freePos = self.constructor.getFreePos(pos.left + sourceStep.width() + 100, pos.top + sourceStep.height() + 100);
                            s = self.constructor.addStep(jsp, {
                                id: self.constructor.generateId(desk), is_goal: false, is_user_sort: false,
                                is_starred: true, starred_text: '', starred_sorting: 0, title: newNodeText, text: '', left: freePos[0] - 40, top: freePos[1] - 29
                            });
                            newConnection = jsp.connect({source: sourceStep, target: s});
                            jsp.repaintEverything();
                            jl = newConnection.getOverlay('label');
                            jl.setLabel(self.constructor.cutText(answerText, 50) + self.constructor.getLinkRemoveHtml());
                            $(jl.getElement())
                              .data('text', answerText)
                              .data('status', status)
                              .data('images', imageSrc ? [{ src: imageSrc, options: { position: 'top', alt: '' } }] : []);
                            self.constructor.showStepLinks(sourceStep);
                            self.constructor.addConditionStatusClasses();
                            self.constructor.addConditionImageClasses();
                            am.trigger('constructor step added', [s]);
                        } else {
                            newConnection = jsp.connect({source: sourceStep, target: $('#' + targetId)});
                            jl = newConnection.getOverlay('label');
                            jl.setLabel(self.constructor.cutText(answerText, 50) + self.constructor.getLinkRemoveHtml());
                            $(jl.getElement())
                              .data('text', answerText)
                              .data('status', status)
                              .data('images', imageSrc ? [{ src: imageSrc, options: { position: 'top', alt: '' } }] : []);
                            self.constructor.showStepLinks(sourceStep);
                            self.constructor.addConditionStatusClasses();
                            self.constructor.addConditionImageClasses();
                        }

                        form.hide();
                        $('.js_add_answer').show();
                        form.find('textarea').val('');

                        $('.script_target_box').addClass('hidden');
                        $('.js_show_link_script').removeClass('active');
                    }

                    //Create link to other script
                    else if (answerText && scriptTargetId) {

                        if (!$('#' + targetScriptId + '_' + scriptTargetId).size()) {
                            pos = sourceStep.position();
                            freePos = self.constructor.getFreePos(pos.left+sourceStep.width()+100, pos.top+sourceStep.height()+100);

                            var node;
                            if (scriptTargetId && targetScriptId) {
                                node = self.script_list[targetScriptId].nodes[scriptTargetId];
                            }

                            s = self.constructor.addStep(jsp, {
                                id: targetScriptId + '_' + scriptTargetId,
                                is_goal: false,
                                is_starred: true,
                                is_user_sort: false,
                                starred_text: '',
                                starred_sorting: '',
                                title: node.title,
                                text: node.text,
                                left: freePos[0] - 40,
                                top: freePos[1] - 29,
                                otherScript: true
                            });
                        }
                        else {
                            s = $('#' + targetScriptId + '_' + scriptTargetId);
                        }

                        newConnection = jsp.connect({source: sourceStep, target: s});
                        jsp.repaintEverything();

                        jl = newConnection.getOverlay('label');
                        jl.setLabel(self.constructor.cutText(answerText, 50)+self.constructor.getLinkRemoveHtml());
                        $(jl.getElement()).data('text', answerText).data('status', status);
                        self.constructor.showStepLinks(sourceStep);
                        self.constructor.addConditionStatusClasses();
                        self.constructor.addConditionImageClasses();

                        form.hide();
                        form.find('#scriptTargetAddAnswer').val(null).data(null);
                        $('.js_add_answer').show();
                        form.find('textarea').val('');
                        $('.script_target_box').addClass('hidden');

                        $('.js_show_link_script').removeClass('active');
                    }
                });

                $('.js_collapse_answer_back').click(function(e){
                    e.preventDefault();
                    var $that = $(this);

                    $that.find('.glyphicon').toggleClass('glyphicon-menu-down')
                        .toggleClass('glyphicon-menu-up');

                    $that.closest('.form-group').find('.js_answers_back').slideToggle();
                });

                $('.js_add_answer_form .close').click(function(){

                    $('.js_add_answer_form').hide();
                    $('.js_add_answer').show();
                });

                var saveDraftTimer;

                var onBeforeUnload = function() {
                    return Translator.trans('save_before_quit');
                }

                am.on('constructor load done', function(){
                    am.trigger('constructor has no changes');
                    self.starred.renderBox();

                    let scriptsElementCategory = $('#scriptsElementCategory');
                    scriptsElementCategory.find('option').remove();

                    self.starred.data.forEach(g => {
                        scriptsElementCategory.append(new Option(g.n, g.n,  false, false));
                    });
                    scriptsElementCategory.trigger('change');
                }).on('constructor has no changes', function(){
                    $('.js_scripts_action_save').hide();
                    self.scripts.stopSaveButtonGlimmering();
                    $(window).unbind('beforeunload', onBeforeUnload);
                }).on('constructor step moved', function(){
                    am.trigger('constructor has changes');
                }).on('constructor condition removed', function(){
                    am.trigger('constructor has changes');
                }).on('constructor condition added', function(){
                    am.trigger('constructor has changes');
                }).on('constructor step removed', function(evt){
                    am.trigger('constructor has changes');
                    self.starred.remove(evt.args);
                }).on('constructor step added', function(evt){
                    am.trigger('constructor has changes');
                    self.starred.add(evt.args);
                }).on('constructor step is_goal changed', function(){
                    am.trigger('constructor has changes');
                }).on('constructor step is_user_sort changed', function(){
                    am.trigger('constructor has changes');
                }).on('constructor step is_starred changed', function(){
                    am.trigger('constructor has changes');
                  //  self.scripts.updateStarredList();
                }).on('constructor step task changed', function(){
                    am.trigger('constructor has changes');
                }).on('constructor step title changed', function(evt){
                    am.trigger('constructor has changes');
                    self.starred.change(evt.args);
                }).on('constructor step category changed', function(evt){
                    am.trigger('constructor has changes');
                    self.starred.change(evt.args);
                }).on('constructor step text changed', function(evt){
                    am.trigger('constructor has changes');
                    self.starred.change(evt.args);
                }).on('constructor condition text changed', function(){
                    am.trigger('constructor has changes');
                }).on('constructor step image changed', function(){
                    am.trigger('constructor has changes');
                }).on('constructor script show_quiz_results changed', function(){
                    am.trigger('constructor has changes');
                })
                .on('constructor quiz background changed', function(){
                  am.trigger('constructor has changes');
                })
                .on('constructor quiz result button name changed', function(){
                  am.trigger('constructor has changes');
                })
                .on('constructor step image position changed', function(){
                  am.trigger('constructor has changes');
                })
                .on('constructor quiz condition points changed', function(){
                  am.trigger('constructor has changes');
                })
                .on('constructor has changes', function () {
                  if ($.inArray(self.role, ['ROLE_SCRIPT_WRITER', 'ROLE_ADMIN']) >= 0) {
                      $('.js_scripts_action_save').show();
                      self.scripts.startSaveButtonGlimmering();
                      $(window).bind('beforeunload', onBeforeUnload);

                      if (saveDraftTimer) clearTimeout(saveDraftTimer);
                      saveDraftTimer = setTimeout(function () {
                          self.scripts.saveDraft();
                      }, 1000);
                  }
                }).on('constructor starred category removed', function (evt) {
                    am.trigger('constructor has changes');
                    //refill options
                    let scriptsElementCategory = $('#scriptsElementCategory');
                    scriptsElementCategory.find('option').remove();

                    self.starred.data.forEach(g => {
                        scriptsElementCategory.append(new Option(g.n, g.n,  false, false));
                    });
                    scriptsElementCategory.trigger('change');
                }).on('constructor starred order changed', function () {
                    am.trigger('constructor has changes');
                }).on('constructor starred category renamed', function () {
                    am.trigger('constructor has changes');
                    let scriptsElementCategory = $('#scriptsElementCategory');
                    scriptsElementCategory.find('option').remove();

                    self.starred.data.forEach(g => {
                        scriptsElementCategory.append(new Option(g.n, g.n,  false, false));
                    });
                    scriptsElementCategory.trigger('change');
                }).on('constructor starred category added', function () {
                    am.trigger('constructor has changes');
                    let scriptsElementCategory = $('#scriptsElementCategory');
                    scriptsElementCategory.find('option').remove();

                    self.starred.data.forEach(g => {
                        scriptsElementCategory.append(new Option(g.n, g.n,  false, false));
                    });
                    scriptsElementCategory.trigger('change');
                }).on('constructor step deselected', function () {
                    $('.zoom-btns').removeClass('settings_box_open');
                    self.starred.deselect();
                }).on('constructor step selected', function (evt) {
                    $('.zoom-btns').addClass('settings_box_open');
                    self.starred.select(evt.args);
                });
            },
            initIssuesCount: function (issues) {
                let box = $('.js_show_constructor').find('.js_issues_count_box');
                box.find('.issues_count').remove();
                box.find('.issues_dropdown').remove();
                let count = issues.length;
                if (count) {
                    let issueItems = '';
                    for (let i = 0; i < count; i++) {
                        let issueText = self.scripts.getIssueNodeText(issues[i].node);
                        issueItems = issueItems + '<li><a href="#" data-issue-node="' + issues[i].node + '">' + issueText + '</a></li>';
                    }
                    box.append('<span id="hs_issues_count_badge" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false" ' +
                        'class="issues_count badge" title="' + Translator.trans('unresolved_issues_count') + '">' +
                        count + '</span><ul class="dropdown-menu issues_dropdown" style="left:115px">' +
                        '<li class="submenu-title disabled"><a href="#">' + Translator.trans('unresolved_issues') +'</a></li><li role="separator" class="divider"></li>'
                        + issueItems + '</ul>');
                    $('.issues_dropdown a').off().click(function (e) {
                        $('.js_show_constructor').click();
                        e.preventDefault();
                        e.stopPropagation();
                        let step = $('#' + $(this).data("issue-node"));
                        step.click();
                        $('.title-issues').click();
                    });
                    $('#hs_issues_count_badge').off().click(function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        $('.issues_dropdown').dropdown('toggle');
                    });

                }
            },
            getIssueNodeText: function (node) {
                let text = '';
                self.steps.forEach((step) => {
                    if (step.id === node) {
                        text = step.text;
                    }
                });
                return text.replace(/<[^>]*>?/gm, '').substring(0, 50);
            },
            initIssuesByNodes: function () {
                self.issuesCountByNodes = [];

                $.each(self.issues, function (i, o) {

                    if (typeof self.issuesCountByNodes[o.node] == 'undefined') {
                        self.issuesCountByNodes[o.node] = 0;
                    }

                    self.issuesCountByNodes[o.node]++
                });
            },
            initShowScriptButtons: function() {
                var boxel = $('.js_editor');
                if (!boxel.size()) return;

                var sclbel = $('.js_scripts_list_box');
                $('.js_show_script').click(function(e){
                    console.log('CLICK SHOW SCRIPT');
                    e.preventDefault();

                    if (self.scripts.processed) {
                        console.log('CANCEL LOAD SCRIPT');
                        return;
                    }
                    self.scripts.processed = true;




                    sclbel.find('.js_show_script').removeClass('active');
                    $('.js_show_script[data-id=' + $(this).data('id') + ']').addClass('active');
                    var currentScriptId = $(this).data('id');
                    $.fancybox.showLoading();
                    self.view.updateScriptStatistic(currentScriptId);
                    am.promiseCmd({
                        method: 'scripts.load_without_external_scripts',
                        id: $(this).data('id')
                    }).always(function(){
                        $.fancybox.hideLoading();
                        self.scripts.processed = false;
                        $('.limit_exceeded').hide();
                        $('.js_script_menu').show();
                        $('.sales-infos').css('display', 'inline-block');
                        $('.target').removeClass('hidden').show();
                        $('.script-buttons').show();
                        $('.call_script_tour').show();
                        $('.js_editor').show();
                        $('.js_back_to_list').show();
                        $('.js_scripts_list_box_wrap').show();
                        $('.zoom-btns').show();
                        $('.js_scripts_action_view').removeClass('open').show();


                        self.issues = [];
                        self.view_notes = [];
                        app.notes.formulas = [];
                    }).fail(function(res){
                        if (res.msg === 'user_limit_exceed') {
                            $('.script_goal_highlight').hide();
                            var box = $('.limit_exceeded');
                            if (res.details.is_owner) {
                                box.find('.limit_exceeded_operator').hide();
                                box.find('.limit_exceeded_owner').show();
                            }
                            else {
                                box.find('.limit_exceeded_owner').hide();
                                box.find('.limit_exceeded_operator').show();
                                box.find('.username').text(res.details.username);
                            }
                            box.show();

                            var sebel = $('.js_scripts_edit_box');
                            $('.js_selected_script_name').text(res.details.name);
                            sclbel.find('.js_show_script').removeClass('active');
                            sebel.hide();
                            $('.js_box').hide();
                            $('.js_script_menu').hide();
                            $('.sales-infos').hide();
                            $('.target').addClass('hidden');
                            $('.script-buttons').hide();
                        }
                    }).done(function(res){
                        if (self.desk) {
                            // connections
                            let conns = jsp.getConnections();
                            for (let i = 0; i < conns.length; i++) {
                                jsp.detach(conns[i]);
                            }
                        }
                        // console.log('SET FIELDS 1', res.fields);
                        app.addField.setFields(res.fields);
                        app.addField.setStaticFields(res.static_fields);
                        self.role = res.role;

                        // if (res.scripts) {
                        //     self.script_list = res.scripts;
                        // }
                        am.promiseCmd({
                            method: 'scripts.load_script_list',
                            id: res.id
                        }).done(function (response) {
                            if (response.scripts) {
                                self.script_list = response.scripts;
                            }
                        });

                        if (res.issues) {
                            self.issues = res.issues;
                            self.steps = res.data.steps;
                            self.scripts.initIssuesCount(self.issues);
                            self.scripts.initIssuesByNodes();
                        }
                        if (res.data.starred) {
                            self.starred.data = res.data.starred;
                        }
                        if (res.view_notes) {
                            self.view_notes = res.view_notes;
                        }
                        // if(res.documents){
                        //     self.documents = res.documents;
                        // }
                        if (res.formulas) {
                            app.notes.formulas = res.formulas;
                        }
                        // if(res.widgets.operator && res.widgets.operator.search){
                        //     $('.js_show_documents').show();
                        // }

                        $('.js_show_constructor').trigger('click');
                        self.currentScriptId = res.id;
                        self.currentScriptType = res.type;
                        boxel.data('id', res.id);
                        boxel.data('ver', res.ver);
                        boxel.data('name', res.name);
                        boxel.data('target', res.target);
                        boxel.data('data', res.data);
                        if (res.type === 'quiz') {
                          boxel.data('show_quiz_results', res.show_quiz_results);
                          boxel.data('quiz_background', res.quiz_background);
                          boxel.data('quiz_options', res.quiz_options);
                        }

                        $('.js_script_target').val(res.target);
                        $('.target').removeClass('hidden');

                        am.cUrl.setAnchorParam('s', res.id);
                        if ('localStorage' in window && window['localStorage'] !== null) {
                            window.localStorage.setItem('current_script', res.id);
                        }

                        var focusTargetShowResultBtn = res.show_quiz_results ? 'on' : 'off'
                        var unfocusTargetShowResultBtn = !res.show_quiz_results ? 'on' : 'off'

                        $(`#result-toggle-btn-${unfocusTargetShowResultBtn}`)
                          .removeClass('active')
                          .removeClass('btn-primary')
                          .addClass('btn-default')
                        $(`#result-toggle-btn-${focusTargetShowResultBtn}`)
                          .addClass('active')
                          .addClass('btn-primary')

                        var designBackgroundColors = document.getElementsByName('designBackgroundColor')
                        var designBackgroundColorCustom = document.getElementById('designBackgroundColorCustom')
                        designBackgroundColorCustom.value = res.quiz_background && res.quiz_background.color && res.quiz_background.color !== null
                          ? res.quiz_background.color === '#ffffff' || res.quiz_background.color === '#000000'
                            ? '#ff0000'
                            : res.quiz_background.color
                          : '#ff0000'

                        designBackgroundColors.forEach(e => {
                          // console.log('🦕 designBackgroundColors', e.value, res.quiz_background.color)
                          if (res.quiz_background && e.value === res.quiz_background.color) {
                            e.checked = true
                          } else {
                            e.checked = false
                          }
                        })

                        var designBackground = document.getElementById('quizBackground')
                        designBackground.value = res.quiz_background ? res.quiz_background.url : ''

                        var designBackgroundPreview = designBackground.parentElement.getElementsByClassName('quiz-design-upload-image--preview')[0].children[0]

                        var quizBackgroundPreviewImage = document.getElementById('quizBackgroundPreviewImage')

                        var btnAction = document.getElementById('btn-upload-quiz-background')

                        if (res.quiz_background && res.quiz_background.url) {
                          designBackgroundPreview.classList.remove('hidden')
                          quizBackgroundPreviewImage.src = res.quiz_background.url
                          btnAction.classList.add('hidden')
                        } else {
                          designBackgroundPreview.classList.add('hidden')
                          quizBackgroundPreviewImage.src = ''
                          btnAction.classList.remove('hidden')
                        }

                        var resultButtonName = document.getElementById('resultButtonName')
                        var resultButtonNamePreview = document.getElementById('resultButtonNamePreview')

                        resultButtonName.value = res.quiz_options?.resultButtonName || 'Показать результат'
                        resultButtonNamePreview.innerText = res.quiz_options?.resultButtonName || 'Показать результат'




                        /**
                         * UI CHACHED
                         * --------------------------------------------------------
                         */

                        var tabs = {
                          script: [
                            '#hs_smenu_integration',
                            '#hs_smenu_data',
                            '#hs_smenu_analytics',
                            '#hs_smenu_access',
                            '#hs_smenu_operators_view',
                          ],
                          quiz: [
                            '#hs_smenu_access',
                            '#hs_smenu_data',
                            "#hs_smenu_quiz_view",
                          ],
                        }

                        var hideAllTabsInPanel = () => {
                          var allTabs = Object.values(tabs).flat()
                          allTabs.forEach(tab => {
                            $(tab).addClass('hidden');
                          })
                        }

                        var showTabsForCurrentScriptType = () => {
                          let currentTabs = tabs[self.currentScriptType]
                          if (currentTabs === undefined) {
                            console.error('🦕 currentTabs is undefined, set default value => script')
                            currentTabs = tabs['script']
                          }
                          currentTabs.forEach(tab => {
                            $(tab).removeClass('hidden');
                          })
                        }

                        var toggleJsFavoritesBox = () => {
                          var flag = self.currentScriptType === 'script'
                          var elJsFavoritesBox = $('.js_favorites_box')
                          if (flag) {
                            elJsFavoritesBox.removeClass('hidden')
                            var isOpen = localStorage.getItem('favorites_box_open')
                            if (isOpen) {
                              elJsFavoritesBox.addClass('open')
                            }
                          } else {
                            elJsFavoritesBox.addClass('hidden')
                            elJsFavoritesBox.removeClass('open')
                          }
                        }

                        var toggleJsAutoSidebar = () => {
                          var flag = self.currentScriptType === 'script'
                          var el = $('.js_auto-sidebar')
                          if (flag) {
                            el.removeClass('hidden')
                          } else {
                            el.addClass('hidden')
                          }
                        }

                        var dropdownLinks = {
                          script: [
                            '#hs_smenu_notes',
                          ],
                          quiz: [
                            '#hs_smenu_result',
                            '#hs_smenu_recommendations',
                          ],
                        }

                        var hideAllDropdownLinksInPanel = () => {
                          var allDropdownLinks = Object.values(dropdownLinks).flat()
                          allDropdownLinks.forEach(tab => {
                            $(tab).addClass('hidden');
                          })
                        }

                        var showDropdownLinksForCurrentScriptType = () => {
                          let currentDropdownLinks = dropdownLinks[self.currentScriptType]
                          if (currentDropdownLinks === undefined) {
                            console.error('🦕 currentDropdownLinks is undefined, set default value => script')
                            currentDropdownLinks = dropdownLinks['script']
                          }
                          currentDropdownLinks.forEach(tab => {
                            $(tab).removeClass('hidden');
                          })
                        }


                        hideAllTabsInPanel()
                        hideAllDropdownLinksInPanel()

                        showTabsForCurrentScriptType()
                        showDropdownLinksForCurrentScriptType()

                        toggleJsFavoritesBox()
                        toggleJsAutoSidebar()

                        if (self.currentScriptType === 'script') {
                          $('.js_design_box').addClass('hidden')
                          $('.only-quiz').addClass('hidden')
                          $('.only-script').removeClass('hidden')
                          $('#hs--quiz--access-box').addClass('hidden')
                          $('#quiz-view-box').addClass('hidden')

                          $('#access_tab__js_access_role option[value=ROLE_SCRIPT_READER]').remove()
                          $('#access_tab__js_access_role').append(`<option value="ROLE_SCRIPT_READER">${Translator.trans('operator')}</option>`)
                          $('#access_tab__js_access_role').parent().removeClass('hidden')
                          $('#access_tab__js_access_role').parent().parent().children().first().css({
                            width: '70%',
                            verticalAlign: 'top',
                          })

                          $('#hs_smenu_access').contents()['2'].replaceWith(` ${Translator.trans('access')} `)
                          $('#hs_smenu_data').contents().last().replaceWith(` ${Translator.trans('data')}`)

                          $('.hs--answer-panel--add-image-to-answer').addClass('hidden')
                        } else {
                          $('.js_design_box').removeClass('hidden')
                          $('.only-script').addClass('hidden')
                          $('.only-quiz').removeClass('hidden')
                          $('#hs--quiz--access-box').removeClass('hidden')
                          $('#quiz-view-box').removeClass('hidden')

                          $('#access_tab__js_access_role option[value=ROLE_SCRIPT_READER]').remove()
                          $('#access_tab__js_access_role').parent().addClass('hidden')
                          $('#access_tab__js_access_role').parent().parent().children().first().css({
                            width: '90%',
                            verticalAlign: 'top',
                          })

                          $('#hs_smenu_access').contents()['2'].replaceWith(` ${Translator.trans('share')} `)
                          $('#hs_smenu_data').contents().last().replaceWith(` ${Translator.trans('reports')}`)

                          $('.hs--answer-panel--add-image-to-answer').removeClass('hidden')

                          $('a[aria-controls="tab_new_simple"]').click()

                          app.get('libAddQuiz').done((l) => {
                            l.generateQuizUrl()
                            l.generateQuizIframeCode()
                            l.getQuizResult()
                            l.clearIframeSize()
                          })
                        }

                        /**
                         * /UI CHACHED (end)
                         * --------------------------------------------------------
                         */


                        var sebel = $('.js_scripts_edit_box');
                        /**
                         * Добавление с селект плашку типа скрипта/квиза
                         */
                        var validClasses = [
                          'is-script',
                          'is-quiz',
                        ]
                        sebel.find('.js_name').add('.js_selected_script_name').text(res.name);
                        validClasses.forEach(cl => {
                          sebel.find('.js_name').add('.type-label-in-edit-mode').removeClass(cl)
                        })
                        sebel.find('.js_name').add('.type-label-in-edit-mode').addClass(`is-${res.type}`)
                        sebel.find('.js_name').add('.type-label-in-edit-mode').text(Translator.trans(res.type));
                        // $('.js_conversion_count').text(res.conversion_count);
                        boxel.find('.js_operators_count').text(res.operators_count);
                        // $('.js_passages_count').text(res.passages_count);
                        sebel.find('.js_user_access_count').text(res.user_access_count);
                        sebel.show();


                        // конструктор генерить только если есть соответствующая роль у пользователя
                        if (self.role === 'ROLE_SCRIPT_WRITER' || self.role === 'ROLE_ADMIN') {
                            if (!jsp) self.constructor.init();
                            self.constructor.load(jsp, res.data);

                            // $('.tab_new_simple_field_addtype').addClass('hidden');
                            $('.tab_new_simple_field_addtype .field_addtype_text').addClass('hidden');
                            if (res.widgets && res.widgets.operator && res.widgets.operator.basket2) {
                                $('.tab_new_simple_field_addtype .field_addtype_text').removeClass('hidden');
                                // $('.tab_new_simple_field_addtype').removeClass('hidden');
                            }
                        }
                        self.scripts.initRights();

                        $('.js_scripts_action_view').show();
                        $('.js_show_fields').show();
                        $('.js_pass_filter_operator').find('option').remove();
                        $('.js_pass_filter_from').val('');
                        $('.js_pass_filter_to').val('');

                        if (res.role === 'ROLE_SCRIPT_READER') {
                            var $script_link = $('.js_scripts_action_view');
                            $script_link.click().html(
                                $script_link.find('span').prop("outerHTML") + ' ' + $script_link.data('operator_text_view')
                            );
                            $('.js_show_add_field').hide();
                            $('.js_pass_filter_operator').closest('div').hide();

                            $('.js_script_menu').hide();
                            $('.sales-infos').hide();
                            $('.target').addClass('hidden');
                            $('.script-buttons').hide();
                        }
                        $('.sales-mode-step:visible').each(function (k,j) {
                            $(j).text(k + 1);
                        });

                        if (res.amo_add_fields_as_note) {
                            $('.js_amocrm_add_fields_as_note').prop('checked', true);
                        }
                        else {
                            $('.js_amocrm_add_fields_as_note').prop('checked', false);
                        }

                        if (res.amo_add_pass_as_note) {
                            $('.js_amocrm_add_pass_as_note').prop('checked', true);
                        }
                        else {
                            $('.js_amocrm_add_pass_as_note').prop('checked', false);
                        }
                        $('.js_bitrix_save_when_call_in').prop('checked', !!res.bitrix_save_when_call_in);
                        $('.js_bitrix_add_fields_as_note').prop('checked', !!res.bitrix_add_fields_as_note);
                        $('.js_bitrix_add_pass_as_note').prop('checked', !!res.bitrix_add_pass_as_note);
                        $('.js_bitrix_auto_create_lead').prop('checked', !!res.bitrix_auto_create_lead);
                        $('.js_bitrix_auto_create_company').prop('checked', !!res.bitrix_auto_create_company);
                        $('.js_bitrix_auto_create_deal').prop('checked', !!res.bitrix_auto_create_deal);
                        $('.js_bitrix_auto_create_contact').prop('checked', !!res.bitrix_auto_create_contact);
                        $('.js_bitrix_allow_deal_selection').prop('checked', !!res.bitrix_allow_deal_selection);

                        var expires = new Date(new Date().getTime()+3600 * 24 * 1000).toUTCString();
                        document.cookie = 'crnscrd='+res.id+'; Expires='+expires+'; Path=/';

                        am.trigger('constructor load done');
                    });
                });

            },
            initRights: function() {
                if (self.role !== 'ROLE_SCRIPT_WRITER' && self.role !== 'ROLE_ADMIN') {
                    $('.js_show_constructor, .js_show_conversion, .js_show_access, .js_scripts_action_view, .js_show_integration').hide();
                    $('.js_scripts_action_save, .js_scripts_action_delete').hide();

                    $('.js_constructor_box').hide();
                    $('.js_view_box').show();

                    $('.sales-infos .sales-info').hide();
                } else {
                    $('.js_show_constructor, .js_show_conversion, .js_show_access, .js_scripts_action_view, .js_show_integration').show();
                    $('.js_scripts_action_save, .js_scripts_action_delete').show();

                    $('.js_constructor_box').show();
                    $('.js_view_box').hide();

                    $('.sales-infos .sales-info').show();

                    // app.get('access').done(function(access){
                    //     access.loadAccessUsers();
                    // });
                }
            },
            initScriptsList: function(scripts){
                var con = $('.js_scripts_list');
                var scriptList = $('.js_list_box .script_list_row');
                if (self.isHs()) {
                    con.find('.js_show_script').remove();
                    scriptList.find('.script__item').remove();

                    // scriptList.append('<div class="col-md-2 script__item script__item-plus">' +
                    //     '<div class="panel panel-default">' +
                    //     '<div class="panel-body js_new_script">' +
                    //     Translator.trans('add_script') +
                    //     '</div>' +
                    //     '</div>' +
                    //     '</div>');

                    /*if ($('html').attr('lang') == 'ru') {
                     scriptList.append(
                     '<div class="col-md-2 script__item script__item-order">' +
                     '<div class="panel panel-default">' +
                     '<div class="panel-body js_order_script">' +
                     '<span>Заказать скрипт</span>' +
                     '</div>' +
                     '</div>' +
                     '</div>');
                     }*/

                    $.each(scripts, function(i, o) {
                      if(!o) return;
                      var oname = tmp.text(o.name).html();

                      con.append(`
                        <li role="presentation">
                          <a class="js_show_script" data-id="${o.id}" data-after-label="${Translator.trans(o.type)}" data-type="${o.type}" role="menuitem" tabindex="-1" href="#">
                            ${oname}
                          </a>
                        </li>
                      `);

                      scriptList.append(`
                        <div class="col-md-2 script__item script-card is-${o.type}">
                          ${self.getSettingsHtml(o.id).html()}

                          <div class="panel panel-default js_show_script" data-id="${o.id}" data-type="${o.type}">
                            <div class="panel-header" title="${o.name}">
                              <h4 data-normalized="${o.name.toLowerCase()}">${o.name}</h4>
                            </div>
                            <div>
                              <div class="clearfix"></div>
                              <div class="script__item-stats">
                                <div class="col-xs-4" title="${Translator.trans('runs')}"><span class="glyphicon glyphicon-earphone"></span>${ o.passages_count }</div>
                                <div class="col-xs-4" title="${Translator.trans('conversion')}"><span class="glyphicon glyphicon-ok"></span>${o.conversion_count}%</div>
                                <div class="col-xs-4" title="${Translator.trans('conversion')}"><span class="glyphicon glyphicon-user"></span><span id="hs_scripts_list_access_count">${o.user_access_count}</span></div>
                              </div>

                              <div class="script-card__type-label">
                                ${Translator.trans(o.type)}
                              </div>
                            </div>
                          </div>
                        </div>
                      `);
                    });
                } else {
                  con.empty();
                  for(var i in scripts) {
                    var r = scripts[i];

                    var icon = null;
                    if (r.icon === 'OWNER') {
                        icon = 'user';
                    } else if (r.icon === 'READER') {
                        icon = 'eye-open';
                    } else if (r.icon === 'READER') {
                        icon = 'pencil';
                    }

                    con.append(`
                      <a class="list-group-item js_show_script" data-id="${r.id}" data-type="${r.type}" href="#">
                        <span class="glyphicon glyphicon-${icon}"></span> &nbsp;
                        ${r.name}
                      </a>
                    `);
                  }
                }
                self.scripts.initShowScriptButtons();
            },
            showBoxClick: function(e) {
                e.preventDefault();
                $('.js_settings_box').hide();
                $('.js_design_box').removeClass('is-focus');
                $('.zoom-btns').removeClass('settings_box_open');
                let box = $(this).data('box');


                if (box === "js_map_box") {
                  box = 'js_constructor_box'
                } else {
                  if (box !== 'js_result_box') {
                    e.stopPropagation();
                  }
                }

                switch (box) {
                    case 'js_notes_box':
                        app.notes.renderList(self.view_notes);
                        break;
                    case 'js_integration_box':
                        show8muF3NsEky8()
                        break;
                    // case 'js_quicklinks_box':
                    //     let data = self.constructor.save(jsp),
                    //         starredSteps = [],
                    //         sortingArray = [],
                    //         steps = data['steps'];
                    //     for (let i = 0; i < steps.length; i++) {
                    //         if (steps[i]['is_starred']) {
                    //             starredSteps[steps[i]["id"]] = steps[i]["starred_text"];
                    //             sortingArray.push([steps[i]["id"], steps[i]["starred_sorting"]]);
                    //         }
                    //     }
                    //     sortingArray.sort(function (a, b) {
                    //         return a[1] - b[1];
                    //     });
                    //     self.view_quicklinks = [];
                    //     sortingArray.forEach(function (item) {
                    //         self.view_quicklinks.push({id: item[0], title: starredSteps[item[0]], sortOrder: item[1]});
                    //     });
                    //
                    //     app.quicklinks.renderList(self.view_quicklinks);
                    //     break;
                }

                $('.js_box').hide();
                $('.' + box).show();

                $('.in,.open').removeClass('in open');
                $('.constructor_submenu_dropdown li').removeClass('active');
                if (box === "js_constructor_box") {
                    $('.js_show_map').parents('li').addClass('active');
                }
                $(this).parents('li').addClass('active');
                let currentMenu = $('#hs_smenu_current');
                if ($(this).parents('li').length) {
                    currentMenu.find('span').html($(this).html());
                    currentMenu.data('box', $(this).data('box'));
                } else {
                    if ($(this).attr('id') !== "hs_smenu_current") {
                        //switch to constructor
                        currentMenu.find('span').html(Translator.trans('menu_map'));
                        currentMenu.data('box', 'js_map_box');
                    }
                }
                am.trigger('tab selected', [box]);
            },
            initTabs: function() {
                let sebEl = $('.js_scripts_edit_box');
                if (!sebEl.size()) return;
                sebEl.off('click', '.js_show_box', self.scripts.showBoxClick);
                sebEl.on('click', '.js_show_box', self.scripts.showBoxClick);
                // sebel.find('.js_show_box').click();
            }
        },
        init: function(){
            $('.js_back_to_list').click(function(e) {
                e.preventDefault();

                $('.js_box').hide();
                $('.js_list_box').show();
                $('.js_editor').hide();
                $('.js_scripts_list_box_wrap .target').hide();
                $('.sales-infos').hide();
                $('.js_selected_script_name').text('...');
                $('.script-buttons').hide();
                $(this).hide();
                $('.script_goal_highlight').hide();
                $('.js_scripts_list_box_wrap').hide();
                $('.limit_exceeded').hide();
                $('.js_settings_box').hide();
                $('.js_favorites_box').hide();
                $('.js_design_box').removeClass('is-focus');
                $('.zoom-btns').removeClass('settings_box_open');
                $('.js_design_box').addClass('hidden');
                am.cUrl.removeAnchorParam('s');
                if ('localStorage' in window && window['localStorage'] !== null) {
                    window.localStorage.setItem('current_script', null);
                }
            });

            self.scripts.init();
            self.view.init();
            app.get('keyCall').done(function(keyCall){
                keyCall.add({
                    map: function(){
                        if ($('.map_canvas').length > 0) {
                            $('.map_canvas').remove();
                        } else {
                            self.constructor.showCircleMap(70);
                        }
                    },
                    'try': function(){
                        self.constructor.doShowTryPattern = !self.constructor.doShowTryPattern;
                    }
                });
            });
            let start_video_tour_modal = $('#start_video_tour');
            if ($('.videoTour') && $('.videoTour').data('val') == true) {
                start_video_tour_modal.modal();
                am.promiseCmd({
                    method: 'user.set_hide_video_tour'
                });
            }
            if ($('.rulesAgreement') && $('.rulesAgreement').data('val') == false && $('html').attr('lang') === 'ru') {
                $('#rules_agreement').modal({backdrop: 'static', keyboard: false});
            }

            if ($('.userProfile') && $('.userProfile').data('val') == true
                // && $('html').attr('lang') == 'ru'
            ) {
                $('#user_profile').modal({backdrop: 'static', keyboard: false});
            }

            $('.favorites_header_bar').click(function () {
                let fav = ($(this)).parent('.js_favorites_box');
                fav.toggleClass('open');
                localStorage.setItem('favorites_box_open', fav.hasClass('open'));
            });

            $('.js_close_video_tour').click(function(){
                if ($('.video_tour_never_show').is(':checked')) {
                    am.promiseCmd({method: 'user.set', name: 'video_tour', data: 'yes'});
                }

                start_video_tour_modal.modal('hide');
            });

            $('input[name=profile_phone]').inputmask({alias: 'phone', clearIncomplete: true});

            $('.js_profile_continue').click(function(e){
                e.preventDefault();

                var modal           = $('#user_profile'),
                    surnameInput    = $('#profile_surname'),
                    nameInput       = $('#profile_name'),
                    phoneInput      = $('#profile_phone'),
                    companyInput    = $('#profile_company'),
                    usersCountInput = $('#profile_users_count'),

                    partner_potential = $('#partner_potential'),
                    partner_www = $('#partner_www'),
                    partner_role = $('#partner_role'),
                    valid           = true;

                if (partner_potential.length && !partner_potential.val()) {
                    valid = false;
                    partner_potential.parents('.form-group').addClass('has-error');
                    partner_potential.unbind('keyup').keyup(function(){
                        partner_potential.parents('.form-group').removeClass('has-error');
                    });
                }
                if (partner_www.length && !partner_www.val()) {
                    valid = false;
                    partner_www.parents('.form-group').addClass('has-error');
                    partner_www.unbind('keyup').keyup(function(){
                        partner_www.parents('.form-group').removeClass('has-error');
                    });
                }
                if (partner_role.length && !partner_role.val()) {
                    valid = false;
                    partner_role.parents('.form-group').addClass('has-error');
                    partner_role.unbind('keyup').keyup(function(){
                        partner_role.parents('.form-group').removeClass('has-error');
                    });
                }
                if (!surnameInput.val()) {
                    valid = false;
                    surnameInput.parents('.form-group').addClass('has-error');
                    surnameInput.unbind('keyup').keyup(function(){
                        surnameInput.parents('.form-group').removeClass('has-error');
                    });
                }

                if (!nameInput.val()) {
                    valid = false;
                    nameInput.parents('.form-group').addClass('has-error');
                    nameInput.unbind('keyup').keyup(function(){
                        nameInput.parents('.form-group').removeClass('has-error');
                    });
                }

                if (!phoneInput.val()) {
                    valid = false;
                    phoneInput.parents('.form-group').addClass('has-error');
                    phoneInput.unbind('keyup').keyup(function(){
                        phoneInput.parents('.form-group').removeClass('has-error');
                    });
                }

                if (!usersCountInput.val()) {
                    valid = false;
                    usersCountInput.parents('.form-group').addClass('has-error');
                    usersCountInput.unbind('change').on('change', function(e){
                        if (!$("option:selected", this).val())
                            usersCountInput.parents('.form-group').addClass('has-error');
                        else
                            usersCountInput.parents('.form-group').removeClass('has-error');
                    });
                }

                if (valid) {
                    $(this).button('loading');
                    $.fancybox.showLoading();
                    am.promiseCmd({
                        method:     'user.set_user_profile',
                        surname:    surnameInput.val(),
                        name:       nameInput.val(),
                        phone:      phoneInput.val(),
                        company:    companyInput.val(),
                        users_count: usersCountInput.val(),
                        partner_role: partner_role.val()?partner_role.val():null,
                        partner_www:  partner_www.val()?partner_www.val():null,
                        partner_potential: partner_potential.val()?partner_potential.val():null,
                    }).always(function(){
                        $.fancybox.hideLoading();
                    }).fail(function(err){
                        console.log(JSON.stringify(err));
                    }).done(function(){
                        modal.modal('hide');
                    });
                }
            });

            $('.js_rules_agreement_continue').click(function(e){
                e.preventDefault();

                var modal           = $('#rules_agreement'),
                    rules_agreement = $('#hs_rules_agreement_field'),
                    item            = $(this);

                item.button('loading');
                $.fancybox.showLoading();
                am.promiseCmd({
                    method:             'user.set_rules_agreement',
                    rules_agreement:    rules_agreement.prop('checked'),
                }).always(function(){
                    $.fancybox.hideLoading();
                    item.button('reset');
                }).fail(function(err){
                    am.showGenericFormErrors(modal, err);
                    console.log(JSON.stringify(err));
                }).done(function(){
                    modal.modal('hide');
                });
            });

            start_video_tour_modal.on('hide.bs.modal', function () {
                let iframe = $('#youtube_video_tour');
                let url = iframe.attr('src');
                iframe.attr('src', '');
                iframe.attr('src', url);
            });

            $(document).on('click', '.js_script_delete', function(e){

                e.preventDefault();
                var me = $(this);
                var scriptId = $(this).data('id');
                if (!scriptId) return;

                app.get('all').done(function(all){
                    all.confirm.show(Translator.trans('are_you_sure_delete_script'), function(){
                        if (self.busy) return;
                        self.busy = true;

                        $.fancybox.showLoading();
                        am.promiseCmd({
                            method: 'script.delete',
                            id: scriptId
                        }).always(function(){
                            self.busy = false;
                            $.fancybox.hideLoading();
                        }).done(function(res){
                            am.cUrl.removeAnchorParam('s');
                            me.parents('.script__item').remove();
                            self.scripts.initScriptsList(res.scripts);
                        }).fail(function(err){
                        });
                    });
                });

            });

            $(document).on('click', '.js_script_edit', function(e){

                var name = $(this).parents('.script__item').find('h4').text();

                e.preventDefault();
                $('#scriptsRenameFormError').val(name);
                $('#rename_script_id').val($(this).data('id'));
                $.fancybox.open($('.js_scripts_rename_script'));
            });

            $(document).on('click', '.js_order_script', function(e){

                e.preventDefault();

                var modal = $('#order_script_modal');

                modal.find('.order-form').show();
                modal.find('.order-success').hide();
                modal.find('.js_send_order_script').show();
                modal.modal();
            });
            $(document).on('click', '.js_multistep_copy', function(e){
                e.preventDefault();
                self.copySteps();
            });
            $(document).on('click', '.js_multistep_delete', function(e){
                e.preventDefault();
                self.deleteSelectedSteps();
            });
            $('.js_unlink_sipuni_user').click(function(e) {
                e.preventDefault();

                $.fancybox.showLoading();
                am.promiseCmd({
                    method: 'script.sipuni_unlink_cur_user'
                }).always(function(){
                    $.fancybox.hideLoading();
                }).done(function(){
                    $('.js_sipuni_integration').prop('readonly', false).prop('disabled', false).val('');
                    $('.integration-sipuni-status').hide('500');
                    $('.integrated-sipuni-status').show();
                }).fail(function(err){
                    console.log(JSON.stringify(err));
                });
            });
            $('.js_sipuni_save').click(function() {

                var hash = $('.js_sipuni_integration').val();
                var phone = $('.js_sipuni_phone').val();
                var script_id = $('.js_sipuni_script_id').val();
                var href = $(this).data('apihref');

                $.fancybox.showLoading();
                $.get( href, {hash: hash, phone: phone, script_id: script_id}, function( data ) {
                    setTimeout(function () {
                        if (hash.length>1) {
                            $('.js_sipuni_integration').prop('readonly', true).prop('disabled', true);
                            $('.integrated-sipuni-status').hide();
                            $('.integration-sipuni-status').show(500);

                        }
                        $.fancybox.hideLoading();
                    }, 700);
                });
            });

            $('.js_amocrm_add_fields_as_note').click(function() {

                var value = $(this).is(':checked');
                var scriptId = $('.js_scripts_list li a.active').data('id');

                $.fancybox.showLoading();
                am.promiseCmd({
                    method: 'script.set_amocrm_add_fields_as_note',
                    value: value,
                    id: scriptId
                }).always(function(){
                    $.fancybox.hideLoading();
                }).done(function(){

                }).fail(function(err){
                    console.log(JSON.stringify(err));
                });
            });

            $('.js_amocrm_add_pass_as_note').click(function() {

                var value = $(this).is(':checked');
                var scriptId = $('.js_scripts_list li a.active').data('id');

                $.fancybox.showLoading();
                am.promiseCmd({
                    method: 'script.set_amocrm_add_pass_as_note',
                    value: value,
                    id: scriptId
                }).always(function(){
                    $.fancybox.hideLoading();
                }).done(function(){

                }).fail(function(err){
                    console.log(JSON.stringify(err));
                });
            });

            $('.js_bitrix_save_when_call_in').click(function() {

                var value = $(this).is(':checked');
                var scriptId = $('.js_scripts_list li a.active').data('id');

                $.fancybox.showLoading();
                am.promiseCmd({
                    method: 'script.set_bitrix_save_when_call_in',
                    value: value,
                    id: scriptId
                }).always(function(){
                    $.fancybox.hideLoading();
                }).done(function(){

                }).fail(function(err){
                    console.log(JSON.stringify(err));
                });
            });

            $('.js_bitrix_add_fields_as_note').click(function() {

                var value = $(this).is(':checked');
                var scriptId = $('.js_scripts_list li a.active').data('id');

                $.fancybox.showLoading();
                am.promiseCmd({
                    method: 'script.set_bitrix_add_fields_as_note',
                    value: value,
                    id: scriptId
                }).always(function(){
                    $.fancybox.hideLoading();
                }).done(function(){

                }).fail(function(err){
                    console.log(JSON.stringify(err));
                });
            });

            $('.js_bitrix_add_pass_as_note').click(function() {

                var value = $(this).is(':checked');
                var scriptId = $('.js_scripts_list li a.active').data('id');

                $.fancybox.showLoading();
                am.promiseCmd({
                    method: 'script.set_bitrix_add_pass_as_note',
                    value: value,
                    id: scriptId
                }).always(function(){
                    $.fancybox.hideLoading();
                }).done(function(){

                }).fail(function(err){
                    console.log(JSON.stringify(err));
                });
            });

            $('.js_bitrix_auto_create_lead').click(function() {

                var value = $(this).is(':checked');
                var scriptId = $('.js_scripts_list li a.active').data('id');

                $.fancybox.showLoading();
                am.promiseCmd({
                    method: 'script.set_bitrix_auto_create_lead',
                    value: value,
                    id: scriptId
                }).always(function(){
                    $.fancybox.hideLoading();
                }).done(function(){

                }).fail(function(err){
                    console.log(JSON.stringify(err));
                });
            });
            $('.js_bitrix_auto_create_company').click(function() {

                var value = $(this).is(':checked');
                var scriptId = $('.js_scripts_list li a.active').data('id');

                $.fancybox.showLoading();
                am.promiseCmd({
                    method: 'script.set_bitrix_auto_create_company',
                    value: value,
                    id: scriptId
                }).always(function(){
                    $.fancybox.hideLoading();
                }).done(function(){

                }).fail(function(err){
                    console.log(JSON.stringify(err));
                });
            });
            $('.js_bitrix_auto_create_deal').click(function() {

                var value = $(this).is(':checked');
                var scriptId = $('.js_scripts_list li a.active').data('id');

                $.fancybox.showLoading();
                am.promiseCmd({
                    method: 'script.set_bitrix_auto_create_deal',
                    value: value,
                    id: scriptId
                }).always(function(){
                    $.fancybox.hideLoading();
                }).done(function(){

                }).fail(function(err){
                    console.log(JSON.stringify(err));
                });
            });
            $('.js_bitrix_auto_create_contact').click(function() {

                var value = $(this).is(':checked');
                var scriptId = $('.js_scripts_list li a.active').data('id');

                $.fancybox.showLoading();
                am.promiseCmd({
                    method: 'script.set_bitrix_auto_create_contact',
                    value: value,
                    id: scriptId
                }).always(function(){
                    $.fancybox.hideLoading();
                }).done(function(){

                }).fail(function(err){
                    console.log(JSON.stringify(err));
                });
            });
            $('.js_bitrix_allow_deal_selection').click(function() {
                let value = $(this).is(':checked');
                let scriptId = $('.js_scripts_list li a.active').data('id');

                $.fancybox.showLoading();
                am.promiseCmd({
                    method: 'script.set_bitrix_allow_deal_selection',
                    value: value,
                    id: scriptId
                }).always(function(){
                    $.fancybox.hideLoading();
                }).done(function(){

                }).fail(function(err){
                    console.log(JSON.stringify(err));
                });
            });

            $('.js_unlink_amo_user').click(function(e) {
                e.preventDefault();

                $.fancybox.showLoading();
                am.promiseCmd({
                    method: 'script.amocrm_unlink_cur_user'
                }).always(function(){
                    $.fancybox.hideLoading();
                }).done(function(){
                    $('.integration-amocrm-status').hide('500');
                }).fail(function(err){
                    console.log(JSON.stringify(err));
                });
            });

            $('.js_unlink_bitrix_user').click(function(e) {
                e.preventDefault();

                $.fancybox.showLoading();
                am.promiseCmd({
                    method: 'script.bitrix_unlink_cur_user'
                }).always(function(){
                    $.fancybox.hideLoading();
                }).done(function(){
                    $('.integration-bitrix-status').hide('500');
                }).fail(function(err){
                    console.log(JSON.stringify(err));
                });
            });

            $('.js_send_order_script').click(function(e) {

                e.preventDefault();

                var surnameInput = $('#order_surname');
                var nameInput = $('#order_name');
                var phoneInput = $('#order_phone');

                if (!surnameInput.val()) {

                    surnameInput.parents('.form-row').addClass('has-error');
                    surnameInput.unbind('change').change(function(){
                        surnameInput.parents('.form-row').removeClass('has-error');
                    });

                    return;
                }
                if (!nameInput.val()) {

                    nameInput.parents('.form-row').addClass('has-error');
                    nameInput.unbind('change').change(function(){
                        nameInput.parents('.form-row').removeClass('has-error');
                    });

                    return;
                }
                if (!phoneInput.val()) {

                    phoneInput.parents('.form-row').addClass('has-error');
                    phoneInput.unbind('change').change(function(){
                        phoneInput.parents('.form-row').removeClass('has-error');
                    });
                    return;
                }

                $.fancybox.showLoading();
                am.promiseCmd({
                    method: 'script.order_script',
                    surname: surnameInput.val(),
                    name: nameInput.val(),
                    phone: phoneInput.val()
                }).always(function(){
                    $.fancybox.hideLoading();
                }).fail(function(err){
                    console.log(JSON.stringify(err));
                }).done(function(){

                    var modal = $('#order_script_modal');

                    modal.find('.order-form').hide();
                    modal.find('.order-success').show();
                    modal.find('.js_send_order_script').hide();

                    window.setTimeout(function(){
                        modal.modal('hide');
                    }, 3000);

                    surnameInput.val('');
                    nameInput.val('');
                    phoneInput.val('');
                });
            });
            $.contextMenu({
                selector: '.step',
                callback: function(key, options) {
                    if(key === "paste") {
                        self.pasteSteps($(this));
                    }
                    if(key === "pasteWithChildren") {
                        self.pasteStepsWithChildrens($(this));
                    }
                    if(key === "copy") {
                        self.copySteps();
                    }
                    if(key === "remove") {
                        self.deleteSelectedSteps();
                    }
                },
                items: {
                    paste: {
                        name: Translator.trans('paste_steps'), icon: "paste",
                        disabled: function(key, opt){
                            if(self.copyStepsBuffer.get().length < 1){
                                return true;
                            }
                            return false;
                        }
                    },
                    pasteWithChildren: {
                        name: Translator.trans('paste_steps_with_children'), icon: "paste",
                        disabled: function(key, opt){
                            if(self.copyStepsBuffer.get().length < 1){
                                return true;
                            }
                            return false;
                        }
                    },
                    copy: {
                        name: Translator.trans('copy'), icon: "copy",
                        disabled: function(key, opt){
                            if(desk.find('.step.sel').length < 2){
                                return true;
                            }
                            return false;
                        }
                    },
                    remove: {
                        name: Translator.trans('delete_selected_steps'), icon: "delete",
                        disabled: function(key, opt){
                            if(desk.find('.step.sel').length < 2){
                                return true;
                            }
                            return false;
                        }
                    }
                }
            });
            $(document).bind('keyup', function (e) {
                var code = e.keyCode? e.keyCode : e.charCode;

                // 91 and 93 for apple
                if(code == 17 || code == 91 || code == 93) {
                    self.isCtrlPressed = false;
                }
            });
            // prevent backspace
            $(document).unbind('keydown').bind('keydown', function (event) {
                var doPrevent = false;
                var d = event.srcElement || event.target;
                if(d.getAttribute('contenteditable')){
                    return;
                }
                var isTextInput = ((d.tagName.toUpperCase() === 'INPUT' && (
                    d.type.toUpperCase() === 'TEXT' ||
                    d.type.toUpperCase() === 'URL' ||
                    d.type.toUpperCase() === 'NUMBER' ||
                    d.type.toUpperCase() === 'PASSWORD' ||
                    d.type.toUpperCase() === 'FILE' ||
                    d.type.toUpperCase() === 'EMAIL' ||
                    d.type.toUpperCase() === 'SEARCH' ||
                    d.type.toUpperCase() === 'DATE' )
                ) || d.tagName.toUpperCase() === 'TEXTAREA');

                if (event.keyCode === 8) {
                    if (isTextInput) {
                        doPrevent = d.readOnly || d.disabled;
                    }
                    else {
                        doPrevent = true;
                    }
                }

                // 91 and 93 for apple
                if(event.ctrlKey || (event.keyCode == 91 || event.keyCode == 93) || event.metaKey) {
                    self.isCtrlPressed = true;
                    if (!isTextInput) {
                        //Ctrl (command) + C
                        if(event.keyCode == 67) {
                            self.copySteps();
                        }
                        //Ctrl (command) + V
                        if(event.keyCode == 86) {
                            self.pasteSteps(null);
                        }
                        //Ctrl (command) + S
                        if(event.keyCode == 83) {
                            // self.save;
                            if($('.js_scripts_action_save').is(":visible")) {
                                $('.js_scripts_action_save').click();
                            }
                            event.preventDefault();
                            return false;
                        }
                    }
                }
                if (doPrevent) {
                    event.preventDefault();
                }
            });

            $(window).bind('beforeunload', function(){
                if (self.view.hasChanges()) {
                    self.view.stopScriptAndSaveLog('leave', true, true);
                }
            });
        },
        getSettingsHtml: function(id){
            var div = $('<div>', { class: 'action-menu action-menu-script' });
            div.append($('<span>', { 'data-type': 'script', 'data-id': id, class: 'action-init', text: '...' }))
            div.append($('<ul>'));
            return $('<div>').append(div);
        }
    };
})();
