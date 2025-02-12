class FormADVRelatedEntitiesController extends BaseController
  @register 'FormADVRelatedEntitiesController'

  @inject 'Restangular', '$state', '$stateParams', 'FormADVRelatedEntitiesResource', 'Utils'

  initialize: ->
    @firmCRD = @$stateParams.firmCRD
    
    @resource = @FormADVRelatedEntitiesResource.$new(id: @firmCRD)

    @Restangular.one('formadv_firms', @firmCRD).get().then (response) =>
      @formadv_firm = response
      
  clearGrouping: (grid,column)=>
    grid.api.grouping.clearGrouping()
      


