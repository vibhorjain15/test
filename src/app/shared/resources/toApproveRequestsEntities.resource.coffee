angular.module('diligenceVault').factory 'ToApproveRequestsEntitiesResource', ($timeout, Restangular, GridResourceService, BaseDataService, Utils, GridsDataService) ->

  entity_type = Utils.getEntityType()
  entity_sub_type = Utils.getEntitySubType()

  new class ToApproveRequestsEntitiesResource

    grid_widths_map = GridsDataService.getGridWidthsMap()

    $new: (options) ->

      resource = GridResourceService.$new(options.options)

      resource.onlyFetchDataAsGrid()
      
      resource.enableFiltering()
      resource.colDefaults(
        align: 'center'
        filterable: false
      )
      resource.setGridNullLabel("Ungrouped")

      resource.enableGridGrouping({groupingShowCounts: true, enableGroupHeaderSelection: false})
      resource.enableColumnMenus()

      resource.setRowTemplate("dd-project-row-template")

      resource.column('entity_name').disableColumnMenu().disableGrouping().setDefaultSort('asc').title('Entity').setWidth(grid_widths_map['sm_column_lg']).align('center').filterable(true, {
        placeholder: 'Search Entity'
      })

      resource.column('templates_list').disableColumnMenu().disableGrouping().setDefaultSort('asc').title('Template(s)').setWidth(grid_widths_map['sm_column_lg']).align('center').setTemplate 'groupable-field-name'

      resource.column('contacts_list').disableColumnMenu().disableGrouping().setDefaultSort('asc').title('Associated Contact(s)').setWidth(grid_widths_map['sm_column_lg']).align('center').setTemplate 'groupable-field-name'
      
      resource
