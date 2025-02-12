angular.module('diligenceVault').component 'tagsManager',{
  bindings:{
    tag: '<'
    tagsValue: '='
  }
  templateUrl: 'shared/components/tagsManager/template.html'
  controller: 'TagsManagerController'
  controllerAs: 'vm'
}