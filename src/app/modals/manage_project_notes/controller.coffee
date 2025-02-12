class ManageProjectNotesController extends ModalController

    @register 'ManageProjectNotesController'

    @inject '$uibModalInstance', 'Restangular', 'Utils', '$state', 'response','$tinymcePlugins','$tinymceToolbarFull','$tinymceStatusbar','diligenceId','ModalFactory','$timeout','toaster','DueDiligenceDataservice','firm_preferences','editable','responseStatus','dvThresholds'

    initialize: ->
        @current_user = @Utils.getCurrentUser()
        @unsupportedResponseTypes = ['Attachment','ReturnTable','aumTable','Grid','DynamicGrid']
        @responseCopy = {}
        @commentsLookup = []
        @validResponsesInSequence = _(@response.sequence.responses).filter (response)=>
            response.id and !response.attributes.is_NA and ((@editable && response.attributes.response_status != @responseStatus.STARTED) or !@editable) and !(response.responseType in @unsupportedResponseTypes)
        @responseIndex = _(@validResponsesInSequence).findIndex (response)=>
            response.id == @response.id
        if @response.attributes.response_with_notes_attributes == null and ((@response.responseType == 'TextMultiLine' and !@editable) or @response.responseType != 'TextMultiLine')
            @responseCopy.response_with_notes_attributes = @response.attributes.responseDisplay
        else if @response.responseType == 'TextMultiLine' and @editable
            @responseCopy.response_with_notes_attributes = @response.attributes.textResponse
        else
            @responseCopy.response_with_notes_attributes = @response.attributes.response_with_notes_attributes
        @initTinymce()
        @togglePreviousComments()

    initTinymce: =>
        @tinymceOptions =
            skin_url: '/assets/stylesheets/tinymce/skins/tinymce-dv'
            browser_spellcheck: true
            plugins: 'tinycomments'
            automatic_uploads: false
            custom_undo_redo_levels: 10
            toolbar: 'addcomment showcomments'
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
            object_resizing: false
            tinycomments_mode: 'callback'
            tinycomments_create: (req, done, fail)=>
                selectedText = @editor.selection.getContent()
                if selectedText.replace(/&nbsp;/g, '').replace(/\s/g, '').length > 0
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
                selectedText = @editor.selection.getContent()
                if selectedText.replace(/&nbsp;/g, '').replace(/\s/g, '').length > 0
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
                selectedText = @editor.selection.getContent()
                if selectedText.replace(/&nbsp;/g, '').replace(/\s/g, '').length > 0
                    selectedComment = _(@commentsLookup.comments).find (comment)=>
                        comment.uid == req.commentUid
                    if selectedComment.author == @current_user.id
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
                        @toaster.pop 'error','','You are not authorized to modify this comment.'
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
                                    createdAt: @Utils.getLocalDateTime(comment.created_at).toDate().toISOString()
                                    content: comment.content
                                    modifiedAt: if comment.updated_at == null then @Utils.getLocalDateTime(comment.created_at).toDate().toISOString() else @Utils.getLocalDateTime(comment.updated_at).toDate().toISOString()
                                    uid: comment.id+''
                                }
                    @commentsLookup = conv
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
                    #this is not working now. keeping this here to fix it later.
                    # $(editor.getBody()).on('keydown',(evt)=>
                    #     key = evt.keyCode || evt.charCode
                    #     if key == 46
                    #         evt.preventDefault()
                    #         evt.stopPropagation()
                    #         return false
                    # )
            setup: (ed) =>
                @editor = ed
                @editor.on 'SkinLoaded', =>
                    @editor.execCommand("ToggleSidebar", false, "showcomments")
        if @response.responseType == 'TextMultiLine' and @editable
            @tinymceOptions.plugins = @tinymceOptions.plugins + ' flite'
            @tinymceOptions.toolbar = @tinymceOptions.toolbar + " | flite"
            @tinymceOptions.flite = {
                isTracking: if @isTrackingEnabled() then true else false
                isVisible: true
                userName: @current_user.fullName
                userId: @current_user.id
                commands: [FLITE.Commands.TOGGLE_TRACKING, FLITE.Commands.ACCEPT_ALL, FLITE.Commands.REJECT_ALL, FLITE.Commands.ACCEPT_ONE, FLITE.Commands.REJECT_ONE]
            }

    isTrackingEnabled: =>
        if @response.responseType == 'TextMultiLine' and (@firm_preferences.enable_track_changes or (@response._previousAttributes.textResponse and @response._previousAttributes.textResponse.indexOf('<span class="ice') > -1))
            true
        else
            false

    previousComment: =>
        if @responseIndex > 0
            @responseIndex--
            @response = @validResponsesInSequence[@responseIndex]
            if @response.attributes.response_with_notes_attributes == null
                @responseCopy.response_with_notes_attributes = @response.attributes.responseDisplay
            else
                @responseCopy.response_with_notes_attributes = @response.attributes.response_with_notes_attributes
            @initTinymce()
            @resetPreviousComments()
            @togglePreviousComments()

    nextComment: =>
        if @responseIndex < @validResponsesInSequence.length-1
            @responseIndex++
            @response = @validResponsesInSequence[@responseIndex]
            if @response.attributes.response_with_notes_attributes == null
                @responseCopy.response_with_notes_attributes = @response.attributes.responseDisplay
            else
                @responseCopy.response_with_notes_attributes = @response.attributes.response_with_notes_attributes
            @initTinymce()
            @resetPreviousComments()
            @togglePreviousComments()

    togglePreviousComments: =>
        @showPreviousComments = !@showPreviousComments
        @getAllComments() if @showPreviousComments

    getAllComments: =>
        @loading_comments = true
        @Restangular.one('diligences',@diligenceId).one('responses',@response.id).all('comments').getList(is_selected_text_removed:true, is_resolved: true, include_internal_notes: true).then (response)=>
            @commentsMap = {}
            _(response).each (comment)=>
                if comment.parent_id == null
                    comment.threads = [angular.copy comment]
                    @commentsMap[comment.id] = comment
                else if @commentsMap[comment.parent_id] != null
                    @commentsMap[comment.parent_id].threads.push comment
            @loading_comments = false

    resetPreviousComments: =>
        @showPreviousComments = false
        @commentsMap = {}

    save: =>
        if @response.responseType == 'TextMultiLine' and @editable
            params = 
                duediligence_id: @diligenceId
                SectionID: @response.sequence.attributes.sectionID
                questionID: @response.question.id
                response: @response.getResponseAttributes()
            params.response.textResponse = @responseCopy.response_with_notes_attributes
            @DueDiligenceDataservice.saveResponse(params).then (response) =>
                currentComments = []
                $(@editor.contentDocument).find("[data-mce-annotation-uid]").each(()->
                    currentComments.push $(this).attr('data-mce-annotation-uid')
                )
                @Restangular.one('diligences', @response.diligenceId).one('responses',@response.id).all('bulk_resolve_comments').customPUT(current_comment_ids: currentComments).then ()=>
                    angular.extend(@response.attributes, _(response).omit('grid_responses'))
                    @response.copyCurrentAttributes()
                    @response.attributes.response_with_notes_attributes = @response.attributes.textResponse
        else
            @Restangular.one('diligences',@diligenceId).one('responses',@response.id).all('notes_attributes').customPUT(response_with_notes_attributes:@responseCopy.response_with_notes_attributes).then (response)=>
                currentComments = []
                $(@editor.contentDocument).find("[data-mce-annotation-uid]").each(()->
                    currentComments.push $(this).attr('data-mce-annotation-uid')
                )
                
                @Restangular.one('diligences', @response.diligenceId).one('responses',@response.id).all('bulk_resolve_comments').customPUT(current_comment_ids: currentComments).then (res)=>
                    @response.attributes.response_with_notes_attributes = @responseCopy.response_with_notes_attributes
                    @response.attributes.response_comments_counts = res.response_comments_counts
                    @response.attributes.response_unresolved_comments_counts = res.response_unresolved_comments_counts