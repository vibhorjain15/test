angular.module('diligenceVault').factory 'ContactsResource', ($timeout, GridResourceService, BaseDataService, GridsDataService, uiGridConstants, statusLabel) ->

  new class ContactsResource

    grid_widths_map = GridsDataService.getGridWidthsMap()

    $new: (options) ->
      resource = GridResourceService.$new(options.options)

      resource.name 'service/dvapi_service/contact_search',
        lastTouchPointDate: ->
          @lastTouchPoint and new Date(@lastTouchPoint)

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

      resource.addTransformer (collection) ->
        _(collection).each (response) ->
          response.fullName = _.compact([response.firstName, response.lastName]).join(' ')


      resource.usePostMethod()

      resource.enableFetchRecords()

      resource.enableAlphabetFiltering()
      
      resource.enableFiltering()
      resource.colDefaults(
        align: 'center'
        filterable: false
      )
      resource.setGridNullLabel("Ungrouped")

      resource.enableGridGrouping({groupingShowCounts: true, enableGroupHeaderSelection: false})
      resource.enableColumnMenus()

      resource.setRowTemplate("dd-project-row-template")

      resource.column('fullName').title('Contact Name').showAggregationOptions(false).enableHiding(false).setWidth(grid_widths_map['sm_column_xl']).setTemplate('contact-name').align('left').filterable(true, {
        placeholder: 'Search contact'
      })
      resource.column('email').title('Email').showAggregationOptions(false).enableHiding(false).setWidth(grid_widths_map['sm_column_sm']).setTemplate('empty-cell').align('center').filterable(true, {
        placeholder: 'Search email'
      })
      resource.column('firm_name').title('Firm').showAggregationOptions(false).enableHiding(false).setWidth(grid_widths_map['sm_column_xl']).setTemplate('empty-cell').filterable(true, {
        placeholder: 'Search firm'
      })
      resource.column('owner_name').title('DiligenceVault Owner').showAggregationOptions(false).enableHiding(false).setWidth(grid_widths_map['sm_column_sm']).setTemplate('dd-owner-name').filterable(true, {
        placeholder: 'Search owner'
      })
      resource.column('lastTouchPoint').title('Last TouchPoint').disableColumnMenu().disableGrouping().setWidth(grid_widths_map['sm_column_sm']).format('date').setTemplate 'last-touchpoint'
      resource.column('activeStatus').disableGrouping().showAggregationOptions(false).enableHiding(false).title('Status').align('center').setWidth(grid_widths_map['sm_column_sm']).setTemplate('entity-status').filterable(true, {
        placeholder: 'Search by status'
      })
      resource.column('last_updated_at').title('Last Updated').disableColumnMenu().disableGrouping().setWidth(grid_widths_map['sm_column_sm']).format('date').setTemplate 'last-updated-at'

      resource.column('key').title('Internal key').disableColumnMenu().disableGrouping().setWidth(grid_widths_map['sm_column_sm']).align('center')

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
              is_dynamic: true
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
              is_dynamic: true
            }
          )

      resource
