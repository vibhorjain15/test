angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'upload_user_avatar',
    controller: 'UploadUserAvatarController'
    backdrop: 'static'
