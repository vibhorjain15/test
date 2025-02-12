class PortfolioController extends BaseController

  @register 'PortfolioController'

  @inject 'Restangular', 'Utils', '$q', '$window', 'angularEnabled'

  initialize: ->
    @promises = []
    @isManager = @Utils.isManager()

    @typeDonutChartConfig =
      type: 'donut_chart'
      title: 'Fund Types'
      options:
        data: []

    @auditorDonutChartConfig =
      type: 'donut_chart'
      title: 'Auditors'
      options:
        data: []

    @pbDonutChartConfig =
      type: 'donut_chart'
      title: 'Prime Broker'
      options:
        data: []

    @custodianDonutChartConfig =
      type: 'donut_chart'
      title: 'Custodian'
      options:
        data: []

     @adminDonutChartConfig =
      type: 'donut_chart'
      title: 'Administrator'
      options:
        data: []

    @manager_focus_map =
      type: 'mapael'
      title: 'Manager Location'
      options:
        data: []

    audit_promise = @Restangular.all('formadv_analytics/service_provider').getList(Type: 'Auditor').then ((response) =>
      @auditors = response

      auditor_obj = []
      _(@auditors).each (item) =>
        auditor_obj.push { "label" : item.label, "value": item.value }

      @auditorDonutChartConfig.options.data = auditor_obj
    )
    @promises.push audit_promise

    type_promise = @Restangular.all('formadv_analytics/strategy').getList().then ((response) =>
      @fund_types = response

      obj = []
      _(@fund_types).each (item) =>
        obj.push { "label" : item.label, "value": item.value }

      @typeDonutChartConfig.options.data = obj
    )
    @promises.push type_promise

    pb_promise = @Restangular.all('formadv_analytics/service_provider').getList(Type: 'PrimeBroker').then ((response) =>
      @pbs = response

      pb_obj = []
      _(@pbs).each (item) =>
        pb_obj.push { "label" : item.label, "value": item.value }

      @pbDonutChartConfig.options.data = pb_obj
    )
    @promises.push pb_promise


    admin_promise = @Restangular.all('formadv_analytics/service_provider').getList(Type: 'Administrator').then ((response) =>
      @admins = response

      admin_obj = []
      _(@admins).each (item) =>
        admin_obj.push { "label" : item.label, "value": item.value }

      @adminDonutChartConfig.options.data = admin_obj
    )

    @promises.push admin_promise

    custody_promise = @Restangular.all('formadv_analytics/service_provider').getList(Type: 'Custodian').then ((response) =>
      @custodians = response

      custodian_obj = []
      _(@custodians).each (item) =>
        custodian_obj.push { "label" : item.label, "value": item.value }

      @custodianDonutChartConfig.options.data = custodian_obj
    )

    @promises.push custody_promise

    geo_promise = @Restangular.all('formadv_analytics/country').getList().then ((response) =>
      @geographies = response

      geography_obj = []
      _(@geographies).each (item) =>
        if item.value == 1
          geography_obj.push { "country" : item.label, "tooltip": item.value + ' manager'}
        else
          geography_obj.push { "country" : item.label, "tooltip": item.value + ' managers'}
      @manager_focus_map.options.data = geography_obj
    )

    @promises.push geo_promise

    @$q.all(@promises).then =>
      @dataIsLoaded = true

      @dashboardConfig =
        rows: [
          {
            columns: [
              {colSpan: 2, widgets: [@manager_focus_map]}
              {colSpan: 1, widgets: [@typeDonutChartConfig]}
            ]
          },
          {
            columns: [
              {colSpan: 1, widgets: [@auditorDonutChartConfig]}
              {colSpan: 1, widgets: [@pbDonutChartConfig]}
            ]
          },
          {
            columns: [
              {colSpan: 1, widgets: [@adminDonutChartConfig]}
              {colSpan: 1, widgets: [@custodianDonutChartConfig]}
            ]
          }
        ]
    if @isManager
      @$window.history.back()
      return
