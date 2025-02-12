class FirmProfileEntitiesController extends BaseController
  @register 'FirmProfileEntitiesController'

  @inject '$stateParams', '$scope', 'Utils', 'FirmDataservice', 'ModalFactory', 'statusLabel','angularEnabled'

  initialize: ->
    @is_manager = @Utils.isManager()
    @firmId = @$stateParams.firmId

    @$scope.getFirm().then (firm) =>
      @firm = firm

    @getRelatedFunds()


  getRelatedFunds: ->

    @FirmDataservice.getRelatedEntities(@firmId).then (response) =>
      @related_entities = response


  addProduct: =>
    @ModalFactory.invokeModal 'manage_fund',
      resolve:
        entity_id : => @firm.id
      success: (fund) =>
        if fund
          @related_entities.push fund
