class DisplayQuestionnaireController extends BaseController
  @register 'DisplayQuestionnaireController'

  @inject '$scope', 'Restangular', '$q', 'DueDiligenceDataservice', 'BaseDataService', 'DvAlert',
    'QuestionnaireResponseFactory', 'Utils', 'QuestionnaireSectionFactory',
    'QuestionnaireResponseSequenceFactory', '$http', 'baseUrl', '$cacheFactory',
    '$anchorScroll', '$location', 'toaster', 'QuestionnaireRuleFactory', '$state', 'SweetAlert',
    '$window', 'QuestionnaireCacheFactory', 'BulkQueryFactory', '$attrs',
    'TemplatesDataService', '$rootScope', 'rbQuestionnaireUtils'

  initialize: ->
    @options =
      mode: if @Utils.isInvestor() then 'investor' else 'manager'
    @current_user = @Utils.getCurrentUser()
    @statusFilter = {}
    @unsaved_count = 0
    @noResponseControls = true
    @analytics_mode = false
    @readOnly = true
    @printPreview = true
    @isLocked = true

    @entity_type = @Utils.getEntityType()
    @entity_sub_type = @Utils.getEntitySubType()

    @questionnaireTree = @$scope.$parent.$eval(@$attrs.questionnaireTree)
    @selectedNodes = @$scope.$parent.$eval(@$attrs.selectedIds)

    promise = @getDueDiligence().then (diligence) =>
      @diligence = diligence
      @diligenceId = diligence.id

    promise.then (diligence) =>
      promises = []

      promises.push @BaseDataService.getTeamMembers().then (teamMembers) =>
        @teamMembers = teamMembers
        @$scope.teamMembers = teamMembers # so that the child scopes will have access to it

      promises.push @BaseDataService.getOperators().then (operators) =>
        @operators = operators

      @$q.all(promises).then =>
        params = @$scope.$eval(@$attrs.filters) || {
          StatusFilter: @statusFilter || 'Default'
          parentID: @categoryId
        }
        @fetchSections(params)

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

    if @$state.current.name is 'app.diligence.project.questionnaire.category'
      @$scope.$on '$stateChangeStart', (event, toState, toParams) =>
        if toState.name is 'app.diligence.project.questionnaire' && @statusFilter is toParams.status
          event.preventDefault()
          return

        if toState.name is 'app.diligence.project.questionnaire.category'
          _(@unsaved_responses).each (response) -> response.rollback()
          @updateSectionCache() # cache this section if we are switching to a different section else don't

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

  initializeBulkUploadOptions: ->
    @initializeResponseBulkUpload()
    @initializeSequenceBulkUpload()

  initializeResponseBulkUpload: ->
    @response_bucket = @BulkQueryFactory.$new({id_property: 'cid'})

    @response_bucket.on 'add:update', =>
      @unsaved_count++

    @response_bucket.on 'remove:update', =>
      @unsaved_count--

    @response_bucket.on 'add:update remove:update', =>
      @handleNotification()

  initializeSequenceBulkUpload: ->
    @sequence_bucket = @BulkQueryFactory.$new({id_property: 'cid'})

    @sequence_bucket.on 'remove:create add:remove', (sequence, action, method) =>
      unsaved_responses = _(sequence.responses).where(is_dirty: true)

      _(unsaved_responses).each (response) =>
        @response_bucket.remove(response, 'update')

      # When you queue a sequence remove request & it has some responses saved on db
      # let's count those responses as unsaved
      if method is 'remove' && !sequence.isNew()
        @unsaved_count += _(sequence.responses).filter((response) ->
          !response.isNew()
        ).length

        @handleNotification()

    @sequence_bucket.on 'remove:remove', (sequence) =>
      unsaved_responses = _(sequence.responses).where(is_dirty: true)

      _(unsaved_responses).each (response) =>
        @response_bucket.add(response, 'update')

      @unsaved_count -= _(sequence.responses).filter((response) ->
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
      sectionAssignments: @sectionAssignments
    })

  loadOptionList: (questionID) ->
    promise = @optionsCache.get(questionID)

    return promise if promise?

    deferred = @$q.defer()
    @DueDiligenceDataservice.getList(questionID).then (list) ->
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
    unsaved_count = @unsaved_count

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
      unsaved_count = @unsaved_count
      "You have #{unsaved_count} unsaved change#{if unsaved_count is 1 then '' else 's' }"

    @$window.onbeforeunload = ->
      "#{getTitle()}. All your unsaved changes will be lost"

    @route_change_nagger = @$scope.$on '$stateChangeStart', (event, toState, toParams) =>
      return if leaving_state

      event.preventDefault()

      SweetAlert.confirm({
        title: "Are you sure you want to leave this page?"
        text: "#{getTitle()}. All your unsaved changes will be lost if you decide to leave this page"
        confirmButtonText: 'Save & Exit'
        cancelButtonText: 'Do Not Save'
        showLoaderOnConfirm: true
        customClass: 'danger-on-cancel'
        preConfirm: =>
          leaving_state = true
          response = @commitUnsavedChanges(true)

          if response?.then?
            response.then =>
              @dismissNotification()
              $state.go(toState, toParams)
          else
            leaving_state = false
            swal.close()
      }).then (isConfirm) =>
        if isConfirm.dismiss and isConfirm.dismiss == 'cancel'
          leaving_state = true
          $state.go(toState, toParams)

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

    @notification = @DvAlert.notify(message: message, @commitUnsavedChanges)

  scrollToResponse: (response) ->
    element = response.scope.element
    scrollTop = element.offset().top - $('.navbar-fixed-top').outerHeight() - $('.menu-bar').outerHeight()

    $("html body").animate({
      scrollTop: scrollTop
    }, 500, -> element.find('.form-control').focus())
    element.focus()

  commitUnsavedChanges: (exiting_route) =>
    unsaved_responses = @response_bucket.getEntitiesForMethod('update')
    invalid_response = _(unsaved_responses).findWhere({is_valid: false})
    deferred = @$q.defer()

    if invalid_response?
      @scrollToResponse(invalid_response)
      @toaster.pop 'error', '', 'Please fix the errors'
      return false

    @sequence_bucket.sync('create', 'remove').then =>
      _(@sections).each (section) ->
        sequences = _(section.sequences).where(marked_for_deletion: true)

        _(sequences).each (sequence) ->
          section.removeSequence(sequence)

      @response_bucket.sync('update', 'remove').then =>
        unless exiting_route
# when the user tries to leave without unsaved changes & clicks "Save & Exit"
# the callback tries to dismiss notification & if notification is null
# @dismissNotification() won't dismiss the notification
          @notification = null
        @unsaved_count = 0
        @removeRouteChangeNagger()
        @$scope.$emit 'refresh:counts'
        deferred.resolve()

    deferred.promise

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
      promise = @$http.get("#{@baseUrl}/v2/diligences/#{@diligenceId}/sections", {
        params: params
      }).then((response) -> response.data)

      promise.then (response) =>
        readonly = @readOnly

        selectedSections = []
        _(@selectedNodes).each (node) =>
          _(response.data).each (section) =>
            if section.id == node
              selectedSections.push section

        response.data = selectedSections

        @initializeSections(response, !params.parentID, readonly)

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

  initializeSections: (response, has_parent_sections, readonly) =>
    sections = []

    selectedQuestions = []
    _(@selectedNodes).each (node) =>
      _(response.included).each (question) =>
        if question.id == node
          selectedQuestions.push question

    _(response.included).each (answer) =>
      if answer.type == 'responses' or answer.type == 'sequences' or answer.type == 'attachments'
        selectedQuestions.push answer

    included = selectedQuestions

    diligenceId = @diligenceId

    unless readonly
      isEditable = !@diligence?.isClosed
      isPrivate = @diligence?.is_internal
      isInvestor = @Utils.isInvestor()
      if isEditable
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


    @sequences = _(@sequences).map (sequence_attrs) =>
      @QuestionnaireResponseSequenceFactory.$new(sequence_attrs, null, diligenceId)

    _(response.data).each (attrs) =>

      section = @QuestionnaireSectionFactory.$new(attrs, diligenceId)

      return if has_parent_sections && section.attributes.isParent
      sectionAssignment = _(@sectionAssignments).find (entity) ->
        entity.attributes.sectionID is section.id

      if sectionAssignment?
        section.assignedUser = _(@teamMembers).findWhere({id: sectionAssignment.attributes.assignedTo})

      section.isEditable = isEditable
      section.readonly = @readOnly
      section.isLocked = @isLocked
      sequences = _.filter @sequences, (sequence) ->
        sequence.attributes.sectionID is section.id

      section.questions = @Utils.filterOut @questions, (question) ->
        question.attributes.sectionID is section.id and question.isParent

      if section.questions.length
        sections.push section
      else
        return

      section.sequences = _(sequences).map (sequence) =>
        sequence.section = section

        sequence.responses = _(section.questions).map (question) =>
          response_attrs = @Utils.filterOut(@responses, (response) ->
            response.attributes.sequenceID is sequence.id and response.attributes.questionID is question.id
          )[0] # there will be only one response per sequence & question combination

          @QuestionnaireResponseFactory.$new(response_attrs, sequence, question, diligenceId)

        sequence

      unless sequences.length
        new_sequence = section.addNewSequence()
        @addUnsavedSequence(new_sequence)

    # these are the conditional responses
    @responses = _(@responses).map (response_attrs) =>
      sequence = _(@sequences).findWhere(id: response_attrs.attributes.sequenceID)
      question = _(@questions).findWhere(id: response_attrs.attributes.questionID)
      if question != undefined
        @QuestionnaireResponseFactory.$new(response_attrs, sequence, question, diligenceId)

    if has_parent_sections
      parent_sections = _(response.data).filter (section) -> section.attributes.isParent

      _(sections).each (section) ->
        parent_section = _(parent_sections).findWhere(id: section.attributes.parentID)
        section.attributes.name = "#{parent_section.attributes.name}: #{section.attributes.name}"

      sections = _(sections).sortBy (section) -> section.attributes.parentID

    @sections = sections
    @$rootScope.$broadcast 'child_sections_update', sections
    @$scope.renderSections(sections)

  getQuestionForId: (id) ->
    _(@questions).findWhere({id: id})

  getResponse: (question, sequence, diligenceId) ->
    response = _(@responses).find (response) ->
      response.attributes.questionID is question.id and response.attributes.sequenceID is sequence.id

    unless response?
      response = @QuestionnaireResponseFactory.$new({}, sequence, question, diligenceId)
      @responses.push(response) #cache this new response

    response

  separateEntities: (entities) ->
    entity_types = ['questions', 'responses', 'sequences', 'nestingrules', 'sectionAssignments',
      'scoredQuestions', 'attachments']

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

  resetForm: (form) ->
    form.$setPristine()
    form.$setUntouched()

  openFollowupDialog: (response) =>
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
    @$scope.displaySidebarPanel(sidebarTitle, sidebarReference, sidebarTemplate, contentFor, @diligence.isClosed)

    @DueDiligenceDataservice.getFollowUps(responseId, 'Response').then (responses) =>
      @followup_responses = responses

      if responses.length
        response = responses[responses.length - 1]
        @$location.hash "followup-response-#{response.id}"
        @$anchorScroll()

  saveFollowupResponse: ->
    if @followup_form.$valid
      @saving_followup_response = true
      @new_followup_response.entity_id = @responseId
      @new_followup_response.entity_type = 'Response'
      @DueDiligenceDataservice.saveFollowup(@new_followup_response).then (response) =>
        @response.attributes.followUpCount++
        @followup_responses.push response
        @new_followup_response = {}
        @$location.hash 'followup-response-' + response.id
        @$anchorScroll()
        @saving_followup_response = false
        @resetForm(@followup_form)

  openTodosDialog: (response) ->
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
    @$scope.displaySidebarPanel(sidebarTitle, sidebarReference, sidebarTemplate, contentFor, @diligence.isClosed)

    @DueDiligenceDataservice.getTodos(responseId).then (todos) =>
      @todos = todos

  updateTodo: (todo) ->
    todo.put().then null, ->
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

  openNotesDialog: (response) ->
    question = response.question
    sidebarTemplate = 'diligence/project/questionnaire/notes/template.html'
    sidebarTitle = 'Notes'
    #@sidebarSmallText = 'Internal use only';
    sidebarReference = "For Question: #{question.attributes.text}"
    contentFor = 'notes'
    @new_note = {}
    @question = question
    @response = response

    @$scope.displaySidebarPanel(sidebarTitle, sidebarReference, sidebarTemplate, contentFor, @diligence.isClosed)

    @DueDiligenceDataservice.getNotes(@diligenceId, question.id, 'Question').then (notes) =>
      @diligence_notes = notes

  saveNotes: ->
    if @notes_form.$valid
      @saving_notes = true

      @DueDiligenceDataservice.saveNotes(@diligenceId, @question.id, @new_note).then (response) =>
        @response.attributes.noteCount++
        @diligence_notes.unshift response
        @new_note = {}
        @$location.hash 'notes-response' + response.id
        @$anchorScroll()
        @saving_notes = false
        @resetForm(@notes_form)

  deleteNote: (event, note) =>
    idx = @diligence_notes.indexOf(note)
    @diligence_notes.splice idx, 1
    @response.attributes.noteCount--

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

    @$scope.displaySidebarPanel(sidebarTitle, sidebarReference, sidebarTemplate, contentFor, @diligence.isClosed)

    @getResponseHistory(responseId).then (response) =>
      @response_history = response

  openBlacklineHistoryDialog: (response) ->
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
    @$scope.displaySidebarPanel(sidebarTitle, sidebarReference, sidebarTemplate, contentFor, @diligence.isClosed)

    @loading_histories = true
    @getResponseHistory(responseId).then (histories) =>
      @loading_histories = false
      sorted_history = _(histories).sortBy (history) ->
        -(new Date(history.responseTimeStamp))
      revisions = []

      if sorted_history.length && (not response.isNew())
        sorted_history.unshift _(response.attributes).pick('responseDisplay', 'responseTimeStamp', 'responseAuthor')

      _(sorted_history).each (history, idx) ->
        if idx isnt sorted_history.length - 1
          revisions.push({
            current: history,
            previous: sorted_history[idx + 1]
          })

      if revisions.length
        _(revisions).first().latest = true
        _(revisions).last().oldest = true

      @revisions = revisions
      @revision = revisions[0]
