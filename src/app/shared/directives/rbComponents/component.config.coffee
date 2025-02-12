
angular.module('diligenceVault')
  .config((RbComponentFactoryProvider) ->
    RbComponentFactoryProvider.configure('line_break', {
      directive_name: 'rbLineBreak',
      customisable: false
      options:
        layout: '100'
    })
  )
  .config((RbComponentFactoryProvider) ->
    RbComponentFactoryProvider.configure('text', {
      customisable: true
      directive_name: 'rbText'
      options:
        content: 'Type to enter text content'
        layout: '100'
    })
  )
  .config((RbComponentFactoryProvider) ->
    RbComponentFactoryProvider.configure('notes', {
      customisable: true
      directive_name: 'rbNotes'
      options:
        content: 'Select from notes or write a custom one'
        layout: '100'
    })
  )
  .config((RbComponentFactoryProvider) ->
    RbComponentFactoryProvider.configure('aum_chart', {
      customisable: true
      directive_name: 'rbAumChart'
      options:
        type: 'bar'
        title: 'AUM Chart'
        color_one: null
        layout: '100'
    })
  )
  .config((RbComponentFactoryProvider) ->
    RbComponentFactoryProvider.configure('performance_chart', {
      customisable: true
      directive_name: 'rbPerformanceChart'
      options:
        type: 'bar'
        title: 'Performance Chart'
        color_one: null
        layout: '100'
    })
  )
  .config((RbComponentFactoryProvider) ->
    RbComponentFactoryProvider.configure('valuation_chart', {
      customisable: true
      directive_name: 'rbValuationChart'
      options:
        title: 'Valuation Chart'
        color_one: null
        color_two: null
        color_three: null
        layout: '100'
    })
  )
  .config((RbComponentFactoryProvider) ->
    RbComponentFactoryProvider.configure('fund_overview', {
      directive_name: 'rbFundOverview',
      customisable: true
      options:
        layout: '100'
        title: 'Fund Profile'
        templateId: null
        infoList: null
    })
  )
  .config((RbComponentFactoryProvider) ->
    RbComponentFactoryProvider.configure('firm_overview', {
      directive_name: 'rbFirmOverview',
      customisable: false
      options:
        layout: '100'
    })
  )
  .config((RbComponentFactoryProvider) ->
    RbComponentFactoryProvider.configure('liquidity_overview', {
      directive_name: 'rbLiquidityOverview',
      customisable: false
      options:
        layout: '100'
    })
  )
  .config((RbComponentFactoryProvider) ->
    RbComponentFactoryProvider.configure('timeline', {
      customisable: true
      directive_name: 'rbTimeline'
      options:
        title: 'Timeline'
        layout: '100'
    })
  )
  .config((RbComponentFactoryProvider) ->
    RbComponentFactoryProvider.configure('image_selector', {
      customisable: true
      directive_name: 'rbImageSelector'
      options:
        layout: '100'
        type: 'image'
    })
  )
  .config((RbComponentFactoryProvider) ->
    RbComponentFactoryProvider.configure('dd_rating', {
      customisable: true
      directive_name: 'rbDDRating'
      options:
        layout: '100'
    })
  )
  .config((RbComponentFactoryProvider) ->
    RbComponentFactoryProvider.configure('questionnaire', {
      customisable: true
      directive_name: 'rbQuestionnaire'
      options:
        layout: '100'
        title: 'Questionnaire'
        questionnaireTree: null
        selectedNodes: null
        selectedDiligence: null
        selectedIds: null
        diligenceId: 0
        entity_id: null
    })
  )
  .config((RbComponentFactoryProvider) ->
    RbComponentFactoryProvider.configure('blank_chart', {
      customisable: true
      directive_name: 'rbBlankChart'
      options:
        rows: 4
        chartType: 'pie'
        title: 'Chart'
        xAxisLegend: 'X-axis'
        yAxisLegend: 'Y-axis'
    })
  )
  .config((RbComponentFactoryProvider) ->
    RbComponentFactoryProvider.configure('header_row', {
      customisable: true
      directive_name: 'rbHeaderRow'
      options:
        layout: '100'
        text: 'Header Title'
        size: '22'
        fontColor: '#FFFFFF'
        backgroundColor: null
        alignment: 'left'
    })
  )
  .config((RbComponentFactoryProvider) ->
    RbComponentFactoryProvider.configure('questionnaire_template', {
      customisable: true
      directive_name: 'rbQuestionnaireTemplate'
      options:
        layout: '100'
        title: 'Questionnaire Responses'
        selectedQuestionsList: null
        templateId: null
        entity_id: null
        view: 'horizontal'
    })
  )
