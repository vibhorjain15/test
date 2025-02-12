class AssignSMEBulkController extends ModalController
  @register 'AssignSMEBulkController'

  @inject 'Restangular', 'SweetAlert', '$q', '$timeout', '$uibModalInstance', 'BaseDataService', 'toaster', '$scope', 'questionsList'

  initialize: ->
    @tempQuestionsList = angular.copy @questionsList
    @loadingData = false
    @smeBulkIds = []
    @teamMembers = []
    @markedSmesToRemoveWIthQuestions = []
    @markedSmesToRemoveBulk = []
    @hideRemoveAllTagsOption = @checkIfEmpty()
    @BaseDataService.getTeamMembers().then (teamMembers) =>
        @teamMembers = _(teamMembers).map (teamMember) ->
            teamMember.fullname = _([teamMember.firstName, teamMember.lastName]).compact().join(' ')
            teamMember
        for question in @tempQuestionsList
          if question.hasOwnProperty('question_sme') && question.question_sme.length > 0
            question.smeIds = []
            for sme in question.question_sme
              for tempSme in @teamMembers
                if sme.id == tempSme.id
                  question.smeIds.push tempSme

  checkIfEmpty: ()->
    smesList = []
    _(@tempQuestionsList).forEach (question) =>
        if question.hasOwnProperty('question_sme') && question.question_sme.length > 0
          for sme in question.question_sme
            smesList.push sme
    if smesList.length > 0
      return false
    else
      return true
  
  markRemoveSMEFromCurrentQuestion:(sme,question,index) =>
    isMatched = false
    for sme_obj,i in @markedSmesToRemoveWIthQuestions
      if sme_obj.sme.id == sme.id 
        @markedSmesToRemoveWIthQuestions[i].question.push question
        isMatched = true
    if !isMatched
      smesParams = 
        sme: sme
        question: [question]
      @markedSmesToRemoveWIthQuestions.push smesParams
    question.question_sme.splice(index,1)
    question.smeIds.splice(index,1)

  markRemoveAllSMEsBulk:(sme) =>
    count = 0
    questionsList = []
    _(@tempQuestionsList).forEach (question) =>
      if question.hasOwnProperty('question_sme')
        i=0
        while i < question.question_sme.length
          if question.question_sme[i].id == sme.id
            count = count + 1
            questionsList.push question
            question.question_sme.splice(i,1)
            question.smeIds.splice(i,1)
            break;
          i++
    smesParams = 
      sme: sme
      count: count
      questions_list: questionsList
    @markedSmesToRemoveBulk.push smesParams

  removeSmeFromCurrentQuestion: (sme,question) =>
    id_list = []
    for question_data in question
      id_list_param = 
        question_id: question_data.question_id
        diligence_id: question_data.duediligence_id
      id_list.push id_list_param
    params = 
      field: 'sme'
      request_type: 'remove'
      ids: id_list
      values:[sme.id]
    @Restangular.all('service/dvapi_service/qabank_bulk_update').post({filters:params}).then (response) =>

  removeSmesForAllQuestionsBulk: (sme,questions_list) =>
    id_list = []
    for question in questions_list
      id_list_param = 
        question_id: question.question_id
        diligence_id: question.duediligence_id
      id_list.push id_list_param
    params = 
      field: 'sme'
      request_type: 'remove'
      ids: id_list
      values:[sme.id]
    @Restangular.all('service/dvapi_service/qabank_bulk_update').post({filters:params}).then (response) =>

  removeAllSme: () =>
    @SweetAlert.confirm({
      title: 'Are you sure you want to remove all the SME(s)?'
      confirmButtonText: 'Yes'
      focusCancel: true
    }).then (isConfirm) =>
        if isConfirm.value and isConfirm.value == true
          @loadingData = true
          id_list = []
          for question in @tempQuestionsList
            id_list_param = 
              question_id: question.question_id
              diligence_id: question.duediligence_id
            id_list.push id_list_param
          params = 
            field: 'sme'
            request_type: 'remove_all'
            ids: id_list
            values: []
          @Restangular.all('service/dvapi_service/qabank_bulk_update').post({filters:params}).then (response) =>
            @loadingData = false
            smeUpdationParamas = 
              smesRemovedBulk: []
              smesRemoved: []
              tempAssignedSmesBulk: []
              allQuestionsUpdated: @tempQuestionsList
              isRemovedAll: true
            @close(smeUpdationParamas)
          ,(error) =>
            @loadingData = false

  addSme: (question) =>
    if question.hasOwnProperty('smeIds') && question.smeIds.length > 0
      smesToBeAddedList = []
      if question.hasOwnProperty('question_sme')
        smesToBeAddedList = _(question.question_sme).pluck('id')
      else
        smesToBeAddedList = []
      indexesToBeRemoved = []
      for sme,index in question.smeIds
        if sme && smesToBeAddedList.indexOf(sme.id) != -1
          indexesToBeRemoved.push index
      for index in indexesToBeRemoved
        question.smeIds.splice(index,1)
      if question.smeIds.length > 0
        id_list_param = 
          question_id: question.question_id
          diligence_id: question.duediligence_id
        params = 
          field: 'sme'
          request_type: 'add'
          ids: [id_list_param]
          values: _(question.smeIds).pluck('id')
        @Restangular.all('service/dvapi_service/qabank_bulk_update').post({filters:params}).then (response) =>


  addSmeBulk: () =>
    if @smeBulkIds.length > 0
      id_list = []
      for question in @tempQuestionsList
        id_list_param = 
          question_id: question.question_id
          diligence_id: question.duediligence_id
        id_list.push id_list_param
      params = 
        field: 'sme'
        request_type: 'add'
        ids: id_list
        values: _(@smeBulkIds).pluck('id')
      @Restangular.all('service/dvapi_service/qabank_bulk_update').post({filters:params}).then (response) =>

  updateSmesBulkData: () ->
    @loadingData = true
    promise = []
    promise.push @addSmeBulk()
    for question in @tempQuestionsList
      promise.push @addSme(question)
    for data in @markedSmesToRemoveWIthQuestions
      promise.push @removeSmeFromCurrentQuestion(data.sme,data.question)
    for data in @markedSmesToRemoveBulk
      promise.push @removeSmesForAllQuestionsBulk(data.sme,data.questions_list)
    @$q.all(promise).then =>
      @loadingData = false
      smeUpdationParamas = 
        smesRemovedBulk: @markedSmesToRemoveBulk
        smesRemoved: @markedSmesToRemoveWIthQuestions
        tempAssignedSmesBulk: @smeBulkIds
        allQuestionsUpdated: @tempQuestionsList
        isRemovedAll: false
      @close(smeUpdationParamas)
    ,(error) =>
      @loadingData = false
      @cancel()
    .finally ->
      @loadingData = false
      @cancel()

  removeMarkedSmesToRemoveWIthQuestions: (index) =>
    for question,i in @questionsList
      for removedQuestion in @markedSmesToRemoveWIthQuestions[index].question
        if question.question_id == removedQuestion.question_id
          @tempQuestionsList[i].question_sme.push @markedSmesToRemoveWIthQuestions[index].sme
    @markedSmesToRemoveWIthQuestions.splice(index,1)

  removedMarkedSmesToRemoveBulk: (index) =>
    allQuestionsIds = _(@markedSmesToRemoveBulk[index].questions_list).pluck('question_id')
    for question,i in @questionsList
      ids = _(question.question_sme).pluck('id')
      ids_temp =  _(@tempQuestionsList[i].question_sme).pluck('id')
      if _(ids).contains(@markedSmesToRemoveBulk[index].sme.id) &&  !_(ids_temp).contains(@markedSmesToRemoveBulk[index].sme.id) && _(allQuestionsIds).contains(question.question_id)
        @tempQuestionsList[i].question_sme.push @markedSmesToRemoveBulk[index].sme
    @markedSmesToRemoveBulk.splice(index,1)

  