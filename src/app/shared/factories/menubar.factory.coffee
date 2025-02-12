angular.module('diligenceVault').factory 'MenubarFactory', (Utils, $compile) ->
  entity_cta = Utils.getEntityCTA()
  entity_type = Utils.getEntityType()
  is_investor = Utils.isInvestor()

  new class MenubarFactory
    # showNewQAView = false

    menu_items = [
      {
        label: 'New'
        iconName: 'plus'
        custom_class: 'js-menu-new-action'
        hidden_from: ['securityAdmin', 'FreeInvestor']
        submenu_items: [
          {
            label: 'Request'
            stateName: 'app.diligence.invite'
            accessible_to: [ 'investor' ]
            freeuser_icon: 'upgrade'
          }

          {
            label: 'Project'
            stateName: 'app.diligence.newddq'
            accessible_to: [ 'manager' ]
            freeuser_icon: 'upgrade'
            premiumTitle:'Unlock Project Creation',
            premiumText:'Don’t miss out on efficient due diligence! Start creating projects instantly.',
          }

          {
            label: 'Investor Pitch'
            stateName: 'app.inbound.investor_pitch'
            accessible_to: [ 'manager' ]
            customTagLabel: "New"
            
          }

          {
            label: 'Investor'
            modal_name: 'manage_firm',
            accessible_to: ['manager']
            freeuser_icon: 'upgrade'
            premiumTitle:'Unlock Investor Firm Creation',
            premiumText:'Don\'t miss out - create your new investor firm today!',
          }

          {
            label: 'Firm'
            modal_name: 'manage_firm',
            accessible_to: ['investor']
            freeuser_icon: 'upgrade'
          }

          {
            label: 'Strategy'
            modal_name: 'manage_master_fund',
          }

          {
            label: entity_type
            modal_name: 'manage_fund',
            hidden_from: [ 'FreeInvestor']
          }

          {

            label: 'Vehicle',
            modal_name: 'manage_vehicle',
            accessible_to: [ 'investor','manager'],
            hidden_from: [ 'FreeInvestor' ]
            modal_options:
              resolve:
                source:
                  text: 'main_menu_new'
          }

          {
            label: 'Contact',
            modal_name: 'manage_contact',
            freeuser_icon: 'upgrade'
            premiumTitle:'Unlock Add New Contact',
            premiumText:'Don\'t miss out on valuable connections! Add new contacts instantly.',
          }

          {
            label: 'Template'
            modal_name: 'manage_template',
            accessible_to: [ 'investor','manager']
            freeuser_icon: 'upgrade'
            premiumTitle:'Unlock New Template Creation',
            premiumText:'Don\'t miss out - customize templates now!',
          }

          {
            label: 'Document / Folder'
            modal_name: 'manage_document'
            freeuser_icon: 'upgrade'
            modal_options:
              resolve:
                documentOptions:
                  mode: 'update'
                  source: 'main_menu_new'
                  editAccessGranted: true

            premiumTitle:'Unlock Document Repository',
            premiumText:'Don\'t miss out - access all your documents now!',
          }

          {

            label: 'Presentation Design'
            modal_name: 'add_report_template'
            accessible_to: ['ProductiveSubscription']
            hidden_from: [ 'FreeInvestor']
            freeuser_icon: 'upgrade'
            hidden_from: ['manager', 'hidePresentationModule']
          }

          {
            label: 'Presentation Reports',
            stateName: 'app.reports.new_report'
            accessible_to: ['ProductiveSubscription']
            hidden_from: ['manager', 'hidePresentationModule', 'FreeInvestor']
            freeuser_icon: 'upgrade'
          }
        ]
      }
      {
        label: 'Home'
        iconName: 'dash'
        stateName: 'app.dash'
        matcher: /^app.dash(.*)/
        accessible_to: ['manager']
        hidden_from: ['securityAdmin']
        submenu_items: [
          {
            label: 'My Work'
            stateName: 'app.dash'
            stateParams: dashType: 'my-work'
          }
          {
            label: 'Dashboard'
            stateName: 'app.dash'
            stateParams: dashType: 'Dashboard'
          }
        ]
      }
      {
        label: 'Home'
        iconName: 'dash'
        stateName: 'app.dash'
        matcher: /^app.dash(.*)/
        accessible_to: ['investor']
        hidden_from: ['securityAdmin']
        submenu_items: [
          {
            label: 'My Work'
            stateName: 'app.dash'
            stateParams: dashType: 'my-work'
          }
          {
            label: 'Activity Dash'
            stateName: 'app.dash'
            stateParams: dashType: 'Activity'
          }
          {
            label: 'Monitoring Dash'
            stateName: 'app.dash'
            stateParams: dashType: 'Monitor'
          }
        ]
      }
      {
        label: 'Content'
        iconName: 'briefcase'
        custom_class: 'js-menu-diligence'
        hidden_from: ['securityAdmin','investor']
        freeuser_icon: 'upgrade'
        submenu_items: [
          {
            label: 'Q/A Center'
            stateName: 'app.content.questions'
            accessible_to: ['manager']
          }
          {
            label: 'Documents'
            stateName: 'app.content.documents'
          }
           {
            label: "Manage AUM & TR"
            stateName: 'app.content.manage_aum_tr'
          }
        ]
      }
      #{
      #  label: 'Discover'
      #  iconName: 'bulb'
      #  stateName: 'app.discover.structure'
      #  stateParams: structure: 'hedge'
      #  matcher: /^app.discover(.*)/
      #}
      {
        label: 'Diligence'
        iconName: 'briefcase'
        custom_class: 'js-menu-diligence'
        hidden_from: ['securityAdmin']
        freeuser_icon: 'upgrade'
        submenu_items: [
          {
            label: 'Projects'
            stateName: 'app.diligence.projects.activity'
            stateParams: type: 'in-progress'
            matcher: /^app.diligence.project(.*)/
            custom_class: 'js-diligence-projects'
          }
          {
            label: 'Templates'
            stateName: 'app.diligence.templates'
            hidden_from: [ 'FreeInvestor']
            freeuser_icon: 'upgrade'
            premiumTitle:'Unlock New Template Creation',
            premiumText:'Don\'t miss out - customize templates now!',
          }
          {
            label: 'Documents'
            stateName: 'app.content.documents'
            hidden_from: [ 'manager']
          }
          {
            label: "Excel Download"
            stateName: 'app.diligence.excel_sync.detail'
            stateParams: sync_type: 'download'
          }
          {
            label: "Excel Upload"
            stateName: 'app.diligence.excel_sync.list'
            stateParams: sync_type: 'download'
          }
        ]
      }
      {
        label: 'Manage'
        iconName: 'monitor'
        stateName: 'app.monitor'
        matcher: /^app.monitor(.*)/
        hidden_from: ['FormADVSubscription', 'FormADVAnalyticsSubscription','securityAdmin']
        submenu_items: [
          {
            label: 'My Firm'
            stateName: 'app.monitor.my_firm.profile.ddqs'
            accessible_to: ['manager']
          }
          {
            label: 'Firms'
            stateName: 'app.monitor.firms'
            accessible_to: ['investor']
          }
          {
            label: 'Strategies'
            stateName: 'app.monitor.strategies'
          }
          {
            label: Utils.standardPluralize(entity_type)
            stateName: 'app.monitor.investments'
          }
          {
            label: 'Vehicles'
            stateName: 'app.monitor.vehicles'
          }
          {
            label: 'Investors'
            stateName: 'app.monitor.firms'
            accessible_to: ['manager']
          }
          {
            label: 'Contacts'
            stateName: 'app.monitor.contacts'
            matcher: /^app.monitor.contact(.*)/
          }
          {
            label: "AUM & Track Record"
            stateName: 'app.content.manage_aum_tr'
            hidden_from: [ 'manager']
          }
        ]
      }
      {
        label: 'Analyze'
        iconName: 'analyze'
        custom_class: 'js-menu-analyze'
        accessible_to: ['ProductiveInvestorSubscription','FormADVAnalyticsSubscription','PowerBISubscription']
        hidden_from: ['securityAdmin']
        submenu_items: [
          {
            label: 'Rating/Score'
            stateName: 'app.analyze.scorecard'
            accessible_to: ['ProductiveSubscription']
            hidden_from: ['manager']
          }
          {
            label: 'Comparisons'
            stateName: 'app.analyze.compare.due_diligence_list'
            matcher: /^app.analyze.compare.due_diligences/
            accessible_to: ['ProductiveSubscription']
            hidden_from: ['manager']
          }
          {
            label: 'Benchmarking'
            stateName: 'app.analyze.templates'
            accessible_to: ['ProductiveSubscription']
            hidden_from: ['manager']
          }
          {
            label: 'Portfolio Analytics'
            stateName: 'app.analyze.portfolio'
            accessible_to: ['FormADVAnalyticsSubscription', 'ProductiveSubscription']
            hidden_from: ['manager']
          }
          {
            label: 'Advanced Reports'
            stateName: 'app.advanced_reporting'
            accessible_to: ['PowerBISubscription']
          }
        ]
      }
      #{
      #  label: 'Discuss'
      #  iconName: 'comments-o'
      #  accessible_to: [ 'InstitutionalSubscription' ]
      #  hidden_from: [ 'ProductiveSubscription' ]
      #  stateName: 'app.discuss.explore'
      #  matcher: /^app.discuss(.*)/
      #  stateParams: sort: 'Top'
      #}
      {
        label: 'Data Hub'
        iconName: 'file'
        hidden_from: ['securityAdmin']
        submenu_items: [
          {
            label: "ADV Portfolio"
            stateName: 'app.form_adv.regulatory_monitor.portfolio',
            matcher: /^app.form_adv.regulatory_monitor.portfolio/
          }
          {
            label: "ADV Search"
            stateName: 'app.form_adv.adv_search',
            matcher: /^app.form_adv.adv_search/
          }
          {
            label: "Manage Thresholds"
            stateName: 'app.form_adv.thresholds',
            matcher: /^app.form_adv.thresholds/
            hidden_from: ['FreeInvestor']
            accessible_to: ['SmartSubscription','FormADVSubscription', 'FormADVAnalyticsSubscription', 'ProductiveSubscription', 'FreeSubscription'],
            freeuser_icon: 'upgrade'
            premiumTitle:'Unlock Manage Threshold',
            premiumText:'Create tailored thresholds for key information.',
          }
          {
            label: "Data Hub Resources"
            stateName: 'app.data_hub.resources',
            matcher: /^app.data_hub.resources/
          }
          # {
          #   label: "Mercer Fund Watch"
          #   stateName: 'app.data_hub.mfw_research',
          #   matcher: /^app.data_hub.mfw_research/
          # }
        ]
      }
      {
        label: 'Reports'
        hidden_from: ['manager', 'FreeSubscription','securityAdmin']
        submenu_items: [
          {
            label: "Excel Data Exports"
            stateName: 'app.reports.exports'
            matcher: /^app.reports.exports(.*)/
          }
          {
            label: "Presentation Reports"
            stateName: 'app.reports.realtime-reports.list'
            matcher: /^app.reports.realtime-reports(.*)/
            accessible_to: ['ProductiveSubscription']
            hidden_from: ['hidePresentationModule']
          }
          {
            label: "Presentation Design"
            stateName: 'app.reports.templates.list'
            matcher: /^app.reports.templates(.*)/
            accessible_to: ['ProductiveSubscription']
            hidden_from: ['hidePresentationModule']
          }

        ]
      }
      {
        label: 'Partnerships'
        stateName: 'app.partnership'
        hidden_from: ['securityAdmin']
        matcher: /^app.partnership(.*)/
      }
    ]

    # if !showNewQAView
    #   menu_items[1].submenu_items[1].stateName =  'app.content.questionsOldView'

    grant_map = null

    getMenuItems: ->
      grant_map = Utils.getGrantMap()

      #cloning to ensure main array is not affected
      menu_items_clone = $.extend(true, [], menu_items)

      _(menu_items_clone).filter(@filterMenuItem, @)

    filterMenuItem: (menu_item) ->
      accessible_to = menu_item.accessible_to
      hidden_from = menu_item.hidden_from

      is_accessible = Utils.isAuthorized(grant_map, accessible_to, hidden_from)

      return unless is_accessible

      if menu_item.submenu_items
        menu_item.submenu_items = _(menu_item.submenu_items).filter(@filterMenuItem, @)

      true

    appendMenuItem: ($container, scope, menu_item, is_submenu) ->
      childScope = scope.$new()
      childScope.menu_item = menu_item

      directive = @getMenuItemDirective(menu_item, is_submenu)

      $container.append $compile(directive)(childScope)

    getMenuItemDirective: (menu_item, is_submenu) ->
      if menu_item.submenu_items?
        directive = "<menu-item-plus></menu-item-plus>"
      else
        stateParams = menu_item.stateParams && angular.toJson(menu_item.stateParams)
        modal_name = menu_item.modal_name
        modal_options = menu_item.modal_options && angular.toJson(menu_item.modal_options)
        custom_class = menu_item.custom_class
        freeuser_icon = menu_item.freeuser_icon
        directive = "<menu-item state-name='#{menu_item.stateName}' " +
                                (if stateParams then "state-params='#{stateParams}' " else '') +
                                (if modal_name then "modal-name='#{modal_name}' " else '') +
                                (if modal_options then "modal-options='#{modal_options}' " else '') +
                                (if custom_class then "custom-class='#{custom_class}' " else '') +
                                (if freeuser_icon then "user-icon='#{freeuser_icon}' " else '') +
                                (if is_submenu then 'sub-menu-item' else '') + ">" +
                    "</menu-item>"

