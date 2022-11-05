var appasyncadd = appasyncadd || [];
(function() {
    var app = {},
        am = {},
        self = {};
    var loader = function(an_app) {
        app = an_app;
        am = app.misc;
        app.addVideo = module;
        self = module;
        self.init();
    };
    setTimeout(function() {
        appasyncadd.push(loader);
    }, 0);

    var tmp = $('<div></div>');

    var module = {
        editor: null,
        init: function() {
            var videoModal = $('#show_add_video');
            var saveBtn = $('.js_video_save');
            saveBtn.attr('disabled', true);
            $('.js_video_add').on('click', function() {
                $('.js_video_error').hide();
                var url = $('.js_video_url_input').val();
                if (url == '') {
                    saveBtn.attr('disabled', true);
                    $('.js_video_error .alert').html(Translator.trans('videoBtn_error_empty_url'));
                    $('.js_video_error').show();
                    return;
                }
                var videoId = self.ytVidId(url);
                if (!videoId) {
                    $('.js_video_error .alert').html(Translator.trans('videoBtn_error_invalid_url'));
                    $('.js_video_error').show();
                    saveBtn.attr('disabled', true);
                    return;
                }
                $('#ytVideoPreview').attr('src', 'https://www.youtube.com/embed/' + videoId);
                $('.js_video_preview').show();
                $('.js_yt_video_id').val(videoId);
                saveBtn.attr('disabled', false);
            });
            saveBtn.on('click', function() {
                self.saveVideo();
            });
        },
        saveVideo: function() {
            var videoId = $('.js_yt_video_id').val();
            self.addVideoToEditor(videoId);
            $('#show_add_video').modal('hide');
            self.clearAddVideoForm();
        },
        ytVidId: function ytVidId(url) {
            var p = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
            return (url.match(p)) ? RegExp.$1 : false;
        },
        showAddVideoFromEditor: function(editor) {
            self.editor = editor;
            var videoModal = $('#show_add_video');
            self.clearAddVideoForm();
            videoModal.modal();
        },
        clearAddVideoForm: function() {
            $('.js_video_url_input').val(null);
            $('.js_yt_video_id').val(null);
            $('.js_video_preview').hide();
            $('#ytVideoPreview').removeAttr('src');
        },
        addVideoToEditor: function(videoId) {
            self.editor.insertContent(self.getVideoLabel(videoId));
        },
        getVideoLabel: function(videoId) {
            return '<hs class="js_embed_video js_non_editable" data-id="' + videoId + '"></hs>';
        },
        replaceVideosToObjects: function(content) {
            var pattern = /<hs class="js_embed_video[^"]*" data-id="(.*?)"[^>]*><\/hs>/gi;
            if (!content) return content;
            return content.replace(pattern, function(match, videoId) {
                return '<hs class="js_embed_video js_embed_video_with_icon js_non_editable" data-id="' + videoId + '">YouTube Video</hs>';
            });
        },
        backReplaceVideosInEditor: function(content) {
            var pattern = /<hs class="js_embed_video[^"]*" data-id="(.*?)">.*?<\/hs>/gi;
            return content.replace(pattern, function(match, videoId) {
                return self.getVideoLabel(videoId);
            });
        },
        replaceVideosToValues: function(content) {
            var pattern = /<hs class="js_embed_video[^"]*" data-id="(.*?)"[^>]*><\/hs>/gi;
            return content.replace(pattern, function(match, videoId) {
                return '<span class="yt_video_span">YouTube Video</span>';
            });
        },
        replaceVideos: function(content, valueWrapper) {
            valueWrapper = valueWrapper || false;
            var pattern = /<hs class="js_embed_video[^"]*" data-id="(.*?)"[^>]*><\/hs>/gi;
            return content.replace(pattern, function(match, videoId) {
                return '<hs class="js_embed_video js_non_editable" data-id="' + videoId + '">' +
                    '<div class="js_yt_video_container"><iframe frameborder="0" src="https://www.youtube.com/embed/' + videoId + '" allowfullscreen></iframe></div>' + '</hs>';
            });
        },
    };

})();