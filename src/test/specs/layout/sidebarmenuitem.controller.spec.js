describe('SideBarMenuItemController', function() {
    var controller, $scope;

    beforeEach(function() {
        module('diligenceVault');
        specHelper.injector(function($controller, $state, $rootScope) {});
    });

    beforeEach(function() {
        $scope = $rootScope.$new();
        controller = $controller('SideBarMenuItemController', {$scope: $scope});
    });

    describe('toggleSubmenuCollapse', function() {
        describe('menu_item has state', function() {
            beforeEach(function() {
                sinon.stub($state, 'go');
            });

            it('should redirect to menu_item state', function() {
                controller.toggleSubmenuCollapse({state: 'foo'});
                $state.go.should.have.been.calledWith('foo');
            });
        });

        it('should mark menu_item as collapsed on collapse:menu_item event', function() {
            var menu_item = {is_collapsed: false};

            $rootScope.$broadcast('collapse:menu_item', menu_item);
            expect(menu_item.is_collapsed).to.be.true;
        });

        it("should do nothing if sidebar nav is collapsed", function() {
            var parent = {current_menu_item: {is_collapsed: false}, is_sidebarnav_collapsed: true};

            controller.toggleSubmenuCollapse({}, parent);
            expect(parent.current_menu_item.is_collapsed).to.be.false;
        });

        it('should toggle submenu_item collapse state if it has submenu_items', function() {
            var current_menu_item = {is_collapsed: false};
            var parent = {current_menu_item: current_menu_item, is_sidebarnav_collapsed: false};
            var menu_item = {is_collapsed: false, submenu_items: [{}]};

            controller.toggleSubmenuCollapse(menu_item, parent);
            expect(menu_item.is_collapsed).to.be.true;
            expect(parent.current_menu_item).to.equal(menu_item);
            expect(current_menu_item.is_collapsed).to.be.true;
        });

        it('should not toggle submenu_item collapse state if it does not have submenu_items', function() {
            var current_menu_item = {is_collapsed: false};
            var parent = {current_menu_item: current_menu_item, is_sidebarnav_collapsed: false};
            var menu_item = {is_collapsed: false};

            controller.toggleSubmenuCollapse(menu_item, parent);
            expect(menu_item.is_collapsed).to.be.false;
            expect(parent.current_menu_item).to.not.equal(menu_item);
            expect(current_menu_item.is_collapsed).to.be.true;
        });
    });
});
