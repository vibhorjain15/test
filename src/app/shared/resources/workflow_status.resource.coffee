angular.module('diligenceVault').factory 'WorkflowStatusResource', (GridResourceService, GridsDataService, Utils) ->
  new class WorkflowStatusResource

    grid_widths_map = GridsDataService.getGridWidthsMap()

    $new: (options) ->
      resource = GridResourceService.$new(options)


      resource.name 'workflow_audits'
      resource.enableFiltering()
      resource.colDefaults(
        align: 'center'
        filterable: false
      )

      resource.setGridNullLabel("Ungrouped")

      resource.enableGridGrouping({groupingShowCounts: true, enableGroupHeaderSelection: false})
      resource.enableColumnMenus()

      resource.column('name').disableColumnMenu().disableGrouping().setDefaultSort('asc').title('Name').align('left').setWidth(grid_widths_map['sm_column_sm']).filterable(true, {
        placeholder: 'Search...'
      }).setTemplate('workflow-status-name')
      resource.column('status').showAggregationOptions(false).enableHiding(false).title('Status').setWidth(grid_widths_map['sm_column_sm']).filterable(true, {
        placeholder: 'Search status'
      }).setTemplate('empty-cell')
      resource.column('latest_step_name').disableColumnMenu().disableGrouping().title('Current step').setWidth(grid_widths_map['sm_column_sm']).filterable(true, {
        placeholder: 'Search current step'
      }).setTemplate 'workflow-last-step'
      resource.column('due_at').disableColumnMenu().disableGrouping().title('Due Date').setWidth(grid_widths_map['sm_column_sm']).format('date').setDefaultSort('asc').setTemplate('dd-due-date')
      resource.column('updated_at').disableColumnMenu().disableGrouping().title('Last updated').setWidth(grid_widths_map['sm_column_sm']).format('date').setDefaultSort('asc').setTemplate('workflow-last-updated')
      resource.column('pct_complete').disableColumnMenu().disableGrouping().title('% Complete').setWidth(grid_widths_map['sm_column_sm']).setTemplate('workflow-percentage').format 'number'
      resource.column('entity_name').showAggregationOptions(false).enableHiding(false).title('Entity Name').align('left').setWidth(grid_widths_map['sm_column_sm']).filterable(true, {
        placeholder: 'Search...'
      }).setTemplate('empty-cell')
      resource.column('entity_type').showAggregationOptions(false).enableHiding(false).title('Type').setWidth(grid_widths_map['sm_column_sm']).filterable(true, {
        placeholder: 'Search type'
      }).setTemplate('resource-type')
      resource.column('owner_name').showAggregationOptions(false).enableHiding(false).title('Owner').setWidth(grid_widths_map['sm_column_lg']).showTooltip().setTemplate('empty-cell')

      resource
