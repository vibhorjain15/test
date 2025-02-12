class DiligenceTemplateScoringController extends BaseController

  @register 'DiligenceTemplateScoringController'

  @inject '$stateParams', 'Utils', '$scope', '$state', 'Restangular', 'BaseDataService', '$timeout', 'SweetAlert',
    'toaster', 'TemplatesDataService', 'ModalFactory', '$q','ratingConstants','angularTemplateEnabled'

  initialize: ->
    @$scope.getTemplate().then (template) =>
      @template = template
      @id = @template.templateInfo.id
      @getQuestions()

    @rule_forms = {}
    @defaultVersion = 0

    @boolean_value_options = [
      {label: 'Yes', value: true},
      {label: 'No', value: false}
    ]

    @$scope.addNewRuleFromModal = (result) =>
      @rules.push(@formRuleObj(result))

    @$scope.updateRuleFromModal = (result) =>
      idx = _.findIndex(@rules, (rule) ->
        rule.id == result.id
      )
      @rules[idx] = @formRuleObj(result)

  getOperatorsList: () =>
    @BaseDataService.getOperators().then (response) =>
      @operators = response
      @getRuleData()

  getQuestions: () =>
    @TemplatesDataService.getCustomQuestions({template_id: @id}).then (response) =>
      response_types_to_allow = ['Boolean', 'BooleanPlus', 'NoPlus', 'Numeric', 'Integer', 'Percentage', 'Date', 'Text', 'TextMultiLine', 'TextEmail', 'TextPhone', 'Dropdown', 'CheckBox']

      responseTypesFiltered = _(response).filter (question) ->
        question.responseType in response_types_to_allow

      @questions = responseTypesFiltered
      @getOperatorsList()

  getRuleData: () =>
    @Restangular.all('score_rules').customGET('', {template_id: @id, version: @template.templateInfo.version}).then (response) =>
      @rules = response
      if @rules.length
        _(@rules).each (rule) =>
          rule = @formRuleObj(rule)
      @getRatingMapping()

  getRatingMapping: =>
    @loadingRatingScales = true
    @Restangular.one('templates',@template.templateInfo.id).one('versions',@template.templateInfo.version).getList('TemplateRatingSchemeMappings').then (response)=>
      if response.length > 0
        @associatedRatingMapping = response[0]
        promises = []
        if @associatedRatingMapping.rating_scale_mode == @ratingConstants.ScoreBand
          promises.push @Restangular.all('rating_scales').one('GetSectionRatingScales',@template.templateInfo.id).doGET().then (response)=>
            @sectionRatingMapping = response

        promises.push @Restangular.one('v2/rating_scales',@associatedRatingMapping.rating_scale_id).one('versions',@associatedRatingMapping.rating_scale_version).getList('rating_scale_definitions').then (rating_scale) =>
          @ratingScaleDefinition = rating_scale
          noValueIndex = _(@ratingScaleDefinition).findIndex (scale)=>
            parseInt(scale.value) == @ratingConstants.naValue

          if noValueIndex > -1
            @naValue = @ratingScaleDefinition[noValueIndex]
            @ratingScaleDefinition.splice(noValueIndex,1)

        @$q.all(promises).then =>
          _(@rules).each (rule)=>
            @getScaleforRule(rule)
          @loadingRatingScales = false
      else
        @associatedRatingMapping = null
        @loadingRatingScales = false
    ,(error)=>
      @loadingRatingScales = false

  getScaleforRule: (rule)=>
    if @associatedRatingMapping and @associatedRatingMapping.rating_scale_mode == @ratingConstants.ScoreBand
      ratingScaleId = @sectionRatingMapping[rule.section_id]
      @Restangular.one('v2/rating_scales',ratingScaleId).one('versions',@defaultVersion).getList('rating_scale_definitions').then (rating_scale) =>
        rule.ratingScaleDefinition = rating_scale
        noValueIndex = _(rule.ratingScaleDefinition).findIndex (scale)=>
          parseInt(scale.value) == @ratingConstants.naValue

        if noValueIndex > -1
          rule.naValue = rule.ratingScaleDefinition[noValueIndex]
          rule.ratingScaleDefinition.splice(noValueIndex,1)
    else
      rule.naValue = @naValue
      rule.ratingScaleDefinition = @ratingScaleDefinition

  formRuleObj: (rule) =>
    questionObj = _.findWhere(@questions, {id: rule.question_id})
    rule.questionObj = questionObj
    operatorObj = _.findWhere(@operators, {value: rule.operator_id})
    rule.operatorText = operatorObj.display_label
    if questionObj.responseType in ['Boolean', 'BooleanPlus', 'NoPlus']
      rule.value = rule.value == 'true'
    else if questionObj.responseType in ['Numeric', 'Integer', 'Percentage']
      rule.value = Number(rule.value)
    else if questionObj.responseType in ['Date']
      rule.value = new Date(rule.value)
    else if questionObj.responseType in ['Dropdown', 'CheckBox']
      rule.value = Number(rule.value)
      @getOptions(rule.questionObj.id).then (response) =>
        rule.options = _(response).map (option)=>
          {
            id: option.dropdown_option_id,
            value: option.dropdown_option_text
          }
        optionObj = _.findWhere(rule.options, {id: rule.value})
        rule.optionText = optionObj.value
    return rule

  getOptions: (questionId) ->
    @Restangular.one('questions', questionId).all('options').getList()

  addNewRule: =>
    @ModalFactory.invokeModal 'manage_dd_rule',
      resolve:
        rule: => undefined
        template: => @template
        questions: => @questions
        operators: => @operators
        ratingScaleDefinition: => @ratingScaleDefinition
        naValue: => @naValue
        associatedRatingMapping: => @associatedRatingMapping
      success: (result) =>
        rule = @formRuleObj(result)
        @getScaleforRule(rule)
        @rules.push(rule)
      scope: @$scope

  editRule: (rule) =>
    @ModalFactory.invokeModal 'manage_dd_rule',
      resolve:
        rule: => rule
        template: => @template
        questions: => @questions
        operators: => @operators
        ratingScaleDefinition: => @ratingScaleDefinition
        naValue: => @naValue
        associatedRatingMapping: => @associatedRatingMapping
      success: (result) =>
        rule = @formRuleObj(result)
      scope: @$scope

  deleteRule: (rule, idx) =>
    @Restangular.one('score_rules', rule.id).remove().then =>
      @toaster.pop 'success', '', 'Rule successfully deleted'
      @rules.splice(idx, 1)
    .finally => swal.close()

  removeRule: (rule, idx) =>
    @SweetAlert.confirm({
      title: "Are you sure you want to delete this rule?"
      confirmButtonText: 'Delete'
      showLoaderOnConfirm: true
      preConfirm: =>
        @deleteRule(rule, idx)
    })


