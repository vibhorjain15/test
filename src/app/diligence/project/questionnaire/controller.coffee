class ProjectQuestionnaireController extends BaseController

  @register 'ProjectQuestionnaireController'

  @inject 'Utils', '$scope', 'DueDiligenceDataservice', '$stateParams', '$state', '$http', 'baseUrl',
          'toaster', '$location', '$anchorScroll', '$window', '$timeout', '$rootScope', 'ModalFactory',
          'Restangular', 'SweetAlert', 'keywordConstants', 'diligenceStatusConstant','angularQuestionnaireEnabled'

  initialize: ->
    @is_investor = @Utils.isInvestor()
    @is_admin = @Utils.isAdmin()
    @is_manager = @Utils.isManager()
    @is_readonly = @Utils.isReadOnly()
    @diligence_type = undefined
    @canStartReview = false
    @reviewStartedForUser = false
    @options =
      viewMySections: false
      mode: if @is_investor then 'investor' else 'manager'

    @name = undefined
    jQuery(".projectsParentDiv").css("margin-right", "auto")

    @is_freeSubscription = @Utils.isFreeSubscription()
    @is_smartSubscription = @Utils.isSmartSubscription()

    @diligenceId = @$stateParams.diligenceId
    @current_user = @Utils.getCurrentUser()
    if @current_user and @current_user.firmInfo
      @permissions_enabled = @current_user.firmInfo.hasPermissionEnabled
    @search_text = @$state.params.q || ''
    @search_text_new = @$state.params.q || ''
    if @$state.params.q
      @activeSearch = true

    @allFiltersMap = {
      'AssignedTotal': {
        name: 'My Assignments'
        icon: 'user'
        param: 'Assigned'
        countParam: 'AssignedTotal'
        count: undefined
      }
      'ToDoTotal': {
        name: 'To-Dos / Drafts'
        icon: 'tasks'
        param: 'Todo'
        countParam: 'ToDoTotal'
        count: undefined
      }
      'AnsweredTotal': {
        name: 'Answered'
        icon: 'check-circle'
        param: 'Answered'
        countParam: 'AnsweredTotal'
        count: undefined
      }
      'UnAnsweredTotal': {
        name: 'Unanswered'
        icon: 'radio-unchecked'
        param: 'Unanswered'
        countParam: 'UnAnsweredTotal'
        count: undefined
      }
      'MandatoryTotal':{
        name: 'Mandatory'
        icon: 'star-check-mark'
        param: 'MandatoryQuestions'
        countParam: 'MandatoryTotal'
        count: undefined
      }
      'MandatoryUnansweredTotal':{
        name: 'Mandatory Unanswered'
        icon: 'star-check-mark'
        param: 'MandatoryUnansweredTotal'
        countParam: 'MandatoryUnansweredTotal'
        count: undefined
      }
      'NATotal': {
        name: 'Not Applicable'
        icon: 'ban'
        param: 'NA'
        countParam: 'NATotal'
        count: undefined
      }
      'FollowupTotal': {
        name: 'Follow-ups'
        icon: 'doubt'
        param: 'Followup'
        countParam: 'FollowupTotal'
        count: undefined
      }
      'ScoredTotal': {
        name: 'Scores/Ratings'
        icon: 'rating'
        param: 'Scored'
        countParam: 'ScoredTotal'
        count: undefined
        hidden_from: ['manager']
      }
      'FlaggedTotal': {
        name: 'Flagged'
        icon: 'flag'
        param: 'Flagged'
        countParam: 'FlaggedTotal'
        count: undefined
        hidden_from: ['manager']
      }
      'ExpiredTotal': {
        name: 'Expired'
        icon: 'times-up'
        param: 'Expired'
        countParam: 'ExpiredTotal'
        count: undefined
        hidden_from: ['investor']
        show_for_dd: ['dd_profile']
      }
      'VerificationMyAssignmentTotal' :{
        name: 'My Assignments Pending'
        icon: 'user-wait'
        param: 'VerificationMyAssignment'
        countParam: 'VerificationMyAssignmentTotal'
        count: undefined
        hidden_from: ['investor']
        show_for_dd: ['dd_profile']
      }
      'TotalReviewerAssignmentPending' :{
        name: 'Pending Reviewer Assignments'
        icon: 'user-wait'
        param: 'TotalReviewerAssignmentPending'
        countParam: 'TotalReviewerAssignmentPending'
        count: undefined
      }
      'ReviewFailed' :{
        name: 'Failed Reviews'
        icon: 'user-wait'
        param: 'ReviewFailed'
        countParam: 'ReviewFailed'
        count: undefined
      }
      'InReviewMyAssignments' :{
        name: 'My Pending Reviews'
        icon: 'user-wait'
        param: 'InReviewMyAssignments'
        countParam: 'InReviewMyAssignments'
        count: undefined
      }
      'WithTrackChangesCount' :{
        name: 'Responses with track changes'
        icon: 'compare'
        param: 'WithTrackChanges'
        countParam: 'WithTrackChangesCount'
        count: undefined
      }
      'RatingReviewpendingCount' :{
        name: 'Rating review pending'
        icon: 'rating'
        param: 'RatingReviewpendingCount'
        countParam: 'RatingReviewpendingCount'
        count: undefined
        redirectionUrl: 'app.diligence.project.investment_ratings'
        redirectionParams: {diligenceId: null}
      }
      'MyRatingReviewpendingCount' :{
        name: 'My pending rating reviews'
        icon: 'rating'
        param: 'MyRatingReviewpendingCount'
        countParam: 'MyRatingReviewpendingCount'
        count: undefined
        redirectionUrl: 'app.diligence.project.investment_ratings'
        redirectionParams: {diligenceId: null}
      }
      'RatingAssignmentpendingCount' :{
        name: 'Rating review assignment pending'
        icon: 'rating'
        param: 'RatingAssignmentpendingCount'
        countParam: 'RatingAssignmentpendingCount'
        count: undefined
        redirectionUrl: 'app.diligence.project.investment_ratings'
        redirectionParams: {diligenceId:null}
      }
      'RatingReviewFailed' :{
        name: 'Rating review failed'
        icon: 'rating'
        param: 'RatingReviewFailed'
        countParam: 'RatingReviewFailed'
        count: undefined
        redirectionUrl: 'app.diligence.project.investment_ratings'
        redirectionParams: {diligenceId:null}
      }
      'TotalReviewPending' :{
        name: 'All Pending Reviews'
        icon: 'user-wait'
        param: 'TotalReviewPending'
        countParam: 'TotalReviewPending'
        count: undefined
      }
      'TotalUnresolvedCommentsCount' :{
        name: 'Responses with Unresolved Comments'
        icon: 'message-square'
        param: 'UnResolvedComments'
        countParam: 'TotalUnresolvedCommentsCount'
        count: undefined
      }
      'ValidationRequiredCount' :{
        name: 'Grid Responses that require validation'
        icon: 'table-with-check'
        param: 'ValidationRequired'
        countParam: 'ValidationRequiredCount'
        count: undefined
      }
    }

    @filterForRole = {
      'investor':{
        'dd_new': {
          'main': ['AssignedTotal','ToDoTotal','AnsweredTotal','UnAnsweredTotal','FollowupTotal']
          'optional':['MandatoryTotal','MandatoryUnansweredTotal','ValidationRequiredCount','NATotal']
        }
        'dd_profile': {
          'main': ['AssignedTotal','ToDoTotal','AnsweredTotal','UnAnsweredTotal','NATotal']
          'optional':['MandatoryTotal','MandatoryUnansweredTotal','ValidationRequiredCount']
        }
        'dd_ongoing':{
          'main': ['AssignedTotal','ToDoTotal','AnsweredTotal','UnAnsweredTotal','FollowupTotal']
          'optional':['MandatoryTotal','MandatoryUnansweredTotal','ValidationRequiredCount','NATotal']
        }
        'dd_event_related':{
          'main': ['AssignedTotal','ToDoTotal','AnsweredTotal','UnAnsweredTotal','FollowupTotal']
          'optional':['MandatoryTotal','MandatoryUnansweredTotal','ValidationRequiredCount','NATotal']
        }
        'dd_doc':{
          'main': ['AssignedTotal','ToDoTotal','AnsweredTotal','UnAnsweredTotal','FollowupTotal']
          'optional':['MandatoryTotal','MandatoryUnansweredTotal','ValidationRequiredCount','NATotal']
        }
        'dd_internal':{
          'main': ['AssignedTotal','ToDoTotal','AnsweredTotal','UnAnsweredTotal','NATotal']
          'optional':['MandatoryTotal','MandatoryUnansweredTotal','ValidationRequiredCount']
        }
        'shared_profile':{
          'main': ['AssignedTotal','ToDoTotal','AnsweredTotal','UnAnsweredTotal','NATotal']
          'optional':['MandatoryTotal','MandatoryUnansweredTotal','ValidationRequiredCount']
        }
        'review_project_pre': {
          'main': ['TotalReviewPending','TotalReviewerAssignmentPending','ReviewFailed','InReviewMyAssignments','WithTrackChangesCount']
          'optional':['TotalUnresolvedCommentsCount','AssignedTotal','ToDoTotal','MandatoryTotal','MandatoryUnansweredTotal','ValidationRequiredCount','AnsweredTotal','UnAnsweredTotal','NATotal']
        }
        'review_project_post': {
          'main': ['TotalReviewPending','TotalReviewerAssignmentPending','InReviewMyAssignments','ToDoTotal','MandatoryTotal']
          'optional':['TotalUnresolvedCommentsCount','MandatoryUnansweredTotal','AnsweredTotal','UnAnsweredTotal','NATotal','ScoredTotal','FlaggedTotal']
        }
        'rating_project': {
          'main': ['TotalReviewPending','TotalReviewerAssignmentPending','ReviewFailed','InReviewMyAssignments','WithTrackChangesCount']
          'optional':['TotalUnresolvedCommentsCount','RatingReviewpendingCount','RatingReviewFailed','MyRatingReviewpendingCount','RatingAssignmentpendingCount','AssignedTotal','ToDoTotal','MandatoryTotal','MandatoryUnansweredTotal','ValidationRequiredCount','AnsweredTotal','UnAnsweredTotal','NATotal','ScoredTotal','FlaggedTotal']
        }
        'analyst_evaluation': {
          'main': ['AssignedTotal','ToDoTotal','AnsweredTotal','UnAnsweredTotal','NATotal']
          'optional':['MandatoryTotal','MandatoryUnansweredTotal','ScoredTotal','FlaggedTotal']
        }
      }
      'manager':{
        'dd_new': {
          'main': ['AssignedTotal','ToDoTotal','AnsweredTotal','UnAnsweredTotal','FollowupTotal']
          'optional':['MandatoryTotal','MandatoryUnansweredTotal','ValidationRequiredCount','NATotal']
        }
        'dd_profile': {
          'main': ['TotalReviewerAssignmentPending','ReviewFailed','InReviewMyAssignments','WithTrackChangesCount','AssignedTotal']
          'optional':['ToDoTotal','MandatoryTotal','MandatoryUnansweredTotal','ValidationRequiredCount','AnsweredTotal','UnAnsweredTotal','NATotal']
        }
        'dd_ongoing':{
          'main': ['AssignedTotal','ToDoTotal','AnsweredTotal','UnAnsweredTotal','FollowupTotal']
          'optional':['MandatoryTotal','MandatoryUnansweredTotal','ValidationRequiredCount','NATotal']
        }
        'dd_event_related':{
          'main': ['AssignedTotal','ToDoTotal','AnsweredTotal','UnAnsweredTotal','FollowupTotal']
          'optional':['MandatoryTotal','MandatoryUnansweredTotal','ValidationRequiredCount','NATotal']
        }
        'dd_internal':{
          'main': ['AssignedTotal','ToDoTotal','AnsweredTotal','UnAnsweredTotal','NATotal']
          'optional':['MandatoryTotal','MandatoryUnansweredTotal','ValidationRequiredCount']
        }
        'dd_doc':{
          'main': ['AssignedTotal','ToDoTotal','AnsweredTotal','UnAnsweredTotal','NATotal']
          'optional':['MandatoryTotal','MandatoryUnansweredTotal','ValidationRequiredCount']
        }
        'review_project_pre': {
          'main': ['TotalReviewPending','TotalReviewerAssignmentPending','ReviewFailed','InReviewMyAssignments','WithTrackChangesCount']
          'optional':['TotalUnresolvedCommentsCount','AssignedTotal','ToDoTotal','MandatoryTotal','MandatoryUnansweredTotal','ValidationRequiredCount','AnsweredTotal','UnAnsweredTotal','NATotal']
        }
        'review_project_post': {
          'main': ['TotalReviewPending','TotalReviewerAssignmentPending','InReviewMyAssignments','ToDoTotal','MandatoryTotal']
          'optional':['TotalUnresolvedCommentsCount','MandatoryUnansweredTotal','AnsweredTotal','UnAnsweredTotal','NATotal']
        }
        'rating_project': {
          'main': ['TotalReviewPending','TotalReviewerAssignmentPending','ReviewFailed','InReviewMyAssignments','WithTrackChangesCount']
          'optional':['TotalUnresolvedCommentsCount','RatingReviewpendingCount','RatingReviewFailed','MyRatingReviewpendingCount','RatingAssignmentpendingCount','AssignedTotal','ToDoTotal','MandatoryTotal','MandatoryUnansweredTotal','ValidationRequiredCount','AnsweredTotal','UnAnsweredTotal','NATotal']
        }
        'analyst_evaluation': {
          'main': ['AssignedTotal','ToDoTotal','AnsweredTotal','UnAnsweredTotal','NATotal']
          'optional':['MandatoryTotal','MandatoryUnansweredTotal','ScoredTotal','FlaggedTotal']
        }
      }
    }

    @defaultFilters = {
      'main': ['AssignedTotal','ToDoTotal','AnsweredTotal','UnAnsweredTotal','NATotal']
      'optional':['MandatoryTotal','MandatoryUnansweredTotal']
    }

    @filtersMap = {
      'main': []
      'optional': []
    }
    utils_grant_map = @Utils.getGrantMap()

    @active_category =
      parent_section: {}
      child_sections: []
      active_child_section_id: -1

    @$scope.active_category = @active_category

    @$scope.$on 'child_sections_update', (event, child_sections_set) =>
      if @active_category.active_child_section_id == -1
        @active_category.child_sections = []
        @active_category.active_child_section_id = -1
        @active_category.child_sections = @active_category.child_sections.concat(child_sections_set)
        if @$state.params['#'] and @$state.params['#'] != "" and @$state.params['#'].indexOf('child_section_') > -1
          childSectionId = @$state.params['#'].slice('child_section_'.length)
          selectedChild = _(@active_category.child_sections).find ((child)=>
            child.id == Number(childSectionId)
          )
          @active_category.active_child_section_id = selectedChild.id if selectedChild
        else if @active_category.child_sections.length and @active_category.child_sections.length > 0
          @active_category.active_child_section_id = @active_category.child_sections[0].id
      @active_category.parent_section.child_sections_loading = false
      $('#js-questionnaire-parent-tpl').css('min-height', ($('#js-questionnaire-sidebar-tpl').outerHeight())+'px');

    if @is_investor
      @chardin_config =
        scroll_to_target: true
        scroll_offset: 200
        intros: [
          {
            target: '.js-response-control-follow-up:first',
            intro: "Followup with #{if @is_investor then 'manager' else 'investor'}"
            position: "right"
          }
          {
            target: '.js-response-control-notes:first'
            intro: "Add notes for this response"
            position: "top"
          }
          {
            target: ".js-response-control-more-actions:first"
            intro: "View response history/add todos"
            position: "bottom"
          }
        ]
    else
      @chardin_config =
        scroll_to_target: true
        scroll_offset: 200
        intros: [
          {
            target: '.js-response-control-more-actions:first',
            intro: "More actions for - Followup with #{if @is_investor then 'manager' else 'investor'}, add notes and view response history/add todos"
            position: 'right'
          }
        ]

    @$scope.getDueDiligence().then (diligence) =>
      @diligence = diligence

      @getRelatedDiligences() if @diligence.entity_type != @keywordConstants.Firm
      if @diligence.is_internal and @is_admin and @diligence.status != 'Deleted'
        @diligence.canDelete = true

      if @permissions_enabled
        @diligence.hasReadOnlyAccess = false
      else
        @diligence.isLocked = @diligence.isLocked || @diligence.hasReadOnlyAccess

      if @diligence.status ==  'Deleted'
        @diligence.isReadOnly = true

      if @diligence.review_allowed && ({'Started': true, 'ExtensionRequested': true, 'Followup': true, 'Completed':true,'PendingRestart':true})[@diligence.status] && !@diligence.alwaysOpen
        @openReviewHelpModal()

      @diligence_type = @diligence.diligence_type
      @getDisclaimer()
      @getFirmPref()

      @name = if @diligence.is_internal is true then "#{@diligence.entity_name} (#{@diligence.name})" else @diligence.entity_name
      ###return if diligence.isReadOnly###

      @options.displayFilterPanel = true

      @statusFilter = @$stateParams.status || 'default'
      @queryStringFilter = @$stateParams.q || null
      @getQuestionCounts()

      @getParentSections(diligence.templateID)

    @$scope.$on 'refresh:counts', =>
      @getQuestionCounts()

    @$rootScope.$on 'questionnaire:total_questions', (evt, count) =>
      @total_questions_count = count

  setReviewStarted: =>
    if @diligence.is_internal
      if @diligence.status == @diligenceStatusConstant.PRECOMPLETIONREVIEW
        @reviewStartedForUser = @diligence.presubmission_review_enabled
      else
        @reviewStartedForUser = @diligence.postsubmission_review_enabled
    else
      if @current_user.firmInfo.id == @diligence.fromfirm_id
        @reviewStartedForUser = true if @diligence.status == @diligenceStatusConstant.POSTCOMPLETIONREVIEW
      else if @current_user.firmInfo.id == @diligence.tofirm_id
        @reviewStartedForUser = true if @diligence.status == @diligenceStatusConstant.PRECOMPLETIONREVIEW

  reloadRatings: =>
    @recalculating_scores = true
    params =
      duediligence_ids: [@diligence.id]
    @Restangular.all('diligences/recalculate_score').post(params).then (response)=>
      @diligence.recalculation_needed = false
      @recalculating_scores = false
      @$rootScope.$emit 'diligence:refresh', @diligence
    , (error)=>
      @recalculating_scores = false

  getFirmPref: =>
    @Restangular.all('firm_preferences').customGET().then (response) =>
      if @diligence.is_internal
        if @diligence.status == @diligenceStatusConstant.COMPLETED
          @canStartReview = @diligence.postsubmission_review_enabled
        else
          @canStartReview = @diligence.presubmission_review_enabled
      else
        if @current_user.firmInfo.id == @diligence.fromfirm_id
          @canStartReview = @diligence.postsubmission_review_enabled
        else if @current_user.firmInfo.id == @diligence.tofirm_id
          @canStartReview = @diligence.presubmission_review_enabled

      @setReviewStarted()
      if @diligence.is_internal
        @diligence.review_mandatory = response.review_workflow_mandatory_for_internal_diligence
      else
        @diligence.review_mandatory = response.review_workflow_mandatory_for_external_diligence
      @allow_internal_to_external = response.enable_internal_project_to_external_option
      @firm_preferences = response
      @isQaSearchEnabled = response.enableQASearch || (@current_user.userName.toLowerCase().indexOf('diligencevault.com') > -1 && @is_manager)
      if @isQaSearchEnabled and jQuery(window).width() <= 1390 and @is_manager
        jQuery(".projectsParentDiv").css("margin-right", "65px")

  showForDDType: (types)=>
    if types
      return _(types).any((type) => type == @diligence_type)
    return true

  getDisclaimer: () ->
     @Restangular.all('disclaimerassignments').customGET('',{entity_id: @diligenceId, entity_type: 'Duediligence'}).then (response) =>
       @disclaimer_id = response.id

  getRelatedDiligences: =>
    @related_diligences = []
    @Restangular.one('diligences',@diligence.id).getList('linked_projects').then ((response) =>
      @related_diligences = response
    )

  getParentSections: (templateID) ->
    params = {
      params:
        isParent: true,
        StatusFilter: @statusFilter
    }

    if @statusFilter == 'Search'
      params.params.q = @queryStringFilter

    @$http.get("#{@baseUrl}/v2/diligences/#{@diligence.id}/sections", params).then (response) =>
      @parent_sections = response.data.data

      @parent_sections = _(@parent_sections).sortBy (section) -> section.attributes.order

      @$scope.parent_sections = @parent_sections

      if @$state.params.categoryId?
        active_parent_section = {}
        _.each @parent_sections, (section) =>
          if section.id == parseInt(@$state.params.categoryId)
            active_parent_section = section
          return
        if !_(active_parent_section).isEmpty()
          @active_category.parent_section = active_parent_section
        else if @parent_sections.length
          @active_category.parent_section = @parent_sections[0]
          state = @$state.current.name
          params = @$state.params
          params.categoryId = @active_category.parent_section.id
          @$state.go(state, params)

      if !@$state.params.categoryId?
        @active_category.parent_section = @parent_sections[0]

      if @$state.current.name.endsWith('project.questionnaire') && !@$state.current.name.endsWith('project.questionnaire.category') && @parent_sections.length
        # if the current state endswith project.questionnaire and doesnt endwith project.questionnaire.category then go its child state category
        @$state.go('.category', {
          categoryId: @parent_sections[0].id
        })

  getChildSections: (parentSection)=>
    if parentSection.id != @active_category.parent_section.id
      @active_category.parent_section = parentSection
      @active_category.child_sections = []
      @active_category.active_child_section_id = -1
      @active_category.parent_section.child_sections_loading = true

    # '.' means current state, here it means go to the child state 'category'
    @$state.go '^.category', {categoryId: parentSection.id}


  goToChildSection: (childSection)=>
    @active_category.active_child_section_id = childSection.attributes.id

    @$anchorScroll.yOffset = 50;
    @$location.hash('child_section_'+childSection.attributes.id)
    #@$state.go 'app.diligence.project.questionnaire.category', {categoryId: @active_category.parent_section.id,'#':'child_section_'+childSection.attributes.id},{reload:true}
    @$anchorScroll()

  getQuestionCounts: =>
    userFilters = @filterForRole[@current_user.type]
    #if diligence is internal and not a profile dd, then load internal filters
    if @diligence.status == @diligenceStatusConstant.PRECOMPLETIONREVIEW
      if @diligence.diligence_type == 'dd_review'
        filters = userFilters['rating_project']
      else
        filters = userFilters['review_project_pre']
    else if @diligence.status == @diligenceStatusConstant.POSTCOMPLETIONREVIEW
      filters = userFilters['review_project_post']
    else if @diligence_type == 'dd_review'
      filters = userFilters['analyst_evaluation']
    else if @diligence.is_internal and @diligence_type != 'dd_profile'
      filters = userFilters['dd_internal']
    else
      #otherwise load the filter of that diligence type
      filters = userFilters[@diligence_type]
    filters = @defaultFilters if not filters
    if @diligence.status == 'Approved' ||  @diligence.status == 'NotApproved'
      if filters.optional.indexOf('FlaggedTotal') == -1
        filters.optional.push 'FlaggedTotal'
    if @diligence.status == 'Completed'
      if filters.optional.indexOf('FlaggedTotal') == -1
        filters.optional.push 'FlaggedTotal'
      if filters.optional.indexOf('ScoredTotal') == -1
        filters.optional.push 'ScoredTotal'
    @DueDiligenceDataservice.getQuestionCounts(@diligenceId).then (response) =>
      #use a separate list for assigning filters. because when it refreshes the counts using the $on, it calls this method
      #multiple times creating duplicate items in the list
      mainList = []
      optionalList = []
      _(filters.main).each (filter)=>
        index = _(response).findIndex((item)=> item.id == filter)
        if index > -1
          filterObj = @allFiltersMap[filter]
          filterObj.count = response[index].value
          mainList.push filterObj

      _(filters.optional).each (filter)=>
        index = _(response).findIndex((item)=> item.id == filter)
        if index > -1
          filterObj = @allFiltersMap[filter]
          filterObj.count = response[index].value
          optionalList.push filterObj

      @filtersMap['main'] = mainList
      @filtersMap['optional'] = optionalList
      _(response).each (count_info) =>
        switch count_info.id
          when 'AnsweredTotal'
            @answeredCount = count_info.value
          when 'UnAnsweredTotal'
            @unansweredCount = count_info.value
          when 'MandatoryTotal'
            @mandatoryCount = count_info.value
          when 'MandatoryUnansweredTotal'
            @mandatoryUnansweredCount = count_info.value
          when 'NATotal'
            @naCount = count_info.value
          when 'ToDoTotal'
            @todoCount = count_info.value
          when 'AssignedTotal'
            @assignedCount = count_info.value
          when 'FollowupTotal'
            @followupCount = count_info.value
          when 'ScoredTotal'
            @scoredCount = count_info.value
          when 'FlaggedTotal'
            @flaggedCount = count_info.value
          when 'ExpiredTotal'
            @expiredCount = count_info.value
          when 'VerificationMyAssignmentTotal'
            @myPendingVerification = count_info.value
          when 'WipTotal'
            @wipCount = count_info.value
          when 'QuestionTotal'
            @totalCount = count_info.value
          when 'TotalReviewPending'
            @totalReviewPending = count_info.value
          when 'ReviewFailed'
            @totalReviewFailed = count_info.value
          when 'WithTrackChangesCount'
            @totalTrackChangesCount = count_info.value
          when 'TotalReviewerAssignmentPending'
            @totalReviewAssignmentPending = count_info.value
          when 'WithRatingTrackChangesCount'
            @totalRatingTrackChangesCount = count_info.value
          when 'RatingReviewpendingCount'
            @totalRatingReviewPending = count_info.value
          when 'RatingAssignmentpendingCount'
            @totalRatingReviewAssignmentPending = count_info.value
          when 'RatingReviewFailed'
            @totalRatingReviewFailed = count_info.value
          when 'TotalUnresolvedCommentsCount'
            @totalUnResolvedComments = count_info.value
          when 'ValidationRequiredCount'
            @validationRequiredCount = count_info.value

      @refeshPercentageCompleted()

  autoFill: ->
    @ModalFactory.invokeModal 'autofill_responses',
      resolve:
        diligence: => @diligence
      success: (response) =>
        if @statusFilter isnt 'default'
          @resetFilter()
        else
          @$state.go @$state.current.name, @$state.params, {reload: true}

  triggerWorkflow: =>
    @ModalFactory.invokeModal 'trigger_workflow',
      resolve:
        workflow: =>
          entity_type: 'Duediligence'
          entity_id: @diligenceId
          name: @diligence.name

  viewDisclaimer: =>
    @ModalFactory.invokeModal 'view_disclaimer',
      resolve:
        id: => @disclaimer_id

  addDisclaimer: =>
    @ModalFactory.invokeModal 'add_disclaimer',
      resolve:
        disclaimer: =>
          entity_id: @diligenceId
          entity_type: 'Duediligence'
          disclaimer_id: @disclaimer_id
          entity_name: @diligence.entity_name
      success: (response) =>
        @disclaimer_id = response.disclaimer_id

  modifyQuestionnaire: () ->
    @$state.go 'app.diligence.template.categories', {templateId: @diligence.template_id}

  chooseExportTemplate: =>
    @ModalFactory.invokeModal 'choose_export_template',
      resolve:
        diligence: => @diligence
      success: (response) =>
        if response
          @writeToDocument(response)

  writeToOriginalDocument: () ->
    @writing_to_doc = true
    @DueDiligenceDataservice.WritetoOriginalDoc(@diligenceId)
    @writing_to_doc = false
    @toaster.pop 'success', '', "Export request received and is being processed"

  emailAndExport: =>
    @writing_to_doc = true
    @DueDiligenceDataservice.WritetoDocWithoutTemplate(@diligenceId)
    @writing_to_doc = false
    @toaster.pop 'success', '', "Export request received and is being processed"

  writeToDocument: (params) ->
    @writing_to_doc = true
    params.diligence_id = @diligenceId
    if params.excelView
      if params.questions.length
        excelparams = {
          "firm_name": @current_user.firmInfo.name,
          "firm_id": @current_user.firmInfo.id,
          "recipients": @current_user.userName,
          "question_ids": _(params.questions).pluck('id'),
          "project_ids": [@diligence.id]
        }
        for key, value of params.preferences
          excelparams[key] = value
        @DueDiligenceDataservice.WritetoExcelQuestionsBased(excelparams)
        @writing_to_doc = false
        @toaster.pop 'success', '', "Export request received and is being processed"
      else
        excelparams = {}
        excelparams.template_id = @diligence.template_id
        excelparams.template_name = @diligence.template_name
        excelparams.firm_name = @current_user.firmInfo.name
        excelparams.diligence_ids = @diligence.id
        for key, value of params.preferences
          excelparams[key] = value
        @DueDiligenceDataservice.WritetoExcel(excelparams)
        @writing_to_doc = false
        @toaster.pop 'success', '', "Export request received and is being processed"
    else
      delete params.activeView
      @DueDiligenceDataservice.WritetoDoc(params)
      @writing_to_doc = false
      @toaster.pop 'success', '', "Export request received and is being processed"


  getSections: (filter) ->
    # '.' means current state, here it means load current state with these params
    if filter.redirectionUrl
      filter.redirectionParams.diligenceId = @diligence.id
      @$state.go filter.redirectionUrl, filter.redirectionParams
    else
      if @statusFilter is filter.param #if they click the button with existing status, unselect that filter
        @$state.go '.', {status: null, q: null}
      else
        @$state.go '.', {status: filter.param, q: null}

  searchQuestions: =>
    # '.' means current state, here it means load current state with these params
    if @search_text_new and @search_text_new.length
      @$state.go '.', {status: 'Search', q: @search_text_new}

  redirectToSinglePageView: =>
    # '^' means parent state, so if the current state endswith project.questionnaire then go one level up to its parent and goto search_n_review_questions
    if @search_text_new.length
      if @$state.current.name.endsWith('project.questionnaire')
        @$state.go '^.search_n_review_questions', {searchString: @search_text_new}
      #otherwise if the current state endswith project.questionnaire.category then go two level up to its grandparent and goto search_n_review_questions
      else if @$state.current.name.endsWith('project.questionnaire.category')
        @$state.go '^.^.search_n_review_questions', {searchString: @search_text_new}

  redirectToSummary: ->
    # '^' means parent state, so if the current state endswith project.questionnaire then go one level up to its parent and goto summary
    if @$state.current.name.endsWith('project.questionnaire')
      @$state.go '^.summary'
    #otherwise if the current state endswith project.questionnaire.category then go two level up to its grandparent and goto summary
    else if @$state.current.name.endsWith('project.questionnaire.category')
      @$state.go '^.^.summary'

  resetFilter: ->
    # '.' means current state, here it means load current state with these params
    @$state.go '.', {status: null, q: null}

  deleteQuestionnaire: =>
    @SweetAlert.confirm({
      title: "Are you sure you want to delete this Project?"
      focusCancel: true
      showLoaderOnConfirm: true
      preConfirm: =>
        @finishDeleteQuestionaire()
    })

  finishDeleteQuestionaire: =>
    @DueDiligenceDataservice.updateDiligenceStatus('deleted', @diligenceId).then (response) =>
      @toaster.pop 'success', '', "Deleted successfully" , 2000
      swal.close()
      @$timeout =>
        @$state.go 'app.diligence.projects.activity', type: 'in-progress'

  toggleSearchBar: (value) ->
    @activeSearch = value

  unMarkWIP: (type) =>
    @DueDiligenceDataservice.unMarkWIP(@diligenceId,type).then (response) =>
      @toaster.pop 'success', '', "#{response.length} response(s) finalized"
      @getQuestionCounts()
      @$rootScope.$emit 'update:wip',response

  goBackToMainProject: =>
    @$state.go "app.diligence.project.questionnaire", {diligenceId: @diligence.linked_duediligence_id}, {reload: true,notify:true}

  getFinishButtonToolTipText: (mandatory_count, wip_count) ->
    message = ""
    if wip_count > 0 and mandatory_count > 0
       message = mandatory_count + ' Mandatory Question(s) Pending and '+wip_count+' question(s) marked as draft. Please resolve these before submitting.'
    else if wip_count > 0
       message = 'You have '+wip_count+' questions marked as draft. Please unmark these before submitting.'
    else if mandatory_count > 0
        message = mandatory_count + ' Mandatory Question(s) Pending'
    message

  viewRelatedProjects: =>
    disabled = !(@diligence.status == 'Started' || @diligence.status == 'Followup' || @diligence.status == 'ExtensionRequested' || @diligence.status == 'InReview') || @is_readonly || @mandatoryUnansweredCount > 0 || @wipCount> 0
    @ModalFactory.invokeModal 'view_related_diligences',
      resolve:
        diligence: => @diligence
        disabled: => disabled
        disabledTooltip: => @getFinishButtonToolTipText(@mandatoryUnansweredCount,@wipCount)

  refeshPercentageCompleted: =>
    pct_complete = (@answeredCount/@totalCount)*100
    @diligence.percentage_completed = Math.ceil(pct_complete)

  openConfirmationforVerifier: =>
    confirmText = ""
    if @diligence.status != @diligenceStatusConstant.COMPLETED
      if @unansweredCount > 0
        confirmText = "You have #{@unansweredCount} unanswered questions. Are you sure you want to continue?"
      else if @wipCount > 0
        confirmText = "You have #{@wipCount} questions marked as draft. Are you sure you want to continue?"
    @SweetAlert.confirm({
      title: "Are you sure you want to submit this project for review?"
      text: confirmText
      focusCancel: true
      showLoaderOnConfirm: true
      preConfirm: =>
        @openCopyVerifierModal()
    })

  openCopyVerifierModal: =>
    @ModalFactory.invokeModal 'copy_verifiers',
      resolve:
        diligence: => @diligence
      success: (response)=>
        @diligence.status = response.status
        @setReviewStarted()
        @$rootScope.$emit 'diligence:refresh', @diligence

  onTerminateReviewClick: =>
    if @diligence.status == @diligenceStatusConstant.PRECOMPLETIONREVIEW
      status = 'Started'
    else
      status = @diligenceStatusConstant.COMPLETED
    @SweetAlert.confirm({
      title: "Are you sure you want to cancel review and change the status of the project to #{status}?"
      text: "You have #{@totalReviewPending} reviews pending."
      focusCancel: true
      showLoaderOnConfirm: true
      preConfirm: =>
        @terminateReview(status)
    })

  onRemovePendingReviewClick: =>
    @SweetAlert.confirm({
      title: "Are you sure you want to remove all the pending reviews?"
      text: "You have #{@totalReviewPending} reviews pending."
      focusCancel: true
      showLoaderOnConfirm: true
      preConfirm: =>
        @removePendingReviews()
    })

  terminateReview: (status)=>
    @DueDiligenceDataservice.exitReview(@diligence.id).then (response)=>
      @DueDiligenceDataservice.setStatus(@diligence.id, status).then (response) =>
        @diligence.status = response.status
        @toaster.pop 'success','','Review Cancelled'
        @$rootScope.$emit 'diligence:refresh', @diligence

  removePendingReviews: =>
    @DueDiligenceDataservice.exitReview(@diligence.id).then (response)=>
      @toaster.pop 'success','','Pending Reviews Removed'
      @$rootScope.$emit 'diligence:refresh', @diligence

  toggleReviewButton: =>
    canStartReview = not @canStartReview
    params = angular.copy @diligence
    params.postsubmission_review_enabled = canStartReview
    params.presubmission_review_enabled = canStartReview
    @Restangular.one('diligences',@diligence.id).all('update_data').customPUT(params).then (response)=>
      @diligence = params
      @canStartReview = canStartReview
      message = "Review mode #{if @canStartReview then 'Enabled' else 'Disabled'}"
      @toaster.pop 'success','',message

  openReviewHelpModal: =>
    if !@Utils.hideReviewFunctionalityIntro() and (@Utils.getReviewFunctionalityIntroDisplayOption() == undefined or !@Utils.getReviewFunctionalityIntroDisplayOption() == false)
      @ModalFactory.invokeModal 'project_review_help'

  exportReviewDoc: =>
    @ModalFactory.invokeModal 'custom_export',
      resolve:
        diligence: => @diligence

  changeDDStatus: (status) ->
    if status in ['Approved','NotApproved'] and @totalReviewPending > 0
      return

    @DueDiligenceDataservice.setStatus(@diligenceId, status).then (response) =>
      action = {
        'Started' : 'started again'
        'Restarted' : 'started again'
        'Approved': 'approved successfully!'
        'Completed': 'completed successfully'
        'NotApproved': 'not approved at this time'
      }[response.status]

      if status in ['Started', 'RestartApproved', 'Restarted']
        type= 'in-progress'
      else
        type = 'closed'

      @toaster.pop 'success', 'Due Diligence is ' + action

      if (@is_freeSubscription or @is_smartSubscription) and status == 'Approved'
        @$state.go 'app.diligence.projects.activity', type: type

        return

      switch status
        when 'Approved'
          if @diligence.entity_type == @keywordConstants.Product
            @$state.go 'app.firms.funds.profile.monitor', {firmId: @diligence.fromfirm_id, fundId: @diligence.entity_id}
          else if @diligence.entity_type == @keywordConstants.Firm
            @$state.go 'app.firms.profile.monitor', firmId: @diligence.entity_id
          else if @diligence.entity_type == @keywordConstants.Vehicle
            if @diligence.linked_duediligence_id
              @$state.go 'app.diligence.firms.funds.vehicles.project.summary', {firmId: @diligence.fromfirm_id, fundId: @diligence.parent_entity_id, vehicleId: @diligence.entity_id, diligenceId: @diligence.linked_duediligence_id}
            else
              @$state.go 'app.firms.funds.vehicles.profile.monitor', {firmId: @diligence.fromfirm_id, fundId: @diligence.parent_entity_id, vehicleId: @diligence.entity_id}
          else if @diligence.entity_type == @keywordConstants.Review
            @$state.go 'app.diligence.projects.activity', type: type

        when 'NotApproved'
          _(@diligence).extend response
          @$state.go '^.not_approval_reasons'
        else
          @$state.go 'app.diligence.projects.activity', type: type
