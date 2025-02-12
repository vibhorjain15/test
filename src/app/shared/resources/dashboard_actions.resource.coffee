angular.module('diligenceVault').factory 'DashboardActionsResource', (GridResourceService, GridsDataService, Restangular, Utils) ->
  new class DashboardActionsResource

    grid_widths_map = GridsDataService.getGridWidthsMap()

    $new: (options) ->
      resource = GridResourceService.$new(options)

      resource.addTransformer (collection) =>
        _(collection).each (response) ->
          response.due_at = Utils.getLocalDateTimeGeneric(response.due_at)
        Restangular.all('workflow_actions').getList().then (response) =>
          action_types = response
          _(collection).each (item) =>
            if item.entity_type == 'Workflow'
              action_item = _(action_types).findWhere(value: item.action_id)
              item.action_label = action_item.label

      resource.name 'dashboard/tasks'
      resource.enableFiltering()
      resource.colDefaults(
        align: 'center'
        filterable: false
      )

      resource.setRowTemplate("dash-myactions-row-template")
      resource.column('entity_name').setDefaultSort('asc').title('Task for').align('left').setTemplate('my-actions-entity-name').filterable(true, {
        placeholder: 'Search...'
      })
      resource.column('due_at').title('Due Date').setWidth(grid_widths_map['sm_column_xm']).format('date').setTemplate('dd-due-date')
      resource.column('action_id').title('Task type').disableSorting().setTemplate('my-actions-action').setWidth(grid_widths_map['sm_column_sm'])
      resource
