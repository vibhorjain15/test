class ResponseParagraphTrackChangesController extends BaseController
    @register 'ResponseParagraphTrackChangesController'

    @inject 'Restangular', '$timeout', 'Utils'

    initialize: ->
        @current_user = @Utils.getCurrentUser()
        @diligenceId = @response.diligenceId
        @tinymceOptions =
            skin_url: '/assets/stylesheets/tinymce/skins/tinymce-dv'
            browser_spellcheck: true
            plugins: 'tinycomments flite'
            automatic_uploads: false
            custom_undo_redo_levels: 10
            toolbar: 'addcomment showcomments | flite'
            menubar: false
            contextmenu: false
            statusbar: false
            paste_data_images: true
            paste_filter_drop: false
            branding: false
            resize: false
            elementpath: false
            image_dimensions: false
            forced_root_block : ""
            content_css : 'assets/stylesheets/tiny_mce_custom.css'
            table_toolbar: ""
            flite :
                isTracking: true
                isVisible: true
                userName: @current_user.fullName
                userId: @current_user.id
                commands: [FLITE.Commands.ACCEPT_ALL, FLITE.Commands.REJECT_ALL, FLITE.Commands.ACCEPT_ONE, FLITE.Commands.REJECT_ONE]
            tinycomments_mode: 'callback'
            tinycomments_create: (req, done, fail)=>
                if @editor.selection.getContent().length > 0
                    @Restangular.all('response_comments').customPOST({
                        diligence_id: @diligenceId
                        response_id: @response.id
                        content: req.content
                        selected_text: @editor.selection.getContent()
                    }).then (response)=>
                        done({ conversationUid: response.id })
                    , (error)=>
                        fail(error)
                else
                    @toaster.pop 'error','','Please select a text to add a review note'
            tinycomments_reply: (req, done, fail)=>
                if @editor.selection.getContent().length > 0
                    @Restangular.all('response_comments').customPOST({
                        diligence_id: @diligenceId
                        response_id: @response.id
                        content: req.content
                        parent_id: req.conversationUid
                        selected_text: @editor.selection.getContent()
                    }).then (response)=>
                        done({ commentUid: response.id })
                    , (error)=>
                        fail(error)
                else
                    @toaster.pop 'error','','Please select a text to add a review note'
            tinycomments_edit_comment: (req, done, fail)=>
                if @editor.selection.getContent().length > 0
                    @Restangular.one('response_comments',req.commentUid).customPUT({
                        diligence_id: @diligenceId
                        response_id: @response.id
                        content: req.content
                        selected_text: @editor.selection.getContent()
                        parent_id: req.conversationUid if Number(req.conversationUid) != req.commentUid
                    }).then (response)=>
                        done({ canEdit: true})
                    , (error)=>
                        fail(error)
                else
                    @toaster.pop 'error','','Please select a text to add a review note'
            tinycomments_delete: (req, done, fail)=>
                @Restangular.one('response_comments',req.conversationUid).remove().then (response)=>
                    done({canDelete: true})
                , (error)=>
                    fail(error)
            tinycomments_delete_all: (req, done, fail)=>
                console.log req
            tinycomments_delete_comment: (req, done, fail)=>
                @Restangular.one('response_comments',req.commentUid).remove().then (response)=>
                    done({canDelete: true})
                , (error)=>
                    fail(error)
            tinycomments_lookup: (req, done, fail)=>
                @Restangular.one('diligences',@diligenceId).one('responses',@response.id).all('comments').getList().then (response)=>
                    conv = 
                        uid: req.conversationUid
                        comments: _(response).filter((comment)=>
                                comment.id == Number(req.conversationUid) or comment.parent_id == Number(req.conversationUid)
                            ).map (comment)=>
                                {
                                    author: comment.created_by
                                    authorName: comment.created_by_name
                                    createdAt: @Utils.getLocalDateTime(comment.created_at)
                                    content: comment.content
                                    modifiedAt: @Utils.getLocalDateTime(comment.updated_at)
                                    uid: comment.id
                                }
                    done(conversation: conv)
                , (error)=>
                    fail(error)
            tinycomments_resolve: (req, done, fail)=>
                @Restangular.one('response_comments',req.conversationUid).customPUT({
                    diligence_id: @diligenceId
                    response_id: @response.id
                    is_resolved: true
                }).then (response)=>
                    @getAllComments()
                    done({ canResolve: true})
                , (error)=>
                    fail(error)
            min_height: 500
            max_height: 1000
            render: (editor) =>
                @$timeout => #since this comes from a event handler in tinymce
                    @ModalFactory.invokeModal 'questionnaire_upload_image',
                        resolve:
                            editor: -> editor
            init_instance_callback: (editor)=>
                @$timeout =>
                    editor.getBody().setAttribute('contenteditable', false)
                    $(editor.getBody()).find('a').click((event)=>
                        event.preventDefault()
                    )
            setup: (ed) =>
                @editor = ed
                @editor.on 'SkinLoaded', =>
                    @editor.execCommand("ToggleSidebar", false, "showcomments")