angular.module('diligenceVault').factory 'SelectedEntitiesResource', ($timeout, Restangular, GridResourceService, BaseDataService, Utils, GridsDataService) ->

  entity_type = Utils.getEntityType()
  entity_sub_type = Utils.getEntitySubType()

  new class SelectedEntitiesResource

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

      resource.column('name').showAggregationOptions(false).enableHiding(false).setDefaultSort('asc').title('Entity').setWidth(grid_widths_map['sm_column_lg']).align('center').filterable(true, {
        placeholder: 'Search Entity'
      })

      resource.column('template').showAggregationOptions(false).enableHiding(false).setDefaultSort('asc').title('Template(s)').setWidth(grid_widths_map['sm_column_lg']).align('center').setTemplate('groupable-field-name').filterable(true, {
        placeholder: 'Search Templates'
      })

      resource.column('notification_contacts').disableColumnMenu().disableGrouping().setDefaultSort('asc').title('Associated Contact(s)').setWidth(grid_widths_map['lg_column_lg']).align('center').setTemplate('groupable-field-name').filterable(true, {
        placeholder: 'Search Contacts'
      })

      resource
