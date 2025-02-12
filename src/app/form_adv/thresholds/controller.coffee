class FormADVThresholdsController extends BaseController
  @register 'FormADVThresholdsController'

  @inject 'Restangular', 'materialThresholds', 'BaseDataService', 'toaster', '$state', '$timeout', 'SweetAlert', 'Utils', '$scope', 'ModalFactory', 'angularEnabled'

  initialize: ->
    @threshold_forms = {}

    @types = @materialThresholds.getThresholdTypes()

    @boolean_value_options = [
      {label: 'Yes', value: true},
      {label: 'No', value: false}
    ]

    @$scope.addNewThresholdFromModal = (result) =>
      @thresholds.push(@formThresholdObj(result))

    @$scope.updateThresholdFromModal = (result) =>
      idx = _.findIndex(@thresholds, (threshold) ->
        threshold.id == result.id
      )
      @thresholds[idx] = @formThresholdObj(result)

    @getQuestions()

  getOperatorsList: () =>
    @BaseDataService.getOperators().then (response) =>
      @operators = response
      @getThresholdData()

  getQuestions: () =>
    @Restangular.all('Formadv_Questions/alerts').getList().then (response) =>
      @questions = response
      @getOperatorsList()

  getThresholdData: () =>
    @Restangular.all('formadv_thresholds').getList().then (response) =>
      @thresholds = response

      if @thresholds.length
        _(@thresholds).each (threshold) =>
          threshold.editMode = false
          questionObj = _.findWhere(@questions, {id: threshold.question_id})
          if questionObj
            threshold.questionObj = questionObj
          operatorObj = _.findWhere(@operators, {value: threshold.operator_id})
          if operatorObj
            threshold.operatorText = operatorObj.display_label
          typeObj = _.findWhere(@types, {id: threshold.type})
          if typeObj
            threshold.typeText = typeObj.text
          if questionObj
            if questionObj.response_type in ['Boolean', 'BooleanPlus', 'NoPlus']
              threshold.threshold_value = threshold.threshold_value == 'true'
            if questionObj.response_type in ['Numeric', 'Integer', 'Percentage']
              threshold.threshold_value = Number(threshold.threshold_value)

        @groupThresholds()

  groupThresholds: () =>
    @grouped_thresholds = []

    @grouped_thresholds = _(@thresholds).groupBy((threshold) ->
      threshold.section_name
    )

    @grouped_thresholds = _(@grouped_thresholds).map((thresholds, section_name) ->
      {
        section_name: section_name
        thresholds: thresholds
      }
    )

  addNewThreshold: =>
    @ModalFactory.invokeModal 'manage_threshold',
      resolve:
        threshold: => undefined
        questions: => @questions
        operators: => @operators
        types: => @types
      success: (result) =>
        @thresholds.push(@formThresholdObj(result))
        @groupThresholds()
      scope: @$scope

  editThreshold: (threshold) =>
    @ModalFactory.invokeModal 'manage_threshold',
      resolve:
        threshold: => threshold
        questions: => @questions
        operators: => @operators
        types: => @types
      success: (result) =>
        result = @formThresholdObj(result)
        if threshold.id == result.id
          threshold = result
        else
          @thresholds.push(result)
        @groupThresholds()
      scope: @$scope

  deleteThreshold: (threshold) =>
    thresholdIndex = _(@thresholds).findIndex (thresholdItem) =>
      thresholdItem.id == threshold.id
    @Restangular.one('formadv_thresholds', threshold.id).remove().then =>
      @toaster.pop 'success', '', 'Threshold successfully deleted'
      @thresholds.splice(thresholdIndex, 1)
      @groupThresholds()
    .finally => swal.close()

  removeThreshold: (threshold) =>
    if threshold.id
      @SweetAlert.confirm({
        title: "Are you sure you want to remove this threshold?"
        showLoaderOnConfirm: true
        confirmButtonText: 'Remove'
        focusCancel: true
        preConfirm: =>
          @deleteThreshold(threshold)
      })
    else
      @thresholds.splice(idx, 1)

  formThresholdObj: (threshold) =>
    questionObj = _.findWhere(@questions, {id: threshold.question_id})
    threshold.questionObj = questionObj
    operatorObj = _.findWhere(@operators, {value: threshold.operator_id})
    threshold.operatorText = operatorObj.display_label
    typeObj = _.findWhere(@types, {id: threshold.type})
    threshold.typeText = typeObj.text
    if threshold.questionObj.response_type in ['Boolean', 'BooleanPlus', 'NoPlus']
      threshold.threshold_value = threshold.threshold_value == 'true'
    else if threshold.questionObj.response_type in ['Numeric', 'Integer', 'Percentage']
      threshold.threshold_value = Number(threshold.threshold_value)

    return threshold
