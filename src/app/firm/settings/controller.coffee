class FirmSettingsController extends BaseController
  @register 'FirmSettingsController'

  @inject 'Restangular', 'Utils', '$q', '$scope', 'headerConstants', 'baseData','USER_ROLES'

  initialize: ->
    firmId = @Utils.getCurrentFirm().id
    deferred = @$q.defer()
    @currentUser = @baseData.currentUser
    @is_investor = @Utils.isInvestor()
    @is_manager = @Utils.isManager()
    @is_free_user = @Utils.isFreeSubscription()
    @entity_type = @Utils.getEntityType()
    @entity_sub_type = @Utils.getEntitySubType()

    @Restangular.one('firms', firmId).one('profile').get().then (response) =>
      @firm_profile = response
      deferred.resolve @firm_profile

    @$scope.getFirmProfile = -> deferred.promise

    @$scope.saveFirmProfile = (params) =>
      @Restangular
        .one('firms', firmId)
        .all('profile')
        .customPUT(params)
        .then (response) => _(@firm_profile).extend(response)

    @Restangular.one('firm_preferences').customGET().then (response) =>
      @firm_preferences = response
      @initializeSettingsMenu()

  initializeSettingsMenu: =>
    states = []
    if @currentUser.firmwide_role.toLowerCase() != @USER_ROLES.SECURITYADMIN
      states.push(
        { name: 'app.firm.settings.profile', label: 'Firm Profile' }
        { name: 'app.firm.settings.activity', label: 'Firm Activity' }
      )
    UserAndTeamsSubStates = [
        {
          name: 'app.firm.settings.employees'
          label: 'Users'
        }
        {
          name: 'app.firm.settings.teams'
          label: 'Teams'
        }
        {
          name: 'app.firm.settings.permissions'
          label: 'Permissions'
        }
        {
          name: 'app.firm.settings.functions'
          label: 'User roles'
        }
      ]
    if @firm_preferences.enable_custom_access_level
      UserAndTeamsSubStates.push({
        name: 'app.firm.settings.access_levels'
        label: 'Access Levels'
      })

    states.push(
      {
        label: 'Users & Teams'
        subStates: UserAndTeamsSubStates
      }
    )

    if @currentUser.firmwide_role.toLowerCase() == @USER_ROLES.ADMIN or @currentUser.firmwide_role.toLowerCase() == @USER_ROLES.SECURITYADMIN
      states.push(
        {
          label: 'Security',
          subStates: [
            { label: 'Domain', name: 'app.firm.settings.domains' }
            { label: 'IP Whitelisting', name: 'app.firm.settings.ip_configurations' }
            { label: 'SAML/SSO', name: 'app.firm.settings.sso_profile' }
            { label: 'Password', name: 'app.firm.settings.password' }
          ]
        }
      )
    if @currentUser.firmwide_role.toLowerCase() != @USER_ROLES.SECURITYADMIN
      states.push(
        {
          label: 'Preferences'
          subStates: [
            {
              name: 'app.firm.settings.preferences'
              label: 'Firm Preferences'
            }
            {
              name: 'app.firm.settings.design_preferences'
              label: 'Design Preferences'
            }
            {
              name: 'app.firm.settings.export_preferences'
              label: 'Export Preferences'
            }
          ]
        }
        {
          label: 'Download Audits',
          name: 'app.firm.settings.download_audits'
        }
      )

      grant_map = @Utils.getGrantMap()

      if @firm_preferences.excel_bulk_import
        BulkImportSubStates = [
          {
            name: 'app.firm.settings.bulk_upload.user_entities'
            label: 'Users & Entities'
          }
        ]
        if @is_manager
          BulkImportSubStates.push({
            name: 'app.firm.settings.bulk_upload.bulk_upload_pre_approved'
            label: 'Q/A Library'
          })
        if !@is_free_user
          BulkImportSubStates.push({
            name: 'app.firm.settings.bulk_upload.mapping_information'
            label: 'Saved Mappings'
          })
          
        states.push(
          {
            label: 'Bulk Upload'
            subStates: BulkImportSubStates
          }
        )

      if @is_manager
        states.push(
          {
          name: 'app.firm.settings.disclaimers',
          label: 'Disclaimers'
          }
        )

      if (@Utils.isAuthorized(grant_map, ['FreeSubscription','SmartSubscription','InstitutionalSubscription', 'ProductiveSubscription', 'FullSubscription']) && @is_investor && (@entity_type == 'Product'))
        states.push(
          {
            label: 'Documents'
            subStates: [
              {
                label: 'Document Types',
                name: 'app.firm.settings.document_tags'
              }
              {
                label: 'Document Groups',
                name: 'app.firm.settings.document_group_tags',
              }
              {
                name: 'app.firm.settings.document_classifications'
                label: 'Document Classification'
              }
            ]
          }
        )

      if (@Utils.isAuthorized(grant_map, ['InstitutionalSubscription', 'ProductiveSubscription']) && @is_investor && (@entity_type == 'Vendor'))
        states.push(
          {
            label: 'Documents'
            subStates: [
              {
                label: 'Document Types',
                name: 'app.firm.settings.document_tags'
              }
              {
                label: 'Document Groups',
                name: 'app.firm.settings.document_group_tags',
              }
              {
                name: 'app.firm.settings.document_classifications'
                label: 'Document Classification'
              }
            ]
          }
        )


      if (@Utils.isAuthorized(grant_map, ['InstitutionalSubscription', 'ProductiveSubscription', 'SmartSubscription']) && @is_manager )
        states.push(
          {
            label: 'Documents'
            subStates: [
              {
                label: 'Document Types',
                name: 'app.firm.settings.document_tags'
              }
              {
                label: 'Document Groups',
                name: 'app.firm.settings.document_group_tags',
              }
              {
                name: 'app.firm.settings.document_classifications'
                label: 'Document Classification'
              }
            ]
          }
        )

      states.push(
        { name: 'app.firm.settings.email_templates', label: 'Email Templates' }
        )  

      if @is_investor && @Utils.isAuthorized(grant_map, ['SmartSubscription','InstitutionalSubscription', 'ProductiveSubscription', 'FullSubscription']) && @firm_preferences.enable_inbound_module
        states.push ({
          label: 'Opportunity Vault',
          subStates: [
            { label: 'Configure New Opportunity', name: 'app.firm.settings.manage_opportunity' }
            { label: 'Manage Opportunities', name: 'app.firm.settings.view_opportunities' }
          ]
        })

      if @is_investor and !@is_free_user
        states.push({
          label: 'Rating/Score Map',
          subStates: [
            { label: @headerConstants.RATINGDEFINITION , name: 'app.firm.settings.investment_rating.types' }
            { label: 'Rating/Score Scales', name: 'app.firm.settings.investment_rating.scales' }
          ]
        })

      if !@is_free_user
        states.push ({
          label: 'Review Definitions',
          name: 'app.firm.settings.review_definitions.list'
        })
 
      states.push({
          label: 'Tags and Custom Fields',
          subStates: [
            {
              label: 'Universal',
              name: 'app.firm.settings.all_tags'
            }

            {
              label: 'Firm',
              name: 'app.firm.settings.firm_tags'
            }

            {
              label: 'Strategy',
              name: 'app.firm.settings.strategy_tags'
            }

            {
              label: 'Product',
              name: 'app.firm.settings.product_tags'
            }

            {
              label: 'Vehicle',
              name: 'app.firm.settings.vehicle_tags'
            }

            {
              label: 'Contact',
              name: 'app.firm.settings.contact_tags'
            }

            {
              label: 'Project',
              name: 'app.firm.settings.project_tags'
            }
          ]
        },
        { name: 'app.firm.settings.workflows.list', label: 'Workflow Definitions' }
        )

      if !@is_free_user
        states.push ({
          label: 'CRM'
          subStates: [
            {
              name: 'app.firm.settings.dynamics-crm'
              label: 'Dynamics 365 CRM'
            }
            {
              name: 'app.firm.settings.salesforce-crm'
              label: 'Salesforce CRM'
            }
          ]
        })

      states.push({
          label: 'Data Integrations',
          subStates: [
            { label: 'Report Exports', name: 'app.firm.settings.integrations.export_import' }
            { label: 'API Key', name: 'app.firm.settings.integrations.api' }
        ]
      })

      if @Utils.isDiligencevaultUser()
        states.push({
          label: 'Releases',
          name: 'app.firm.settings.releases.list'
        })


    if @currentUser.firmwide_role.toLowerCase() == @USER_ROLES.SECURITYADMIN
      states.push({
        label: 'Download Audits',
        name: 'app.firm.settings.download_audits'
      })
    @states = states
