angular.module('diligenceVault').factory 'WorkflowActionsResource', (GridResourceService, GridsDataService) ->
  new class WorkflowActionsResource

    grid_widths_map = GridsDataService.getGridWidthsMap()

    $new: (options) ->
      resource = GridResourceService.$new(options)

      resource.name 'workflow_steps_actions'
      resource.enableFiltering()
      resource.colDefaults(
        align: 'center'
        filterable: false
      )

      resource.column('entity_name').setDefaultSort('asc').title('Name').align('left').setTemplate('workflow-action-entity-name').setWidth(grid_widths_map['lg_column_xxm']).filterable(true, {
        placeholder: 'Search...'
      })
      resource.column('action_id').title('Action').disableSorting().setTemplate('workflow-actions-action').setWidth(grid_widths_map['sm_column_xm'])
      resource
