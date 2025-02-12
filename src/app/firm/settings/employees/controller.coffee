class FirmSettingsEmployeesController extends BaseController
  @register 'FirmSettingsEmployeesController'

  @inject 'Restangular', 'Utils', '$q', '$timeout', 'SweetAlert', '$scope', 'toaster', 'ModalFactory',
          'SettingsDataservice', '$rootScope', '$stateParams', '$state', 'USER_ROLES', 'UsersResource', 'DocumentsService', 'userservice','angularEnabled'

  initialize: ->
    @selectedView = "card"
    @is_admin = @Utils.isAdmin()
    @current_user = @Utils.getCurrentUser()
    @currentFirmId = @current_user.firmInfo.id
    @addedUserId = @userservice.getSavedUserId()
    @refreshUsers = false
    @numberOfSuperAdmins = 0
    @userFilter = {
      All: 'All',
      Inactive: 'Deleted',
      Invited: 'Invited',
      Locked: 'Locked'
      Pending: 'PendingApproval'
      Active: 'Active'
    }
    @selectedFilter = @userFilter.Active
    @access_types = []
    @team_members = []
    @copyOfUsers = []

    @$scope.getFirmProfile().then (firm_profile) =>
      @firm_profile = firm_profile

    if @selectedView == 'card'
      @fetchEmployees()
    else
      @getUsersGrid()


    @$rootScope.$on 'teamMember:newAdded', (evt,data) =>
      data.alias = @getRoleAlias(data)
      data.is_new = true
      @copyOfUsers.push data
      @selectedFilter = @userFilter.Invited
      @toggleFilter(@selectedFilter)
      #  *********** Code For scrolling **********
      # if justScroll
      #   @$timeout =>
      #     @scrollToBottom()
      # else
      #   @fetchEmployees()
      #   @refreshUsers = true
      #  *********** Code For scrolling **********


  getAdminCount: ->
    count = 0
    if @copyOfUsers and @copyOfUsers.length
      for member in @copyOfUsers
        if member.firmwide_role_name.toLowerCase() == @USER_ROLES.ADMIN or member.firmwide_role_name.toLowerCase() == @USER_ROLES.SECURITYADMIN
          count += 1
    count

  changeView: (view) =>
    @selectedView = view
    if view == 'grid'
      @getUsersGrid()
    else
      @fetchEmployees()

  fetchEmployees: ->
    @loading = true
    firmId = @Utils.getCurrentFirm().id

    promises = []

    if @is_admin
      promises.push @Restangular.one('firms', @currentFirmId).all('users').getList(include_deleted: true)
      promises.push @Restangular.one('firms', @currentFirmId).all('roles').getList(is_firmwide: true)

    @$q.all(promises).then (responses) =>
      @copyOfUsers = responses[0]
      @roles = responses[1]
      # @copyOfUsers = JSON.parse(JSON.stringify(@team_members))
      for member in @copyOfUsers
        member.alias = @getRoleAlias(member)
        if @addedUserId and member.id == parseInt @addedUserId
          member.is_new = true
        for memberFunction in member.functions
          newStrArr = memberFunction.function_name.split("/")
          firstWord = newStrArr[0].trim()
          secondWord = null
          if newStrArr[1]
            secondWord = newStrArr[1].trim()
          memberFunction.tag2 = if secondWord then "#{firstWord[0]}" + "#{secondWord[0]}" else firstWord[0]

      @$timeout =>
        @loading = false
        if @addedUserId
          @selectedFilter = @userFilter.Invited
        @toggleFilter(@selectedFilter)


  bulkAddToFunctions: =>
    items_arr = @usersGrid.selection.getSelectedRows()
    @ModalFactory.invokeModal 'manage_user_functions',
      resolve:
        usersList: => items_arr
      success: (new_user) =>
        new_user.alias = @getRoleAlias(new_user)
        new_user.is_new = true
        @copyOfUsers.push new_user
        @toggleFilter(@selectedFilter)


  toggleFilter: (filter_type) =>
    @loading = true
    @selectedFilter = filter_type
    if filter_type == @userFilter.Inactive
      @team_members = _(@copyOfUsers).filter((member) =>
            member.status == @userFilter.Inactive
          )
      @loading = false
    else if filter_type == @userFilter.Locked
      @team_members = _(@copyOfUsers).filter((member) =>
            @isUserLocked(member)
          )
      @loading = false
    else if filter_type == @userFilter.Pending
      @team_members = _(@copyOfUsers).filter((member) =>
            member.status == @userFilter.Pending
          )
      @loading = false
    else if filter_type == @userFilter.Invited
      @team_members = _(@copyOfUsers).filter((member) =>
            member.status == @userFilter.Invited
          )
      @loading = false
    else if filter_type == @userFilter.Active
      @team_members = _(@copyOfUsers).filter((member) =>
            member.status == @userFilter.Active
          )
      @loading = false
    else if filter_type == @userFilter.All
      @team_members = JSON.parse(JSON.stringify(@copyOfUsers))
      @loading = false
    if @team_members.length
      @scrollToNewAdded()
    @team_members


  scrollToNewAdded: =>
    userId = null
    for member in @team_members
      if member.is_new
        userId = member.id
        member.is_new = false
        break
    # if userId
      # @$timeout (=>
      #   $('#' + userId).css("background-color", "#fffac7");
      #   $('html,body').animate { scrollTop: $('#' + userId).offset().top - 110 }, 500
      #   @$timeout (=>
      #     $('#' + userId).css("background-color", "");
      #     @userservice.resetSavedUser()
      #   ), 3000
      # ), 2500

  getFunctionTag: (name, tag) =>
    newTag = ""
    inputStr = name.split(/[ /]+/);
    if tag == "tag1"
      if inputStr[0]
        newTag = inputStr[0]
    else
      if inputStr[1]
        newTag = inputStr[1]
    newTag

  changeAccessLevel: (user, role) ->
    params = angular.copy user
    params.firmwide_role = role.id
    @Restangular.all('user_accesslevels').customPUT(params).then (response) =>
      @copyOfUsers = _(@copyOfUsers).map((member) =>
        if member.id == response.id
          response.alias = @getRoleAlias(response)
          response
        else
          member.alias = @getRoleAlias(member)
          member
      )
      @toggleFilter(@selectedFilter)
      @toaster.pop 'success', '', "Role changed successfully", 3000

  goToSelectedEntity: (member)=>
    if member.status != @userFilter.Inactive
      @$state.go("app.firm.settings.permission.detail",{entity_id: member.id, entity_type: 'User', entity_name: member.fullName})

  openRow: (row,col)=>
    if !row.internalRow && col.field != "selectionRowHeaderCol" and row.entity.status != @userFilter.Inactive and  col.field != 'action'
      @$state.go("app.firm.settings.permission.detail",{entity_id: row.entity.id, entity_type: 'User', entity_name: row.entity.fullName})

  displayChangeUserAccessConfirmation: (user, role) ->
    if user.id == this.current_user.id
      @toaster.pop 'error','','Users cannot change role themselves'
      return


    @adminCount = @getAdminCount()
    if (user.firmwide_role_name.toLowerCase() == @USER_ROLES.ADMIN || user.firmwide_role_name.toLowerCase() == @USER_ROLES.SECURITYADMIN) && (@adminCount <= 1 || @team_members.length == 1)
      @toaster.pop 'error','Firm should have at least one admin or security admin','',3000
      return

    fullname = _.compact([user.firstname, user.lastname]).join(' ')

    title = "Are you sure you want to change #{fullname}'s role to "+role.alias+"?"
    text = "Please request user to logout and login again."

    @SweetAlert.confirm({
      title: title
      text: text
      confirmButtonText: 'Yes'
      focusCancel: true
    }).then (isConfirm) =>
      @changeAccessLevel(user, role) if isConfirm.value and isConfirm.value == true

  displayUserRemovalConfirmation: (user) ->
    if user.id is @current_user.id
      return

    @adminsCount  = @getAdminCount()
    if (user.firmwide_role_name.toLowerCase() == @USER_ROLES.ADMIN || user.firmwide_role_name.toLowerCase() == @USER_ROLES.SECURITYADMIN) && @adminsCount <= 1
      @toaster.pop 'error', '', "Firm should have at least one admin or security admin", 3000
      return

    fullname = _.compact([user.firstname, user.lastname]).join(' ')
    is_contact_person = user.id is @firm_profile.contactPerson?.id

    if is_contact_person
      title = "#{fullname} is set as contact person for this firm. Do you still want to remove?"
    else
      title = "Are you sure you want to remove #{fullname}?"

    @SweetAlert.confirm({
      title: title
      confirmButtonText: 'Yes'
      focusCancel: true
    }).then (isConfirm) =>
      @removeUser(user, is_contact_person) if isConfirm.value and isConfirm.value == true

  getUsersGrid: =>
    delete @all_users
    @renderGrid = false
    @all_users = @UsersResource.$new({firm_id: @currentFirmId})
    @$timeout (=>
      @renderGrid = true
    ), 1000

  removeUser: (user, is_contact_person) ->
    if user.accessLevel is 'Invited'
      promise = user.remove()
    else
      promise = @Restangular.one('users', user.id).remove()

    promises = [promise]

    if is_contact_person
      promises.push(@clearContactPerson())

    @$q.all(promises).then =>
      if @selectedView == 'grid'
        @getUsersGrid()
      else
        fullname = _.compact([user.firstname, user.lastname]).join(' ')
        @fetchEmployees()

      msg = ''+fullname+' deleted successfully!'

      @toaster.pop 'success','', msg, 5000

  clearContactPerson: ->
    @firm_profile.contactPerson = null
    @$scope.saveFirmProfile(@firm_profile)

  closeQuickActions: () =>
    @usersGrid.selection.clearSelectedRows()
    items_arr = @usersGrid.grid.rows

    _(items_arr).each (rows) =>
      rows.isSelected = false
      rows.entity.isSelected = false
      @usersGrid.selection.unSelectRow(rows)

    jQuery('input[type="checkbox"]').each (ind) ->
      jQuery(this).prop 'checked', false
      return

    @$scope.vm.show_bulk_actions = false
    @usersGrid.grid.appScope.vm.select_all = false

  toggleSelectAll: (gridApi,rows) =>
    #ui-grid handles the selectall
    #method recieves all the selected rows, loop through all the rows and check all of them group header rows
    angular.forEach rows, (row) =>
      if row.treeNode.parentRow && row.treeNode.parentRow.internalRow
        row.treeNode.parentRow.isSelected = row.isSelected

    #get total selected rows from the grid api
    selectedCount = gridApi.selection.getSelectedRows().length
    selectAll = selectedCount > 0
    @$scope.vm.show_bulk_actions = selectAll
    @usersGrid.grid.appScope.vm.select_all = selectAll
    @totalSelectedRecords = selectedCount

  toggleButtonClick: (grid,row) =>
    #Normal row selection is handled by ui grid
    #But grouped rows we have to handle. Following conditions are for that.
    if row.internalRow
      angular.forEach row.treeNode.children,(children) =>     #loop over all the rows inside this group
        children.row.isSelected = false
        #select only visible rows
        if children.row.visible and row.isSelected
          children.row.isSelected = true             #and select all the rows inside that group

    #Below logic is used to select the group header row if all items inside the group are selected.
    else if row.treeNode.parentRow                            #if the row is a child inside a group
      row.treeNode.parentRow.isSelected = true                #Check the group header row
      angular.forEach row.treeNode.parentRow.treeNode.children,(children) =>
        if !children.row.isSelected                           #if any of the group's children are not checked
          row.treeNode.parentRow.isSelected = false           #then uncheck the group header row

    #Get the number of selected rows
    @totalSelectedRecords = grid.api.selection.getSelectedRows().length

    #Show/hide bulk actions depending on the number of selected rows.
    if @totalSelectedRecords > 0
      @$scope.vm.show_bulk_actions = true
    else
      @$scope.vm.show_bulk_actions = false

  openNewUserDialog: () ->
    accessTypes = @access_types
    @ModalFactory.invokeModal 'new_user',
      resolve:
        existing_user: => false
      success: (new_user) =>
        @selectedFilter = @userFilter.Invited
        new_user.alias = @getRoleAlias(new_user)
        new_user.is_new = true
        @copyOfUsers.push new_user
        @toggleFilter(@selectedFilter)

  isUserLocked: (user) ->
    is_locked = false
    if user.isLocked
      is_locked = true
    is_locked
    #   return false
    #
    # locked_date =  moment().utc(user.lockoutEndDateUtc).format()
    # date_now = moment().utc().format()
    # moment(locked_date).isAfter(date_now)

  updateUserCopy: (user) =>
    userIndex = _(@copyOfUsers).findIndex (userCopy)=>
        userCopy.id == user.id
    if userIndex and userIndex > -1
      @copyOfUsers[userIndex] = user

  unlockUser: (user) ->
    @SettingsDataservice.unlockUser(user.userName).then (response) =>
      if @selectedView == 'grid'
        @getUsersGrid()
      else
        user.isLocked = false
        @toaster.pop 'success', '', "User successfully unlocked!", 5000
        @updateUserCopy(user)
        @toggleFilter(@selectedFilter)

  approveUser: (user) ->
    if @selectedView != 'grid'
      user.loading = true
    params =
      id: user.id
    @Restangular.all('users/approve').customPUT(params).then (response) =>
      @toaster.pop 'success', '', "User successfully approved!", 5000
      if @selectedView == 'grid'
        @getUsersGrid()
      else
        user.status = @userFilter.Active
        user.approved_by = response.approved_by
        user.approved_at = response.approved_at
        user.loading = false
        @updateUserCopy(user)
        @toggleFilter(@selectedFilter)

  getRoleById: (role_id) ->
    role = _(@roles).findWhere({id: role_id})
    if role
      role.alias


  getRandomColor: (member) =>
    lum = -0.25
    hex = String('#' + Math.random().toString(16).slice(2, 8).toUpperCase()).replace(/[^0-9a-f]/gi, '')
    if hex.length < 6
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
    rgb = '#'
    c = undefined
    i = undefined
    i = 0
    while i < 3
      c = parseInt(hex.substr(i * 2, 2), 16)
      c = Math.round(Math.min(Math.max(0, c + c * lum), 255)).toString(16)
      rgb += ('00' + c).substr(c.length)
      i++
    member.style = "background-color:"+ rgb

  resendActivation: (user) ->
    user_clone = $.extend(true, {}, user)
    if @selectedView != 'grid'
      user.loading = true
    @Restangular.all('users/resend_activation').customPUT(user_clone).then (response) =>
      if @selectedView == 'grid'
        @toaster.pop 'success', '', "Activation link resent to #{fullname}", 5000
        @getUsersGrid()
      else
        fullname = _([user.firstname, user.lastname]).compact().join(' ')
        @toaster.pop 'success', '', "Activation link resent to #{fullname}", 5000
        user.loading = false

  scrollToBottom: ->
    jQuery("html, body").animate({ scrollTop: jQuery(document).height() }, 2500)

  formatTagsTooltip: (tagsList) ->
      @DocumentsService.formatTagsTooltip(tagsList)

  getRoleAlias: (role)=>
    roleIndex = _(@roles).findIndex (roleItem)=>
      roleItem.name.toLowerCase() == role.firmwide_role_name.toLowerCase()
    if roleIndex > -1 then @roles[roleIndex].alias else 'Read-write'
