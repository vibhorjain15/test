angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'questionnaire_upload_image',
    controller: 'QuestionnaireUploadImageController'
    size: "xl"
