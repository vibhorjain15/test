angular.module('diligenceVault').factory 'OnboardingFactory', ($interval, $state, DueDiligenceDataservice, Utils, $timeout, Restangular, $q) ->

  new class OnboardingFactory

    $onboardBubble = $('.onboardBubble')

    manager_tour_settings = {
      manager_tour_dd_id: undefined
      diligence_invites: []
      hasNoDDs: 0
    }

    tour_config =
      maskExit: false
      onSkip: =>
        removeTransitionMask()
        $state.go 'app.home'
      afterExit: =>
        removeTransitionMask()
        $state.go 'app.home'
      steps: []

    module_specific_steps = {
      product_tour_menu_item: [
          {
            selector: '#js-product-tour'
            onboard: "If you need to go through the tutorial anytime again, you will find it here. Let's start, click on Next!"
            options:
              beforeEntering: =>
                addTransitionMask()
                isHidden = $('#js-product-tour').is(':hidden')
                if isHidden
                  $timeout =>
                    $( "#js-help-nav-btn" ).trigger( "click" )
                  , 100
              onNext: =>
                removeTransitionMask()
                enableClicks('#js-product-tour')
                isHidden = $('#js-product-tour').is(':hidden')
                if !isHidden
                  $( "#js-help-nav-btn" ).trigger( "click" )
              callback: =>
                removeTransitionMask()
                disableClicks('#js-product-tour')
              onSkip: =>
                enableClicks('#js-product-tour')
              delay: 500
          }
        ]
      firm_settings_menu_item: [
          {
            selector: '#js-firm-settings'
            onboard: "Manage your firm settings here!"
            options:
              onPrevious: =>
                isHidden = $('#js-firm-settings').is(':hidden')
                if !isHidden
                  $( "#settings-toggle" ).trigger( "click" )
              beforeEntering: =>
                addTransitionMask()
                $timeout =>
                  $( "#settings-toggle" ).trigger( "click" )
                , 50
              onNext: =>
                isHidden = $('#js-firm-settings').is(':hidden')
                enableClicks('#js-firm-settings')
                if !isHidden
                  $( "#settings-toggle" ).trigger( "click" )
              callback: =>
                removeTransitionMask()
                disableClicks('#js-firm-settings')
              onSkip: =>
                enableClicks('#js-firm-settings')
              delay: 500
            accessible_to: ['admin']
          }
        ]
      
      firm_add_team_members: [
          {
            selector: '#js-add-team-members'
            onboard: 'Add team members, it’s fun when more people are around!'
            options:
              beforeEntering: =>
                addTransitionMask()
                $state.go 'app.firm.settings.employees'
              callback: =>
                removeTransitionMask()
                disableClicks('#js-add-team-members')
              onSkip: =>
                enableClicks('#js-add-team-members')
              delay: 500
            accessible_to: ['admin']
          }
        ]
      
      diligence_projects_menu_item: [
          {
            selector: '.js-diligence-projects'
            onboard: 'Find all your invites and in-progress diligence projects here!'
            options:
              onPrevious: =>
                isHidden = $('.js-diligence-projects').is(':hidden')
                if !isHidden
                  $( ".js-menu-diligence" ).removeClass( "open" )
              beforeEntering: =>
                addTransitionMask()
                $timeout =>
                  isHidden = $('.js-diligence-projects').is(':hidden')
                  if isHidden
                    $( ".js-menu-diligence" ).addClass( "open" )
                , 50
              onNext: =>
                isHidden = $('.js-diligence-projects').is(':hidden')
                enableClicks('.js-diligence-projects')
                if !isHidden
                  $( ".js-menu-diligence" ).removeClass( "open" )
              callback: =>
                removeTransitionMask()
                disableClicks('.js-diligence-projects')
              onSkip: =>
                enableClicks('.js-diligence-projects')
              delay: 500
            hidden_from: ['FormADVSubscription','FormADVAnalyticsSubscription']
          }
        ]
      diligence_projects_no_dds: [
          {
            selector: '.js-projects-no-dds'
            onboard: 'No Diligence Projects here!'
            options:
              beforeEntering: =>
                addTransitionMask()
                $state.go 'app.diligence.projects.activity', type: 'in-progress'
              onNext: =>
                enableClicks('.js-projects-no-dds')
              callback: =>
                removeTransitionMask()
                disableClicks('.js-projects-no-dds')
              onSkip: =>
                enableClicks('.js-projects-no-dds')
              delay: 4000
            accessible_to: ['hasNoDDs']
            hidden_from: ['FormADVSubscription','FormADVAnalyticsSubscription']
          }
        ]
      diligence_project: [
          {
            selector: '#js-projects-in-progress'
            onboard: "You will find all the investor requests and all ongoing diligence projects here!"
            options:
              beforeEntering: =>
                addTransitionMask()
                $state.go 'app.diligence.projects.activity', type: 'in-progress'
              callback: =>
                removeTransitionMask()
              delay: 500
            hidden_from: ['hasNoDDs', 'FormADVSubscription','FormADVAnalyticsSubscription']
          }
          {
            selector: '#js-dd-grid'
            onboard: 'View investor requests and all the ongoing diligence projects here!'
            options:
              beforeEntering: =>
                addTransitionMask()
                $state.go 'app.diligence.projects.activity', type: 'in-progress'
              callback: =>
                removeTransitionMask()
                disableClicks('#js-dd-grid')
              onSkip: =>
                enableClicks('#js-dd-grid')
              delay: 500
            hidden_from: ['hasNoDDs', 'FormADVSubscription','FormADVAnalyticsSubscription']
          }
          {
            selector: '.js-projects-dd-name'
            onboard: 'This is an ongoing diligence project!'
            options:
              beforeEntering: =>
                addTransitionMask()
                $state.go 'app.diligence.projects.activity', type: 'in-progress'
              callback: =>
                removeTransitionMask()
              delay: 500
            accessible_to: ['hasDD']
            hidden_from: ['hasNoDDs', 'FormADVSubscription','FormADVAnalyticsSubscription']
          }
        ]
      diligence_project_questionnaire: [
          {
            selector: '.js-dd-questionnaire'
            onboard: 'Questionnaire Tab lets you to check out the diligence questionnaire!'
            options:
              beforeEntering: =>
                addTransitionMask()
                $state.go 'app.diligence.project.questionnaire', {diligenceId: manager_tour_settings.manager_tour_dd_id}
              callback: =>
                disableBodyScroll()
                removeTransitionMask()
              onSkip: =>
                enableBodyScroll()
              onNext: =>
                enableBodyScroll()
              delay: 500
            accessible_to: ['hasDD']
            hidden_from: ['hasNoDDs', 'FormADVSubscription','FormADVAnalyticsSubscription']
          }
          {
            selector: '#js-questionnaire-parent-tpl'
            onboard: "Fill out questionnaire, slice and dice, assign, add to-dos, and watch as the answered count goes up!"
            options:
              beforeEntering: =>
                addTransitionMask()
                $state.go 'app.diligence.project.questionnaire', {diligenceId: manager_tour_settings.manager_tour_dd_id}
              callback: =>
                removeTransitionMask()
                disableClicks('#js-questionnaire-parent-tpl')
              onSkip: =>
                enableClicks('#js-questionnaire-parent-tpl')
              delay: 2000
            accessible_to: ['hasDD']
            hidden_from: ['hasNoDDs', 'FormADVSubscription','FormADVAnalyticsSubscription']
          }
          {
            selector: '#js-collaborate-with-team'
            onboard: 'Collaborate with your team… divide and conquer in a good way!'
            options:
              beforeEntering: =>
                addTransitionMask()
                $state.go 'app.diligence.project.questionnaire', {diligenceId: manager_tour_settings.manager_tour_dd_id}
              callback: =>
                removeTransitionMask()
                disableClicks('#js-collaborate-with-team')
              onSkip: =>
                enableClicks('#js-collaborate-with-team')
              delay: 500
            accessible_to: ['hasDD']
            hidden_from: ['hasNoDDs', 'FormADVSubscription','FormADVAnalyticsSubscription']
          }
          {
            selector: '.js-dd-assignments-link'
            onboard: "Find all the team assignments at 'Assignments' Tab!"
            options:
              beforeEntering: =>
                addTransitionMask()
                $state.go 'app.diligence.project.assignment_status', {diligenceId: manager_tour_settings.manager_tour_dd_id}
              callback: =>
                removeTransitionMask()
              delay: 500
            accessible_to: ['hasDD']
            hidden_from: ['hasNoDDs', 'FormADVSubscription','FormADVAnalyticsSubscription']
          }
          {
            selector: '#js-dd-assignments'
            onboard: 'Review your team assignments here!'
            options:
              beforeEntering: =>
                addTransitionMask()
                $state.go 'app.diligence.project.assignment_status', {diligenceId: manager_tour_settings.manager_tour_dd_id}
              callback: =>
                removeTransitionMask()
              delay: 500
            accessible_to: ['hasDD']
            hidden_from: ['hasNoDDs', 'FormADVSubscription','FormADVAnalyticsSubscription']
          }
          {
            selector: '.js-dd-documents'
            onboard: 'View all the diligence specific documents here!'
            options:
              beforeEntering: =>
                addTransitionMask()
                $state.go 'app.diligence.project.documents.list', {diligenceId: manager_tour_settings.manager_tour_dd_id}
              callback: =>
                removeTransitionMask()
              delay: 500
            accessible_to: ['hasDD']
            hidden_from: ['hasNoDDs', 'FormADVSubscription','FormADVAnalyticsSubscription']
          }
          {
            selector: '#js-dd-docs-list'
            onboard: 'Attach supporting documents… show off your diligence!'
            options:
              beforeEntering: =>
                addTransitionMask()
                $state.go 'app.diligence.project.documents.list', {diligenceId: manager_tour_settings.manager_tour_dd_id}
              callback: =>
                removeTransitionMask()
                disableClicks('#js-dd-docs-list')
              onSkip: =>
                enableClicks('#js-dd-docs-list')
              delay: 500
            accessible_to: ['hasDD']
            hidden_from: ['hasNoDDs', 'FormADVSubscription','FormADVAnalyticsSubscription']
          }
        ]
      feedback_menu_item: [
          {
            selector: '#js-feedback-li'
            onboard: 'Give us your feedback… we love to hear the good and the bad!'
            options:
              onPrevious: =>
                isHidden = $('#js-feedback-li').is(':hidden')
                if !isHidden
                  $( "#js-help-nav-btn" ).trigger( "click" )
              beforeEntering: =>
                addTransitionMask()
                isHidden = $('#js-feedback-li').is(':hidden')
                if isHidden
                  $( "#js-help-nav-btn" ).trigger( "click" )
              onNext: =>
                isHidden = $('#js-feedback-li').is(':hidden')
                enableClicks('#js-feedback-li')
                if !isHidden
                  $( "#js-help-nav-btn" ).trigger( "click" )
              callback: =>
                removeTransitionMask()
                disableClicks('#js-feedback-li')
              onSkip: =>
                enableClicks('#js-feedback-li')
              delay: 500
          }
        ]
      feedback_menu_item: [
          {
            selector: '#js-feedback-li'
            onboard: 'Give us your feedback… we love to hear the good and the bad!'
            options:
              onPrevious: =>
                isHidden = $('#js-feedback-li').is(':hidden')
                if !isHidden
                  $( "#js-help-nav-btn" ).trigger( "click" )
              beforeEntering: =>
                addTransitionMask()
                isHidden = $('#js-feedback-li').is(':hidden')
                if isHidden
                  $( "#js-help-nav-btn" ).trigger( "click" )
              onNext: =>
                isHidden = $('#js-feedback-li').is(':hidden')
                enableClicks('#js-feedback-li')
                if !isHidden
                  $( "#js-help-nav-btn" ).trigger( "click" )
              callback: =>
                removeTransitionMask()
                disableClicks('#js-feedback-li')
              onSkip: =>
                enableClicks('#js-feedback-li')
              delay: 500
            accessible_to: ['hasDD']
            hidden_from: ['hasNoDDs', 'FormADVSubscription','FormADVAnalyticsSubscription']
          }
        ]

      firm_profile: [
          {
            selector: '#js-firms-profile'
            onboard: 'Setup your firm’s profile, you know you want to!'
            options:
              beforeEntering: =>
                $state.go 'app.firm.settings.profile'
                addTransitionMask()
              callback: =>
                removeTransitionMask()
              delay: 500
            accessible_to: ['admin']
          }
        ]

      firm_preferences: [
          {
            selector: '#js-firms-preferences'
            onboard: 'Since you are an admin, update your firm\'s settings here!'
            options:
              beforeEntering: =>
                addTransitionMask()
                $state.go 'app.firm.settings.preferences'
              callback: =>
                removeTransitionMask()
              delay: 500
            accessible_to: ['admin']
          }
      ]
    }

    disableBodyScroll = =>
      $('body').addClass('noscroll')
    
    enableBodyScroll = =>
      $('body').removeClass('noscroll')

    enableClicks = (element)=>
      selectedElement = $(element)
      selectedElement.removeClass('pointer-events-none')

    disableClicks = (element)=>
      selectedElement = $(element)
      selectedElement.addClass('pointer-events-none')

    addTransitionMask = =>
      $onboardBubble.addClass('semi-transparent')

    removeTransitionMask = =>
      $onboardBubble.removeClass('semi-transparent')

    getTourGrantMap: =>
      tour_grant_map =
        hasDD: (manager_tour_settings.manager_tour_dd_id)
        hasDDInvites: (manager_tour_settings.diligence_invites.length)
        hasNoDDs: (manager_tour_settings.hasNoDDs)
      utils_grant_map = Utils.getGrantMap()
      tour_grant_map = angular.extend(tour_grant_map, utils_grant_map)

      tour_grant_map

    getUserDiligences: =>
      DueDiligenceDataservice.getDiligences({type: 'in-progress'}).then (response) =>
        selected_dd = null
        if response.length
          i = 0
          while i < response.length
            if !((_(['Approved', 'NotApproved', 'Deleted']).contains(response[i].status) or Utils.isReadOnly()) and (response[i].diligence_type != 'dd_profile')) and (response[i].question_count > 0)
              selected_dd = response[i]
              break
            i++
          if selected_dd
            manager_tour_settings.manager_tour_dd_id = selected_dd.id

    getDiligenceInvites: =>
      DueDiligenceDataservice.getDiligences({type: 'in-progress'}).then (response) =>
        if response.length
          manager_tour_settings.diligence_invites = response

    getAllDDsCount: =>
      Restangular.all('diligences').customGET('counts')
      .then (response) =>
        manager_tour_settings.hasNoDDs = not response.has_projects

    returnProductTourConfig: =>
      promises = []
      promises.push @getUserDiligences()
      promises.push @getDiligenceInvites()
      promises.push @getAllDDsCount()

      $q.all(promises).then =>
        tour_grant_map = @getTourGrantMap()

        #cloning to ensure main tour config is not affected
        tour_config_clone = $.extend(true, {}, tour_config)

        #cloning to ensure main tour steps array is not affected
        module_specific_steps_clone = $.extend(true, {}, module_specific_steps)

        _.each module_specific_steps_clone, (module_steps) ->
          _.each module_steps, (step) ->
            tour_config_clone.steps.push(step)

        #exportable object (to the tour API)
        tour_config_for_export = $.extend(true, {}, tour_config_clone)
        tour_config_for_export.steps = []

        _(tour_config_clone.steps).each (tour_item, j) =>
          is_accessible = Utils.isAuthorized(tour_grant_map, tour_item.accessible_to, tour_item.hidden_from)
          if is_accessible
            tour_config_for_export.steps.push(tour_item)

        return tour_config_for_export

    getProductTourConfig: =>
      return @returnProductTourConfig()