angular.module('diligenceVault').factory 'FormADVRegulatorsResource', (GridResourceService, GridsDataService) ->
  new class FormADVRegulatorsResource

    grid_widths_map = GridsDataService.getGridWidthsMap()

    $new: (options) ->
      resource = GridResourceService.$new(options)
      resource.name 'formadv_regulators'
      resource.enableFiltering()

      resource.column('value').title('Regulator / Jurisdiction').setWidth(grid_widths_map['lg_column_sm']).setDefaultSort('desc').align('left').filterable(true, {
        placeholder: 'Search regulator'
      })    
      resource
