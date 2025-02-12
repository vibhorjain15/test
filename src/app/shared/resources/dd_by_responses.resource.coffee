angular.module('diligenceVault').factory 'DDByResponseResource', (GridResourceService, GridsDataService) ->

  new class DDByResponseResource

    grid_widths_map = GridsDataService.getGridWidthsMap()

    $new: (options) ->
      resource = GridResourceService.$new(options)

      resource.name('diligences')
      resource.enableFiltering()
      resource.colDefaults(
        align: 'center'
        filterable: false
      )

      resource.column('entity_name').setDefaultSort('asc').title('Fund Name').setTemplate('dd-fund-name').align('left').filterable(true)
      resource.column('name').title 'Name'

      resource
