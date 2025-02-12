angular.module('diligenceVault').factory 'MFWResource', ($timeout, Restangular, GridResourceService, BaseDataService, Utils, GridsDataService) ->

  entity_type = Utils.getEntityType()
  entity_sub_type = Utils.getEntitySubType()

  new class MFWResource

    grid_widths_map = GridsDataService.getGridWidthsMap()

    $new: (options) ->

      resource = GridResourceService.$new(options.options)

      # resource.addTransformer (collection) ->
      #   console.log collection

      resource.name 'service/dvapi_service/all_fund_rating ',
        lastTouchPointDate: ->
          @lastTouchPoint and new Date(@lastTouchPoint)


      resource.usePostMethod()

      resource.enableFetchRecords()
      
      resource.enableFiltering()
      resource.colDefaults(
        align: 'center'
        filterable: false
      )
      resource.setGridNullLabel("Ungrouped")

      resource.enableGridGrouping({groupingShowCounts: true, enableGroupHeaderSelection: false})
      resource.enableColumnMenus()

      resource.setRowTemplate("dd-project-row-template")

      resource.column('created_at').disableColumnMenu().disableGrouping().title('Report Date').setWidth(grid_widths_map['sm_column_sm']).setTemplate('dd-date-field').format 'date'

      resource.column('identifier').disableColumnMenu().disableGrouping().setDefaultSort('asc').title('ISIN').setWidth(grid_widths_map['sm_column_lg']).align('center').filterable(true, {
        placeholder: 'ISIN'
      })
      
      resource.column('fund_name').disableColumnMenu().disableGrouping().setDefaultSort('asc').title('Fund Name').setWidth(grid_widths_map['sm_column_lg']).align('center').filterable(true, {
        placeholder: 'Fund Name'
      })

      # resource.column('rating_value').showAggregationOptions(false).enableHiding(false).setWidth(grid_widths_map['sm_column_lg']).setTemplate('rating-status').title 'Rating'
 
      # resource.column('esg_rating_value').showAggregationOptions(false).enableHiding(false).setWidth(grid_widths_map['sm_column_lg']).setTemplate('esg_rating-status').title 'ESG Rating'

      resource.column('rating').showAggregationOptions(false).enableHiding(false).setWidth(grid_widths_map['sm_column_lg']).setTemplate('rating-stars').title 'Rating (Stars)'
 
      resource.column('esg_rating').showAggregationOptions(false).enableHiding(false).setWidth(grid_widths_map['sm_column_lg']).title 'ESG Rating'

      resource
