angular.module('diligenceVault').factory 'MyAccountsResource', (GridResourceService, BaseDataService, GridsDataService) ->
  new class MyAccountsResource

    grid_widths_map = GridsDataService.getGridWidthsMap()

    $new: (options) ->
        resource = GridResourceService.$new()
        resource.name 'users/' +options.user_id+ '/associated_firms',
        resource.enableFiltering()
        resource.colDefaults(
            align: 'center'
            filterable: false
        )
        resource.setRowTemplate("my-accounts-row")

        resource.column('action').title('Action').disableSorting().align('center').setTemplate('my-account-action').setWidth(grid_widths_map['sm_column_xm'])
        resource.column('firm_name').title('Firm Name').align('left').setWidth(grid_widths_map['sm_column_xl']).filterable(true, {
            placeholder: 'Search by name'
        })
        resource.column('status').title('Status').align('center').setWidth(grid_widths_map['sm_column_xm']).filterable(true, {
            placeholder: 'Search by status'
        })
        resource.column('invited_by_name').title('Invited By').align('center').setWidth(grid_widths_map['sm_column_lg']).filterable(true, {
            placeholder: 'Search by user'
        })
        resource
