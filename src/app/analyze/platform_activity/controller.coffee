class PlatformActivityController extends BaseController

  @register 'PlatformActivityController'

  @inject '$http', 'baseUrl', 'Utils'

  initialize: ->
    dd_trend_bar_chart =
      title: 'Due Diligence Trend'
      type: 'bar_chart'
      options:
        data: [
          {new_dd: 7, ongoing: 1, event: 2}
          {new_dd: 2, ongoing: 4, event: 1}
          {new_dd: 7, ongoing: 3, event: 2}
          {new_dd: 5, ongoing: 2, event: 3}
          {new_dd: 7, ongoing: 3, event: 2}
          {new_dd: 1, ongoing: 2, event: 4}
        ]
        stacked: true
        valueProperty: ['new_dd', 'ongoing', 'event']
        labels: ['New', 'On-going', 'Event']
        displayChartLabels: true

    dd_funnel_bar_chart =
      title: 'Due Diligence Funnel'
      type: 'bar_chart'
      options:
        data: [
          {invites: 7, diligence: 1, approved: 2}
          {invites: 2, diligence: 4, approved: 1}
          {invites: 7, diligence: 3, approved: 2}
          {invites: 5, diligence: 2, approved: 3}
          {invites: 7, diligence: 3, approved: 2}
          {invites: 1, diligence: 2, approved: 4}
        ]
        stacked: true
        valueProperty: ['invites', 'diligence', 'approved']
        labels: ['Invites', 'Diligence', 'Approved']
        displayChartLabels: true

    acceptance_rate_donut =
      title: 'Acceptance Rate'
      type: 'donut_chart'
      options: {}

    if @Utils.isInvestor()
      acceptance_rate_donut.options.data = [
        {label: 'PE', value: 9}
        {label: 'Long-only', value: 4}
        {label: 'Hedge Funds', value: 4}
      ]
    else
      acceptance_rate_donut.options.data = [
        {label: 'Family Office', value: 9}
        {label: 'E&F', value: 4}
        {label: 'Pensions', value: 4}
      ]

    @dashboardConfig =
      rows: [
        columns: [
          {
            widgets: [dd_trend_bar_chart]
          }
          {
            widgets: [dd_funnel_bar_chart]
          }
          {
            widgets: [acceptance_rate_donut]
          }
        ]
      ]
