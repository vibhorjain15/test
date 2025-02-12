angular.module('diligenceVault').factory 'BaseDataService', (Restangular, baseData, $rootScope, userservice,
                                                             Upload, baseUrl,RestangularHeaderService,USER_ROLES,GridStateDataService) ->

  new class BaseDataService

    promises = {}
    contactPageUrl = ""
    samlLoginErrorMsg = null

    loadTeamMembers = ->
      promises.team_members = Restangular.all('team_members').getList('',{'page-url': 'team_members'})

    loadFunctions = ->
      promises.functions = Restangular.all('functions').getList('',{'page-url': 'functions'})

    loadUserProfile = ->
      promises.user_profile = Restangular.one('users', 'me').get('',{'page-url': 'users/me'})

    hasFirmWideRole = (user) ->
      isFirmWide = false
      if user.firmwide_role.toLowerCase() != USER_ROLES.RESTRICTED
        isFirmWide = true
      isFirmWide

    loadCurrentUser = ->
      $rootScope.currentUserPromise = userservice.getCurrentUser().then (response) ->
        currentUser = response.data
        currentUser.hasFirmWideRole = hasFirmWideRole(currentUser)
        baseData.currentUser = currentUser
        currentUser

    loadSubscriptions = ->
      $rootScope.subscriptionLimitsPromise = Restangular.all('subscription_limits').getList('',{'page-url': 'subscription_limits'}).then (response) ->
        baseData.subscription_limits = response

    loadEmailNotification = ->
      $rootScope.email_notificationsPromise = Restangular.all('user_notification_settings').customGET().then (response) ->
        baseData.email_notifications = response

    loadOperators = ->
      promises.operators = Restangular.all('operators').getList('',{'page-url': 'operators'}).then (response) ->
        symbol_map =
          eq: '='
          gt: '>'
          gte: '>='
          lt: '<'
          lte: '<='
          noteq: '≠'
          ac: 'Δ'
          cont: '⊂'
        label_map =
          eq: 'Equal To'
          gt: 'Greater Than'
          gte: 'Greater Than or Equal To'
          lt: 'Less Than'
          lte: 'Less Than or Equal To'
          noteq: 'Not Equal To'
          ac: 'Any Change'
          cont: 'Contains'

        angular.forEach response, (operator) ->
          operator.display_symbol = symbol_map[operator.value]
          operator.display_label = label_map[operator.value]

        response

    loadBaseData: ->
      loadCurrentUser()
      loadSubscriptions()
      loadTeamMembers()
      loadFunctions()
      loadUserProfile()
      loadOperators()
      loadEmailNotification()

    flushBaseData: ->
      for prop in ['currentUser', 'teamMembers', 'user_profile', 'subscription_limits', 'email_notifications']
        baseData[prop] = null

    getTeamMembers: ->
      promises.team_members

    getFunctions: ->
      promises.functions

    getUserProfile: ->
      promises.user_profile

    getOperators: ->
      promises.operators

    getSubscriptionLimits: ->
      promises.subscription_limits

    getStatuses: ->
      Restangular.all('tags').getList(type: 'Status')

    getAttachments: ->
      Restangular.all('attachment').getList()

    getAttachmentTypes: ->
      Restangular.all('document_tag_definitions').getList().then (response) =>
        response = _(response).sortBy((tag) =>
          tag.name.toLowerCase()
        )

    assignAttachment: (params) ->
      Restangular.all('attachment_assignments').customPUT params

    getCurrencies: ->
      Restangular.all('currency').getList()

    getCountries: ->
      Restangular.all('country').getList()

    getTouchPoints: ->
      Restangular.all('touch_points').getList()

    getAddresses: (params) ->
      Restangular.all('entity_addresses').getList(params)

    addAddress: (params) ->
      Restangular.all('entity_addresses').post(params)

    updateAddress: (params, id) ->
      Restangular.one('entity_addresses', id).customPUT params

    deleteAddress: (id) ->
      Restangular.one('entity_addresses', id).remove()

    deleteNote: (id) ->
      Restangular.one('notes', id).remove()

    deleteEmail: (id) ->
      Restangular.one('emails', id).remove()

    setContactPageUrl: (url) ->
      contactPageUrl = url

    getContactPageUrl: ->
      contactPageUrl

    setEmailErrorMessage: (message) ->
      samlLoginErrorMsg = message

    getEmailErrorMessage: ->
      samlLoginErrorMsg

    getAvoidErrorLoggingStatusList: ->
      response_codes = [200, 201, 404, 405]

      response_codes

    getAvoidErrorDisplayStatusList: ->
      response_codes = [400, 403, 404, 405, 500, 502, 503]

      response_codes

    getFunctionParams: (ownerList, params, primary_function_id, secondary_owner_id) =>
      functionsArr = []
      for owner in ownerList
        if owner.selectedFunction
          if owner.selected_function_users and owner.selected_function_users.length
            for user in owner.selected_function_users
                obj = {}
                obj.function_id = owner.selectedFunction
                if owner.autoAssign
                  obj.assigned_to_function_id = owner.selectedFunction
                  functionsArr.push obj
                  break
                else
                  obj.user_id = user.user_id
                  functionsArr.push obj
          else
            obj = {}
            obj.function_id = owner.selectedFunction
            if owner.autoAssign
              obj.assigned_to_function_id = owner.selectedFunction
              functionsArr.push obj
      if params.hasOwnProperty('primary_owners')
        for user in params.primary_owners
          obj2 = {}
          obj2.function_id = primary_function_id
          obj2.user_id = user.id
          functionsArr.push obj2
      if params.hasOwnProperty('secondary_owners')
        for user in params.secondary_owners
          obj3 = {}
          obj3.function_id = secondary_owner_id
          obj3.user_id = user.id
          functionsArr.push obj3
      functionsArr

    getPermissionEntityDetails: (entityId, entityType)=>
      RestangularHeaderService.RestangularWithHeader('app/permissionurls').all('permissionurls').customGET('',{entity_id:entityId,entity_type:entityType})

    createTable: (params)=>
      Restangular.all('AumTrackRecordDefinitions').post(params)

    updateTable: (params)=>
      Restangular.one('AumTrackRecordDefinitions', params.id).customPUT params

    getShareClassTableValues: (id)=>
      Restangular.one('AumTrackRecordDefinitions',id).all('AumTrackRecordValues').getList()

    getShareClassTable :(id)=>
      Restangular.one('AumTrackRecordDefinitions',id).doGET()

    updateFirstLogin: =>
      Restangular.all('users/is_first_login').customPUT({ isFirstLogin: false })

    getPermissionTypes: (called_from_firm_pref = false)=>
      Restangular.all('Permission_Types').customGET({ called_from_firm_pref: called_from_firm_pref })
