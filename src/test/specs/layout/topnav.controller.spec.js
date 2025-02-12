describe('TopNavController', function() {
    var controller, $scope;

    beforeEach(function() {
        module('diligenceVault');
        specHelper.injector(function($controller, $state, $rootScope) {});
    });

    beforeEach(function() {
        $scope = $rootScope.$new();
        controller = $controller('TopNavController', {$scope: $scope});
    });

    describe('toggleSideBarNav', function() {
        it('should toggle is_sidebarnav_collapsed', function() {
            controller.toggleSideBarNav();
            expect($rootScope.is_sidebarnav_collapsed).to.be.true;
            controller.toggleSideBarNav();
            expect($rootScope.is_sidebarnav_collapsed).to.be.false;
        });

        it('should used the specified value for toggling sidebarnav', function() {
            $rootScope.is_sidebarnav_collapsed = false;
            controller.toggleSideBarNav(false);
            expect($rootScope.is_sidebarnav_collapsed).to.be.false;

            $rootScope.is_sidebarnav_collapsed = true;
            controller.toggleSideBarNav(true);
            expect($rootScope.is_sidebarnav_collapsed).to.be.true;
        })
    });

    describe('resizeSidebarNav', function() {
        it('should expand sidebarnav when screen width is >= 992px', function() {
            $rootScope.is_sidebarnav_collapsed = true;
            window.innerWidth = 1024;
            $rootScope.$broadcast('rendered:sidebarnav');

            expect($rootScope.is_sidebarnav_collapsed).to.be.false;
        });

        it('should collapse sidebarnav when screen width is < 992px', function() {
            $rootScope.is_sidebarnav_collapsed = false;
            window.innerWidth = 768;
            $rootScope.$broadcast('rendered:sidebarnav');

            expect($rootScope.is_sidebarnav_collapsed).to.be.true;
        });
    });
});
