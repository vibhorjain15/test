class ProjectNotApprovalReasonsController extends BaseController

  @register 'ProjectNotApprovalReasonsController'

  @inject '$stateParams', '$scope', 'Restangular', 'toaster', '$state', '$q', 'Utils', 'angularEnabled'

  initialize: ->
    @promises = []
    @diligenceId = @$stateParams.diligenceId
    @params = type: 'NotApproved'

    @$scope.getDueDiligence().then @checkForStatusValidity

    @Restangular
    .one('notes')
    .get(
      entity_type : 'DueDiligence'
      entity_id : @diligenceId
      type : 'NotApproved'
    ).then (response) =>
      if response.length
        @initReadOnlyMode response
      else
        @initReadWriteMode()

  initReadOnlyMode: (notes) ->
    @dataIsLoaded = true
    @note = notes[0]
    @reasons = @note.text.split(',')

  initReadWriteMode: ->
    promise = @Restangular.all('reasons').getList(type: 'notapprove_investments').then((response) =>
      @investment_reasons = response
    )

    @promises.push promise

    promise = @Restangular.all('reasons').getList(type: 'notapprove_business').then((response) =>
      @business_reasons = response
    )

    @promises.push promise

    @$q.all(@promises).then => @dataIsLoaded = true

  checkForStatusValidity: (diligence) =>
    @diligence = diligence

    if @diligence.status isnt 'NotApproved'
      @$state.go '^.questionnaire'

  submit: ->
    investment_reasons = _(@investment_reasons).where(selected: true)
    business_reasons = _(@business_reasons).where(selected: true)
    reasons = _(investment_reasons).concat(business_reasons)

    @params.text = _(reasons).pluck('value').join(',')
    @params.entity_id = @diligenceId
    @params.entity_type = 'DueDiligence'
    @params.type = 'NotApproved'
    @saving = true

    @Restangular.all('notes').post(@params).then =>
      message = 'Your feedback has been recorded!'

      @saving = false
      @toaster.pop 'success', '', message, 5000
      @$state.go 'app.diligence.projects.activity', type: 'closed'
