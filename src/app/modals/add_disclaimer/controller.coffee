class AddDisclaimerController extends ModalController
  @register 'AddDisclaimerController'

  @inject '$uibModalInstance', 'toaster', 'Restangular', 'disclaimer', '$state', '$timeout'

  initialize: ->
    @disclaimer_id = null
    @disclaimers = []
    @getDisclaimers()
    if @disclaimer.disclaimer_id
      @disclaimer_id = @disclaimer.disclaimer_id

  getDisclaimers: ->
    @Restangular.all('disclaimers').getList().then (response) =>
      @disclaimers = response
      if @disclaimer_id
        assignedDisclaimer = _(@disclaimers).pluck 'id'
        # make disclaimer_id null if it doesn't exist in active disclaimers
        if assignedDisclaimer.indexOf(@disclaimer_id) == -1
          @disclaimer_id = null

  redirectToDisclaimerDefinitions: =>
    @$uibModalInstance.close()
    @$timeout =>
      @$state.go 'app.firm.settings.disclaimers'



  save: ->
    if @add_disclaimer_form.$valid and @disclaimers.length and @disclaimer_id
      @saving = true
      params =
        'entity_type': @disclaimer.entity_type
        'entity_id': @disclaimer.entity_id
        'disclaimer_id': @disclaimer_id

      @Restangular.all('disclaimerassignments').post(params).then((response) =>
        @toaster.pop 'success', 'Disclaimer successfully attached!'
        @$uibModalInstance.close params
        @saving = false
      ).finally =>
          @saving = false
