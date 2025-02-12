class ManageThresholdController extends ModalController
  @register 'ManageThresholdController'

  @inject 'threshold', 'questions', 'operators', 'types', 'Restangular', '$timeout', '$uibModalInstance', 'BaseDataService', 'toaster', '$scope'

  initialize: ->
    @boolean_value_options = [
      {label: 'Yes', value: true},
      {label: 'No', value: false}
    ]

    @edit_mode = false

    if (@threshold)
      @threshold_params = angular.copy(@threshold)
      @edit_mode = true
    else
      @initNewThreshold()

  initNewThreshold: () =>
    @edit_mode = false
    @threshold_params = {
      type: @types[1].id
      operator_id: 'ac'
    }

  initThresholdForm: () =>
    @threshold_form.$setPristine()
    @threshold_form.$setUntouched()

  conditionChanged: (threshold) =>
    conditionChanged: (threshold, idx) =>
    threshold.threshold_value = null
    threshold.operator_id = null
    threshold.isLoading = true

    if threshold.question_id || (threshold.type in [0, 1])
      if threshold.question_id
        questionObj = _.findWhere(@questions, {id: threshold.question_id})
        threshold.questionObj = questionObj
        temp_response_type = angular.copy(threshold.questionObj.response_type)
        threshold.questionObj.response_type = null
        
        @$timeout (=>
          threshold.questionObj.response_type = temp_response_type
          threshold.isLoading = false
        ), 500

      if (threshold.type in [0, 1]) && !threshold.operator_id
        if threshold.type == 1
          ###For Change thresholds, default condition to be Any Change###
          threshold.operator_id = 'ac'
        else if threshold.type == 0
          ###For Absolute threshold, default condition to be Equals To###
          threshold.operator_id = 'eq'
    else
      threshold.isLoading = false

  getOptions: (questionId) ->
    @Restangular.one('questions', questionId).all('options').getList()

  save: (addAnotherThreshold) ->
    return unless @threshold_form.$valid

    if addAnotherThreshold
      @savingAnother = true
    else
      @saving = true

    @threshold_params.question_id = @threshold_params.questionObj.id
    threshold_copy = _(@threshold_params).omit(['questionObj', 'hoverState', 'isLoading', 'editMode'])
    
    if @edit_mode
      @Restangular.one('formadv_thresholds', threshold_copy.id).customPUT(threshold_copy)
      .finally => @allSaveLoaderStop()
      .then (response) =>
        _(@threshold).extend response
        if addAnotherThreshold
          @$scope.$parent.updateThresholdFromModal(@threshold)
          @initNewThreshold()
          @initThresholdForm()
        else
          @close(@threshold)
        @toaster.pop 'success', '', 'Threshold successfully updated'
      , (error) =>
        @toaster.pop 'error', '', 'Something went wrong. Please try again.'
        avoid_error_logging_statuses = @BaseDataService.getAvoidErrorLoggingStatusList()
        if !(error.status in avoid_error_logging_statuses)
          @Utils.logError('Updating threshold failed', error)
    else
      @Restangular.one('formadv_thresholds').customPOST(threshold_copy)
      .finally => @allSaveLoaderStop()
      .then (response) =>
        @toaster.pop 'success', '', 'Threshold successfully added'
        if addAnotherThreshold
          @$scope.$parent.addNewThresholdFromModal(response)
          @initNewThreshold()
          @initThresholdForm()
        else
          @close(response)
      , (error) =>
        @toaster.pop 'error', '', 'Something went wrong. Please try again.'
        avoid_error_logging_statuses = @BaseDataService.getAvoidErrorLoggingStatusList()
        if !(error.status in avoid_error_logging_statuses)
          @Utils.logError('Adding threshold failed', error)

  allSaveLoaderStop: () =>
    @saving = false
    @savingAnother = false

  addAnotherThreshold: =>
    @save true

  cancel: () ->
    @$uibModalInstance.dismiss @threshold