angular.module('diligenceVault').factory 'TeamMembersResource', (GridResourceService, BaseDataService, GridsDataService, $templateCache) ->
  new class TeamMembersResource

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
        resource = GridResourceService.$new()
        resource.name 'firms/'+options.firm_id+'/Teams/'+options.id+'/TeamMemberships',

        resource.enableFiltering()
        resource.enableRowSelection({full_row_selection: false})
        resource.setGridName('team_members')
        resource.colDefaults(
            align: 'center'
            filterable: false
        )
        resource.setRowTemplate("dd-project-row-template")

        resource.enableGridGrouping({groupingShowCounts: true, enableGroupHeaderSelection: true})

        resource.column('user_name').setTemplate('team-member-name').title('Name').align('left').setWidth(grid_widths_map['sm_column_sm']).filterable(true, {
            placeholder: 'Search by name'
        })
        resource.column('role_name').title('Access Level').align('center').setWidth(grid_widths_map['sm_column_xxm']).filterable(true, {
            placeholder: 'Search by access level'
        })
        resource.column('action').disableColumnMenu().disableGrouping().setWidth(grid_widths_map['sm_column_xxm']).title('Actions').align('center').disableSorting().setTemplate('team_members_action').disableColumnMenu()
        resource
