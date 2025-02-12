angular.module('diligenceVault').config ($authProvider, baseUrl) ->
  $authProvider.baseUrl = baseUrl
  $authProvider.loginUrl = '/auth/token'
  $authProvider.logoutRedirect = null
  $authProvider.signupUrl = '/Account/Register'
  $authProvider.tokenName = 'access_token'
  $authProvider.tokenPrefix = 'dv' # Local Storage name prefix
  $authProvider.loginOnSignup = false
  $authProvider.signupRedirect = null
  $authProvider.loginRedirect = null
  $authProvider.storageType = 'localStorage'
