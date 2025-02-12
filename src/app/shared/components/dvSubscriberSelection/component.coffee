angular.module('diligenceVault').component 'dvSubscriberSelection',{
  bindings:{
      selection: '='
      selectionChanged: '&'
      singleMode: '='
      functions: '='
  }
  templateUrl: 'shared/components/dvSubscriberSelection/template.html'
  controller: 'SubscriberSelectionController'
  controllerAs: 'vm'
}