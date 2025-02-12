angular.module('diligenceVault').factory 'ContactSearchService', () ->

  class ContactSearch

    constructor: (params) ->
      @dateFormat = 'MM-DD-YYYYTHH:mm:ss'
      #set passed values to constructor
      @originalContacts = angular.copy params.contacts
      @contacts = params.contacts
      # Receive and set search related data like Document Type, Document Group, Firm Name and Product Name
      @contactTypes = params.contactTypes
      @countries = params.countries
      @filterParams = {}
      @fitleredResults = []

    # A provision to get Document Type, Document Group, Firm Name and Product Name, if they are not passed
    # Write Separate functions to fetch them, but use deferred promise to resolve all at the same time

    # A function to check whether Document Type, Document Group, Firm Name and Product Name is present individually or not
    # If not, use the above function to get the required data

    # Function to set contacts, Why? When we use query search, BE returns new data, so documents property needs to be
    # updated here inside the class
    setContacts: (contacts) =>
      @contacts = contacts

    setOriginalContacts: (contacts) =>
      @originalContacts = angular.copy contacts

    # A direct interface to call filtering, which will internally call others functions of this class
    filterContacts: (params) =>
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
      @fitleredResults = _(@contacts).filter((contact) =>
        [countrySearch, typeSearch, citySearch, stateSearch, titleSearch] = [true, true, true, true, true]

        if 'country_id' of @filterParams
          countrySearch = (contact.country_id == @filterParams.country_id)

        if 'tag_list' of @filterParams
          if contact.contact_type_ids
            typeSearch = _(contact.contact_type_ids).intersection(@filterParams.tag_list).length > 0
          else
            typeSearch = false

        if 'city' of @filterParams
          if contact.city
            citySearch = (contact.city.toLowerCase().indexOf(@filterParams.city.toLowerCase())>-1)
          else
            citySearch = false

        if 'state' of @filterParams
          if contact.state
            stateSearch = (contact.state.toLowerCase().indexOf(@filterParams.state.toLowerCase())>-1)
          else
            stateSearch = false

        if 'title' of @filterParams
          if contact.title
            titleSearch = (contact.title.toLowerCase().indexOf(@filterParams.title.toLowerCase())>-1)
          else
            titleSearch = false

        return countrySearch and typeSearch and citySearch and stateSearch and titleSearch
      )

      return @fitleredResults

    performOrBasedFiltering: () =>
      @fitleredResults = _(@contacts).filter((contact) =>
        if 'country_id' of @filterParams
          if (contact.country_id == @filterParams.country_id) then return true

        if 'tag_list' of @filterParams
          if contact.contact_type_ids
            if _(contact.contact_type_ids).intersection(@filterParams.tag_list).length > 0 then return true

        if 'city' of @filterParams
          if (contact.city && (contact.city.toLowerCase().indexOf(@filterParams.city.toLowerCase())>-1)) then return true

        if 'state' of @filterParams
          if (contact.state && (contact.state.toLowerCase().indexOf(@filterParams.state.toLowerCase())>-1)) then return true

        if 'title' of @filterParams
          if (contact.title && (contact.title.toLowerCase().indexOf(@filterParams.title.toLowerCase())>-1)) then return true

        if (_.intersection(_.keys(@filterParams), ['global_operator', 'q'])).length == 2 then return true

        return false
      )

      return @fitleredResults

    # Return the results performed after search operation
    getFilteredResults: () =>
      return @fitleredResults

    getOriginalContacts: () =>
      return @originalContacts

    # Reset Documents to original documents
    resetToOriginalContacts: () =>
      originalContacts = angular.copy @getOriginalContacts()
      @setContacts originalContacts

  new class ContactSearchService
    $new: (options) ->
      new ContactSearch(options)
