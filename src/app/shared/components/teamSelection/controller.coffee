class TeamSelectionController extends BaseController
    @register 'TeamSelectionController'

    @inject '$attrs', '$scope', 'Restangular','$timeout', '$injector','Utils','$q','PermissionDataservice','BaseDataService'

    initialize: ->
        @current_user = @Utils.getCurrentUser()
        @currentFirmId = @current_user.firmInfo.id
        @EveryonePermissionTypeId = 2
        @HighestRoleObj =
          id: -1,
          name: 'Highest Access Level',
          alias: 'Highest Access Level',
          description: 'it will automatically set their permission access level to their highest existing access level that they have for any team or permission assignments. Example: If a user has contributor access to Product A and owner access to Template A, then they will automatically receive owner access by default.'
        @loading_data = true
        @$scope.$watch 'vm.accessList', (value)=>
            if value
                @loading_data = false
                if !@selectedTeams
                    @selectedTeams = {
                        permissionType: null
                        disableAssignmentDetails: false
                        permissions:[{
                          team: null
                          access: null
                        }]
                    }

        @PermissionDataservice.getRoles(@currentFirmId).then (response)=>
          @roles = response

        @BaseDataService.getPermissionTypes().then (response)=>
          @permissionTypes = response
          @everyonePermissionType = _(@permissionTypes).find((x) => x.name == 'Everyone');
          if (!@everyonePermissionType)
            # temp workaround until SOW is signed - BE is not returning this type
            @everyonePermissionType =
              id: @EveryonePermissionTypeId
          @selectedTeams.permissionType = response[0].id
          @onPermissionTypeChange(response[0].id);

    onPermissionTypeChange: =>
      @selectedTeams.disableAssignmentDetails = @selectedTeams.permissionType == @everyonePermissionType.id;
      #change the value of form controls based on the type selection
      if @selectedTeams.disableAssignmentDetails and @selectedTeams.permissions.length > 1
        @selectedTeams.permissions.splice(1, @selectedTeams.permissions.length - 1)

      _(@selectedTeams.permissions).each (teams)=>
        teams.team = null
        teams.access = null
      if @roles
        @updateRolesData()

    updateRolesData: () =>
      if @selectedTeams.disableAssignmentDetails
        if _(@roles).findIndex((x) => x.id == @HighestRoleObj.id) == -1
          #add the highest role option
          this.roles.unshift(@HighestRoleObj);
      else
        index = @roles.findIndex((x) => x.id == @HighestRoleObj.id)
        if index > -1
          @roles.splice(index, 1)

    addNewAccess: =>
        @selectedTeams.permissions.push {
            team: null
            access: null
        }

    removeAccess: (access)=>
        if @selectedTeams.permissions.length > 1
            index = @selectedTeams.permissions.indexOf(access)
            @selectedTeams.permissions.splice(index,1)
        else
            @selectedTeams.permissions[0].team = null
            @selectedTeams.permissions[0].access = null
        @setValidationMessage()

    setValidationMessage: =>
      _(@teamselectionForm.$$controls).each((formItem)=>
          if formItem.$name and formItem.$name.indexOf('team') > -1 and formItem.$modelValue
              map = _(@selectedTeams.permissions).filter((team)=>
                  team.team == formItem.$modelValue
              )
              occurence = map.length
              formItem.$setValidity('duplicateTeam', occurence < 2)
      )
