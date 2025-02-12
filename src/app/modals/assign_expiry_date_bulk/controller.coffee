class AssignExpiryDateBulkController extends ModalController
  @register 'AssignExpiryDateBulkController'

  @inject 'Restangular', 'SweetAlert', '$timeout', 'Utils', '$q', '$uibModalInstance', 'BaseDataService', 'toaster', '$scope', 'questionsList'

  initialize: ->
    @tempQuestionsList = angular.copy @questionsList
    @loadingData = false
    @markedDatesToRemoveWIthQuestions = []
    @minDate = new Date()
    @hideRemoveAllTagsOption = @checkIfEmpty()

  markRemoveDateFromCurrentQuestion:(question) =>
    @markedDatesToRemoveWIthQuestions.push question
    question.expiry_date = ''

  checkIfEmpty: ()->
    datesList = []
    _(@tempQuestionsList).forEach (question) =>
        if question.hasOwnProperty('expiry_date') && question.expiry_date
            datesList.push question.expiry_date
    if datesList.length > 0
      return false
    else
      return true

  removeExpiryDate: (question) =>
    params = 
      field: 'expiry_date'
      request_type: 'remove'
      ids: [question.response_id]
      values:question.expiry_date
    @Restangular.all('service/dvapi_service/qabank_bulk_update').post({filters:params}).then (response) =>

  removeAllExpiryDate: () =>
    @SweetAlert.confirm({
      title: 'Are you sure you want to remove all the expiry dates?'
      confirmButtonText: 'Yes'
      focusCancel: true
    }).then (isConfirm) =>
        if isConfirm.value and isConfirm.value == true
          @loadingData = true
          params = 
            field: 'expiry_date'
            request_type: 'remove_all'
            ids: _(@tempQuestionsList).pluck('response_id')
            values: null
          @Restangular.all('service/dvapi_service/qabank_bulk_update').post({filters:params}).then (response) =>
            @close()
            @loadingData = false
          ,(error) =>
            @loadingData = false

  addexpiryDate: (question) =>
    if question.hasOwnProperty('temp_expiryDate') && question.temp_expiryDate
      params = 
        field: 'expiry_date'
        request_type: 'add'
        ids: [question.response_id]
        values: @Utils.getToDateTimeFormatted(question.temp_expiryDate)
      @Restangular.all('service/dvapi_service/qabank_bulk_update').post({filters:params}).then (response) =>


  addexpiryDateBulk: () =>
    if @expiryDate
      params = 
        field: 'expiry_date'
        request_type: 'add'
        ids: _(@tempQuestionsList).pluck('response_id')
        values: @Utils.getToDateTimeFormatted(@expiryDate)
      @Restangular.all('service/dvapi_service/qabank_bulk_update').post({filters:params}).then (response) =>

  updateDatesBulkData: () ->
    @loadingData = true
    promise = []
    for question in @markedDatesToRemoveWIthQuestions
      promise.push @removeExpiryDate(question)
    if @expiryDate
      promise.push @addexpiryDateBulk()
    else
      for question in @tempQuestionsList
        promise.push @addexpiryDate(question)
    @$q.all(promise).then =>
      @loadingData = false
      @close()
    ,(error) =>
      @loadingData = false
      @cancel()
    .finally ->
      @loadingData = false
      @cancel()


  