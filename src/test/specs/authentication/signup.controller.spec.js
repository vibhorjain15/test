describe('SignupController', function() {
    var controller;

    beforeEach(function() {
        module('diligenceVault');
        specHelper.injector(function($controller, $auth, toaster, $q, $rootScope, $httpBackend) {});
    });

    beforeEach(function() {
        controller = $controller('SignupController');
        controller.signup_form = {$valid: true};
    });

    it('should have manager as default user type', function() {
        expect(controller.user.userType).to.equal(1);
    });

    it('should have the value of loading as false', function() {
        expect(controller.loading).to.be.false;
    });

    describe('signup', function() {
        beforeEach(function() {
            sinon.spy($auth, 'signup');
        });

        it('should not call $auth.signup if the form is invalid', function() {
            controller.signup_form = {$valid: false};
            controller.signup();

            $auth.signup.should.not.have.been.called;
        });

        it('should call $auth.signup if the form is valid', function() {
            sinon.stub(controller, 'passwordsMatch').returns(true);
            controller.signup();

            $auth.signup.should.have.been.calledWith(controller.user);
            expect(controller.loading).to.be.true;
        });

        it('should not call $auth.signup if the passwords do not match', function() {
            sinon.stub(controller, 'passwordsMatch').returns(false);
            controller.signup();

            $auth.signup.should.not.have.been.called;
        });
    });

    describe('signup callbacks', function() {
        var deferred;

        beforeEach(function() {
            deferred = $q.defer();
            sinon.stub($auth, 'signup').returns(deferred.promise);
            sinon.spy(toaster, 'pop');
            sinon.stub(controller, 'passwordsMatch').returns(true);
        });

        it('should show toaster success notification on successful signup', function() {
            controller.signup();
            deferred.resolve();
            $rootScope.$apply();

            toaster.pop.should.have.been.calledWithMatch('success');
        });

        it('should show toaster error notification on signup failure', function() {
            controller.signup();
            deferred.reject();
            $rootScope.$apply();

            toaster.pop.should.have.been.calledWithMatch({ title: "An error ocurred", type: "error" });
        });
    });

    describe('isEmpty', function() {
        beforeEach(function() {
            controller.signup_form = {foo: {}, $submitted: false};
        });

        it('should return false if the attribute is not touched', function() {
            controller.signup_form.foo.$touched = false;

            expect(controller.isEmpty('foo')).to.be.false;
        });

        it('should return true if the attribute is empty', function() {
            controller.signup_form.foo.$touched = true;
            controller.signup_form.foo.$error = {required: true};

            expect(controller.isEmpty('foo')).to.be.true;
        });
    });

    describe('isValid', function() {
        beforeEach(function() {
            controller.signup_form = {foo: {}, password: {}, $submitted: true};
        });

        it('should return true if the attribute is $valid', function() {
            controller.signup_form.foo.$valid = true;

            expect(controller.isValid('foo')).to.be.true;
        });

        it('should return false if the attribute is not $valid', function() {
            controller.signup_form.foo.$valid = false;

            expect(controller.isValid('foo')).to.be.false;
        });

        it('should return true if password is $valid and has >= 8 characters', function() {
            controller.signup_form.password.$valid = true;
            controller.signup_form.password.$viewValue = 'fooisbar';

            expect(controller.isValid('password')).to.be.true;
        });

        it('should return false if password is $valid and has < 8 characters', function() {
            controller.signup_form.password.$valid = true;
            controller.signup_form.password.$viewValue = 'foobar';

            expect(controller.isValid('password')).to.be.false;
        });

        it('should return false if password is not $valid', function() {
            controller.signup_form.password.$valid = false;

            expect(controller.isValid('password')).to.be.false;
        });
    });

    describe('isInvalid', function() {
        beforeEach(function() {
            controller.signup_form = {userName: {}, password: {}, $submitted: true};
        });

        it('should return true if the userName is not a valid email', function() {
            controller.signup_form.userName.$error = {email: true};

            expect(controller.isInvalid('userName')).to.be.true;
        });

        it('should return false if the userName is a valid email', function() {
            controller.signup_form.userName.$error = {email: false};

            expect(controller.isInvalid('userName')).to.be.false;
        });

        it('should return false if the password is a not $valid', function() {
            controller.signup_form.password.$valid = false;

            expect(controller.isInvalid('password')).to.be.false;
        });

        it('should return false if the password is $valid and has >= 8 characters', function() {
            controller.signup_form.password.$valid = true;
            controller.signup_form.password.$viewValue = 'fooisbar';

            expect(controller.isInvalid('password')).to.be.false;
        });

        it('should return toaster if the password is $valid and has < 8 characters', function() {
            controller.signup_form.password.$valid = true;
            controller.signup_form.password.$viewValue = 'foobar';

            expect(controller.isInvalid('password')).to.be.true;
        });
    });

    describe('passwordMismatch', function() {
        beforeEach(function() {
            controller.signup_form = {
                confirmPassword: {$valid: true},
                password: {$valid: true},
                $submitted: true
            };
        });

        it('should return false if password is invalid', function() {
            controller.signup_form.confirmPassword.$viewValue = 'foo';
            controller.signup_form.password.$viewValue = 'bar';

            expect(controller.passwordMismatch()).to.be.false;
        });

        it('should return true if password is valid & is not equal to confirmPassword', function() {
            controller.signup_form.password.$viewValue = 'fooisbar';
            controller.signup_form.confirmPassword.$viewValue = 'bar';

            expect(controller.passwordMismatch()).to.be.true;
        });

        it('should return false if password is valid & is equal to confirmPassword', function() {
            controller.signup_form.password.$viewValue = 'fooisbar';
            controller.signup_form.confirmPassword.$viewValue = 'fooisbar';

            expect(controller.passwordMismatch()).to.be.false;
        });
    });


    describe('passwordMismatch', function() {
        beforeEach(function() {
            controller.signup_form = {
                confirmPassword: {$valid: true},
                password: {$valid: true},
                $submitted: true
            };
        });

        it('should return false if password is invalid', function() {
            controller.signup_form.confirmPassword.$viewValue = 'foo';
            controller.signup_form.password.$viewValue = 'bar';

            expect(controller.passwordsMatch()).to.be.false;
        });

        it('should return true if password is valid & is equal to confirmPassword', function() {
            controller.signup_form.password.$viewValue = 'fooisbar';
            controller.signup_form.confirmPassword.$viewValue = 'fooisbar';

            expect(controller.passwordsMatch()).to.be.true;
        });

        it('should return false if password is valid & is not equal to confirmPassword', function() {
            controller.signup_form.password.$viewValue = 'fooisbar';
            controller.signup_form.confirmPassword.$viewValue = 'foo';

            expect(controller.passwordsMatch()).to.be.false;
        });
    });
});
