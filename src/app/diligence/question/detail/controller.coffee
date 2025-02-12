class QuestionDetailController extends BaseController
  @register 'QuestionDetailController'

  @inject '$stateParams', '$q', 'toaster', 'Restangular', '$state', 'DueDiligenceDataservice', 'Utils', 'MentionsFactory', '$scope',
    'SweetAlert', '$rootScope', '$timeout', '$tinymceMentionsPlaceholderText','HistoryDataService','ModalFactory','RestangularHeaderService','keywordConstants','responseStatus'

  initialize: ->
    promise = []
    promise.push @Restangular.all('firm_preferences').customGET().then (response) =>
      @showNewQAView = response.enable_new_qa_look
    
    @$q.all(promise).then =>
      if !@showNewQAView
        if @$stateParams.questionId
          @getQuestionResponses()
        else
          @toaster.pop 'error', '', 'Something went wrong!'
      else
        @$state.go 'app.content.questions'
      @is_admin = @Utils.isAdmin()
      @current_user = @Utils.getCurrentUser()
      @is_freeSubscription = @Utils.isFreeSubscription()
      @pageUrl = ""

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

      @$scope.$on 'delete:notes', (event, note) =>
        @removeNote(note)
        @grouped_questions[@groupIdx].questions[@questionIdx].note_count--

  generateFilterParams: =>

    savedParams = @HistoryDataService.getSavedQuestionData()

    if savedParams
      criterias = []
      _(savedParams.filterCriteria).each((criteria) ->
        if criteria.value
          criteria_obj = {}
          criteria_obj.criteria_label = criteria.criteria_obj.value
          if criteria.criteria_obj.value == 'tags_list'
            criteria_obj.value = []
            _(criteria.value).each((value) ->
              criteria_obj.value.push(value.id)
            )
          else if criteria.criteria_obj.value == 'strategy_dropdown' || criteria.criteria_obj.value == 'fund_dropdown'
            criteria_obj.value = criteria.value.id
          else if criteria.criteria_obj.value == 'not_updated_since'
            criteria_obj.value = moment(criteria.value).format("DD-MMMM-YYYY")
          else
            criteria_obj.value = criteria.value
          criterias.push(criteria_obj)
      )

      params = {}
      if criterias and criterias.length > 0
        params.global_operator = savedParams.global_ternary_operator
        params.global_search_criteria = savedParams.global_search_criteria
        params.criterias = criterias

    else
      params = {}
    params

  generateEntityUrl: (entity)=>
    if entity.entity_type.toLowerCase() == @keywordConstants.Firm.toLowerCase()
      "app/firms/#{entity.entity_id}/question_detail"
    else if entity.entity_type.toLowerCase() == @keywordConstants.Product.toLowerCase()
      "app/funds/#{entity.entity_id}/question_detail"

  generatePageUrl: (questions)=>
    pageUrl = ""
    _(questions).each (question,index)=>
      pageUrl += @generateEntityUrl(question)
      pageUrl += "," if index != questions.length - 1
    pageUrl

  getQuestionResponses: =>
    params = @generateFilterParams()
    params.question_id = @$stateParams.questionId

    @fetching_responses = true

    @Restangular.all('v2/responses').customGET('', params).then (response) =>
      @pageUrl = @generatePageUrl(response)
      grouped_questions = _(response).groupBy('response_text')

      @response_count = response.length
      @question_text = if response[0] then response[0].question_text else ''

      @getQuestionTags()
      @grouped_questions = _(grouped_questions).map (value, key) ->
        {
        response: key,
        questions: value
        }
      _(@grouped_questions).each (group)=>
        if @checkExpiryDate(group.questions[0].expired_at)
          group.questions[0].is_inactive = true
      @fetching_responses = false

  getQuestionTags: =>
    @RestangularHeaderService.RestangularWithHeader(@pageUrl).all('tag_assignments').getList(entity_type: 'Question', entity_id: @$stateParams.questionId).then (response) =>
      @assigned_tags = response
      @sortTags()

  checkExpiryDate: (date) ->
    moment(date).isBefore(moment())

  sortTags: () =>
    @assigned_tags = _(@assigned_tags).sortBy((tag) =>
      tag.name.toLowerCase()
    )

  copyResponse: ->
    @toaster.pop 'success', '', 'Response copied to clipboard', 5000

  deactivateResponse: (response_group, index) ->
    response_ids = []

    _(response_group.questions).each((question) ->
      response_ids.push(question.id)
    )

    params =
      response_ids: response_ids
      action_type: 'deactivate'

    pageUrl = @generatePageUrl(response_group.questions)
    @RestangularHeaderService.RestangularWithHeader(pageUrl).all('response_actions').post(params).then (response) =>

      _(response_group.questions).each((question) ->
        question.is_inactive = true
        question.expired_at = response.action_date
      )

      @toaster.pop 'success', '', 'This response has been deactivated', 5000

  getNotes: (dueDiligenceId, questionId,pageUrl) ->
    @loadingNotes = true
    @DueDiligenceDataservice.getNotes(dueDiligenceId, questionId, 'Question', pageUrl)
      .finally => @loadingNotes = false
      .then (response) =>
        @questionNotes = response

  saveNotes: =>
    return unless @add_notes_form.$valid

    @saving_notes = true
    id = @response.id

    if @new_note.text.length > 0
      mentioned_members_ids = @MentionsFactory.getMentionedIds(@new_note.text, true)
      if mentioned_members_ids.length > 0
        @new_note.mentions = mentioned_members_ids
    pageUrl = @generateEntityUrl(@response)

    notesParams =
      entity_type: 'Duediligence'
      type: 'General'
      entity_id: @response.duediligence_id
      child_entity_id:  @response.question_id
      child_entity_type: 'Question'
      text: @new_note.text
      mentions: @new_note.mentions
    @DueDiligenceDataservice.saveNotes(notesParams,pageUrl).then((response) =>
      message = 'Your notes are added!'
      @questionNotes.unshift response
      @grouped_questions[@groupIdx].questions[@questionIdx].note_count++
      @toaster.pop 'success', '', message
      @resetForm()
    )
    .finally(=> @saving_notes = false)

  displayNotesController: (response, parentIdx, idx) ->
    @sidebarTemplate = 'diligence/question/detail/add_notes.html'
    @sidebarTitle = 'Add Notes'
    @sidebarContent = 'notes'
    @displaySidebarPanel = true
    @groupIdx = parentIdx
    @questionIdx = idx

    @new_note = {}
    @target_response = response
    @resetForm()

    dueDiligenceId = response.duediligence_id
    questionId = response.question_id
    pageUrl = @generateEntityUrl(response)

    @getNotes(dueDiligenceId, questionId,pageUrl)
    @response = response

  closeSidebarPanel: =>
    if @$scope.hasOwnProperty('has_unsaved_changes')
      scope_has_unsaved_changes = false
      for key of @$scope.has_unsaved_changes
        if @$scope.has_unsaved_changes.hasOwnProperty(key)
          if @$scope.has_unsaved_changes[key]
            scope_has_unsaved_changes = true
            break
      if scope_has_unsaved_changes
        @SweetAlert.confirm({
          title: "You have unsaved changes on this page"
          text: "All your unsaved changes will be lost if you leave this page"
          cancelButtonText: 'Do Not Save'
          confirmButtonText: 'Save & Exit'
          showLoaderOnConfirm: true
          showCloseButton: true
          reverseButtons: false
          customClass: 'danger-on-cancel'
          preConfirm: =>
            @$rootScope.$broadcast('dv_input_alert:save_changes')
            @$timeout =>
              @displaySidebarPanel = false
            , 1000
        }).then (isConfirm) =>
          if isConfirm.dismiss and isConfirm.dismiss == 'cancel'
            @$rootScope.$broadcast('dv_input_alert:leave_page')
            @$timeout =>
              @displaySidebarPanel = false
              swal.close()

      else
        @displaySidebarPanel = false
    else
      @displaySidebarPanel = false

  resetForm: ->
    @new_note = {}
    @add_notes_form?.$setPristine()
    @add_notes_form?.$setUntouched()

  canEditNote: (note) ->
    note.created_by is @Utils.getCurrentUser().id

  removeNote: (deletedNote) ->
    noteIndex = _(@questionNotes).findIndex (note) ->
      note.id == deletedNote.id
    @questionNotes.splice noteIndex, 1

  displayTagsController: =>
    @sidebarTemplate = 'diligence/question/detail/add_tags.html'
    @sidebarTitle = 'Manage Tags'
    @sidebarContent = 'tags'
    @displaySidebarPanel = true
    @temp_assigned_tags = jQuery.extend(true, [], @assigned_tags);

    if !@tags
      params=
        Type: 'Question'

      @Restangular.all('tags').customGET('', params).then (response) =>
        @tags = response

  filterTags: (query) ->
    return @tags unless query
    regex = new RegExp(query, 'i')
    _(@tags).filter((tag) -> regex.test(tag.name))

  saveTags: ->
    @saving_tags = true

    tags_param = []

    _(@temp_assigned_tags).each((tag) ->
      tags_param.push(tag.id)
    )

    params =
      entity_type : 'Question'
      entity_id : @$stateParams.questionId
      tags : tags_param
    @RestangularHeaderService.RestangularWithHeader(@pageUrl).all('tag_assignments').post(params).then ((response) =>
      message = 'Tags have been assigned!'
      @toaster.pop 'success', '', message, 5000
      @saving_tags = false
      @displaySidebarPanel = false
      @assigned_tags = response
      @sortTags()
    ), (error) =>
      @saving_tags = false

  redirectToFirmSettings: ->
    @$state.go 'app.firm.settings.all_tags'

  verifyRequest: (group)=>
    group.questions[0].task.verifyQuestion = true
    params = _(group.questions[0].task).pick('assigned_to','due_date','id','is_active','text','type')
    params.is_complete = true
    params.type = 1702
    params.text = ""
    pageUrl = @generatePageUrl(group.questions)

    @RestangularHeaderService.RestangularWithHeader(pageUrl).one('todos', params.id).customPUT(params).then (response) =>
      group.questions[0].task = response
      message = 'Response successfully verified'
      @toaster.pop 'success', '', message
      group.questions[0].task.verifyQuestion = false

  filterTeamMembers: (term) =>
    @filteredTeamMembers = @MentionsFactory.getFilteredMembers(term)

  getDisplayName: (user) =>
    @$timeout =>
      if @tinymceEditor
        @tinymceEditor.insertContent('')
    , 300
    return @MentionsFactory.getDisplayName(user, true)

  getExpiryClass: (expiryDate)=>
    isLabel = true
    classObject = @Utils.getExpiryClass(expiryDate, isLabel)
    classObject

  editPreapprovedQuestion: (question)=>
    if question.response.response_type == 'Date'
      date_format = 'MM-DD-YYYY'
      question.response.dateResponse = moment(question.response.dateResponse, date_format).toDate()
    @ModalFactory.invokeModal 'add_pre_approved',
      resolve:
        response: => question
        assigned_tags: => @assigned_tags
        source: => 'question_detail'
      success: (response) =>
        @getQuestionResponses()
        @getQuestionTags()

  responseTypeNotExcluded: (response)=>
    excludedResponseTypes = ['aumTable', 'DynamicGrid', 'Grid', 'CheckBox', 'Dropdown', 'Bookends', 'ReturnTable', 'Attachment']
    response.response_type not in excludedResponseTypes
