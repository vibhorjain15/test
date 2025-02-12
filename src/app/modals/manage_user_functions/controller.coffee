class AssignNewFunctionsBulkController extends ModalController
  @register 'AssignNewFunctionsBulkController'

  @inject '$q', 'SweetAlert', 'Utils', 'Restangular', '$timeout', '$uibModalInstance', 'BaseDataService', 'toaster', '$scope', 'usersList'

  initialize: ->
    @tempUsersList = angular.copy @usersList
    @current_user = @Utils.getCurrentUser()
    @currentFirmId = @current_user.firmInfo.id
    @loadingData = false
    @tagsList = []
    @tagsToBeAdded = ''
    @temp_assigned_functions_bulk = []
    @markedTagsToRemoveWIthQuestions = []
    @markedTagsToRemoveBulk = []
    @addNewQuestionToggle = false
    @hideRemoveAllTagsOption = @checkIfEmpty()
    @Restangular.one('firms', @currentFirmId).all('users').getList().then (response) =>
      @team_members = response
      for functionObj in @tempUsersList
        if functionObj.hasOwnProperty('user_assigments') && functionObj.user_assigments.length > 0
          functionObj.temp_assigned_users = []
          for fnUser in functionObj.user_assigments
            for tempUser in @team_members
              if fnUser.user_id == tempUser.id
                functionObj.temp_assigned_users.push tempUser

  checkIfEmpty: ()->
    functionsList = []
    _(@tempUsersList).forEach (user) =>
        if user.hasOwnProperty('functions') && user.functions.length > 0
          for userFunction in user.functions
            functionsList.push userFunction
    if functionsList.length > 0
      return false
    else
      return true

  markRemoveTagFromCurrentQuestion:(user,functionObj,index) =>
    isMatched = false
    for user_obj,i in @markedTagsToRemoveWIthQuestions
      if user_obj.user.id == user.id
        @markedTagsToRemoveWIthQuestions[i].function.push functionObj
        isMatched = true
    if !isMatched
      usersParams =
        user: user
        function: [functionObj]
      @markedTagsToRemoveWIthQuestions.push usersParams
    functionObj.user_assigments.splice(index,1)

  markRemoveAllTagsBulk:(tag,index) =>
    count = 0
    usersList = []
    _(@tempUsersList).forEach (user) =>
      if user.hasOwnProperty('functions')
        i=0
        while i < user.tags.length
          if user.tags[i].id == tag.id
            count = count + 1
            usersList.push user
            user.tags.splice(i,1)
            break;
          i++
    tagParam =
      tag: tag
      count: count
      questions_list: usersList
    @markedTagsToRemoveBulk.push tagParam

  removeTagFromCurrentQuestion: (tag,question) =>
    params =
      field: 'tags'
      request_type: 'remove'
      ids: _(question).pluck('question_id')
      values: [tag.id]
    @Restangular.all('service/dvapi_service/qabank_bulk_update').post({filters:params}).then (response) =>

  removeTagsForAllQuestionsBulk: (tag,questions) ->
    params =
      field: 'tags'
      request_type: 'remove'
      ids: _(questions).pluck('question_id')
      values: [tag.id]
    @Restangular.all('service/dvapi_service/qabank_bulk_update').post({filters:params}).then (response) =>

  removeAllTagsBulk: (tag) ->
    @SweetAlert.confirm({
      title: 'Are you sure you want to remove all the tags.'
      confirmButtonText: 'Yes'
      focusCancel: true
    }).then (isConfirm) =>
        if isConfirm.value and isConfirm.value == true
          @loadingData = true
          params =
            field: 'tags'
            request_type: 'remove_all'
            ids: _(@tempUsersList).pluck('question_id')
            values: null
          @Restangular.all('service/dvapi_service/qabank_bulk_update').post({filters:params}).then (response) =>
            @loadingData = false
            tagUpdationParamas =
              tagsRemovedBulk: []
              tagsRemoved: []
              tempAssignedTagsBulk: []
              allQuestionsUpdated: @tempUsersList
              isRemovedAll: true
            @close(tagUpdationParamas)

  addTagsForRespectiveQuestion: (user) ->
    if user.hasOwnProperty('temp_assigned_functions') && user.temp_assigned_functions.length > 0
      functionsToBeAddedList = []
      if user.hasOwnProperty('tags')
        functionsInUserIds = _(user.functions).pluck('function_id')
      else
        functionsInUserIds = []
      indexesToBeRemoved = []
      for user_function,index in user.temp_assigned_functions
        if user_function && functionsInUserIds.indexOf(user_function.function_id) == -1
          user_function_obj =
            id: user_function.function_id
            value: user_function.function_name
          functionsToBeAddedList.push user_function_obj
        else
          indexesToBeRemoved.push index
      for index in indexesToBeRemoved
        user.temp_assigned_functions.splice(index,1)
      if functionsToBeAddedList.length > 0
        params =
          field: 'functions'
          request_type: 'add'
          ids: [user.id]
          values: functionsToBeAddedList
        @Restangular.all('service/dvapi_service/qabank_bulk_update').post({filters:params}).then (response) =>

  addTagsBulk: () ->
    if @temp_assigned_functions_bulk.length > 0
      tagsToBeAddedList = []
      for tag in @temp_assigned_functions_bulk
        if tag
          tag_obj =
            id: tag.id
            value: tag.name
        tagsToBeAddedList.push tag_obj
      for tag in @tagsToBeAdded.split(',')
        if tag
          tag_obj =
            id: 0
            value: tag
        tagsToBeAddedList.push tag_obj
      if tagsToBeAddedList.length > 0
        params =
          field: 'tags'
          request_type: 'add'
          ids: _(@tempUsersList).pluck('question_id')
          values: tagsToBeAddedList
        @Restangular.all('service/dvapi_service/qabank_bulk_update').post({filters:params}).then (response) =>

  filterTags: (query) ->
    return @tags unless query
    regex = new RegExp(query, 'i')
    _(@tags).filter((tag) -> regex.test(tag.name))

  updateTagsBulkData: () =>
    params = []
    for entry in @tempUsersList
      innerObj = {}
      innerObj.function_id = entry.function_id
      innerObj.user_ids = _(entry.temp_assigned_users).pluck "id"
      params.push innerObj
    @Restangular.all('functions').customPUT(params).then (response) =>
      console.log "response" , response

  removeMarkedTagsToRemoveWIthQuestions: (index) =>
    for question,i in @usersList
      for removedQuestion in @markedTagsToRemoveWIthQuestions[index].question
        if question.question_id == removedQuestion.question_id
          @tempUsersList[i].tags.push @markedTagsToRemoveWIthQuestions[index].tag
    @markedTagsToRemoveWIthQuestions.splice(index,1)

  removedMarkedTagsToRemoveBulk: (index) =>
    allQuestionsIds = _(@markedTagsToRemoveBulk[index].questions_list).pluck('question_id')
    for question,i in @usersList
      ids = _(question.tags).pluck('id')
      ids_temp =  _(@tempUsersList[i].tags).pluck('id')
      if _(ids).contains(@markedTagsToRemoveBulk[index].tag.id) &&  !_(ids_temp).contains(@markedTagsToRemoveBulk[index].tag.id) && _(allQuestionsIds).contains(question.question_id)
        @tempUsersList[i].tags.push @markedTagsToRemoveBulk[index].tag
    @markedTagsToRemoveBulk.splice(index,1)
