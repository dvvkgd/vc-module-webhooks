// Call this to register your module to main application
var moduleName = "virtoCommerce.webhooksModule";

if (AppDependencies !== undefined) {
    AppDependencies.push(moduleName);
}

angular.module(moduleName, [])
    .config(['$stateProvider', '$urlRouterProvider',
        function ($stateProvider, $urlRouterProvider) {
            $stateProvider
                .state('workspace.virtoCommerceWebhooksModuleState', {
                    url: '/virtoCommerce.webhooksModule',
                    templateUrl: '$(Platform)/Scripts/common/templates/home.tpl.html',
                    controller: [
                        '$scope', 'platformWebApp.bladeNavigationService', function ($scope, bladeNavigationService) {
                            var newBlade = {
                                id: 'webhooks-list',
                                controller: 'virtoCommerce.webhooksModule.webhooksListController',
                                template: 'Modules/$(virtoCommerce.webhooksModule)/Scripts/blades/webhooks-list.tpl.html',
                                isClosingDisabled: true
                            };
                            bladeNavigationService.showBlade(newBlade);
                        }
                    ]
                });
        }
    ])
    .run(['$rootScope', 'platformWebApp.mainMenuService', 'platformWebApp.widgetService', '$state',
        function ($rootScope, mainMenuService, widgetService, $state) {
            //Register module in main menu
            var menuItem = {
                path: 'browse/virtoCommerce.webhooksModule',
                icon: 'fa fa-rocket',
                title: 'webhooks.main-menu-title',
                priority: 100,
                action: function () { $state.go('workspace.virtoCommerceWebhooksModuleState'); },
                permission: 'virtoCommerce.webhooksModule.WebPermission'
            };
            mainMenuService.addMenuItem(menuItem);
        }
    ]);
