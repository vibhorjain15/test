angular.module('diligenceVault').component 'heatmapComponent',{
    bindings:{
        heatmapOptions: '='
        heatmapResponse: '='
        ratingScales: '='
        naColor: '='
        displayAttr:'='
        displayTotalAttr: '='
    }
    templateUrl: 'shared/components/heatmapComponent/template.html'
    controller: 'HeatmapComponentController'
    controllerAs: 'vm'
}