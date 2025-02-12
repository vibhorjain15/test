angular.module('diligenceVault').factory 'DocumentSearchService', () ->

  class DocumentSearch

    constructor: (params) ->
      @dateFormat = 'MM-DD-YYYYTHH:mm:ss'
      #set passed values to constructor
      @originalDocuments = angular.copy params.documents
      @documents = params.documents
      # Receive and set search related data like Document Type, Document Group, Firm Name and Product Name
      @documentTypes = params.documentTypes
      @documentGroups = params.documentGroups
      @allFirmsList = params.allFirmsList
      @allFundsList = params.allFundsList
      @filterParams = {}
      @fitleredResults = []

    # A provision to get Document Type, Document Group, Firm Name and Product Name, if they are not passed
    # Write Separate functions to fetch them, but use deferred promise to resolve all at the same time

    # A function to check whether Document Type, Document Group, Firm Name and Product Name is present individually or not
    # If not, use the above function to get the required data

    # Function to set documents, Why? When we use query search, BE returns new data, so documents property needs to be
    # updated here inside the class
    setDocuments: (documents) =>
      @documents = documents

    setOriginalDocuments: (documents) =>
      @originalDocuments = angular.copy documents

    # A direct interface to call filtering, which will internally call others functions of this class
    filterDocuments: (params) =>
      @setFilterParams(params)
      @performFiltering()
      return @getFilteredResults()

    # A function to get the search queries from the UI
    setFilterParams: (params) =>
      @filterParams = params

    # Check if Keyword search is made or not
    # If Keyword search is performed, then we need to search on the new results provided from the BE.

    # A generic search function to search the data based on multiple conditions
    # Try to apply multiple conditions in one single iteration, so that we can optimize the performance
    performFiltering: () =>
      if @filterParams != _.isEmpty() and @filterParams.global_operator == 'or'
        return @performOrBasedFiltering()
      else
        return @performAndBasedFiltering()

    performAndBasedFiltering: () =>
      @fitleredResults = _(@documents).filter((document) =>
        [groupSearch, typeSearch, firmSearch, strategySearch, fundSearch, vehicleSearch, beforeDateSearch, afterDateSearch, betweenDateSearch, equalDateSearch ] = [true, true, true, true, true, true, true, true, true, true]

        if 'group_ids' of @filterParams
          if _(document).has('group_ids')
            groupSearch = _(document.group_id).intersection(@filterParams.group_ids).length > 0
          else
            groupSearch = _(document.group_ids).intersection(@filterParams.group_ids).length > 0

        if 'type_ids' of @filterParams
          typeSearch = _(document.tags).intersection(@filterParams.type_ids).length > 0

        if 'firm_ids' of @filterParams
          firmSearch = _(document.associated_firms).intersection(@filterParams.firm_ids).length > 0

        if 'strategy_ids' of @filterParams
          strategySearch = _(document.associated_strategies).intersection(@filterParams.strategy_ids).length > 0

        if 'fund_ids' of @filterParams
          fundSearch = _(document.associated_funds).intersection(@filterParams.fund_ids).length > 0

        if 'vehicle_ids' of @filterParams
          vehicleSearch = _(document.associated_vehicles).intersection(@filterParams.vehicle_ids).length > 0

        if 'gt_as_of_date' of @filterParams and 'lt_as_of_date' of @filterParams
          betweenDateSearch = moment(document.as_of_date).isBetween(moment(@filterParams.gt_as_of_date, @dateFormat), moment(@filterParams.lt_as_of_date, @dateFormat), 'day', '[]')
        else
          if 'eq_as_of_date' of @filterParams
            equalDateSearch = moment(document.as_of_date).isSame(moment(@filterParams.eq_as_of_date, @dateFormat), 'day')
          else if 'gt_as_of_date' of @filterParams
            afterDateSearch = moment(document.as_of_date).isSameOrAfter(moment(@filterParams.gt_as_of_date, @dateFormat), 'day')
          else if 'lt_as_of_date' of @filterParams
            beforeDateSearch = moment(document.as_of_date).isSameOrBefore(moment(@filterParams.lt_as_of_date, @dateFormat), 'day')

        return groupSearch and typeSearch and firmSearch and strategySearch and fundSearch and vehicleSearch and betweenDateSearch and afterDateSearch and beforeDateSearch and equalDateSearch
      )

      return @fitleredResults

    performOrBasedFiltering: () =>
      @fitleredResults = _(@documents).filter((document) =>
        if 'group_ids' of @filterParams
          if _(document).has('group_ids')
            if _(document.group_id).intersection(@filterParams.group_ids).length > 0 then return true
          else
            if _(document.group_ids).intersection(@filterParams.group_ids).length > 0 then return true

        if 'type_ids' of @filterParams
          if _(document.tags).intersection(@filterParams.type_ids).length > 0 then return true

        if 'firm_ids' of @filterParams
          if _(document.associated_firms).intersection(@filterParams.firm_ids).length > 0 then return true

        if 'strategy_ids' of @filterParams
          if _(document.associated_strategies).intersection(@filterParams.strategy_ids).length > 0 then return true

        if 'fund_ids' of @filterParams
          if _(document.associated_funds).intersection(@filterParams.fund_ids).length > 0 then return true

        if 'vehicle_ids' of @filterParams
          if _(document.associated_vehicles).intersection(@filterParams.vehicle_ids).length > 0 then return true

        if 'gt_as_of_date' of @filterParams and 'lt_as_of_date' of @filterParams
          if moment(document.as_of_date).isSameOrAfter(moment(@filterParams.gt_as_of_date, @dateFormat), 'day') or
            moment(document.as_of_date).isSameOrBefore(moment(@filterParams.lt_as_of_date, @dateFormat), 'day') then return true
        else
          if 'eq_as_of_date' of @filterParams
            if moment(document.as_of_date).isSame(moment(@filterParams.eq_as_of_date, @dateFormat), 'day') then return true

          if 'gt_as_of_date' of @filterParams
            if moment(document.as_of_date).isSameOrAfter(moment(@filterParams.gt_as_of_date, @dateFormat), 'day') then return true

          if 'lt_as_of_date' of @filterParams
            if moment(document.as_of_date).isSameOrBefore(moment(@filterParams.lt_as_of_date, @dateFormat), 'day') then return true

        if (_.intersection(_.keys(@filterParams), ['global_operator', 'q'])).length == 2 then return true

        return false
      )

      return @fitleredResults

    # Return the results performed after search operation
    getFilteredResults: () =>
      return @fitleredResults

    getOriginalDocuments: () =>
      return @originalDocuments

    # Reset Documents to original documents
    resetToOriginalDocuments: () =>
      originalDocuments = angular.copy @getOriginalDocuments()
      @setDocuments originalDocuments

  new class DocumentSearchService
    $new: (options) ->
      new DocumentSearch(options)
