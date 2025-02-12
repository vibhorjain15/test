describe('router', function() {
    var $state, $rootScope, loader, userservice, $q, $auth;

    beforeEach(function() {
        module('diligenceVault');

        inject(function(_$state_, _$rootScope_, _loader_, _userservice_, _$q_, _$auth_) {
            $state = _$state_;
            $rootScope = _$rootScope_;
            loader = _loader_;
            userservice = _userservice_;
            $q = _$q_;
            $auth = _$auth_;
        });
    });

    describe('authentication routes', function() {
        describe('onEnter callback', function() {
            beforeEach(function() {
                sinon.spy(loader, 'remove');
            });

            var tests = [
                {args: ['authentication.confirm_email']},
                {args: ['authentication.signup']},
                {args: ['authentication.login']},
                {args: ['authentication.begin_password_reset']},
                {args: ['authentication.confirm_password_reset']}
            ];

            tests.forEach(function(test) {
                it('should set app_initialized to true on entering ' + test.args[0], function() {
                    $rootScope.$apply(function() {
                        $state.go.apply($state, test.args);
                    });

                    expect($rootScope.app_initialized).to.be.true;
                    loader.remove.should.have.been.called.once;
                })
            });
        });

        describe('confirm email', function() {
            it('should respond to confirm email URL', function() {
                var params = {token: 'foo', emailId: 'bar@baz.com'};
                var url = '#/confirm_email?token=foo&emailId=' + encodeURIComponent("bar@baz.com");

                expect($state.href('authentication.confirm_email', params)).to.equal(url);
            });
        });

        describe('signup', function() {
            it('should respond to signup URL', function() {
                expect($state.href('authentication.signup')).to.equal('#/signup');
            });
        });

        describe('login', function() {
            it('should respond to login URL', function() {
                expect($state.href('authentication.login', {next: 'foo'})).to.equal('#/login?next=foo');
            });
        });

        describe('begin_password_reset', function() {
            it('should respond to begin_password_reset URL', function() {
                var url = $state.href('authentication.begin_password_reset', {userName: 'foobar'});

                expect(url).to.equal('#/begin_password_reset?userName=foobar');
            });
        });

        describe('confirm_password_reset', function() {
            it('should respond to confirm_password_reset URL', function() {
                var url = $state.href('authentication.confirm_password_reset', {
                    token: 'abcd',
                    Email: 'foo@bar.com'
                });

                expect(url).to.equal('#/confirm_password_reset?token=abcd&Email=' + encodeURIComponent('foo@bar.com'));
            });
        });
    });

    describe('app routes', function() {
        describe('currentUser resolution', function() {
            it('should fetch currentUser before initializig state');
            it('should set app_initialized to true');
            // var deferred;

            // beforeEach(function() {
            //     deferred = $q.defer();
            //     deferred.resolve('foo');
            //     sinon.stub(userservice, 'getCurrentUser').returns(deferred.promise);
            //     sinon.stub($auth, 'isAuthenticated').returns(true);
            // });

            // it('should fetch currentUser before initializing state', function() {
            //     expect($rootScope.app_initialized).to.be.undefined;

            //     debugger;
            //     $state.go('app.dash');
            //     // $rootScope.$digest();

            //     expect($rootScope.app_initialized).to.be.true;
            // });
        });

        describe('discover', function() {
            it('should respond to discover URL', function() {
                expect($state.href('app.discover')).to.equal('#/app/discover');
            });
        });

        describe('firm profile', function() {
            it('should respond to fund profile URL', function() {
                expect($state.href('app.profile', {profileId: 1})).to.equal('#/app/profile/1');
            });
        });

        describe('explore discuss', function() {
            it('should construct url based on query parameters', function() {
                var params = {
                    q: 'due-diligence',
                    sort: 'popular',
                    category: 'hedge-fund'
                };

                expect($state.href('app.discuss.explore', params)).to.equal('#/app/discuss/explore?sort=popular&category=hedge-fund&q=due-diligence');
            });
        });

        describe('new discussion', function() {
            it('should respond to new discussion URL', function() {
                expect($state.href('app.discuss.new')).to.equal('#/app/discuss/new');
            });
        });

        describe('discussion detail', function() {
            var slug = 'what-is-the-answer-to-earth-universe-and-everthing';

            it('should respond to question detail URL', function() {
                expect($state.href('app.discuss.detail', {slug: slug})).to.equal('#/app/discuss/' + slug);
            });

            it('should respond to question detail URL with action', function() {
                var action = 'write_answer';
                var url = $state.href('app.discuss.detail', {slug: slug, action: action});

                expect(url).to.equal('#/app/discuss/' + slug + '?action=' + action);
            });
        });

        describe('user profile', function() {
            it('should respond to user profile URL', function() {
                var username = 'foo.bar';

                expect($state.href('app.user_profile', {username: username})).to.equal('#/app/users/' + username);
            });
        });

        describe('dash' , function() {
            it('should respond to dash URL', function() {
                expect($state.href('app.dash')).to.equal('#/app/dash');
            });
        })

        describe('manage' , function() {
            it('should respond to manage due_diligence URL', function() {
                expect($state.href('app.manage.due_diligence')).to.equal('#/app/manage/due_diligence');
            });

            it('should respond to manage templates URL', function() {
                expect($state.href('app.manage.templates')).to.equal('#/app/manage/templates');
            });
        });

        describe('monitor', function() {
            it('should respond to monitor investments URL', function() {
                expect($state.href('app.monitor.investments')).to.equal('#/app/monitor/investments');
            });

            it('should respond to monitor products URL', function() {
                expect($state.href('app.monitor.products')).to.equal('#/app/monitor/products');
            });

            it('should respond to monitor user_activity URL', function() {
                expect($state.href('app.monitor.user_activity')).to.equal('#/app/monitor/user_activity');
            });
        });

        describe('analyze', function() {
            it('should respond to analyze compare URL', function() {
                expect($state.href('app.analyze.compare')).to.equal('#/app/analyze/compare');
            });

            it('should respond to analyze platform_activity URL', function() {
                expect($state.href('app.analyze.platform_activity')).to.equal('#/app/analyze/platform_activity');
            });

            it('should respond to analyze portfolio URL', function() {
                expect($state.href('app.analyze.portfolio')).to.equal('#/app/analyze/portfolio');
            });
        });
    });
});
