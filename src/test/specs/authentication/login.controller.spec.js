describe('LoginController', function() {
    var controller;

    beforeEach(function() {
        module('diligenceVault');
        specHelper.injector(function($controller, $auth, toaster, $q, $rootScope, $httpBackend) {});
    });

    beforeEach(function() {
        controller = $controller('LoginController');
        controller.login_form = {$valid: true};
    });

    it('should set grant_type to password by default', function() {
        expect(controller.user.grant_type).to.equal('password');
    });

    it('should set invalid_login to false by default', function() {
        expect(controller.invalid_login).to.be.false;
    });

    it('should set loading to false by default', function() {
        expect(controller.loading).to.be.false;
    });

    describe('login', function() {
        beforeEach(function() {
            sinon.spy($auth, 'login');
        });

        it('should not call $auth login if the form is invalid', function() {
            controller.login_form.$valid = false;
            controller.login();

            $auth.login.should.not.have.been.called;
        });

        it('should call $auth.login if the form is valid', function() {
            controller.login();

            $auth.login.should.have.been.calledWith(controller.user);
        });
    });

    describe('login callbacks', function() {
        var deferred;

        beforeEach(function() {
            deferred = $q.defer();
            sinon.stub($auth, 'login').returns(deferred.promise);
            sinon.spy(toaster, 'pop');
        });

        it('should throw error message for 401', function() {
            controller.login();
            deferred.reject({status: 401});
            $rootScope.$apply();

            toaster.pop.should.have.been.calledWith('error', "", "Invalid email or password");
            expect(controller.invalid_login).to.be.true;
            expect(controller.loading).to.be.false;
        });

        it('should throw error message for 500', function() {
            controller.login();
            deferred.reject({status: 500});
            $rootScope.$apply();

            toaster.pop.should.have.been.calledWith({type: 'error', title: "An error ocurred"});
            expect(controller.loading).to.be.false;
        });
    });
});
