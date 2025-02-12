class FormADVSnapshotController extends BaseController
  @register 'FormADVSnapshotController'

  @inject 'Restangular', '$state', '$stateParams' , 'FormADVRegulatorsResource', 'SweetAlert', 'toaster', 'FormADVServiceProvidersResource', 'Utils'

  initialize: ->
    @firmCRD = @$stateParams.firmCRD
    @colorScheme = @Utils.getFirmColorScheme()

    @Restangular.one('formadv_firms', @firmCRD).get().then (response) =>
      @formadv_firm = response
      @printOptions = pageTitle: "DiligenceVault ADV Summary - #{@formadv_firm.businessName}"

    params =
      id: @firmCRD
    
    @regulators_resource = @FormADVRegulatorsResource.$new(params)

    @service_providers_resource = @FormADVServiceProvidersResource.$new(params)

    @advAssetBreakdownConfig =
      data:
        columns: []
        type: 'donut'
        empty:
          label:
            text: 'Loading...'
      donut:
        title: ''
        
      color: pattern: @colorScheme or ['#008C97','#C0CA33']

    @Restangular.one('formadv_firms', @firmCRD).all('profile').customGET().then (response) =>
      @profile = response

      @columns_asset = []
      @columns_asset.push ['Discretionary AUM (%)', @profile.discretionary_aum]
      @columns_asset.push ['Non Discretionary AUM (%)', @profile.non_discretionary_aum]

      @advAssetBreakdownConfig.data.columns = @columns_asset

    @advClientBreakdownConfig =
      data:
        columns: []
        type: 'donut'
        empty:
          label:
            text: 'Loading...'
      donut:
        title: ''
      color: 
        pattern: @colorScheme or ['#073336', '#C0CA33', '#7FCCC1', '#008C97','ff6666']


    @Restangular.one('formadv_firms', @firmCRD).all('clients').customGET().then (response) =>
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

  toggleADVTracking: =>
    @toggling_ADV_tracking = true
    if @formadv_firm.is_tracking 
      params =
        firmCrd: @formadv_firm.id

      @Restangular.all('Firm_FirmCRD_Mappings').customDELETE(null, params)
      .then (response) =>
        @formadv_firm.is_tracking = false
        @toaster.pop 'success', '', "Tracking removed for CRD# #{@formadv_firm.id}"
      .finally =>
        @toggling_ADV_tracking = false
    else
      params =
        firmCrd: @formadv_firm.id
      
      @Restangular.all('Firm_FirmCRD_Mappings').post(params)
      .then (response) =>
        @formadv_firm.is_tracking = true
        @toaster.pop 'success', '', "Tracking added for CRD# #{@formadv_firm.id}"
      .finally =>
        @toggling_ADV_tracking = false

  goBack: =>
    if @formadv_firm.is_tracking
      @$state.go 'app.form_adv.regulatory_monitor.portfolio'
    else
      @$state.go 'app.form_adv.regulatory_monitor.explore'
  
  clearGrouping: (grid,column)=>
    grid.api.grouping.clearGrouping()