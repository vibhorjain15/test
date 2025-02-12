angular.module('diligenceVault').factory 'FormADVRelatedEntitiesResource', (GridResourceService, GridsDataService) ->
  new class FormADVRelatedEntitiesResource

    grid_widths_map = GridsDataService.getGridWidthsMap()

    $new: (options) ->
      resource = GridResourceService.$new(options)

      resource.name 'formadv_related_entities'

      resource.enableFiltering()
      resource.enableAlphabetFiltering()

      resource.colDefaults(
        align: 'center'
        filterable: false
      )

      resource.enableGridGrouping({groupingShowCounts: true, enableGroupHeaderSelection: false})
      resource.enableColumnMenus()
      resource.setGridNullLabel("Ungrouped")

      resource.column('name').disableColumnMenu().disableGrouping().title('Name').setDefaultSort('desc').align('left').setWidth(grid_widths_map['lg_column_xl']).filterable(true, {
        placeholder: 'Search entity'
      })
      resource.column('id').disableColumnMenu().disableGrouping().setWidth(grid_widths_map['sm_column_xl']).title('CRD #')
      resource.column('entity_type').showAggregationOptions(false).enableHiding(false).title('Relation').setWidth(grid_widths_map['sm_column_xl']).filterable(true, {
        placeholder: 'Search relation'
      }).setTemplate('empty-cell')
      resource.column('owenrship').showAggregationOptions(false).enableHiding(false).title('Ownership Code').setWidth(grid_widths_map['sm_column_xl']).filterable(true, {
        placeholder: 'Search ownership'
      }).setTemplate('empty-cell')
    
      resource
