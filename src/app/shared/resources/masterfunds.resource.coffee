angular.module('diligenceVault').factory 'MasterFundsResource', ($timeout, Restangular, GridResourceService, BaseDataService, Utils, GridsDataService,uiGridConstants, statusLabel) ->

  entity_type = 'Strategy'
  # entity_sub_type = Utils.getEntitySubType()
  is_manager = Utils.isManager()

  new class MasterFundsResource

    grid_widths_map = GridsDataService.getGridWidthsMap()

    $new: (options) ->

      resource = GridResourceService.$new(options.options)

      resource.addTransformer (collection) ->
        BaseDataService.getTeamMembers().then (team_members) ->
          _(collection).each (response) ->
            user = _(team_members).findWhere(id: response.owner_user_id)

            if user?
              response.ownerName = _([user.firstName, user.lastName]).compact().join(' ')

          _(collection).each (response) ->
            if response.platform_active
              response.activeStatus = "Active"
            else
              response.activeStatus = "Deactivated"
            _(options.dynamic_grids_options).each (custom_field) ->
              dynamic_custom_feild = _(response.custom_fields).findWhere(field_key: custom_field.field_unique_key)
              if dynamic_custom_feild
                response[custom_field.field_unique_key] = dynamic_custom_feild.field_value
              else
                response[custom_field.field_unique_key] = ''

      resource.name 'service/dvapi_service/product_search',
        lastTouchPointDate: ->
          @lastTouchPoint and new Date(@lastTouchPoint)


      resource.usePostMethod()

      resource.enableFiltering()
      #resource.setServerFilterable(true)
      resource.enableAlphabetFiltering()
      #resource.setServerPaginated(true)
      resource.colDefaults(
        align: 'center'
        filterable: false
      )
      resource.setGridNullLabel("Ungrouped")

      resource.enableGridGrouping({groupingShowCounts: true, enableGroupHeaderSelection: false})
      resource.enableColumnMenus()

      resource.setRowTemplate("dd-project-row-template")

      resource.column('display_name').disableColumnMenu().disableGrouping().setDefaultSort('asc').title(entity_type+' Name').setWidth(grid_widths_map['sm_column_lg']).setTemplate('investment-name').align('left').filterable(true, {
        placeholder: 'Search ' + entity_type
      })
      # resource.column('product_type').showAggregationOptions(false).enableHiding(false).setWidth(grid_widths_map['sm_column_lg']).setTemplate('empty-cell').title 'Type'

      if !is_manager

        resource.column('relationship_status_name').showAggregationOptions(false).enableHiding(false).title('Relationship Status').setWidth(grid_widths_map['sm_column_lg']).setTemplate('empty-cell').filterable(true, {
          placeholder: 'Search by relationship status'
        })

        resource.column('platform_active').format('boolean').disableGrouping().showAggregationOptions(false).enableHiding(false).title('Status').align('center').setWidth(grid_widths_map['sm_column_sm']).setTemplate('entity-status').filterable(true, {
          placeholder: 'Search by status'
        })
      resource.column('primary_owner').showAggregationOptions(false).enableHiding(false).title('Primary Owner').setWidth(grid_widths_map['sm_column_sm']).setTemplate('dd-owner-name').filterable(true, {
        placeholder: 'Search primary'
      })

      resource.column('secondary_owner').showAggregationOptions(false).enableHiding(false).title('Secondary Owner').setWidth(grid_widths_map['sm_column_sm']).setTemplate('dd-owner-name').filterable(true, {
        placeholder: 'Search secondary'
      })

      resource.column('lastTouchPoint').disableColumnMenu().disableGrouping().title('Last TouchPoint').setWidth(grid_widths_map['sm_column_sm']).format('date').setTemplate 'last-touchpoint'

      resource.column('last_updated_at').disableColumnMenu().disableGrouping().title('Last Updated').setWidth(grid_widths_map['sm_column_sm']).format('date').setTemplate 'last-updated-at'
      resource.column('firm_name').disableColumnMenu().setWidth(grid_widths_map['sm_column_lg']).title('Parent Firm').align('center').filterable(true, {
        placeholder: 'Search by parent'
      })

      resource.column('key').setWidth(grid_widths_map['sm_column_sm']).disableGrouping().disableColumnMenu().title('Internal key').align('center')

      for custom_field,index in options.dynamic_grids_options
        if custom_field.has_href || custom_field.type == 'link' || custom_field.type == 'dynamic'
          resource.columnDefs.push(
            {
              name:custom_field.field_unique_key,
              visible: false,
              field: custom_field.field_unique_key,
              cellTemplate: "shared/ui-grid-cell-templates/dynamic-c-f-link-cell.html",
              enableHiding: true
              groupingShowAggregationMenu: false
              groupingShowGroupingMenu: false
              displayName: custom_field.alias,
              cellClass: 'text-center',
              headerCellClass: 'text-center',
              width: grid_widths_map['sm_column_lg'],
            }
          )
        else
          resource.columnDefs.push(
            {
              name:custom_field.field_unique_key,
              visible: false,
              field: custom_field.field_unique_key,
              cellTemplate: "shared/ui-grid-cell-templates/dynamic-c-f-cell.html",
              enableHiding: true
              groupingShowAggregationMenu: false
              groupingShowGroupingMenu: false
              displayName: custom_field.alias,
              cellClass: 'text-center',
              headerCellClass: 'text-center',
              width: grid_widths_map['sm_column_sm'],
            }
          )

      resource
