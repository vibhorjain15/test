class FundProfileVehiclesController extends BaseController
  @register 'FundProfileVehiclesController'

  @inject '$stateParams', '$scope', 'Utils', 'FundDataservice', 'ModalFactory', '$window', 'keywordConstants', 'statusLabel','angularEnabled'

  initialize: ->
    @fundId = Number(@$stateParams.fundId)
    @parentFirmId = @$stateParams.firmId
    @is_manager = @Utils.isManager()
    @isFreeSubscription = @Utils.isFreeSubscription()
    @entity_type = @Utils.getDisplayEntityType(@keywordConstants.Product)

    @$scope.getFund().then (fund) =>
      @fund = fund

    @getRelatedVehicles()

  addNewVehicleModal: ->
    @ModalFactory.invokeModal 'manage_vehicle',
      resolve:
        vehicle: =>
          fund_id: Number(@fundId)
        edit_mode: false
      success: (response) =>
        if response.fund_id == @fundId
          @vehicles.push response
      dismiss: =>
        @getRelatedVehicles()

  goBack: =>
    @$window.history.back()

  getRelatedVehicles: ->
    params =
      fundId: @fundId
      firmId: @parentFirmId
      pageUrl: "app/firms/#{@parentFirmId}/funds/#{@fundId}/vehicles"
    @FundDataservice.getRelatedVehicles(params).then (response) =>
      @vehicles = response
