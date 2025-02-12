angular.module('diligenceVault').factory 'FormADVServiceProvidersResource', (GridResourceService, GridsDataService) ->
  
  new class FormADVServiceProvidersResource

    grid_widths_map = GridsDataService.getGridWidthsMap()

    $new: (options) ->
      resource = GridResourceService.$new(options)
      resource.name 'formadv_service_providers'
      resource.enableFiltering()

      resource.colDefaults(
        align: 'left'
        filterable: false
      )

      resource.enableGridGrouping({groupingShowCounts: true, enableGroupHeaderSelection: false})
      resource.enableColumnMenus()
      resource.setGridNullLabel("Ungrouped")

      resource.column('normalized_name').disableColumnMenu().disableGrouping().title('Service Provider').setTemplate('form-adv-service-provider-name').setWidth(grid_widths_map['lg_column_xxm']).setDefaultSort('desc').filterable(true, {
        placeholder: 'Search by name'
      })
      resource.column('type').showAggregationOptions(false).enableHiding(false).align('center').title('Type').setDefaultSort('desc').setWidth(grid_widths_map['sm_column_xm']).filterable(true, {
        placeholder: 'Search by type'
      }).setTemplate('empty-cell')
    
      resource
