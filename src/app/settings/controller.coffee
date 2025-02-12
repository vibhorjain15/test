class SettingsController extends BaseController
  @register 'SettingsController'

  @inject 'Utils','USER_ROLES'

  initialize: ->
    @currentUser = @Utils.getCurrentUser()
    @initializeSettingsMenu()

  initializeSettingsMenu: ->
    states = [
      { name: 'app.settings.profile', label: 'My Profile' }
      { name: 'app.settings.preferences', label: 'My Preferences' }
      { name: 'app.settings.my_accounts', label: 'My Accounts' }
      { name: 'app.settings.account', label: 'Password Settings' }
      {
        label: 'Security',
        subStates: [
          {
            name: 'app.settings.security.two_factor_authentication.status',
            label: 'Two-Factor Authentication',
            matcher: /^app.settings.security.two_factor_authentication/
          }
          { name: 'app.settings.security.account_activity', label: 'Account Activity' }
          { name: 'app.settings.security.my_token', label: 'My Token' }
        ]
      }
    ]
    if @currentUser.firmwide_role.toLowerCase() != @USER_ROLES.SECURITYADMIN
      states.push { name: 'app.settings.email_notifications', label: 'Email Notifications' }
    states.push { name: 'app.settings.my_permissions', label: 'My Permissions' }
    states.push { name: 'app.settings.my_admins', label: 'My Admins' }

    @states = states
