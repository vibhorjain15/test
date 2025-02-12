class ReportBuilderHeaderController extends BaseController
  @register 'ReportBuilderHeaderController'
  @inject '$scope', '$attrs', 'uiSortableMultiSelectionMethods'

  initialize: ->
    @initComponents()
    @renameTemplateUrl = 'shared/directives/reportBuilderHeader/rename-template.html'

  setTemplate: (template) ->
    @template = template

  displayTemplateRenamePopover: ->
    return unless @template

    @template_params = @template.clone()
    @isPopoverOpen = true

  updateTemplate: ->
    @saving_template = true

    @$scope.updateTemplate(@template_params).then =>
      @saving_template = false
      @isPopoverOpen = false

  redirectToPreview: ->
    @$scope.redirectToPreview(@template.id)

  initComponents: ->
    @component_controls = [
      {
        label: 'Questions'
        icon: 'question-circle'
        type: 'questionnaire_template'
      }
      {
        label: 'Text'
        icon: 'font'
        type: 'text'
      }
      {
        label: 'Notes'
        icon: 'notepad'
        type: 'notes'
      }
      {
        label: 'Image'
        icon: 'image'
        type: 'image_selector'
      }
      {
        label: 'Separator'
        icon: 'minus'
        type: 'line_break'
      }
      {
        label: 'Header'
        icon: 'bars'
        type: 'header_row'
      }
    ]

    @component_controls_with_options = [
      {
        label: 'Chart'
        icon: 'pie-chart'
        sub_components: [
          {
            label: 'AUM History'
            type: 'aum_chart'
          }
          {
            label: 'Track Record'
            type: 'performance_chart'
          }
          {
            label: 'Asset Liquidity'
            type: 'valuation_chart'
          }

          {
            label: 'Audit Timeline'
            type: 'timeline'
          }
          {
            label: 'Blank Chart'
            type: 'blank_chart'
          }
        ]
      }
      {
        label: 'Overviews'
        icon: 'overview'
        sub_components: [
          {
            label: 'Fund Overview'
            type: 'fund_overview'
          }
          {
            label: 'Firm Overview'
            type: 'firm_overview'
          }
          {
            label: 'Liquidity Overview'
            type: 'liquidity_overview'
          }
        ]
      }
      {
        label: 'Ratings'
        icon: 'star-half'
        sub_components: [
          {
            label: 'Due Diligence Ratings'
            type: 'dd_rating'
          }
        ]
      }
    ]
