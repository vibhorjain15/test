class FormADVFundSnapshotController extends BaseController
  @register 'FormADVFundSnapshotController'

  @inject 'Restangular', '$state', '$stateParams' , 'FormADVServiceProvidersResource', 'Utils', '$window'

  initialize: ->
    @id = @$stateParams.firmCRD
    @sequence_id = @$stateParams.sequence_id
    @defaultColorScheme = @Utils.getFirmColorScheme()
    
    params =
      id: @id
      sequence_id: @sequence_id

    @Restangular.all('formadv_funds').customGET('', params).then (response) =>
      @fund = response
      @columns_asset = []
      @columns_asset.push ['Related Parties (%)', @fund.owner_related]
      @columns_asset.push ['Fund of Funds (%)', @fund.owner_fof]
      @columns_asset.push ['Non-us Persons(%)', @fund.owner_non_us]
      @columns_asset.push ['Others (%)', @fund.owner_other]

      @advOwnershipBreakdownConfig.data.columns = @columns_asset

    @service_providers_resource = @FormADVServiceProvidersResource.$new(params)

    @advOwnershipBreakdownConfig =
      data:
        columns: []
        type: 'donut'
        empty:
          label:
            text: 'Loading...'
      donut:
        title: ''
        
      color: pattern: @defaultColorScheme

  goBack: =>
    @$window.history.back()

  clearGrouping: (grid,column)=>
    grid.api.grouping.clearGrouping()