
class QuestionnaireFormControlController extends BaseController
  @register 'QuestionnaireFormControlController'

  @inject '$scope', 'DueDiligenceDataservice', '$attrs', 'SweetAlert', 'FileHandlerFactory',
          '$compile', '$q', 'toaster', '$timeout', 'ModalFactory','$rootScope','DocumentsService'
          '$stateParams', 'SidebarViewService', 'BaseDataService', 'Utils','Restangular','QuestionnaireGridResponseFactory', '$tinymceToolbarFull', '$tinymcePlugins', 'FILTER_TERNARY_OPERATORS','responseStatus','diligenceStatusConstant','dvThresholds','QuestionnaireResponseFactory','$tinymceStatusbar', 'ratingConstants','ImageDataService','trackChangeStatus'


  initialize: ->
    @templateId = @$stateParams.templateId
    @is_admin = @Utils.isAdmin()
    @is_investor = @Utils.isInvestor()
    @es_params = {}
    @is_manager = @Utils.isManager()
    @is_freeSubscription = @Utils.isFreeSubscription()
    @isCommentSectionVisible = false
    @isCommentAddBtnVisible = true
    @noCommentResponseTypes = ['TextMultiLine', 'Text', 'TextEmail']
    @minDate = new Date()
    @current_user = @Utils.getCurrentUser()
    @showForManager = @is_manager && !@is_freeSubscription
    @showForInvestor = @is_investor && !@is_freeSubscription
    @unsupportedResponseTypes = ['Attachment','ReturnTable','aumTable','Grid','DynamicGrid']
    @commentsLookup = []
    @reviewButtonShow = {
      edit: false
      decline: false
      accept: false
      addverifier: false
      updateverifier: false
      undo: false
      othercontrols: false
      notecontrols: false
    }
    @responseDisplayUnsupportedTypes = ['Attachment','ReturnTable','aumTable']

    @$rootScope.$on 'update:wip',(event,responseList) =>
      if responseList.indexOf(@response.id) > -1
        @response.attributes['is_WIP'] = false
        @response._previousIsWIP = false

    deregisterer = @$scope.$watch 'questionnaireController.diligence', (value) =>
      if value?
        @assignFormViewLogic()
        deregisterer()

    deregistererFirmPref = @$scope.$watch 'questionnaireController.firm_preferences', (value) =>
      if value?
        @firm_preferences = value
        @isQaSearchEnabled = value.enableQASearch || (@current_user.userName.toLowerCase().indexOf('diligencevault.com') > -1)
        @selectedTab = "all"
        if value.set_preapproved_default && !@is_freeSubscription
          @selectedTab = 'profile'
        deregistererFirmPref()

    allowed_file_extensions = @FileHandlerFactory.getFileTypes()
    @maxFileSize = @FileHandlerFactory.getMaxFileSize()

    @allowed_file_extensions_str = _(allowed_file_extensions).map((ext) ->
      '.' + ext
    ).join(',')

    @$scope.$watch "::#{@$attrs.response}", (response) =>
      $scope = @$scope
      response.scope = $scope # used to scroll to the element in case of error, this scope has element tied to it
      @response = response
      @response.showQuestionMap = false
      @ngModelControllers = []
      @responseType = response.question.attributes.responseType
      @child_scope_map = {}
      @preview = @$scope.questionnaireController.preview
      @updateRecommendationTooltip()

      @tinymceOptions =
        images_upload_handler: (blobInfo, success, failure) =>
          @uploadImages(blobInfo,success,failure)
        skin_url: '/assets/stylesheets/tinymce/skins/tinymce-dv'
        browser_spellcheck: true
        plugins: @$tinymcePlugins
        automatic_uploads: false
        custom_undo_redo_levels: 10
        toolbar: @$tinymceToolbarFull
        menubar: false
        contextmenu: false
        statusbar: @$tinymceStatusbar
        paste_data_images: true
        paste_filter_drop: false
        branding: false
        resize: false
        elementpath: false
        image_dimensions: false
        forced_root_block : ""
        content_css : 'assets/stylesheets/tiny_mce_custom.css'
        table_toolbar: ""
        height: "400"
        toolbar_mode : 'sliding'
        indent: false
        flite:
          isTracking: false
          isVisible: false
        render: (editor) =>
          @$timeout => #since this comes from a event handler in tinymce
            @ModalFactory.invokeModal 'questionnaire_upload_image',
              resolve:
                editor: -> editor
        init_instance_callback: (editor)=>
          editor.on(FLITE.Events.TRACKING, (flite, tracking)=>
            @tinymceOptions.flite.isTracking = flite.tracking
          )
        setup: (ed) =>
          @editor = ed
          @response.editor = ed
          ed.on('keyup', (event,ed)=>
            if @response.question.attributes.responseType == "TextMultiLine"
              if @response.question.attributes.response_word_limit != null
                edContent = @Utils.removeHtmlStrings(@editor.getContent())
                wordCount = @Utils.countWords(edContent)
                if wordCount
                  @response.question.attributes['word_count'] = wordCount
                  if wordCount > @response.question.attributes.response_word_limit
                    @editor.contentDocument.body.style.border = '1px solid #dc3545';
                  else
                    @editor.contentDocument.body.style.border = 'none';
                else
                  @editor.contentDocument.body.style.border = 'none';
                  @response.question.attributes['word_count'] = 0
              else
                edContent = @Utils.removeHtmlStrings(@editor.getContent())
                wordCount = @Utils.countWords(edContent)
                if wordCount
                  @response.question.attributes['word_count'] = wordCount
                else
                  @response.question.attributes['word_count'] = 0
          )
          ed.on('init', (event)=>
            if @response.question.attributes.response_word_limit && @response.question.attributes.response_word_limit != null
              edContent = @Utils.removeHtmlStrings(@editor.getContent())
              wordCount = @Utils.countWords(edContent)
              if wordCount
                @response.question.attributes['word_count'] = wordCount
                if wordCount > @response.question.attributes.response_word_limit
                  @editor.contentDocument.body.style.border = '1px solid #dc3545'
                else
                  @editor.contentDocument.body.style.border = 'none'
              else
                @editor.contentDocument.body.style.border = 'none'
                @response.question.attributes['word_count'] = 0
            else
              edContent = @Utils.removeHtmlStrings(@editor.getContent())
              wordCount = @Utils.countWords(edContent)
              if wordCount
                @response.question.attributes['word_count'] = wordCount
              else
                @response.question.attributes['word_count'] = 0
          )
          ed.on(FLITE.Events.INIT, (event)=>
            @flite = event.flite
          )

      @setTrackinginTinymce() if @response.responseType == 'TextMultiLine'

      if @responseTypeNotExcluded(@response)
        @response.allowAddToPreapproved = true
      else
        @response.allowAddToPreapproved = false

      if @response.question.hint_text
        @response.question.attributes.hint_text = @response.question.hint_text

      @$scope.init()

      @checkConditionsForAddToResponse()

      response.onChange =>
        @onResponseChange()

      if response.sequence.section.readonly
        if @responseType == 'CheckBox'
          @initCheckboxWidget(response).then =>
            @onResponseChange()
        else
          @onResponseChange()
        return

      switch @responseType
        when 'Dropdown'
          @initDropdownWidget(response).then =>
            @onResponseChange()
        when 'CheckBox'
          @initCheckboxWidget(response).then =>
            @onResponseChange()
        when 'Grid'
          response.initialized.then =>
            @onResponseChange()
        when 'DynamicGrid'
          response.initialized.then =>
            @onResponseChange()
        when 'Text', 'TextMultiLine'
          response.initialized.then =>
            if  @response.attributes.responseDisplay && @response.attributes.responseDisplay != undefined
              if !@response.question.attributes.word_count
                edContent = @Utils.removeHtmlStrings(@response.attributes.responseDisplay)
                wordCount = @Utils.countWords(edContent)
                if wordCount
                  @response.question.attributes['word_count'] = wordCount
                else
                  @response.question.attributes['word_count'] = 0
            @onResponseChange()
        else
          @onResponseChange()

      response.initialized.then =>
        response.onFlagChange = $scope.toggleIconDisplay
        $scope.toggleIconDisplay(response)

    @getTeamMembers()

  setTrackinginTinymce: =>
    if @response.sequence.section.isReadonlyEditable and @response.attributes.response_status != @responseStatus.STARTED
      @tinymceOptions.plugins = @tinymceOptions.plugins + ' flite tinycomments'
      @tinymceOptions.toolbar = @$tinymceToolbarFull + " | flite | addcomment showcomments"
      @tinymceOptions.flite = {
        isTracking: if @isTrackingEnabled() then true else false
        isVisible: true
        userName: @current_user.fullName
        userId: @current_user.id
        commands: [FLITE.Commands.TOGGLE_TRACKING, FLITE.Commands.ACCEPT_ALL, FLITE.Commands.REJECT_ALL, FLITE.Commands.ACCEPT_ONE, FLITE.Commands.REJECT_ONE]
      }
      @tinymceOptions.tinycomments_mode = 'callback'
      @tinymceOptions.tinycomments_create = (req, done, fail)=>
        selectedText = @editor.selection.getContent()
        if selectedText.replace(/&nbsp;/g, '').replace(/\s/g, '').length > 0
          @Restangular.all('response_comments').customPOST({
            diligence_id: @response.diligenceId
            response_id: @response.id
            content: req.content
            selected_text: @editor.selection.getContent()
          }).then (response)=>
            done({ conversationUid: response.id })
          , (error)=>
            fail(error)
        else
            @toaster.pop 'error','','Please select a text to add a review note'
      @tinymceOptions.tinycomments_reply = (req, done, fail)=>
        selectedText = @editor.selection.getContent()
        if selectedText.replace(/&nbsp;/g, '').replace(/\s/g, '').length > 0
          @Restangular.all('response_comments').customPOST({
            diligence_id: @response.diligenceId
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
      @tinymceOptions.tinycomments_edit_comment = (req, done, fail)=>
        selectedText = @editor.selection.getContent()
        if selectedText.replace(/&nbsp;/g, '').replace(/\s/g, '').length > 0
          selectedComment = _(@commentsLookup.comments).find (comment)=>
            comment.uid == req.commentUid
          if selectedComment.author == @current_user.id
            @Restangular.one('response_comments',req.commentUid).customPUT({
              diligence_id: @response.diligenceId
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
      @tinymceOptions.tinycomments_delete = (req, done, fail)=>
        @Restangular.one('response_comments',req.conversationUid).remove().then (response)=>
          done({canDelete: true})
        , (error)=>
          fail(error)
      @tinymceOptions.tinycomments_delete_all = (req, done, fail)=>
          console.log req
      @tinymceOptions.tinycomments_delete_comment = (req, done, fail)=>
        @Restangular.one('response_comments',req.commentUid).remove().then (response)=>
          done({canDelete: true})
        , (error)=>
          fail(error)
      @tinymceOptions.tinycomments_lookup = (req, done, fail)=>
        @Restangular.one('diligences',@response.diligenceId).one('responses',@response.id).all('comments').getList().then (response)=>
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
          @commentsLookup = conv
          done(conversation: conv)
        , (error)=>
          fail(error)
      @tinymceOptions.tinycomments_resolve = (req, done, fail)=>
        @Restangular.one('response_comments',req.conversationUid).customPUT({
          diligence_id: @response.diligenceId
          response_id: @response.id
          is_resolved: true
        }).then (response)=>
          done({ canResolve: true})
        , (error)=>
          fail(error)

  isTrackingEnabled: =>
    if @responseType == 'TextMultiLine' and (@firm_preferences.enable_track_changes or (@response._previousAttributes.textResponse and @response._previousAttributes.textResponse.indexOf('<span class="ice') > -1))
      true
    else
      false

  assignFormViewLogic: =>
    @type = @$scope.questionnaireController.diligence.diligence_type
    @is_internal = @$scope.questionnaireController.diligence.is_internal
    @isLocked = @$scope.questionnaireController.diligence.isLocked
    @isEditable = !@$scope.questionnaireController.diligence.isReadOnly and !@isLocked
    @isReadOnly = @$scope.questionnaireController.diligence.isReadOnly

  getTeamMembers: =>
    @BaseDataService.getTeamMembers().then (teamMembers) =>
      @teamMembers = _(teamMembers).map (teamMember) ->
        teamMember.fullname = _([teamMember.firstName, teamMember.lastName]).compact().join(' ')
        teamMember

  openFollowupDialog: ->
    return if (@response.isNew() || @is_internal || @type == 'shared_profile')
    @$scope.questionnaireController.openFollowupDialog(@response)

  openHistoryDialog: ->
    return if @response.isNew()

    responseType = @response.responseType

    if responseType in @unsupportedResponseTypes
      @$scope.questionnaireController.openHistoryDialog(@response)
    else
      @$scope.questionnaireController.openBlacklineHistoryDialog(@response)

  openNotesDialog: ->
    @$scope.questionnaireController.openNotesDialog(@response, 'Question')

  openReviewNotesDialog: ->
    if @response.id
      @ModalFactory.invokeModal 'manage_project_notes',
        resolve:
          response: => @response
          diligenceId: => @$scope.questionnaireController.diligence.id
          firm_preferences: => @firm_preferences
          editable: => if @$scope.isReadonlyEditable then true else false
        dismiss: =>
          @$scope.$emit 'refresh:counts'



  openTodosDialog: ->
    return if @response.isNew()
    @$scope.questionnaireController.openTodosDialog(@response)

  b64toBlob : (b64Data, contentType = '', sliceSize = 512) =>
    byteCharacters = atob(b64Data)
    byteArrays = []
    offset = 0
    while offset < byteCharacters.length
      slice = byteCharacters.slice(offset, offset + sliceSize)
      byteNumbers = new Array(slice.length)
      i = 0
      while i < slice.length
        byteNumbers[i] = slice.charCodeAt(i)
        i++
      byteArray = new Uint8Array(byteNumbers)
      byteArrays.push byteArray
      offset += sliceSize
    blob = new Blob(byteArrays, type: contentType)
    blob

  uploadImages: (blobInfo,success,failure) =>
    @resultBlob = @b64toBlob(blobInfo.base64())
    @resultBlob.name = blobInfo.filename()
    @ImageDataService.uploadImage(@resultBlob).success (uploaded_file) =>
      success(uploaded_file[0].blobUrl)
      @response.attributes.textResponse = @editor.getContent()

  loadOptionList: (response) ->
    questionID = response.question.id

    @$scope.questionnaireController.loadOptionList(questionID).then (list) =>
      @list = list
      @otherOption = _(list).findWhere(value: 'Other')

      list

  removeAttachment: (attachment) =>
    @response.attachments.splice(@response.attachments.indexOf(attachment), 1)

    attachmentIds = @response.attributes.attachmentIds
    attachmentIds.splice(attachmentIds.indexOf(attachment.id), 1)

    unless @response.attributes.attachmentIds.length
      @response.attributes.attachmentIds = null

    @onResponseChange()

  onResponseChangeForAttachment: () =>
    unless @response.attributes.attachmentIds?
      @response.attributes.attachmentIds = []

    _(@response.attachments).each (attachment) =>
      if @response.attributes.attachmentIds.indexOf(attachment.id) < 0
        @response.attributes.attachmentIds.push(attachment.id)

    @onResponseChange()

  addDocument: () ->
    @ModalFactory.invokeModal 'manage_document',
      resolve:
        documentOptions: ->
          mode: 'new-upload'
          managerCheck: true
      success: (response) =>
        if response != 'refresh'
          @response.attachments.push response[0]
          unless @response.attributes.attachmentIds?
            @response.attributes.attachmentIds = []

          _(@response.attachments).each (attachment) =>
            if @response.attributes.attachmentIds.indexOf(attachment.id) < 0
              @response.attributes.attachmentIds.push(attachment.id)
          @onResponseChange()

  onResponseChangeForGrid: () =>
    attributes = @response.attributes
    if attributes.textResponse is ''
      attributes.textResponse = null
    _(@response.attributes.grid_responses).each (grid_response) ->
      if grid_response?.attributes?.value is ''
        grid_response.attributes.value = null

    #if this is not the preview page and any rows or columns have been added/changed then update grid data before regiestering the response
    if !@$scope.questionnaireController.preview && ((@response.rows.length != @response._previousAttributes.rows.length)||(@response.columns.length != @response._previousAttributes.columns.length))
      @updateGridData()
    else
      @onResponseChange()

    return true

  updateGridData: ()=>
    #Need to copy the changed row/column values inside the attribute object and then call the onResponseChange
    @response.attributes.rows = angular.copy(@response.rows)
    @response.attributes.columns = angular.copy(@response.columns)
    @onResponseChange()



  onResponseChange: (valueAttribute) ->
    attributes = @response.attributes
    questionnaireController = @$scope.questionnaireController

    if valueAttribute == 'textResponse' and attributes.textResponse == ''
      attributes.textResponse = null

    switch @responseType
      when 'CheckBox'
        if @otherOption? and (valueAttribute isnt 'textResponse')
          if @oldListValue
            # To check if `Other` checkbox was checked / unchecked, if yes then reset textResponse to null
            changedID = _.difference(@oldListValue, @response.attributes.listValueID)
            reverseChangedID = _.difference(@response.attributes.listValueID, @oldListValue)
            changedID = [].concat(changedID, reverseChangedID)
            if _(changedID).contains(@otherOption.id)
              @response.attributes.textResponse = null
          @is_other_option_selected = _(attributes.listValueID).contains(@otherOption.id)
          if @response.attributes.textResponse == null || @response.attributes.textResponse == ''
            @response.attributes.textResponse = null
          if @is_other_option_selected
            @hideCommentSection()
        @oldListValue = angular.copy @response.attributes.listValueID
      when 'TextEmail', 'Text', 'TextMultiLine'
        attributes.textResponse = null if attributes.textResponse is ''
      when 'NoPlus'
        if valueAttribute isnt 'textResponse'
          @noInNoPlus = attributes.booleanResponse == false
          if @noInNoPlus
            @hideCommentSection()
          if attributes.textResponse == null || attributes.textResponse == ''
            attributes.textResponse = null
        if valueAttribute is 'booleanResponse'
          attributes.textResponse = null
      when 'BooleanPlus'
        if valueAttribute isnt 'textResponse'
          @yesInBooleanPlus = attributes.booleanResponse == true
          if @yesInBooleanPlus
            @hideCommentSection()
          if attributes.textResponse == null || attributes.textResponse == ''
            attributes.textResponse = null
        if valueAttribute is 'booleanResponse'
          attributes.textResponse = null
      when 'Dropdown'
        if @otherOption? and (valueAttribute isnt 'textResponse')
          # To check if `Other` option was selected / unselected, if yes then reset textResponse to null
          if (@oldListValue?) and (@oldListValue == @otherOption.id or @response.attributes.listValueID == @otherOption.id)
            @response.attributes.textResponse = null
          @is_other_option_selected = attributes.listValueID == @otherOption.id
          if @response.attributes.textResponse == null || @response.attributes.textResponse == ''
            @response.attributes.textResponse = null
          if @is_other_option_selected
            @hideCommentSection()
        @oldListValue = angular.copy @response.attributes.listValueID
      when 'Numeric', 'Integer', 'TextPhone', 'Percentage', 'Identifier'
        if attributes.numericResponseA is ''
          attributes.numericResponseA = null
      when 'Bookends'
        if attributes.numericResponseA is ''
          attributes.numericResponseA = null
        if attributes.numericResponseB is ''
          attributes.numericResponseB = null

    if !@response.sequence.section.readonly
      @response.updateFlags(@otherOption)

    if questionnaireController
      if @response.is_valid && @response.is_dirty
        questionnaireController.addUnsavedResponse(@response)
        if @editor and @responseType == 'TextMultiLine' and @$scope.isReadonlyEditable and (@response.attributes.response_status != @responseStatus.STARTED) and @response.id
          $(@editor.contentDocument).find("[data-mce-annotation-uid]").each(()->
            contentHtml = $(this).html()
            contentHtml = contentHtml.replace(/<br\s*\/?>/gi,'').trim()
            if contentHtml.length == 0
              $(this).remove()
          )
          params =
            duediligence_id: @response.diligenceId
            SectionID: @response.sequence.attributes.sectionID
            questionID: @response.question.id
            response: @response.getResponseAttributes()
          params.response.textResponse = @editor.getContent()
          @DueDiligenceDataservice.saveResponse(params).then (response) =>
            currentComments = []
            $(@editor.getDoc()).find("[data-mce-annotation-uid]").each(()->
              currentComments.push $(this).attr('data-mce-annotation-uid')
            )
            @Restangular.one('diligences', @response.diligenceId).one('responses',@response.id).all('bulk_resolve_comments').customPUT(current_comment_ids: currentComments).then (response)=>
              return
      else
        questionnaireController.removeUnsavedResponse(@response)

      #moved this method inside the if because, this method use functions from questionairecontroller
      @computeRules(valueAttribute)

  computeRules: (valueAttribute) =>
    return unless @response.ruleIsApplicable()

    value = @response.getValueForRule()
    questionnaireController = @$scope.questionnaireController
    response = @response
    rules = @response.question.rules
    element = @$scope.element
    child_scope_map = @child_scope_map
    $scope = @$scope
    $compile = @$compile
    response_is_dirty = response.is_dirty

    _(rules).each (rule) =>
      ruleID = rule.id

      return unless valueAttribute != 'textResponse'

      #Added null check here because the nested question was not removed from view when we deleted the main question
      #Adding the null check here fixed the issue.
      if ((value != undefined and value?) && rule.passes(value))
        # Scenario: append conditional response if value != 'NY'
        # Now by default since the value is null, a conditional response is appended
        # Now as you keep typing values that are not equal to 'NY'
        # once again the same conditional response gets appended
        # This check prevents the same
        if element.find("[data-rule-id=#{ruleID}]").length
          element.find("[data-rule-id=#{ruleID}]").remove()

        _(rule.attributes.nestedQuestionIds).each (questionID) =>
          # if you don't use ">" you'll end up getting containers for nested rules too
          $container = element.find('> .js-conditional-responses')
          question = questionnaireController.getQuestionForId(questionID)

          #get user assigments of this question and add it as an attribute
          questionAssignment = _(questionnaireController.question_assignments).find (entity) ->
            entity.attributes.entity_id is question.id
          question.attributes.assignedUsers = []
          question.attributes.assignedFunctions = []

          if questionAssignment?
            question.attributes.assignedUsers = _(@teamMembers).filter (teamMember) ->
              teamMember.id in questionAssignment.attributes.assigned_to

            question.attributes.assignedFunctions = _(@$scope.questionnaireController.functions).filter (func) ->
              func.function_id in questionAssignment.attributes.assigned_to_functions

          conditional_response = questionnaireController.getResponse(question, response.sequence, response.diligenceId)

          child_response_element = $compile("""
            <questionnaire-form-control response="response" data-rule-id="#{ruleID}"></questionnaire-form-control>
          """)($scope)
          child_scope = child_response_element.scope()
          child_scope.response = conditional_response

          # Scenario: User has conditional responses for the value: Yes
          # user selects No, so all the conditional responses are marked for deletion
          # now user switches back to Yes without saving the change
          # so we need to remove the responses that were marked for deletion
          questionnaireController.removeResponseFromDeletion(conditional_response)

          child_scope_map[ruleID] ||= []
          child_scope_map[ruleID].push(child_scope)
          $container.append(child_response_element)
      else
        responses = []
        @collectConditionalResponses(@$scope, responses, true, (response) ->
          response.is_dirty
        )
        responses = _(responses).where(is_dirty: true)

        _(responses).each (response) ->
          response.rollback()
          questionnaireController.removeUnsavedResponse(response)

        # this means the user changed the response to the one where the rule fails
        # but there can be conditional responses that are saved on db for the previous response value
        # so the conditional responses related to previous response value must to be deleted
        if response_is_dirty
          responses_to_delete = []
          @collectConditionalResponses(@$scope, responses_to_delete, true, (response) ->
            !response.isNew()
          )

          _(responses_to_delete).each (response) ->
            questionnaireController.addResponseForDeletion(response)

        element.find("[data-rule-id=#{ruleID}]").remove()
        _(child_scope_map[ruleID]).each (child_scope) ->
          child_scope.$destroy()
        child_scope_map[ruleID] = []

  getAvailableQuestionsAndResponses: =>
    @DueDiligenceDataservice.getAvailableQuestionsAndResponses()

  isDateExpired: =>
    moment(@response.attributes.expiry_date).isBefore(moment())

  compileEsParams: (response, type) =>
    @es_params.filters = {}
    @es_params.filters[@FILTER_TERNARY_OPERATORS.AND] = []
    if type == 'profile'
      obj =
        filter_name: "diligence_type",
        filter_value: -1,
        filter_type: "str",
        search_type: "exact"
      @es_params.filters[@FILTER_TERNARY_OPERATORS.AND].push obj
    paramsObj1 = {}
    paramsObj1.filter_name = "question_text"
    paramsObj1.filter_value = response.question.attributes.text
    paramsObj1.filter_type = 'str'
    paramsObj1.search_type = 'contains'
    paramsObj2 = {}
    paramsObj2.filter_name = "question_id"
    paramsObj2.filter_value = response.question.id
    paramsObj2.filter_type = 'id'
    paramsObj2.search_type = 'exact'
    if @es_params.filters.hasOwnProperty(@FILTER_TERNARY_OPERATORS.AND)
      @es_params.filters[@FILTER_TERNARY_OPERATORS.AND].push paramsObj1
      @es_params.filters[@FILTER_TERNARY_OPERATORS.AND].push paramsObj2
    else
      @es_params.filters[@FILTER_TERNARY_OPERATORS.AND] = []
      @es_params.filters[@FILTER_TERNARY_OPERATORS.AND].push paramsObj1
      @es_params.filters[@FILTER_TERNARY_OPERATORS.AND].push paramsObj2


  isEmptyObject: (obj) ->
    for prop of obj
      if obj.hasOwnProperty(prop)
        return false
    JSON.stringify(obj) == JSON.stringify({})

  addResponseFromSmartText: =>
    if @response.question.attributes.has_standardized_text
      @ModalFactory.invokeModal 'add_standard_response',
        resolve:
          response: => @response
          diligence: => @$scope.questionnaireController.diligence
          mapped_diligences: => @$scope.questionnaireController.mapped_diligences
          mapped_questions: => @$scope.questionnaireController.question_mappings
          mapped_questions_array: => @response.question.mapped_questions
        success: (answer)=>
          if @response.attributes.textResponse
            @response.attributes.textResponse += "<br> " +answer
          else
            @response.attributes.textResponse = answer
          @onResponseChange()

  showAvailableResponses: =>
    entity_id = @$scope.questionnaireController.diligence.entity_id
    strategy_id = @$scope.questionnaireController.diligence.strategy_id
    entity_type = @$scope.questionnaireController.diligence.entity_type
    getResponsesFn = (type) =>
      q_params = {
        q: @response.question.attributes.text
        include_response: true
        entity_id: entity_id
        entity_type: entity_type
        strategy_id: strategy_id
      }
      q_params.type = type
      if @isQaSearchEnabled
        @compileEsParams(@response, type)
        @DueDiligenceDataservice.getAvailableQuestionsAndResponsesEs(@es_params)
      else
        @DueDiligenceDataservice.getAvailableQuestionsAndResponses(q_params)

    addSelectedResponses = (added_response) =>
      attributes = @response.attributes
      switch @responseType
        when 'TextEmail', 'Text', 'TextMultiLine'
          if attributes.textResponse
            attributes.textResponse += added_response
          else
            attributes.textResponse = added_response

      @onResponseChange()

    activeResponse = @response
    firm_preferences = @$scope.questionnaireController.firm_preferences
    template_url = 'sidebars/available_responses/template.html'
    @SidebarViewService.open({
      templateUrl: template_url
      title: "Suggested Responses"
      size: 'lg'
      controller: 'AvailableResponsesController'
      controllerAs: 'vm'
      resolve:
        getResponsesFn: -> getResponsesFn
        addSelectedResponses: -> addSelectedResponses
        activeResponse: -> activeResponse
        firm_preferences: -> firm_preferences
    })

  toggleNotApplicable: () ->
    @response.attributes.is_NA = !@response.attributes.is_NA

    if @response.attributes.is_NA
      @response.resetValueAttrs()
    else
      @response.rollback(true)

    @$scope.init()

    @onResponseChange()

    ###@$scope.questionnaireController.addUnsavedResponse(@response)###

    #do not know how to invoke the Save bar here. Need to de-activate the form control for this question

  toggleWIP: () ->
    @response.attributes.is_WIP = !@response.attributes.is_WIP

    @onResponseChange()

  validateResponse: ->
    if @response.is_valid
      @response.attributes.is_validation_required = false

      @onResponseChange()

  isSourceTypeQuestion: (str) =>
    found = false
    if str.indexOf("downloadAttachment") > -1
      found = true
    found

  extractTextFromQuestionString: (s) =>
    span = document.createElement('span')
    span.innerHTML = s
    string = span.textContent or span.innerText
    string = string.replace("Download Source File", "")
    string

  updateAssignMember: (member, type) =>
    if @isSourceTypeQuestion(@response.question.attributes.text)
      question_name = @extractTextFromQuestionString(@response.question.attributes.text)
    else
      question_name = @response.question.attributes.text

    if type == 'function'
      attr = "assigned_to_function"
      idAttr = "function_id"
      user = member.function_name
    else
      attr = "assigned_to"
      idAttr = "id"
      user = member.firstName + ' ' + member.lastName

    if member.is_removed
      message = "#{user} assignment removed from #{question_name}"

      params =
        entity_id: @response.question.id
        entity_type: "question"
        duediligence_id: @response.diligenceId
        "#{attr}": member[idAttr]
        is_removed: true

    else
      message = "#{user} is now assigned to #{question_name}"

      params =
        entity_id: @response.question.id
        entity_type: "question"
        duediligence_id: @response.diligenceId
        "#{attr}": member[idAttr]

    @DueDiligenceDataservice.assignUserToEntity(params).then (response) =>
      if member.is_removed
        if type == 'user'
          memberIdx = _.findIndex(@response.question.attributes.assignedUsers, (memberItem) ->
            memberItem.id == member.id
          )
          @response.question.attributes.assignedUsers.splice(memberIdx, 1)

        if type == 'function'
          functionIdx = _.findIndex(@response.question.attributes.assignedFunctions, (functionItem) ->
            functionItem.function_id == member.function_id
          )
          @response.question.attributes.assignedFunctions.splice(functionIdx, 1)
      else
        if type == 'user'
          if !@response.question.attributes.assignedUsers || !@response.question.attributes.assignedUsers.length
            @response.question.attributes.assignedUsers = []
          @response.question.attributes.assignedUsers.push(member)

        if type == 'function'
          if !@response.question.attributes.assignedFunctions || !@response.question.attributes.assignedFunctions.length
            @response.question.attributes.assignedFunctions = []
          @response.question.attributes.assignedFunctions.push(member)

      @toaster.pop 'success', '', message

      @$scope.$emit 'refresh:counts'

  initCheckboxWidget: (response) ->
    @loadOptionList(response).then (list) =>
      if @otherOption?
        # ensuring the other option comes at the end, because if it is somewhere in the middle, clicking it
        # will open a textarea which is rendered at the bottom & might go un-noticed
        list.splice(list.indexOf(@otherOption), 1)
        list.push(@otherOption)

  initDropdownWidget: (response) ->
    @loadOptionList(response).then (list) ->
      if _.isArray(response.listValueID)
        response.listValueID = response.listValueID[0]


  # recursively collects the responses based on cb(callback used for filtering)
  collectConditionalResponses: (scope, responses, skip_parent_response, cb) ->
    cb ||= -> true

    if !skip_parent_response && cb(scope.response)
      responses.push(scope.response)

    # this could happen if the child scope's controller hasn't been instantiated yet but the
    # parent calls this method. Now since the child scope doesn't have vm yet, it uses the parent's vm
    # due to prototypical inheritance & we'll end up having a infinite loop
    return unless scope.hasOwnProperty('vm')

    child_scope_map = scope.vm.child_scope_map

    if child_scope_map?
      _(child_scope_map).each (val) =>
        _(val).each (child_scope) =>
          @collectConditionalResponses(child_scope, responses, false, cb)

  deleteResponse: =>
    return if @response.isNew()
    @SweetAlert.confirm({
      title: 'Are you sure you want to delete this response ?'
      text: 'All the history associated with this response will be lost.'
      confirmButtonText: 'Yes, delete it!'
      focusCancel: true
      showLoaderOnConfirm: true
      preConfirm: =>
        responses_to_delete = []
        @collectConditionalResponses(@$scope, responses_to_delete, false, (response) ->
          !response.isNew()
        )

        promises = _(responses_to_delete).map (response) ->
          response.remove()

        @$q.all(promises).then (=>
          @toaster.pop 'success', '', 'Response deleted successfully'
          swal.close()
          @$scope.$emit 'refresh:counts'
          @$timeout =>
            #clear the attachments array after delete in case the response is an attachment
            if @responseType == "Attachment"
              @response.attachments = []
            #swapped the order of onresponsechange and init since onresponsechange clears all the nested questions inside it
            #so that in init it will get the widgetcontainer of that particualar form control. Earlier it was getting the
            #widget controllers of its nested questions too which was causing the question unresponsive after delete issue.
            @onResponseChange()
            @$scope.init()
        ), (error) =>
          swal.close()
    })


  showCommentAddButton: ->
    isInternal = @$scope.questionnaireController?.diligence?.is_internal
    printPreview = @$scope.questionnaireController?.printPreview
    #if it is in precompletion review then show the add comment button based on the response status. but if it is not in precompletion
    #review then use the earlier condition to show this.
    showEditForReview = (@response.attributes.response_status == @responseStatus.STARTED or @response.verifierEdit or ((!@$scope.questionnaireController.firm_preferences.enable_track_changes or @response.responseType in ['ReturnTable', 'aumTable', 'Attachment'] or !@response.responses_history) and @response.attributes.response_status == @responseStatus.REVIEWFAILED and @response.verifier and !@Utils.isAssignedToUser(@response.verifier, @$scope.questionnaireController.myFunctions) and (typeof @response.timeDiff == 'number' && @response.timeDiff > @dvThresholds.REVIEW_TIMELIMIT)))
    return ((@$scope.isReadonlyEditable and showEditForReview) or (!@$scope.isReadonlyEditable and !(@is_investor and !isInternal) and @isCommentAddBtnVisible and !printPreview)) and
      (!@response.attributes.textResponse and @isEditable and !(@responseType in @noCommentResponseTypes or
        ((@responseType == 'CheckBox' or @responseType == 'Dropdown') and @otherOption and @is_other_option_selected) or
        (@responseType == 'NoPlus' and @noInNoPlus) or (@responseType == 'BooleanPlus' and @yesInBooleanPlus)))

  showCommentSection: ->
    return (@isCommentSectionVisible) or (@response.attributes.textResponse and !(@responseType in @noCommentResponseTypes or
        ((@responseType == 'CheckBox' or @responseType == 'Dropdown') && @otherOption && @is_other_option_selected) or
        (@responseType == 'NoPlus' and @noInNoPlus) or (@responseType == 'BooleanPlus' and @yesInBooleanPlus)))

  displayCommentSection: ->
    @isCommentSectionVisible = true
    @isCommentAddBtnVisible = false

  hideCommentSection: =>
    @isCommentSectionVisible = false
    @isCommentAddBtnVisible = true
    @isMouseInside = false

  updateQuestionnaireComment: =>
    @onResponseChange('textResponse')

  updateExpiryDate: =>
    if @response.id
      expiry_date = @Utils.getToDateTimeFormatted(@response.attributes.expiry_date)
      @response.attributes.expiry_date = moment(expiry_date).toDate()
      params =
        response_ids: [@response.id]
        action_type: 'deactivate'
        action_date: expiry_date

      @Restangular.all('response_actions').post(params).then (response) =>
        @toaster.pop 'success', '', 'Expiry date updated', 5000

  openVerifierModal: =>
    if @response.id && !@response.attributes.is_WIP
      @ModalFactory.invokeModal 'add_verifier',
        resolve:
          response: => @response
          verificationLevel: => 'response'
          verificationType: => if @$scope.isReadonlyEditable then @diligenceStatusConstant.PRECOMPLETIONREVIEW else @diligenceStatusConstant.POSTCOMPLETIONREVIEW
          diligenceType: => @type
          functions: => @$scope.questionnaireController.entityFunctions
        success: (verifier)=>
          @response.verifier = {
            id: verifier.id
            type: "response_verify"
            attributes: verifier
          }

          if @$scope.isReadonlyNotEditable and @response.attributes.post_response_status == @responseStatus.STARTED
            @response.attributes.post_response_status = 'InReview'
          else
            @response.attributes.response_status = 'InReview'
          @setTrackinginTinymce() if @response.responseType == 'TextMultiLine'
          @$scope.init()
          @checkConditionsForAddToResponse()
          @$scope.$emit 'refresh:counts'

  reviewAgain: =>
    if !@response.attributes.is_WIP
      @DueDiligenceDataservice.updateResponseStatus(@response.id, @responseStatus.INREVIEW).then (response)=>
        @updateSectionStatus()
        @response.attributes.response_status = @responseStatus.INREVIEW
        @response.verifier.attributes.is_complete = false
        @response.verifier.attributes.completed_by_name = ""
        @response.verifier.attributes.completed_by = ""
        @response.verifier.attributes.completed_at = null
        @$scope.$emit 'refresh:counts'
        @checkConditionsForAddToResponse()
        @$scope.init()

  verifyRequest: =>
    if !@response.attributes.is_WIP
      if @response.attributes.response_unresolved_comments_counts > 0
          @showCommentsWarning()
      else if @responseType == 'TextMultiLine' and @response._previousAttributes.textResponse and @response._previousAttributes.textResponse.indexOf('<span class="ice') > -1
        if @flite and @flite.countChanges() > 0
          @showVerifyConfirmationforTrackChanges()
        else if !@response.verifierEdit
          @showTrackingWarning()
      else if @response.is_valid && @response.is_dirty
        @showUnsavedResponseAlert('reviewed')
      else
        @setToVerified()

  showTrackingWarning: =>
    @SweetAlert.error
      'title':'You have pending tracking changes'
      'text':'Please edit this response and accept or reject the changes before marking this response as reviewed.'

  showCommentsWarning: =>
    @SweetAlert.error
      'title':'You have unresolved review comments for this response'
      'text':'Please resolve these before marking this response as reviewed.'

  showUnsavedResponseAlert: (message)=>
    @SweetAlert.error
      'title':'You have unsaved changes for this response'
      'text':'Please resolve these before marking this response as '+message+'.'

  showVerifyConfirmationforTrackChanges: =>
    @SweetAlert.confirm({
      title: "Are you sure you want to mark this response as reviewed?"
      text: "You have #{@flite.countChanges()} change(s) yet to be accepted or rejected."
      cancelButtonText: 'Reject all changes'
      confirmButtonText: 'Accept all changes'
      customClass: 'danger-on-cancel'
      showCloseButton: true
      reverseButtons: false
      showLoaderOnConfirm: true
      preConfirm: =>
        @editor.plugins.flite.acceptAll()
        @response.attributes.textResponse = @editor.getContent()
        @response.update(false).then =>
          @setToVerified()
          swal.close()
        ,(error)=>
          swal.close()
    }).then (isConfirm) =>
      if isConfirm.dismiss and isConfirm.dismiss == 'cancel'
        @flite.rejectAll()
        @response.update(false).then =>
          @setToVerified()
          swal.close()
        ,(error)=>
          swal.close()

  setToVerified: =>
    @response.verifierEdit = false
    @DueDiligenceDataservice.updateResponseStatus(@response.id, @responseStatus.REVIEWSUCCESS).then (response)=>
      if @$scope.isReadonlyNotEditable
        @response.attributes.post_response_status = @responseStatus.REVIEWSUCCESS
      else
        @response.attributes.response_status = @responseStatus.REVIEWSUCCESS
      @updateSectionStatus()
      @response.verifier.attributes.is_complete = true
      @response.verifier.attributes.completed_by_name = @current_user.fullName
      @response.verifier.attributes.completed_by = @current_user.id
      @response.verifier.attributes.completed_at = @Utils.formatDatetimeUtc(moment.utc())
      @$scope.questionnaireController.removeUnsavedResponse(@response)
      @$scope.init()
      @$scope.$emit 'refresh:counts'
      @checkConditionsForAddToResponse()
      message = 'Response verified successfully'
      @toaster.pop 'success', '', message

  addToPreapproved: (response)=>
    entity_details = _(@$scope.questionnaireController.diligence).pick('entity_type','entity_id','entity_name')
    @Restangular.all('tag_assignments').getList(entity_type: 'Question', entity_id: response.question.id).then (tags) =>
      assigned_tags = tags
      @ModalFactory.invokeModal 'add_pre_approved',
        resolve:
          response: => response
          source: => 'questionnaire'
          entity_details: => entity_details
          assigned_tags: => assigned_tags

  updateSectionStatus: =>
    @Restangular.one('diligences', @response.diligenceId).one('sections',@response.sequence.section.id).all('status').customGET().then (response) =>
      @response.sequence.section.attributes.section_status = response.status

  responseTypeNotExcluded: (response)=>
    excludedResponseTypes = ['aumTable', 'DynamicGrid', 'Grid', 'CheckBox', 'Dropdown', 'Bookends', 'ReturnTable', 'Attachment']
    response.responseType not in excludedResponseTypes

  downloadAttachment: (url)=>
    @DocumentsService.downloadAttachment(url)

  editResponse: =>
    @updateSectionStatus()
    @response.verifierEdit = true
    @$scope.init()

  sendBackToAuthor: =>
    if @response.is_valid && @response.is_dirty
      @showUnsavedResponseAlert('review failed')
    else
      @rejectResponse()

  rejectResponse: =>
    @response.verifierEdit = false
    @DueDiligenceDataservice.updateResponseStatus(@response.id, @responseStatus.REVIEWFAILED).then (response)=>
      @updateSectionStatus()
      if @$scope.isReadonlyNotEditable
        @response.attributes.post_response_status = @responseStatus.REVIEWFAILED
      else
        @response.attributes.response_status = @responseStatus.REVIEWFAILED
      @response.verifier.attributes.is_complete = true
      @response.verifier.attributes.completed_by_name = @current_user.fullName
      @response.verifier.attributes.completed_by = @current_user.id
      @response.verifier.attributes.completed_at = @Utils.formatDatetimeUtc(moment.utc())
      @DueDiligenceDataservice.updateTrackChangesStatus(@response.id, @trackChangeStatus.STARTED).then (response)=>
        @response.attributes.track_change_status = @trackChangeStatus.STARTED
      @$scope.$emit 'refresh:counts'
      @toaster.pop 'success', '', 'Response rejected successfully'
      @checkConditionsForAddToResponse()
      @$scope.init()

  checkConditionsForDisplayingReview: (button)=>
    @response.timeDiff = moment().diff(@Utils.getLocalDateTime(@response.verifier.attributes.completed_at),'milliseconds') if @response.verifier and @response.verifier.attributes.is_complete
    canResponseVerify = @response.verifier and @Utils.isAssignedToUser(@response.verifier, @$scope.questionnaireController.myFunctions)
    if @$scope.isReadonlyNotEditable
      response_status_value = @response.attributes.post_response_status
    else
      response_status_value = @response.attributes.response_status
    @reviewButtonShow[button] = false
    switch button
      when 'edit'
        if @$scope.isReadonlyEditable and !@response.verifierEdit and (canResponseVerify) and response_status_value == @responseStatus.INREVIEW
          @reviewButtonShow[button] = true
          true

      when 'decline'
        if (@$scope.isReadonlyEditable or @$scope.isReadonlyNotEditable) and (canResponseVerify) and response_status_value == @responseStatus.INREVIEW
          @reviewButtonShow[button] = true
          true

      when 'addverifier'
        if (((@$scope.isReadonlyEditable or @$scope.isReadonlyNotEditable) and !(response_status_value in [@responseStatus.REVIEWSUCCESS,@responseStatus.REVIEWFAILED]))) and !@response.verifier
          @reviewButtonShow[button] = true
          true

      when 'updateverifier'
        if (@$scope.isReadonlyEditable or @$scope.isReadonlyNotEditable) and @response.verifier and !@Utils.isAssignedToUser(@response.verifier, @$scope.questionnaireController.myFunctions) and !@response.verifier.attributes.is_complete
          @reviewButtonShow[button] = true
          true

      when 'accept'
        canResponseVerifyFailed = @response.verifier and !@Utils.isAssignedToUser(@response.verifier, @$scope.questionnaireController.myFunctions)
        if ((@$scope.isReadonlyEditable or @$scope.isReadonlyNotEditable) and response_status_value == @responseStatus.INREVIEW and canResponseVerify) or (@$scope.isReadonlyEditable and response_status_value ==  @responseStatus.REVIEWFAILED and canResponseVerifyFailed and (typeof @response.timeDiff == 'number' && @response.timeDiff > @dvThresholds.REVIEW_TIMELIMIT))
          @reviewButtonShow[button] = true
          true

      when 'sendForVerify'
        verifierAssigned = @response.verifier and !@Utils.isAssignedToUser(@response.verifier, @$scope.questionnaireController.myFunctions)

        if @$scope.isReadonlyEditable and verifierAssigned and response_status_value == @responseStatus.REVIEWFAILED && (typeof @response.timeDiff == 'number' && @response.timeDiff > @dvThresholds.REVIEW_TIMELIMIT)
          @reviewButtonShow[button] = true
          true

      when 'undo'
        if (@$scope.isReadonlyEditable or @$scope.isReadonlyNotEditable) && (response_status_value in [@responseStatus.REVIEWSUCCESS,@responseStatus.REVIEWFAILED]) && @response.verifier && @current_user.id == @response.verifier.attributes.completed_by && (typeof @response.timeDiff == 'number' && @response.timeDiff <= @dvThresholds.REVIEW_TIMELIMIT)
          @reviewButtonShow[button] = true
          true

      when 'othercontrols'
        if !@$scope.isReadonlyEditable or (@$scope.isReadonlyEditable && (@response.verifierEdit or @response.attributes.response_status == @responseStatus.STARTED or (@response.attributes.response_status == @responseStatus.REVIEWSUCCESS and typeof @response.timeDiff == 'number' and @response.timeDiff > @dvThresholds.REVIEW_TIMELIMIT)) or (@response.attributes.response_status == @responseStatus.REVIEWFAILED and @response.verifier and typeof @response.timeDiff == 'number' and @response.timeDiff > @dvThresholds.REVIEW_TIMELIMIT))
          @reviewButtonShow[button] = true
          true

      when 'notecontrols'
        if !((@$scope.isReadonlyEditable and @response.attributes.response_status != @responseStatus.STARTED) or @$scope.isReadonlyNotEditable) or @response.attributes.is_NA or !@response.id or (((@$scope.isReadonlyEditable && (@response.attributes.response_status != @responseStatus.STARTED)) or @$scope.isReadonlyNotEditable) && @response.responseType in @unsupportedResponseTypes)
          @reviewButtonShow[button] = true
          true

      when 'reviewnotecontrols'
        if @response.id and !@response.attributes.is_NA and ((@$scope.isReadonlyEditable && (@response.attributes.response_status != @responseStatus.STARTED)) or @$scope.isReadonlyNotEditable) and !(@response.responseType in @unsupportedResponseTypes)
          @reviewButtonShow[button] = true
          true

      when 'reverify'
        if (@$scope.isReadonlyEditable or @$scope.isReadonlyNotEditable) and @response.attributes.response_status == @responseStatus.REVIEWSUCCESS and @response.verifier and @response.verifier.attributes.is_complete and typeof @response.timeDiff == 'number' and @response.timeDiff > @dvThresholds.REVIEW_TIMELIMIT
          @reviewButtonShow[button] = true
          true

  undoVerification: =>
    @DueDiligenceDataservice.updateResponseStatus(@response.id, @responseStatus.INREVIEW).then (response)=>
      @updateSectionStatus()
      if @$scope.isReadonlyNotEditable
        @response.attributes.post_response_status = @responseStatus.INREVIEW
      else
        @response.attributes.response_status = @responseStatus.INREVIEW
      @response.verifier.attributes.is_complete = false
      @response.verifier.attributes.completed_by_name = ""
      @response.verifier.attributes.completed_by = ""
      @response.verifier.attributes.completed_at = null
      @$scope.$emit 'refresh:counts'
      @checkConditionsForAddToResponse()
      @$scope.init()

  getRemainingTime: (diff)=>
    remainingtimeinms = Number(@dvThresholds.REVIEW_TIMELIMIT) - diff
    remainingtimeinsecs = parseInt(remainingtimeinms / 1000)
    if remainingtimeinsecs < 60
      message = remainingtimeinsecs + " sec left"
    else
      message = parseInt(remainingtimeinsecs/60) + " min left"
    message

  showMappedQuestions: =>
    @response.showQuestionMap = !@response.showQuestionMap
    if @response.showQuestionMap and not @response.mapped_responses
      @response.loading_response_map = true
      params = {
        mapped_diligence_ids: _(@$scope.questionnaireController.mapped_diligences).pluck('id')
        mapped_question_ids: _(@response.question.mapped_questions).pluck('mapped_question_id')
      }
      @Restangular.all('review_projects').customPOST(params,'responses').then (mapped_responses)=>
        @response.loading_response_map = false

        @response.mapped_responses = []
        _(@response.question.mapped_questions).each (mapped_question)=>
          _(mapped_responses).each (responseObject)=>
            if responseObject.template_id == mapped_question.template_id and responseObject.question_group_id == mapped_question.question_group_id
              response_attrs = {
                id: responseObject.id
                attributes: responseObject
              }

              response_attrs.attributes.responseType = responseObject.response_type
              new_response = @QuestionnaireResponseFactory.$new(response_attrs, {}, response_attrs, responseObject.duediligence_id, true)
              new_response.questionText = mapped_question.mapped_question_text
              new_response.templateName = @$scope.questionnaireController.mapped_diligences[responseObject.duediligence_id].template_name
              new_response.project_name = @$scope.questionnaireController.mapped_diligences[responseObject.duediligence_id].name
              new_response.attachments = responseObject.attachments if responseObject.attachments

              new_response.allowCopy = false
              if responseObject.response_type not in @responseDisplayUnsupportedTypes
                new_response.allowCopy = true

              @response.mapped_responses.push new_response
      ,(error)=>
        @response.loading_response_map = false

  copyResponse: =>
    @toaster.pop 'success', '', 'Response copied to clipboard', 5000

  addTextToResponse: (response)=>
    @response.attributes.textResponse = "" if @response.attributes.textResponse == undefined or @response.attributes.textResponse == null
    @response.attributes.textResponse += " "+ @getResponseContent(response)
    if @response.question.attributes.responseType == "TextMultiLine" && @response.attributes.textResponse
      if @response.question.attributes.response_word_limit != null and @editor
        text = @Utils.removeHtmlStrings(@response.attributes.textResponse)
        wordCount = @Utils.countWords(text)
        if wordCount
          @response.question.attributes['word_count'] = wordCount
          if wordCount > @response.question.attributes.response_word_limit
            @editor.contentDocument.body.style.border = '1px solid #dc3545';
          else
            @editor.contentDocument.body.style.border = 'none';
        else
          @editor.contentDocument.body.style.border = 'none';
          @response.question.attributes['word_count'] = 0
      else
        text = @Utils.removeHtmlStrings(@response.attributes.textResponse)
        wordCount = @Utils.countWords(text)
        if wordCount
          @response.question.attributes['word_count'] = wordCount
        else
          @response.question.attributes['word_count'] = 0
    @onResponseChange()

  addAllResponses: =>
    @response.attributes.textResponse = "" if @response.attributes.textResponse == undefined or @response.attributes.textResponse == null
    _(@response.mapped_responses).each (mapping)=>
      if mapping.allowCopy
        @response.attributes.textResponse += " "+ @getResponseContent(mapping)
    @onResponseChange()

  getResponseContent: (response)=>
    if response.responseType in @unsupportedResponseTypes
      response.renderedData.html()
    else if response.attributes.responseDisplay
      response.attributes.responseDisplay
    else
      ''

  checkConditionsForAddToResponse: =>
    if @response.responseType == 'TextMultiLine' and @type and @type == 'dd_review'
      if @$scope.isReadonlyEditable and (@response.verifierEdit or @response.attributes.response_status == @responseStatus.STARTED or (@response.attributes.response_status == @responseStatus.REVIEWFAILED and @response.verifier and !@Utils.isAssignedToUser(@response.verifier, @$scope.questionnaireController.myFunctions) and (typeof @response.timeDiff == 'number' && @response.timeDiff > @dvThresholds.REVIEW_TIMELIMIT)))
        @addToResponseAllowed = true
      else if !@$scope.readonly and !@$scope.isReadonlyNotEditable and !@$scope.questionnaireController.preview and !@$scope.questionnaireController.printPreview and !@$scope.questionnaireController.analytics_mode
        @addToResponseAllowed = true
      else
        @addToResponseAllowed = false
    else
      @addToResponseAllowed = false

  convertToSlug: (text) =>
    text.toLowerCase().replace(RegExp(' ', 'g'), '-').replace /[^\w-]+/g, ''

  checkInputLimitExceded: (value,event) =>
    text = @response.attributes.textResponse
    if text && text!= null
      if @response.question.attributes.response_word_limit && @response.question.attributes.response_word_limit != null
        text = @Utils.removeHtmlStrings(text)
        wordCount = @Utils.countWords(text)
        @response.question.attributes['word_count'] = wordCount
      else
        text = @Utils.removeHtmlStrings(text)
        wordCount = @Utils.countWords(text)
        @response.question.attributes['word_count'] = wordCount
    else
      @response.question.attributes['word_count'] = 0

  openUseExistingModal: =>
    @ModalFactory.invokeModal 'use_existing_document',
      success: (response)=>
        @response.attachments = @response.attachments.concat(response)
        @onResponseChangeForAttachment()

  toggleFlag: =>
    if @response.id && !@response.attributes.is_WIP
      @response.attributes.is_flagged = !@response.attributes.is_flagged
      params =
        response_id: @response.id
        duediligence_id: @$scope.questionnaireController.diligence.id
        is_flagged: @response.attributes.is_flagged

      @Restangular.all('ratings/flags').customPUT([params]).then (response)=>
        if @response.attributes.is_flagged
          message = "Question is flagged"
        else
          message = "Question unflagged"
        @toaster.pop 'success',message
        @$scope.$emit 'refresh:counts'
      ,(error)=>
        @response.attributes.is_flagged = !@response.attributes.is_flagged

  openRecommendationDialog: ->
    return if !@$scope.questionnaireController.diligence
    activeResponse = {
      id: @response.question.id,
      text: @response.question.attributes.text
    }
    diligence = @$scope.questionnaireController.diligence
    title = @firm_preferences?.issue_tracker_default_name
    onSuccess = @handleRecommendationChange
    @SidebarViewService.open({
      templateUrl: 'sidebars/recommendation_panel/template.html'
      title: title
      size: 'lg'
      controller: 'RecommendationPanelController'
      controllerAs: 'vm'
      resolve:
        diligence: -> diligence
        question: -> activeResponse
        onSuccess: -> onSuccess
        onUpdate: ->
    })

  handleRecommendationChange: (mode) =>
    if mode == 'add'
      @response.question.attributes.issue_count = if @response.question.attributes.issue_count then @response.question.attributes.issue_count + 1 else 1
    else if mode == 'delete'
      @response.question.attributes.issue_count = if @response.question.attributes.issue_count then @response.question.attributes.issue_count - 1 else 0
    @updateRecommendationTooltip()

  updateRecommendationTooltip: =>
    @recommendationTooltip = "#{if @response.question?.attributes?.issue_count || @Utils.isFreeSubscription() || @$scope.questionnaireController?.diligence?.isLocked then 'View ' else 'Add '}#{@firm_preferences?.issue_tracker_default_name || 'Recommendation'}"
