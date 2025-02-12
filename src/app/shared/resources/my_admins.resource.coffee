angular.module('diligenceVault').factory 'MyAdminsResource', (GridResourceService, BaseDataService, GridsDataService, Utils) ->
  new class MyAdminsResource

    grid_widths_map = GridsDataService.getGridWidthsMap()

    $new: (options) ->
        resource = GridResourceService.$new()
        resource.addTransformer (collection) ->
            _(collection).each (response) ->
                response.firmwide_role_label = Utils.getDisplayUserRole(response.firmwide_role_name)
        resource.name 'myadmins',
        resource.enableFiltering()
        resource.colDefaults(
            align: 'center'
            filterable: false
        )

        resource.enableGridGrouping({groupingShowCounts: true, enableGroupHeaderSelection: true})

        resource.column('fullName').title('Name').align('left').setWidth(grid_widths_map['sm_column_sm']).filterable(true, {
            placeholder: 'Search by name'
        })
        resource.column('email').title('Email').align('left').setTemplate('my-admin-email').setWidth(grid_widths_map['sm_column_sm']).filterable(true, {
            placeholder: 'Search by email'
        })
        resource.column('firmwide_role_label').title('Type').setTemplate('my-admin-type').setWidth(grid_widths_map['sm_column_sm']).filterable(true, {
            placeholder: 'Search by type'
        })
        resource
