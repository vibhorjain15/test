angular.module('diligenceVault').factory 'QuestionsManager', (GridResourceService, GridsDataService,uiGridConstants) ->
  new class QuestionsManager

    grid_widths_map = GridsDataService.getGridWidthsMap()

    $new: (options) ->
      resource = GridResourceService.$new(options)
      resource.name 'questions'
      # resource.setServerPaginated(true)

      if options and options.type == 'profile'
        resource.modifyDataFunction (collection) ->

          collection.forEach (question) ->
            if moment(question.expiry_date).isBefore(moment())
              question.expired = true
            else
              question.expired = false

          collection


      resource.enableFiltering()
      resource.setServerFilterable(false)
      resource.colDefaults(
        align: 'center'
        filterable: false
      )

      resource.setGridNullLabel("Ungrouped")
      resource.enableGridGrouping({groupingShowCounts: true, enableGroupHeaderSelection: false})
      resource.enableColumnMenus()
      resource.enableSaveFilter()

      resource.setRowTemplate("dd-questions-row-template")

      resource.column('action').disableColumnMenu().disableGrouping().align('center').setWidth(grid_widths_map['icon_lg']).setTemplate('qa-action').setEmptyTitle().title ''
      resource.column('is_verified').disableColumnMenu().disableGrouping().align('center').setWidth(grid_widths_map['icon_xl']).setTemplate('is-verified').setEmptyTitle().title ''

      #When enabling inital grouping for a column we also have to set the initial sorting for it, otherwise it wont group it properly
      resource.column('question_text').showAggregationOptions(false).enableHiding(false).setWidth(grid_widths_map['lg_column_xl']).title('Question Text').setTemplate('question-name').align('left').filterable(true, {
        placeholder: 'Search questions'
      })
      resource.column('associated_entities').showAggregationOptions(false).enableHiding(false).title('Entities').setWidth(grid_widths_map['sm_column_lg']).setTemplate('question-products').align('left').filterable(true, {
        placeholder: 'Search entities'
      })
      resource.column('tags').disableColumnMenu().disableGrouping().title('Tags').setWidth(grid_widths_map['sm_column_xxl']).setTemplate('question-tags').filterable(true, {
        placeholder: 'Search tags'
      })
      resource.column('response_count').disableColumnMenu().disableGrouping().setWidth(grid_widths_map['sm_column_xm']).setTemplate('empty-cell').title 'Response Count'
      resource.column('lastupdated_at').disableColumnMenu().disableGrouping().setDefaultSort('DESC').title('Last Updated').format('date').setWidth(grid_widths_map['sm_column_sm']).setTemplate 'question-last-response'
      resource.column('associated_templates').showAggregationOptions(false).enableHiding(false).setWidth(grid_widths_map['sm_column_lg']).setTemplate('question-templates').title('Questionnaire').filterable(true, {
        placeholder: 'Search templates'
      })
      #Show these columns only in the 'all' tab, reason for the conditions are:
      #1. When 'all' tab is selected and there are no filters applied options object will be undefined
      #2. When filters are applied, options won't be empty, but type attribute will be undefined for 'all' tab
      if !options or options.type == undefined
        resource.column('associated_investors').showAggregationOptions(false).enableHiding(false).title('Investors').setWidth(grid_widths_map['sm_column_lg']).setTemplate('question-investors').filterable(true, {
          placeholder: 'Search investors'
        })
        resource.column('investor_count').disableColumnMenu().disableGrouping().setWidth(grid_widths_map['sm_column_lg']).setTemplate('empty-cell').title 'Investor Count'
      resource.column('subject_matter_experts').showAggregationOptions(false).enableHiding(false).title('Subject Matter Expert').setWidth(grid_widths_map['sm_column_sm']).setTemplate('questions-sme').filterable(true, {
        placeholder: 'Search SME'
      })
      resource.column('expiry_date').disableColumnMenu().disableGrouping().title('Expiry Date').format('date').setTemplate('empty-cell').setWidth(grid_widths_map['sm_column_sm'])
      .filterable(true, {
          condition: ((searchTerm, cellValue)=>
            if searchTerm
              moment(cellValue).isBefore(moment())
            else
              moment(cellValue).isAfter(moment()) or cellValue == null
          )
          type: uiGridConstants.filter.SELECT
          selectOptions: [
            {value: true, label: 'Expired'}
            {value: false, label: 'Active'}
          ]
        }).setTemplate 'questions-expiry-date'
      resource
