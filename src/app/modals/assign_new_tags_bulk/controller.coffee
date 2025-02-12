class AssignNewTagsBulkController extends ModalController
  @register 'AssignNewTagsBulkController'

  @inject '$q', 'SweetAlert', 'Restangular', '$timeout', '$uibModalInstance', 'BaseDataService', 'toaster', '$scope', 'questionsList'

  initialize: ->
    @tempQuestionsList = angular.copy @questionsList
    @loadingData = false
    @tagsList = []
    @tagsToBeAdded = ''
    @temp_assigned_tags_bulk = []
    @markedTagsToRemoveWIthQuestions = []
    @markedTagsToRemoveBulk = []    
    @addNewQuestionToggle = false
    @hideRemoveAllTagsOption = @checkIfEmpty()
    params=
        Type: 'Question'
    @Restangular.all('tags').customGET('', params).then (response) =>
        @tags = response
        for question in @tempQuestionsList
          if question.hasOwnProperty('tags') && question.tags.length > 0
            question.temp_assigned_tags = []
            for tag in question.tags
              for tempTag in @tags
                if tag.id == tempTag.id
                  question.temp_assigned_tags.push tempTag

  checkIfEmpty: ()->
    tagsList = []
    _(@tempQuestionsList).forEach (question) =>
        if question.hasOwnProperty('tags') && question.tags.length > 0
          for tag in question.tags
            tagsList.push tag
    if tagsList.length > 0
      return false
    else
      return true

  markRemoveTagFromCurrentQuestion:(tag,question,index) =>
    isMatched = false
    for tag_obj,i in @markedTagsToRemoveWIthQuestions
      if tag_obj.tag.id == tag.id 
        @markedTagsToRemoveWIthQuestions[i].question.push question
        isMatched = true
    if !isMatched
      tagsParams = 
        tag: tag
        question: [question]
      @markedTagsToRemoveWIthQuestions.push tagsParams
    question.tags.splice(index,1)
    question.temp_assigned_tags.splice(index,1)

  markRemoveAllTagsBulk:(tag,index) =>
    count = 0
    questionsList = []
    _(@tempQuestionsList).forEach (question) =>
      if question.hasOwnProperty('tags')
        i=0
        while i < question.tags.length
          if question.tags[i].id == tag.id
            count = count + 1
            questionsList.push question
            question.tags.splice(i,1)
            question.temp_assigned_tags.splice(i,1)
            break;
          i++
    tagParam = 
      tag: tag
      count: count
      questions_list: questionsList
    @markedTagsToRemoveBulk.push tagParam

  removeTagFromCurrentQuestion: (tag,question) =>
    params = 
      field: 'tags'
      request_type: 'remove'
      ids: _(question).pluck('response_id')
      values: [tag.id]
    @Restangular.all('service/dvapi_service/qabank_bulk_update').post({filters:params}).then (response) =>

  removeTagsForAllQuestionsBulk: (tag,questions) ->
    params = 
      field: 'tags'
      request_type: 'remove'
      ids: _(questions).pluck('response_id')
      values: [tag.id]
    @Restangular.all('service/dvapi_service/qabank_bulk_update').post({filters:params}).then (response) =>

  removeAllTagsBulk: (tag) ->
    @SweetAlert.confirm({
      title: 'Are you sure you want to remove all the tags?'
      confirmButtonText: 'Yes'
      focusCancel: true
    }).then (isConfirm) =>
        if isConfirm.value and isConfirm.value == true
          @loadingData = true
          params = 
            field: 'tags'
            request_type: 'remove_all'
            ids: _(@tempQuestionsList).pluck('response_id')
            values: null
          @Restangular.all('service/dvapi_service/qabank_bulk_update').post({filters:params}).then (response) =>
            @loadingData = false
            tagUpdationParamas = 
              tagsRemovedBulk: []
              tagsRemoved: []
              tempAssignedTagsBulk: []
              allQuestionsUpdated: @tempQuestionsList
              isRemovedAll: true
            @close(tagUpdationParamas)
          ,(error) =>
            @loadingData = false

  addTagsForRespectiveQuestion: (question) ->
    #  Remove duplicate tags (tags which are already present in the QA)
    listOfTagsRemoved = []
    for data in @markedTagsToRemoveWIthQuestions
      markedQuestionsListTemp = _(data.question).pluck('question_id')
      if markedQuestionsListTemp.indexOf(question.question_id) != -1
        listOfTagsRemoved.push data.tag.id
    for data in @markedTagsToRemoveBulk
      markedQuestionsListTemp = _(data.questions_list).pluck('question_id')
      if markedQuestionsListTemp.indexOf(question.question_id) != -1
        listOfTagsRemoved.push data.tag.id
    # [End]
    if question.hasOwnProperty('temp_assigned_tags') && question.temp_assigned_tags.length > 0
      tagsToBeAddedList = []
      if question.hasOwnProperty('tags')
        tagsInQuestionIds = _(question.tags).pluck('id')
      else
        tagsInQuestionIds = []
      indexesToBeRemoved = []
      for tag,index in question.temp_assigned_tags
        if tag && tagsInQuestionIds.indexOf(tag.id) == -1 && listOfTagsRemoved.indexOf(tag.id) == -1
          tag_obj = 
            id: tag.id
            value: tag.name
          tagsToBeAddedList.push tag_obj
        else
          indexesToBeRemoved.push index
      for index in indexesToBeRemoved
        question.temp_assigned_tags.splice(index,1)
      if tagsToBeAddedList.length > 0
        params = 
          field: 'tags'
          request_type: 'add'
          ids: [question.response_id]
          values: tagsToBeAddedList
        @Restangular.all('service/dvapi_service/qabank_bulk_update').post({filters:params}).then (response) =>

  addTagsBulk: () ->
    if @temp_assigned_tags_bulk.length > 0
      tagsToBeAddedList = []
      for tag in @temp_assigned_tags_bulk
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
          ids: _(@tempQuestionsList).pluck('response_id')
          values: tagsToBeAddedList
        @Restangular.all('service/dvapi_service/qabank_bulk_update').post({filters:params}).then (response) =>

  filterTags: (query) ->
    return @tags unless query
    regex = new RegExp(query, 'i')
    _(@tags).filter((tag) -> regex.test(tag.name))

  updateTagsBulkData: () ->
    @loadingData = true
    promise = []
    promise.push @addTagsBulk()
    for question in @tempQuestionsList
      promise.push @addTagsForRespectiveQuestion(question)
    for data in @markedTagsToRemoveWIthQuestions
      promise.push @removeTagFromCurrentQuestion(data.tag,data.question)
    for data in @markedTagsToRemoveBulk
      promise.push @removeTagsForAllQuestionsBulk(data.tag,data.questions_list)
    @$q.all(promise).then =>
      @loadingData = false
      tagUpdationParamas = 
        tagsRemovedBulk: @markedTagsToRemoveBulk
        tagsRemoved: @markedTagsToRemoveWIthQuestions
        tempAssignedTagsBulk: @temp_assigned_tags_bulk
        allQuestionsUpdated: @tempQuestionsList
        isRemovedAll: false
      @close(tagUpdationParamas)
    ,(error) =>
      @loadingData = false
      @cancel()
    .finally ->
      @loadingData = false
      @cancel()

  removeMarkedTagsToRemoveWIthQuestions: (index) =>
    for question,i in @questionsList
      for removedQuestion in @markedTagsToRemoveWIthQuestions[index].question
        if question.question_id == removedQuestion.question_id
          @tempQuestionsList[i].tags.push @markedTagsToRemoveWIthQuestions[index].tag
    @markedTagsToRemoveWIthQuestions.splice(index,1)

  removedMarkedTagsToRemoveBulk: (index) =>
    allQuestionsIds = _(@markedTagsToRemoveBulk[index].questions_list).pluck('question_id')
    for question,i in @questionsList
      ids = _(question.tags).pluck('id')
      ids_temp =  _(@tempQuestionsList[i].tags).pluck('id')
      if _(ids).contains(@markedTagsToRemoveBulk[index].tag.id) &&  !_(ids_temp).contains(@markedTagsToRemoveBulk[index].tag.id) && _(allQuestionsIds).contains(question.question_id)
        @tempQuestionsList[i].tags.push @markedTagsToRemoveBulk[index].tag
    @markedTagsToRemoveBulk.splice(index,1)