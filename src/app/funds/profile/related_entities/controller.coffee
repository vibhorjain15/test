class FundProfileEntitiesController extends BaseController
  @register 'FundProfileEntitiesController'

  @inject '$stateParams', '$scope', 'Utils', 'FundDataservice', 'statusLabel','angularEnabled'

  initialize: ->
    @fundId = @$stateParams.fundId
    @is_manager = @Utils.isManager()

    @$scope.getFund().then (fund) =>
      @fund = fund

    @getRelatedFunds()


  getRelatedFunds: ->

    @FundDataservice.getRelatedEntities(@fundId).then (response) =>
      @related_entities = response
