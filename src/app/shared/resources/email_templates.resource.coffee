angular.module('diligenceVault').factory 'EmailTemplatesResource', (GridResourceService, Restangular, GridsDataService, BaseDataService) ->

  new class EmailTemplatesResource

    grid_widths_map = GridsDataService.getGridWidthsMap()
    $new: (options) ->
      resource = GridResourceService.$new()
      resource.name 'EmailTemplateMessages'
      resource.enableFiltering()
      resource.colDefaults(
        align: 'center'
        filterable: false
      )

      resource.column('action').title('Action').disableSorting().setTemplate('email-template-action').setWidth(grid_widths_map['icon_lg'])
      resource.column('name').title('Name').align('left').setTemplate('email-template-name').setWidth(grid_widths_map['sm_column_xxl']).filterable(true, {
        placeholder: 'Search by Name'
      })
      resource.column('content').title('Content').setTemplate('email-template-content').setWidth(grid_widths_map['sm_column_xxl']).filterable(true, {
        placeholder: 'Search by Content'
      })
      resource.column('updated_at').title('Last Updated').format('date').setWidth(grid_widths_map['sm_column_xxm']).setTemplate 'disclaimer-updated-at'

      resource
