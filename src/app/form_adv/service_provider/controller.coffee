class FormADVServiceProviderController extends BaseController
  @register 'FormADVServiceProviderController'

  @inject 'Restangular', '$state', '$stateParams', 'Utils', '$window'

  initialize: ->
    @unique_name = @$stateParams.unique_name
    @type = @$stateParams.type
    @defaultColorScheme = @Utils.getFirmColorScheme()
    
    params =
      name: @unique_name
      type: @type

    @Restangular.all('formadv_service_providers').customGET('',params).then (response) =>
      @provider = response
    

    @advClientBreakdownConfig =
      data:
        columns: []
        type: 'donut'
        empty:
          label:
            text: 'Loading...'
      donut:
        title: ''
        
      color: pattern: @defaultColorScheme

    @Restangular.all('formadv_service_providers/client_breakdown').customGET('',params).then (response) =>
      @client_total = response.length

      unless @client_total
        @advClientBreakdownConfig.data.empty.label.text = 'No data available'
        return

      @client = response
      @columns_status = []

      _(@client).each (item) =>
        current_obj = []
        current_obj.push item.label
        current_obj.push item.value
        @columns_status.push current_obj

      # Initialising the colums data with the response from json
      @advClientBreakdownConfig.data.columns = @columns_status
    

    @Restangular.all('formadv_service_providers/top_clients').customGET('',params).then (response) =>
      @clients = response

      sum_of_gross_assets = 0
      _(@clients).each (client, i) =>
        sum_of_gross_assets += client.value

      @sum_of_gross_assets = sum_of_gross_assets


    @Restangular.all('formadv_service_providers/focus_areas').customGET('',{name: @unique_name}).then (response) =>
      @roles = response

  goBack: () =>
    @$window.history.back()

  goBack: =>
    @$window.history.back()
        
    