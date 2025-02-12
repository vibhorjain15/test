angular.module('diligenceVault').factory 'DisclaimersResource', (GridResourceService, Restangular, GridsDataService, BaseDataService) ->

  new class DisclaimersResource

    grid_widths_map = GridsDataService.getGridWidthsMap()
    $new: (options) ->
      resource = GridResourceService.$new(options)
      resource.name 'disclaimers'
      resource.enableFiltering()
      resource.colDefaults(
        align: 'center'
        filterable: false
      )

      resource.column('name').title('Name').setDefaultSort('asc').align('left').setTemplate('disclaimerlist-name').setWidth(grid_widths_map['sm_column_sm']).filterable(true, {
        placeholder: 'Search...'
      })
      resource.column('updated_at').title('Last Updated').format('date').setWidth(grid_widths_map['sm_column_sm']).setTemplate 'disclaimer-updated-at'
      resource.column('usage').title('Usage').setWidth(grid_widths_map['sm_column_sm'])
      resource.column('action').title('Action').disableSorting().setTemplate('disclaimerlist-action').setWidth(grid_widths_map['sm_column_xxm'])

      resource
