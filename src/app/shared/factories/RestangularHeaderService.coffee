angular.module('diligenceVault').factory 'RestangularHeaderService', (baseData,Restangular) ->

    new class RestangularHeaderService
        RestangularWithHeader: (url, status)=>
            Restangular.withConfig((RestangularConfigurer)=>
                if url
                    RestangularConfigurer.setDefaultHeaders({
                        'page-url': url
                    })
                if status
                    RestangularConfigurer.setDefaultHeaders({
                        'diligence-status': status.toLowerCase()
                    })
            )
