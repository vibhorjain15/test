angular.module('diligenceVault').factory 'EntityAssignmentResource', (GridResourceService, BaseDataService, GridsDataService, $templateCache) ->
  new class EntityAssignmentResource

    $templateCache.put('ui-grid/selectionRowHeaderButtons',
      "<div class=\"ui-grid-selection-row-header-buttons doc-checkbox\" data-ng-class=\"{'ui-grid-row-selected': row.isSelected}\"><dv-checkbox data-ng-model=\"row.isSelected\" data-ng-click=\"selectButtonClick(row, $event);grid.appScope.vm.toggleButtonClick(grid,row)\"></dv-checkbox></div>"
    );


    $templateCache.put('ui-grid/selectionSelectAllButtons',
      "<div class=\"ui-grid-selection-row-header-buttons doc-checkbox\" data-ng-class=\"{'ui-grid-all-selected': grid.selection.selectAll}\" ><dv-checkbox data-ng-model=\"grid.selection.selectAll\" data-ng-click=\"headerButtonClick($event)\"></dv-checkbox></div>"
    );

    grid_widths_map = GridsDataService.getGridWidthsMap()

    $new: (options) ->
        params = {
            entity_type: options.entity_type
        }
        resource = GridResourceService.$new(params)
        if options.owner_type != "User"
          resource.name 'firms/'+options.firms+'/teams/'+options.owner_id+'/ResourcePermissions',
        else
          resource.name 'firms/'+options.firms+'/users/'+options.owner_id+'/ResourcePermissions',

        resource.enableFiltering()
        resource.enableRowSelection({full_row_selection: false})
        resource.setGridName('assignments_grid')
        resource.colDefaults(
            align: 'center'
            filterable: false
        )
        resource.setRowTemplate("details-page-permissions-row")

        resource.enableGridGrouping({groupingShowCounts: true, enableGroupHeaderSelection: true})

        resource.column('entity_name').title('Name').align('left').setWidth(grid_widths_map['sm_column_sm']).filterable(true, {
            placeholder: 'Search by name'
        })
        if options.owner_type == "User"
          resource.column('assigned_to_name').title('Assigned To').align('center').setWidth(grid_widths_map['sm_column_sm']).filterable(true, {
              placeholder: 'Search by keyword'
          })
          resource.column('role_name').title('Role').align('center').setWidth(grid_widths_map['sm_column_xxm']).filterable(true, {
              placeholder: 'Search by role'
          })
        resource.column('access_level').title('Visibility').align('center').setTemplate('visibility-column').setWidth(grid_widths_map['sm_column_xxm']).filterable(true, {
            placeholder: 'Search by Visibility'
        })
        resource.column('action').disableColumnMenu().disableGrouping().setWidth(grid_widths_map['sm_column_xxm']).title('Actions').align('center').disableSorting().setTemplate('entity-action').disableColumnMenu()
        resource
