class QuestionnaireController extends BaseController
  @register 'QuestionnaireController'

  @inject '$scope', 'Restangular', '$q', 'DueDiligenceDataservice', 'BaseDataService', 'DvAlert',
          'QuestionnaireResponseFactory', 'Utils', 'QuestionnaireSectionFactory',
          'QuestionnaireResponseSequenceFactory', '$http', 'baseUrl', '$cacheFactory',
          '$location', 'toaster', 'QuestionnaireRuleFactory', '$state', 'SweetAlert',
          '$window', 'QuestionnaireCacheFactory', 'BulkQueryFactory', '$attrs',
          'TemplatesDataService', '$rootScope', 'MentionsFactory', '$timeout', '$tinymceMentionsPlaceholderText','diligenceStatusConstant', 'DiligenceDataSaveService','ratingConstants','keywordConstants'

  initialize: ->
    @options =
      mode: if @Utils.isInvestor() then 'investor' else 'manager'
    @current_user = @Utils.getCurrentUser()
    @statusFilter = @$state.params.status
    @search_text = @$state.params.q
    @noResponseControls = angular.isDefined(@$attrs.noResponseControls)
    @analytics_mode = angular.isDefined(@$attrs.analyticsMode)
    @printPreview = angular.isDefined @$attrs.printPreview
    @entity_type = @Utils.getEntityType()
    @entity_sub_type = @Utils.getEntitySubType()
    @is_investor = @Utils.isInvestor()
    @DiligenceDataSaveService.unsaved_count = 0
    @is_manager = @Utils.isManager()
    @is_freeSubscription = @Utils.isFreeSubscription()
    @defaultVersion = 0
    @responses_history = []

    @Restangular.all('firm_preferences').customGET().then (response) =>
      @firm_preferences = response
      @$scope.is_numbered = response.enable_questionnaire_numbering
      @disable_response_followups = response.disable_response_followups

    @$scope.deregistererRefresh = @$rootScope.$on 'diligence:refresh', (event,diligence)=>
      @diligence = diligence
      @QuestionnaireCacheFactory.clear()
      @$scope.$emit 'refresh:counts'
      _(@sections).each ((section)=>
        @$scope.removeRenderedSection(section)
      )
      @initialisePage()

    if @Utils.isInvestor() or @Utils.isManager()
      @spinner_text = 'Populating the questionnaire'

    deregisterer = @$scope.$parent.$watch @$attrs.filters, (value) =>
      if value?
        @sectionFilters = value
        deregisterer()

    @$scope.deregigisterSequenceSave = @$rootScope.$on 'sequence:save', ($event)=>
      _(@sections).each (section) ->
        sequences = _(section.sequences).where(marked_for_deletion: true)

        _(sequences).each (sequence) ->
          section.removeSequence(sequence)

    @$scope.deregisterResponseSave = @$rootScope.$on 'response:save', ($event,exiting_route)=>
      unless exiting_route
        # when the user tries to leave without unsaved changes & clicks "Save & Exit"
        # the callback tries to dismiss notification & if notification is null
        # @dismissNotification() won't dismiss the notification
        @notification = null
      @DiligenceDataSaveService.unsaved_count = 0
      @dismissNotification()
      @removeRouteChangeNagger()
      @$scope.$emit 'refresh:counts'

    @$scope.deregisterRevertChanges = @$rootScope.$on 'response:revert', ($event)=>
      @revertChanges()
      @handleNotification()

    if @$attrs.diligence
      promise = @getDueDiligence().then (diligence) =>
        @diligence = diligence
        @diligenceId = diligence.id
    else if @$attrs.templateId
      promise = @getTemplateId().then (templateId) =>
        @templateId = templateId

    promise.then (diligence) =>
      if @printPreview
        @mode = 'print-preview'
      unless angular.isDefined @$attrs.printPreview
        @getCategoryId().then =>
          @initialisePage()
      else
        @initialisePage()

    if @$cacheFactory.get('options-cache')
      @$cacheFactory.get('options-cache').destroy()

    optionsCache = @$cacheFactory('options-cache')
    @initializeBulkUploadOptions()
    @optionsCache = optionsCache

    @$scope.$on 'delete:notes', @deleteNote
    @$scope.$on '$destroy', =>
      @removeRouteChangeNagger()
      optionsCache.destroy()
      @dismissNotification()

    # We check with endsWith since the child state of the new routes will remain the same, logic remains the same.
    if @$state.current.name.endsWith('project.questionnaire.category')
      @$scope.$on '$stateChangeStart', (event, toState, toParams) =>
        if (toState.name.endsWith('project.questionnaire')) && @statusFilter is toParams.status && @search_text is toParams.q
          event.preventDefault()
          return

        if toState.name.endsWith('project.questionnaire.category')
          _(@unsaved_responses).each (response) -> response.rollback()
          @updateSectionCache() # cache this section if we are switching to a different section else don't

      @$scope.$on '$stateChangeSuccess', (event,toState,toParams, fromState, fromParams) =>
        $('body').removeClass('noscroll')
        $(".js-sidebar-mask").remove()
        if fromParams.categoryId == toParams.categoryId
          if toParams['#'] and toParams['#'] != "" and toParams['#'].indexOf('child_section_') > -1
            childSectionId = Number(toParams['#'].slice('child_section_'.length))
            _(@sections).each ((section)=>
              @$scope.removeRenderedSection(section)
              if section.id == childSectionId
                @$scope.renderSection(section)
            )
          else if fromParams['#'] and fromParams['#'] != "" and fromParams['#'].indexOf('child_section_') > -1
            childSectionId = Number(fromParams['#'].slice('child_section_'.length))
            _(@sections).each ((section)=>
              if section.id == childSectionId
                @$scope.removeRenderedSection(section)
            )
            @$scope.renderSections(@sections)

    @tinymceOptions =
      init_instance_callback: (editor) =>
        @tinymceEditor = editor
        editor.on 'paste', (e) =>
          @tinymceEditor.insertContent('')
      skin_url: '/assets/stylesheets/tinymce/skins/tinymce-dv'
      browser_spellcheck: true
      placeholder: @$tinymceMentionsPlaceholderText
      toolbar: false
      menubar: false
      statusbar: false
      content_css : 'assets/stylesheets/tiny_mce_custom.css'
      forced_root_block : ""

  getCategoryId: -> #TODO: refactor to pass category-id via attributes
    deferred = @$q.defer()

    deregisterer = @$scope.$watch 'vm.$state.params.categoryId', (value) =>
      if value?
        @categoryId = value
        deferred.resolve(value)

        deregisterer()

    deferred.promise

  getSelectedRatingScheme: =>
    deferred = @$q.defer()
    @Restangular.one('templates',@diligence.template_id).one('versions',@diligence.template_version).all('TemplateRatingSchemeMappings').getList().then (response)=>
      @ratingScheme = response
      if response.length > 0
        @Restangular.one('rating_scheme_defaults').customGET('',{entity_id: @diligence.id, entity_type: 'DueDiligence'}).then (response) =>
          @rating_scheme_default = response
          if (response and response.rating_scheme_id == @ratingScheme[0].rating_scheme_id) or not response
            @selectedRatingScheme = @ratingScheme[0]
            @getRatingScales(@selectedRatingScheme)
            @getCustomFields(@selectedRatingScheme.rating_scheme_id)
          else
            @selectedRatingScheme = null
          deferred.resolve(@selectedRatingScheme)
      else
        @ratingScheme = null
        deferred.resolve(@ratingScheme)
    deferred.promise

  getRatingScales: (scheme)=>
    @Restangular.one('v2/rating_scales',scheme.rating_scale_id).one('versions',scheme.rating_scale_version).getList('rating_scale_definitions').then (rating_scale) =>
      @rating_scales = rating_scale
      noValueIndex = _(@rating_scales).findIndex (scale)=>
        parseInt(scale.value) == @ratingConstants.naValue

      if noValueIndex > -1
        @naValue = @rating_scales[noValueIndex]
        @rating_scales.splice(noValueIndex,1)

  getCustomFields: (ratingScheme)=>
    params =
      schema_type : 'rating'
      entity_id : ratingScheme
    @Restangular.all('service/dvapi_service/get_custom_fields').post(params).then (response) =>
      @custom_fields = response.custom_fields.rating

  getDueDiligence: ->
    deferred = @$q.defer()

    deregisterer = @$scope.$parent.$watch @$attrs.diligence, (value) ->
      if value?
        deferred.resolve(value)

        deregisterer()

    deferred.promise

  getTemplateId: ->
    deferred = @$q.defer()

    deregisterer = @$scope.$parent.$watch @$attrs.templateId, (value) ->
      if value?
        deferred.resolve(value)

        deregisterer()

    deferred.promise

  initialisePage: =>
    promises = []

    promises.push @BaseDataService.getTeamMembers().then (teamMembers) =>
      @teamMembers = teamMembers
      @$scope.teamMembers = teamMembers # so that the child scopes will have access to it

    promises.push @BaseDataService.getFunctions().then (response)=>
      @functions = response
      @$scope.functions = response

    if @diligence
      if @diligence.entity_type == 'Review'
        params =
          entity_type: @keywordConstants.Project
          entity_id: @diligence.id
      else
        params =
          entity_type: @diligence.entity_type
          entity_id: @diligence.entity_id

      promises.push @Restangular.all('function_assignments').getList(params).then (response)=>
        @entityFunctions = response
        @$scope.entityFunctions = response

    promises.push @BaseDataService.getOperators().then (operators) =>
      @operators = operators

    if (@$state.current.name.endsWith('project.questionnaire.category') || @$state.current.name.endsWith('project.questionnaire')) && (@is_investor && !@is_freeSubscription) && (({'Evaluation': true, 'Completed': true})[@diligence.status] || @diligence.isLocked || @diligence.diligence_type == 'dd_review')
      promises.push @getSelectedRatingScheme()
      promises.push @Restangular.all('rating_scales').one('GetSectionRatingScales',@diligence.template_id).doGET().then (response)=>
        @sectionRatingScaleMapping = response

    if @diligence and @diligence.diligence_type == 'dd_review'
      promises.push @Restangular.one('diligences',@diligence.id).all('review_mappings_data').customGET().then (response)=>
        @mapped_diligences = {}
        _(response.mapped_diligences).each (diligence)=>
          @mapped_diligences[diligence.id] = diligence
        @question_mappings = response.question_mappings

    if @diligence and !(angular.isDefined @$attrs.printPreview) and (@diligence.status == @diligenceStatusConstant.PRECOMPLETIONREVIEW) or (@options.mode == 'manager' and @diligence.diligence_type == 'dd_profile')
      promises.push @Restangular.one('diligences',@diligence.id).one('categories',@categoryId).all('track_change_responses').doGET().then (response)=>
        @responses_history = response

    @$q.all(promises).then =>
      params = @sectionFilters || {
        StatusFilter: @statusFilter || 'Default'
        parentID: @categoryId
        q: @search_text || null
      }
      if @selectedRatingScheme
        params.rating_scheme_id = @selectedRatingScheme.rating_scheme_id
        params.rating_scheme_version = @selectedRatingScheme.rating_scheme_version
        @saveDefaultRatingScheme()

      if @diligence and (({'InReview': true ,'Evaluation': true})[@diligence.status] or (@is_manager and !@is_freeSubscription and @diligence.diligence_type == 'dd_profile'))
        params.task_type = if @diligence.status == @diligenceStatusConstant.POSTCOMPLETIONREVIEW then 1701 else 1702
        @Restangular.one('diligences',@diligenceId).getList('MyFunctions').then (response)=>
          @myFunctions = response
      @fetchSections(params)

  saveDefaultRatingScheme: =>
      if not @rating_scheme_default
        params=
          rating_scheme_id: @selectedRatingScheme.rating_scheme_id,
          entity_id: @diligence.id,
          entity_type: 'Duediligence'

        @Restangular.all('rating_scheme_defaults/system').customPUT(params).then (response)=>
          return

  initializeBulkUploadOptions: =>
    @initializeResponseBulkUpload()
    @initializeSequenceBulkUpload()

  initializeResponseBulkUpload: ->
    @response_bucket = @BulkQueryFactory.$new({id_property: 'cid'})
    @DiligenceDataSaveService.setResponseObject(@response_bucket)

    @response_bucket.on 'add:update', =>
      @DiligenceDataSaveService.unsaved_count++

    @response_bucket.on 'remove:update', =>
      @DiligenceDataSaveService.unsaved_count--

    @response_bucket.on 'add:update remove:update', =>
      @handleNotification()

  initializeSequenceBulkUpload: ->
    @sequence_bucket = @BulkQueryFactory.$new({id_property: 'cid'})
    @DiligenceDataSaveService.setSequenceObject(@sequence_bucket)

    @sequence_bucket.on 'remove:create add:remove', (sequence, action, method) =>
      unsaved_responses = _(sequence.responses).where(is_dirty: true)

      _(unsaved_responses).each (response) =>
        @response_bucket.remove(response, 'update')

      # When you queue a sequence remove request & it has some responses saved on db
      # let's count those responses as unsaved
      if method is 'remove' && !sequence.isNew()
        @DiligenceDataSaveService.unsaved_count += _(sequence.responses).filter((response) ->
          !response.isNew()
        ).length

        @handleNotification()

    @sequence_bucket.on 'remove:remove', (sequence) =>
      unsaved_responses = _(sequence.responses).where(is_dirty: true)

      _(unsaved_responses).each (response) =>
        @response_bucket.add(response, 'update')

      @DiligenceDataSaveService.unsaved_count -= _(sequence.responses).filter((response) ->
        !response.isNew()
      ).length

      @handleNotification()

  updateSectionCache: ->
    @QuestionnaireCacheFactory.put(@categoryId, {
      sections: @sections,
      questions: @questions,
      responses: @responses,
      sequences: @sequences,
      nestingrules: @nestingrules,
      section_assignments: @section_assignments,
      question_assignments: @question_assignments
    })

  loadOptionList: (questionID) ->
    promise = @optionsCache.get(questionID)

    return promise if promise?

    deferred = @$q.defer()
    @DueDiligenceDataservice.getList(questionID).then (response) ->
      list = _(response).map (option) ->
        {value: option.dropdown_option_text,id: option.dropdown_option_id, group_id: option.dropdown_value_groupid, is_active: option.is_active, order: option.order}
      deferred.resolve(list)
    @optionsCache.put(questionID, deferred.promise)

    deferred.promise

  addUnsavedSequence: (sequence) ->
    @sequence_bucket.add(sequence, 'create')

  addUnsavedResponse: (response) ->
    @response_bucket.add(response, 'update')

  addResponseForDeletion: (response) ->
    @response_bucket.add(response, 'remove')

  removeResponseFromDeletion: (response) ->
    @response_bucket.remove(response, 'remove')

  removeUnsavedSequence: (sequence) ->
    @sequence_bucket.remove(sequence, 'create')

  addRemovableSequence: (sequence) ->
    @sequence_bucket.add(sequence, 'remove')

  removeRemovableSequence: (sequence) ->
    @sequence_bucket.remove(sequence, 'remove')

  removeUnsavedResponse: (response) ->
    @response_bucket.remove(response, 'update')

  handleNotification: ->
    unsaved_count = @DiligenceDataSaveService.unsaved_count

    if unsaved_count
      @createOrUpdateNotification(unsaved_count)
      @addRouteChangeNagger(unsaved_count)
    else
      @dismissNotification()
      @removeRouteChangeNagger()

  addRouteChangeNagger: ->
    return if @route_change_nagger?

    leaving_state = false
    SweetAlert = @SweetAlert
    $state = @$state

    getTitle = =>
      unsaved_count = @DiligenceDataSaveService.unsaved_count
      "You have #{unsaved_count} unsaved change#{if unsaved_count is 1 then '' else 's' }"

    @$window.onbeforeunload = ->
      "#{getTitle()}. All your unsaved changes will be lost"

    @route_change_nagger = @$scope.$on '$stateChangeStart', (event, toState, toParams) =>
      return if leaving_state

      event.preventDefault()

      SweetAlert.confirm({
        title: "Are you sure you want to leave this page?"
        text: "#{getTitle()}. All your unsaved answers will be lost if you leave this page"
        cancelButtonText: 'Do Not Save'
        confirmButtonText: 'Save & Exit'
        customClass: 'danger-on-cancel'
        showCloseButton: true
        reverseButtons: false
        showLoaderOnConfirm: true
        preConfirm: =>
          leaving_state = true
          response = @commitUnsavedChanges(true)
          if response?.then?
            response.then =>
              @dismissNotification()
              swal.close()
              $state.go(toState, toParams)
            ,(error)=>
              leaving_state = false
              swal.close()
          else
            leaving_state = false
            swal.close()
      }).then (isConfirm) =>
        if isConfirm.dismiss and isConfirm.dismiss == 'cancel'
          leaving_state = true
          @revertChanges()
          @dismissNotification()
          swal.close()
          $state.go(toState, toParams)

  revertChanges: =>
    while @response_bucket.getEntitiesForMethod('update').length > 0
      response = @response_bucket.getEntitiesForMethod('update')[0]
      @removeUnsavedResponse(response)
      response.rollbackAttributes()

    while @response_bucket.getEntitiesForMethod('remove').length > 0
      response = @response_bucket.getEntitiesForMethod('remove')[0]
      @removeResponseFromDeletion(response)
      response.rollbackAttributes()
    return

  removeRouteChangeNagger: ->
    @$window.onbeforeunload = null

    if @route_change_nagger?
      @route_change_nagger() #deregisters the listener
      @route_change_nagger = null

  createOrUpdateNotification: (unsaved_count) ->
    message = "You have #{unsaved_count} unsaved change#{if unsaved_count is 1 then '' else 's'} in your questionnaire"

    if @notification?
      @notification.updateMessage(message)
      return

    #pass object with the button names to the DvAlert constructor
    @notification = @DvAlert.notify(button_label: 'Save as Draft',button_label2: 'Save', message: message, @commitUnsavedChanges)

  scrollToResponse: (response) ->
    element = response.scope.element
    scrollTop = element.offset().top - $('.navbar-fixed-top').outerHeight() - $('.menu-bar').outerHeight()

    $("html body").animate({
      scrollTop: scrollTop
    }, 500, -> element.find('.form-control').focus())
    element.focus()

  #method that sets the is_WIP value to true
  setResponseWIP: (response) =>
    if response.attributes['is_NA'] == true
      response.attributes['is_WIP'] = false
    else
      response.attributes['is_WIP'] = true

  commitUnsavedChanges: (exiting_route,set_WIP) =>
    responses = @response_bucket.getEntitiesForMethod('update')
    promises = []
    _(responses).each (response)=>
      if response.editor and response.editor.uploadImages
        promises.push response.editor.uploadImages (success)=>
          response.attributes.textResponse = response.editor.getContent()
    if promises.length > 0
      @$q.all(promises).then =>
        @DiligenceDataSaveService.commitUnsavedChanges(exiting_route,set_WIP)
    else
      @DiligenceDataSaveService.commitUnsavedChanges(exiting_route,set_WIP)

  dismissNotification: ->
    return unless @notification?
    @DvAlert.dismissActiveNotification()
    @notification = null

  fetchSections: (params) ->
    categoryId = params.parentID
    category_cache = @QuestionnaireCacheFactory.get(categoryId)

    if category_cache?
      angular.extend(@, category_cache)
      @$rootScope.$broadcast 'child_sections_update', @sections
      @$scope.renderSections(@sections)
    else
      if @diligence
        promise = @$http.get("#{@baseUrl}/v2/diligences/#{@diligenceId}/sections", {
          params: params
        }).then((response) -> response.data)
      else if @templateId
        promise = @fetchTemplateSectionsWithQuestions(params)

      promise.then (response) =>
        readonly = angular.isDefined(@$attrs.readonly)
        if @$scope.is_numbered
          @numberBySections()
        @initializeSections(response, !params.parentID, readonly)

  numberBySections: ()=>
    #logic to calculate numbering for normal questionaires
    if !@printPreview && !@analytics_mode
      @indexCount = 0
      for pSection, index in @$scope.parent_sections
        #start numbering from 0
        @indexCount += @$scope.parent_sections[index - 1].attributes.question_counts if @$scope.parent_sections[index - 1] != undefined
        #add the number of questions in the previous sections
        if pSection.id == @$scope.active_category.parent_section.id
          #Stop calculating if it is the active section
          break
    #logic to number questionaires in analytics mode
    else if @analytics_mode
      @indexCount = 0
      for pSection, index in @$scope.parent_sections
          @indexCount += @$scope.parent_sections[index - 1].question_counts if @$scope.parent_sections[index - 1] != undefined
          #same logic as above except the condition to check for the active section
          if pSection.id == parseInt @categoryId
            break

  formatByAttributes: (resource, type) ->
    attributes = _(resource).omit('id')

    {
      attributes: attributes,
      id: resource.id,
      type: type
    }

  fetchTemplateSectionsWithQuestions: (params) ->
    deferred = @$q.defer()
    response = {
      included: []
    } #trying to comply with questionnaire api response format

    @TemplatesDataService.getSections(@templateId, params).then (sections) =>
      sections = _(sections).map (section) =>
        @formatByAttributes(section, 'sections')

      response.data = sections

      promises = _(sections).map (section) =>
        @TemplatesDataService.getQuestions(sectionID: section.id)

      @$q.all(promises).then (array_of_questions) =>
        questions = []

        _(array_of_questions).each (list, idx) ->
          _(list).each (question) ->
            question.sectionID = sections[idx].id

            questions.push(question)

        _(questions).each (question) =>
          response.included.push(@formatByAttributes(question, 'questions'))

        deferred.resolve(response)

    deferred.promise

  getSectionRatingScale: (scaleId, section)=>
    @Restangular.one('v2/rating_scales',scaleId).one('versions',@defaultVersion).getList('rating_scale_definitions').then (rating_scale) =>
      section.rating_scales = rating_scale
      noValueIndex = _(section.rating_scales).findIndex (scale)=>
        parseInt(scale.value) == @ratingConstants.naValue

      if noValueIndex > -1
        section.naValue = section.rating_scales[noValueIndex]
        section.rating_scales.splice(noValueIndex,1)

  initializeSections: (response, has_parent_sections, readonly) =>
    sections = []
    included = response.included
    diligenceId = @diligenceId

    unless readonly
      isPrivate = @diligence?.is_internal
      isInvestor = @Utils.isInvestor()
      isLocked = @diligence?.isLocked
      isEditable = !@diligence?.isReadOnly and !isLocked
      if (isEditable & !isLocked)
        readonly = if isInvestor then !isPrivate else false
      else
        readonly = true
    else
      isEditable = false

    @separateEntities(included)
    @initializeRules(@nestingrules)
    @initializeQuestions(@questions, @nestingrules, @scoredQuestions)

    _(@responses).each (response) =>
      return unless response.attributes.attachmentIds?

      response.attachments = _(response.attributes.attachmentIds).map (id) =>
        _(@attachments).findWhere(id: id)

      response.verifier = _(@response_verify).find((verify)=>
        verify.attributes.entity_id == response.id
      )

      response.responses_history = @responses_history[response.id]

    @sequences = _(@sequences).map (sequence_attrs) =>
      @QuestionnaireResponseSequenceFactory.$new(sequence_attrs, null, diligenceId)

    _(response.data).each (attrs) =>

      section = @QuestionnaireSectionFactory.$new(attrs, diligenceId)

      if @selectedRatingScheme and @selectedRatingScheme.rating_scale_mode == @ratingConstants.ScoreBand
        scaleId = @sectionRatingScaleMapping[section.id]
        if scaleId
          @getSectionRatingScale(scaleId, section)
        else
          section.naValue = @naValue
          section.rating_scales = @rating_scales

      section.verifier = _(@section_verify).find((verify)=>
        verify.attributes.entity_id == section.id
      )

      section.rating = _(@section_rating_mapping).find((verify)=>
        verify.attributes.section_id == section.id
      )

      if section.rating
        section.rating.verifier = _(@section_rating_verify).find((verify)=>
          verify.attributes.entity_id == section.rating.attributes.rating_id
        )

      sectionAssignment = _(@section_assignments).find (entity) ->
        entity.attributes.entity_id is section.id

      section.assignedUsers = []
      section.assignedFunctions = []

      if sectionAssignment?
        section.assignedUsers = _(@teamMembers).filter (teamMember) ->
          teamMember.id in sectionAssignment.attributes.assigned_to

        section.assignedFunctions = _(@functions).filter (func) ->
          func.function_id in sectionAssignment.attributes.assigned_to_functions

      #diligence object is available here only in project routes. but this directive is also used in analyze->benchmarking,
      #here diligence object is null. so added the check here to only do the following review based operations if diligence
      #object is present
      if @diligence
        if @diligence.is_internal
          if @diligence.status == @diligenceStatusConstant.COMPLETED or @diligence.status == @diligenceStatusConstant.POSTCOMPLETIONREVIEW
            review_enabled = @diligence.postsubmission_review_enabled
          else
            review_enabled = @diligence.presubmission_review_enabled
        else
          if @current_user.firmInfo.id == @diligence.fromfirm_id and @diligence.status == @diligenceStatusConstant.POSTCOMPLETIONREVIEW
            review_enabled = @diligence.postsubmission_review_enabled
          else if @current_user.firmInfo.id == @diligence.tofirm_id and @diligence.status == @diligenceStatusConstant.PRECOMPLETIONREVIEW
            review_enabled = @diligence.presubmission_review_enabled

        section.isReadonlyEditable = (@diligence.status == @diligenceStatusConstant.PRECOMPLETIONREVIEW and review_enabled) or (@options.mode == 'manager' and @diligence.diligence_type == 'dd_profile')
        section.isReadonlyNotEditable = @diligence.status == @diligenceStatusConstant.POSTCOMPLETIONREVIEW and review_enabled

      section.isEditable = isEditable
      section.isLocked = isLocked
      section.readonly = readonly
      section.isPrintPreview = angular.isDefined @$attrs.printPreview
      sequences = _.filter @sequences, (sequence) ->
        sequence.attributes.sectionID is section.id

      section.questions = @Utils.filterOut @questions, (question) ->
        question.attributes.sectionID is section.id and question.isParent

      if section.questions.length
        sections.push section
      else
        return

      _(section.questions).each (question) =>
        if @$scope.is_numbered && !@printPreview
          question.attributes.indexCount = ++@indexCount
        questionAssignment = _(@question_assignments).find (entity) ->
          entity.attributes.entity_id is question.id
        question.attributes.assignedUsers = []
        question.attributes.assignedFunctions = []

        if questionAssignment?
          question.attributes.assignedUsers = _(@teamMembers).filter (teamMember) ->
            teamMember.id in questionAssignment.attributes.assigned_to

          question.attributes.assignedFunctions = _(@functions).filter (func) ->
            func.function_id in questionAssignment.attributes.assigned_to_functions



      section.sequences = _(sequences).map (sequence) =>
        sequence.section = section

        sequence.responses = _(section.questions).map (question) =>
          response_attrs = @Utils.filterOut(@responses, (response) ->
            response.attributes.sequenceID is sequence.id and response.attributes.questionID is question.id
          )[0] # there will be only one response per sequence & question combination

          @QuestionnaireResponseFactory.$new(response_attrs, sequence, question, diligenceId, null, @mode)

        sequence

      unless sequences.length
        new_sequence = section.addNewSequence()
        @addUnsavedSequence(new_sequence)

    # these are the conditional responses
    @responses = _(@responses).map (response_attrs) =>
      sequence = _(@sequences).findWhere(id: response_attrs.attributes.sequenceID)
      question = _(@questions).findWhere(id: response_attrs.attributes.questionID)
      @QuestionnaireResponseFactory.$new(response_attrs, sequence, question, diligenceId, null, @mode)

    if has_parent_sections
      parent_sections = _(response.data).where (section) -> section.attributes.isParent

      _(sections).each (section) ->
        parent_section = _(parent_sections).findWhere(id: section.attributes.parentID)
        if parent_section
          section.attributes.section_name = "#{parent_section.attributes.name}: #{section.attributes.name}"
          section.attributes.parent_order = parent_section.attributes.order
        else
          section.attributes.section_name = "#{section.attributes.name}: #{section.attributes.name}"
          section.attributes.parent_order = section.attributes.order

      sections = _(sections).sortBy (section) -> section.attributes.parent_order

    @sections = sections

    #Logic for number the questions in print preview
    if @printPreview
      @indexCount = 0
      #This is simple logic where assign numbers questions in a section incremently
      #This approach is used here since all the questions are available here which is not the case in other pages.
      _(@sections).each (section) =>
        _(section.questions).each (question) =>
          question.attributes.indexCount = ++@indexCount

    @$rootScope.$broadcast 'child_sections_update', sections
    @renderSelectedSections(sections)

  getMappedQuestions: (question)=>
    questionMap = []
    _(@question_mappings).each (mapping)=>
      if mapping.question_group_id == question.attributes.group_id
        _(mapping.mapped_questions).each (questionMapped)=>
          questionMapped.template_id = mapping.mapped_template_id
          questionMap.push questionMapped

    question.mapped_questions = questionMap


  renderSelectedSections: (sections)=>
    if @$state.params['#'] and @$state.params['#'] != ""
      childSectionId = Number(@$state.params['#'].slice('child_section_'.length))
      _(sections).each ((section)=>
        if section.id == childSectionId
          @$scope.renderSection(section)
      )
    else
      @$scope.renderSections(sections)

  getQuestionForId: (id) ->
    _(@questions).findWhere({id: id})

  getResponse: (question, sequence, diligenceId) ->
    response = _(@responses).find (response) ->
      response.attributes.questionID is question.id and response.attributes.sequenceID is sequence.id

    unless response?
      response = @QuestionnaireResponseFactory.$new({}, sequence, question, diligenceId, null, @mode)
      @responses.push(response) #cache this new response

    response

  separateEntities: (entities) ->
    entity_types = ['questions', 'responses', 'sequences', 'nestingrules', 'section_assignments', 'question_assignments',
                    'scoredQuestions', 'attachments','response_verify','section_verify','section_rating_mapping','question_rating_verify','section_rating_verify','question_rating_mapping']

    _(entity_types).each (type) =>
      @[type] = @Utils.filterOut entities, (entity) ->
        entity.type is type

    _(@attachments).each (attachment) ->
      _(attachment).extend(attachment.attributes)

    @nestingrules = @groupRules(@nestingrules)

  groupRules: (rules) ->
    grouped_rules = []

    rules = _(rules).groupBy (rule) ->
      "question_#{rule.attributes.questionID}:value_#{rule.attributes.value}:operator_#{rule.attributes.operatorID}"

    _(rules).each (value) ->
      nestedQuestionIds = _(value).map (rule) -> rule.attributes.nestedQuestionId

      rule = value[0]

      rule.attributes.nestedQuestionIds = nestedQuestionIds

      grouped_rules.push(rule)

    grouped_rules

  initializeRules: (rules) ->
    operators = @operators

    @nestingrules = _(rules).map (rule) =>
      rule.operator = _(operators).find (operator) ->
        operator.id is rule.attributes.operatorID

      @QuestionnaireRuleFactory.$new(rule)

  initializeQuestions: (questions, rules, scoredQuestions) ->
    _(questions).each (question) =>
      question.score = _(scoredQuestions).find (scoredQuestion) ->
        scoredQuestion.attributes.questionID is question.id

      ###
        Now, we'll render all questions that are not part of a rule first & as the user keeps answering
          -> we execute rule & see if they pass
          -> if they do then we'll fetch the additional questions related to that rule & render
      ###
      question.isParent = !_(rules).find (rule) ->
        _(rule.attributes.nestedQuestionIds).contains(question.id)

      question.rules = _(rules).filter (rule) ->
        rule.attributes.questionID is question.id

      question.rating = _(@question_rating_mapping).find((verify)=>
        verify.attributes.question_id == question.id
      )

      if question.rating
        question.rating.verifier = _(@question_rating_verify).find((verify)=>
          verify.attributes.entity_id == question.rating.attributes.rating_id
        )

      if @diligence and @diligence.diligence_type == 'dd_review'
        question.mapped_questions = @getMappedQuestions(question)

  resetForm: (form) ->
    form.$setPristine()
    form.$setUntouched()

  openFollowupDialog: (response) =>
    return if !@diligence
    question = response.question
    responseId = response.id

    if @followup_form
      @resetForm(@followup_form)

    @response = response
    @responseId = responseId
    @new_followup_response = {}
    @followup_responses = null
    @DVEntityDisplayName = @Utils.getDVEntityDisplayName()
    sidebarTemplate = 'diligence/project/questionnaire/followup/template.html'
    sidebarTitle = 'Follow-ups'
    #@sidebarSmallText = 'Viewable by both sides';
    sidebarReference = 'For Question: ' + question.attributes.text
    contentFor = 'followup'
    @$scope.displaySidebarPanel(sidebarTitle, sidebarReference, sidebarTemplate, contentFor, @diligence.isLocked)

    @DueDiligenceDataservice.getFollowUps(responseId, 'Response').then (responses) =>
      @followup_responses = responses

      if responses.length
        response = responses[responses.length - 1]

  saveFollowupResponse: ->
    if @followup_form.$valid and not (@disable_response_followups and !@followup_responses.length)
      @saving_followup_response = true
      @new_followup_response.entity_id = @responseId
      @new_followup_response.entity_type = 'Response'
      @DueDiligenceDataservice.saveFollowup(@new_followup_response)
      .then (response) =>
        @$scope.$emit 'refresh:counts' if @response.attributes.followUpCount < 1
        @response.attributes.followUpCount++
        #unshift is used here because in the followup_responses array, the recently added followup is at the top of the list
        #and old followups are at the end.
        @followup_responses.unshift response
        @new_followup_response = {}
        @saving_followup_response = false
        @resetForm(@followup_form)
        $(".dd-sidebar-panel .panel-body").animate({
          scrollTop: 0
        }, 500)

      , (error) =>
        @saving_followup_response = false
        @toaster.pop 'error', '', 'Something went wrong. Please try again.'
        avoid_error_logging_statuses = @BaseDataService.getAvoidErrorLoggingStatusList()
        if !(error.status in avoid_error_logging_statuses)
          delete error.config.data.text
          @Utils.logError('Followup for response save failed', error)

  openTodosDialog: (response) ->
    return if !@diligence
    question = response.question
    responseId = response.id

    if @todo_form
      @todo_form.$setPristine true

    @response = response
    @responseId = responseId
    @new_todo = {}
    @todos = null
    sidebarTemplate = 'diligence/project/questionnaire/todos/template.html'
    sidebarTitle = 'To-dos'
    #@sidebarSmallText = 'Internal use only';
    sidebarReference = 'For Question: ' + question.attributes.text
    contentFor = 'todo'
    @$scope.displaySidebarPanel(sidebarTitle, sidebarReference, sidebarTemplate, contentFor, @diligence.isLocked)

    @DueDiligenceDataservice.getTodos(responseId).then (todos) =>
      @todos = todos

  updateTodo: (todo) ->
    todo.put().then (response)=>
      if todo.is_complete
        @response.attributes.toDoCount--
        @$scope.$emit 'refresh:counts' if @response.attributes.toDoCount < 1
        @toaster.pop 'success', '', 'Todo has been marked as completed!'
    , ->
      todo.is_complete = false # on failure

  saveTodo: ->
    if @todo_form.$valid
      @saving_todo = true

      @DueDiligenceDataservice.saveTodo(@new_todo, @responseId).then (response) =>
        @response.attributes.toDoCount++
        @todos.push response
        @new_todo = {}
        @saving_todo = false
        @resetForm(@todo_form)
      .finally =>
        @$scope.$emit 'refresh:counts' if @response.attributes.toDoCount == 1

  openNotesDialog: (response, type) ->
    return if !@diligence

    if type == 'Question'
      question = response.question
      sidebarReference = "For Question: #{question.attributes.text}"
      @notesType = type
      @notesFor = question
      @response = response.question
    else
      @notesFor = response
      @notesType = type
      @response = response
      sidebarReference = "For Section: #{response.attributes.name}"

    sidebarTemplate = 'diligence/project/questionnaire/notes/template.html'
    sidebarTitle = 'Internal Notes'
    #@sidebarSmallText = 'Internal use only';
    contentFor = 'notes'
    @new_note = {}

    @$scope.displaySidebarPanel(sidebarTitle, sidebarReference, sidebarTemplate, contentFor, @diligence.isLocked)

    @DueDiligenceDataservice.getNotes(@diligenceId, @notesFor.id, @notesType).then (notes) =>
      @diligence_notes = notes

  saveNotes: =>
    if @notes_form.$valid
      @saving_notes = true
      if @new_note.text.length>0
        mentioned_members_ids = @MentionsFactory.getMentionedIds(@new_note.text, true)
        if mentioned_members_ids.length>0
          @new_note.mentions = mentioned_members_ids

      notesParams =
        entity_type: 'Duediligence'
        type: 'General'
        entity_id: @diligenceId
        child_entity_id:  @notesFor.id
        child_entity_type: @notesType
        text: @new_note.text
        mentions: @new_note.mentions
      @DueDiligenceDataservice.saveNotes(notesParams).then ((response) =>
        @response.attributes.note_count++
        @diligence_notes.unshift response
        @new_note = {}
        @saving_notes = false
        @resetForm(@notes_form)
      ), (error) =>
        @saving_notes = false

  filterTeamMembers: (term) =>
    @filteredTeamMembers = @MentionsFactory.getFilteredMembers(term)

  getDisplayName: (user) =>
    @$timeout =>
      if @tinymceEditor
        @tinymceEditor.insertContent('')
      if @tinymceEditEditor
        @tinymceEditEditor.insertContent('')
    , 300
    return @MentionsFactory.getDisplayName(user, true)

  deleteNote: (event, note) =>
    idx = @diligence_notes.indexOf(note)
    @diligence_notes.splice idx, 1
    @response.attributes.note_count--

  incrementRevision: ->
    unless @revision.latest
      idx = @revisions.indexOf(@revision)
      @revision = @revisions[idx - 1]

  decrementRevision: ->
    unless @revision.oldest
      idx = @revisions.indexOf(@revision)
      @revision = @revisions[idx + 1]

  restoreRevision: (revision) ->
    @response.setValue(textResponse: revision.current.responseDisplay)
    @$scope.removeSidebarPanel()

  getResponseHistory: (responseId) ->
    @DueDiligenceDataservice.getResponseHistory(responseId)

  openHistoryDialog: (response) ->
    return if !@diligence
    question = response.question
    responseId = response.id
    @response = response
    @responseId = responseId
    @response_history = null

    sidebarTemplate = 'diligence/project/questionnaire/history/template.html'
    sidebarTitle = 'Response History'
    #@sidebarSmallText = 'Viewable by both sides';
    sidebarReference = 'For Question: ' + question.attributes.text
    contentFor = 'history'

    @$scope.displaySidebarPanel(sidebarTitle, sidebarReference, sidebarTemplate, contentFor, @diligence.isLocked)

    @getResponseHistory(responseId).then (response) =>
      @response_history = []
      if response.length
        @response_history = response
        @response_history.shift()

  openBlacklineHistoryDialog: (response) ->
    return if !@diligence
    question = response.question
    responseId = response.id
    @response = response
    @responseId = responseId
    @response_history = null

    sidebarTemplate = 'diligence/project/questionnaire/history/blackline-template.html'
    sidebarTitle = 'Response History'
    #@sidebarSmallText = 'Viewable by both sides';
    sidebarReference = 'For Question: ' + question.attributes.text
    contentFor = 'blackline'

    @revision = null
    @$scope.displaySidebarPanel(sidebarTitle, sidebarReference, sidebarTemplate, contentFor, @diligence.isLocked)

    @loading_histories = true
    @getResponseHistory(responseId).then (histories) =>
      @loading_histories = false
      revisions = []

      if histories.length > 1
        _(histories).each (history, idx) ->
          if idx isnt histories.length - 1
            revisions.push({
              current: history,
              previous: histories[idx + 1]
            })

        if revisions.length
          _(revisions).first().latest = true
          _(revisions).last().oldest = true

        @revisions = revisions
        @revision = revisions[0]

  formatDateTimeFormat: (timeStamp) ->
    return @Utils.getLocalDateTime(timeStamp).format("MMM Do, YYYY h:mm a")
