class ManageDDRuleController extends ModalController
  @register 'ManageDDRuleController'

  @inject 'rule', 'template', 'questions', 'operators', 'Restangular', '$timeout', '$uibModalInstance', 'TemplatesDataService', 'BaseDataService', 'toaster', '$scope', 'ratingScaleDefinition', 'naValue', 'associatedRatingMapping','ratingConstants'

  initialize: ->
    @boolean_value_options = [
      {label: 'Yes', value: true},
      {label: 'No', value: false}
    ]
    @defaultVersion = 0
    
    @edit_mode = false

    if (@rule)
      @rule_params = angular.copy(@rule)
      @edit_mode = true
    else
      @rule_params = {}

    if @associatedRatingMapping and @associatedRatingMapping.rating_scale_mode == @ratingConstants.ScoreBand
      @ratingScaleDefinition = null
      @naValue = {}
      @Restangular.all('rating_scales').one('GetSectionRatingScales',@template.templateInfo.id).doGET().then (response)=>
        @sectionRatingMapping = response
        @questionChanged() if @edit_mode

  initNewRule: () =>
    @edit_mode = false
    @rule_params = {}
    @rule_form.$setPristine()
    @rule_form.$setUntouched()

  questionChanged: =>
    if @associatedRatingMapping and @associatedRatingMapping.rating_scale_mode == @ratingConstants.ScoreBand and @sectionRatingMapping
      @selectedRatingId = @sectionRatingMapping[@rule_params.questionObj.sectionID]
      @getRatingScaleDefinition()

  getRatingScaleDefinition: =>
    @loading_rating_scale = true
    @Restangular.one('v2/rating_scales',@selectedRatingId).one('versions',@defaultVersion).getList('rating_scale_definitions').then (rating_scale) =>
      @ratingScaleDefinition = rating_scale
      noValueIndex = _(@ratingScaleDefinition).findIndex (scale)=>
        parseInt(scale.value) == @ratingConstants.naValue
      
      if noValueIndex > -1
        @naValue = @ratingScaleDefinition[noValueIndex]
        @ratingScaleDefinition.splice(noValueIndex,1)
      @loading_rating_scale = false
    ,(error)=>
      @loading_rating_scale = false

  conditionChanged: (rule) =>
    rule.value = null
    rule.operator_id = null
    rule.isLoading = true
    questionObj = _.findWhere(@questions, {id: rule.question_id})
    rule.questionObj = questionObj
    @questionChanged()
    if rule.questionObj
      temp_responseType = angular.copy(rule.questionObj.responseType)
      rule.questionObj.responseType = null
      @$timeout (=>
        rule.questionObj.responseType = temp_responseType
        rule.isLoading = false

        if rule.questionObj.responseType in ['Dropdown', 'CheckBox']
          @getOptions(rule.questionObj.id).then (response) =>
            rule.options = _(response).map (option)=>
              {
                id: option.dropdown_option_id,
                value: option.dropdown_option_text
              }
      ), 300
    else
      rule.isLoading = false

  getOptions: (questionId) ->
    @Restangular.one('questions', questionId).all('options').getList()


  save: (addAnotherRule) ->
    return unless @rule_form.$valid

    if addAnotherRule
      @savingAnother = true
    else
      @saving = true

    @rule_params.question_id = @rule_params.questionObj.id
    @rule_params.section_id = @rule_params.questionObj.sectionID
    @rule_params.value = moment(@rule_params.value).format('MM-DD-YYYY') if @rule_params.questionObj.responseType == 'Date'
    rule_copy = angular.copy(@rule_params)
    rule_copy.template_id = @template.templateInfo.id
    rule_copy.version = @template.templateInfo.version
    delete rule_copy.questionObj
    delete rule_copy.hoverState
    delete rule_copy.isLoading
    delete rule_copy.editMode
    delete rule_copy.options
    if @edit_mode
      @Restangular.one('score_rules', rule_copy.id).customPUT(rule_copy)
      .finally => @allSaveLoaderStop()
      .then (response) =>
        _(@rule).extend response
        if addAnotherRule
          @$scope.$parent.updateRuleFromModal(@rule)
          @initNewRule()
        else
          @close(@rule)
        @toaster.pop 'success', '', 'Rule successfully updated'
      , (error) =>
        @toaster.pop 'error', '', 'Something went wrong. Please try again.'
        avoid_error_logging_statuses = @BaseDataService.getAvoidErrorLoggingStatusList()
        if !(error.status in avoid_error_logging_statuses)
          @Utils.logError('Updating dd score failed', error)
    else
      @Restangular.one('score_rules').customPOST(rule_copy)
      .finally => @allSaveLoaderStop()
      .then (response) =>
        @toaster.pop 'success', '', 'Rule successfully added'
        if addAnotherRule
          @$scope.$parent.addNewRuleFromModal(response)
          @initNewRule()
        else
          @close(response)
      , (error) =>
        @toaster.pop 'error', '', 'Something went wrong. Please try again.'
        avoid_error_logging_statuses = @BaseDataService.getAvoidErrorLoggingStatusList()
        if !(error.status in avoid_error_logging_statuses)
          @Utils.logError('Adding dd score failed', error)

  allSaveLoaderStop: () =>
    @saving = false
    @savingAnother = false

  addAnotherRule: =>
    @rule_form.$setSubmitted true
    @save true

  cancel: () ->
    @$uibModalInstance.dismiss @rule