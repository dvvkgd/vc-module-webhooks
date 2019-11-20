angular.module('virtoCommerce.webhooksModule')
    .controller('virtoCommerce.webhooksModule.webhooksListController', ['$scope', 'virtoCommerce.webhooksModule.webApi', 'platformWebApp.bladeNavigationService', 'platformWebApp.dialogService', 'platformWebApp.authService', 'platformWebApp.uiGridHelper', 'platformWebApp.bladeUtils', '$timeout', function ($scope, webHookApi, bladeNavigationService, dialogService, authService, uiGridHelper, bladeUtils, $timeout) {
        $scope.uiGridConstants = uiGridHelper.uiGridConstants;
        var blade = $scope.blade;

        blade.title = 'Webhoks list';
        blade.subtitle = 'List of all user defined weebhoks';
        

        blade.refresh = function () {
            blade.isLoading = true;

            if ($scope.pageSettings.currentPage !== 1)
                $scope.pageSettings.currentPage = 1;

            var searchCriteria = getSearchCriteria();

            webHookApi.search(searchCriteria,
                function (data) {
                    $scope.items = data.results;
                    angular.forEach($scope.items,
                        function (item) {
                            var totalRaisedEventCount = item.errorCount + item.successCount;
                            if (totalRaisedEventCount > 0) {
                                item.successPercent =
                                    (item.errorCount * 100 / totalRaisedEventCount).toFixed(2);
                            } else {
                                item.successPercent = 0;
                            }
                        });

                    $scope.pageSettings.totalItems = $scope.items.length;
                    $scope.hasMore = data.results.length === $scope.pageSettings.itemsPerPageCount;

                    $timeout(function () {
                        // wait for grid to ingest data changes
                        if ($scope.gridApi && $scope.gridApi.selection.getSelectAllState()) {
                            $scope.gridApi.selection.selectAllRows();
                        }
                    });
                }).$promise.finally(function () {
                blade.isLoading = false;
            });
            //reset state grid
            resetStateGrid();

        };


        function showMore() {
            if ($scope.hasMore) {
                ++$scope.pageSettings.currentPage;
                $scope.gridApi.infiniteScroll.saveScrollPercentage();
                blade.isLoading = true;
                var searchCriteria = getSearchCriteria();

                webHookApi.search(searchCriteria,
                    function (data) {
                        $scope.items = $scope.items.concat(data.results);
                        $scope.pageSettings.totalItems = $scope.items.length;
                        $scope.hasMore = data.results.length === $scope.pageSettings.itemsPerPageCount;
                        $scope.gridApi.infiniteScroll.dataLoaded();

                        $timeout(function () {
                            // wait for grid to ingest data changes
                            if ($scope.gridApi.selection.getSelectAllState()) {
                                $scope.gridApi.selection.selectAllRows();
                            }
                        });

                    }).$promise.finally(function () {
                    blade.isLoading = false;
                });
            }
        }

        $scope.deleteWebHook = function(item) {
            deleteWebHooks([item]);
        };

        function deleteWebHooks(selection) {
            var dialog = {
                id: "confirmDelete",
                title: "webhooks.dialogs.setting-delete.title",
                message: "webhooks.dialogs.setting-delete.message",
                callback: function(remove) {
                    if (remove) {
                        blade.isLoading = true;
                        bladeNavigationService.closeChildrenBlades(blade);
                        var ids = _.map(selection, function(item) { return item.id; });
						webHookApi.remove({ ids: ids },
                            function() {
                                blade.refresh();
                            });
                    }
                }
            };
            dialogService.showConfirmationDialog(dialog);
        }


        blade.setSelectedItem = function (listItem) {
            $scope.selectedNodeId = listItem.id;
        };


        $scope.selectItem = function (e, listItem) {
            blade.setSelectedItem(listItem);
            var newBlade = {
                id: "webhookDetail",
                currentEntityId: listItem.id,
                title: 'webhooks.blades.webhook-detail.title',
                subtitle: 'webhooks.blades.webhook-detail.subtitle',
                controller: 'virtoCommerce.webhooksModule.webhookDetailController',
                template: 'Modules/$(virtoCommerce.webhooksModule)/Scripts/blades/webhook-detail.tpl.html'
            };
            bladeNavigationService.showBlade(newBlade, blade);
        };

        $scope.selectNode = function (node, isNew) {
            $scope.selectedNodeId = node.id;

            var newBlade = {
                id: 'webhookDetail',
                controller: 'virtoCommerce.webhooksModule.webhookDetailController',
                template: 'Modules/$(virtoCommerce.webhooksModule)/Scripts/blades/webhook-detail.tpl.html',
                subtitle: 'webhooks.blades.webhook-detail.subtitle'
            };

            if (isNew) {
                angular.extend(newBlade, {
                    title: 'webhooks.blades.webhook-detail.title',
                    
                    isNew: true,
                    saveCallback: function (newPricelist) {
                        newBlade.isNew = false;
                        blade.refresh(true).then(function () {
                            newBlade.currentEntityId = newPricelist.id;
                            bladeNavigationService.showBlade(newBlade, blade);
                        });
                    }
                });
            } else {
                angular.extend(newBlade, {
                    currentEntityId: node.id,
                    title: node.name
                });
            }

            bladeNavigationService.showBlade(newBlade, blade);
        };


        function isItemsChecked() {
            return $scope.gridApi && _.any($scope.gridApi.selection.getSelectedRows());
        }

        function getSelectedItems() {
            return $scope.gridApi.selection.getSelectedRows();
        }


        blade.toolbarCommands = [
            {
                name: "platform.commands.refresh",
                icon: 'fa fa-refresh',
                executeMethod: blade.refresh,
                canExecuteMethod: function() {
                    return true;
                }
            },
            {
                name: "platform.commands.add",
                icon: 'fa fa-plus',
                executeMethod: function () {
                    $scope.selectNode({}, true);
                },
                canExecuteMethod: function () {
                    return true;
                }
            },
            {
                name: "platform.commands.remove",
                icon: 'fa fa-trash',
                executeMethod: function () {
                    deleteWebHooks(getSelectedItems());
                },
                canExecuteMethod: isItemsChecked
            }
        ];

        // simple and advanced filtering
        var filter = $scope.filter = {};


        filter.criteriaChanged = function () {
            blade.refresh();
        };

        // ui-grid
        $scope.setGridOptions = function (gridOptions) {

            //disable watched
            bladeUtils.initializePagination($scope, true);
            //сhoose the optimal amount that ensures the appearance of the scroll
            $scope.pageSettings.itemsPerPageCount = 20;

            uiGridHelper.initialize($scope, gridOptions, function (gridApi) {
                //update gridApi for current grid
                $scope.gridApi = gridApi;

                uiGridHelper.bindRefreshOnSortChanged($scope);
                $scope.gridApi.infiniteScroll.on.needLoadMoreData($scope, showMore);
            });

            blade.refresh();
        };

        //reset state grid (header checkbox, scroll)
        function resetStateGrid() {
            if ($scope.gridApi) {
                $scope.items = [];
                $scope.gridApi.selection.clearSelectedRows();
                $scope.gridApi.infiniteScroll.resetScroll(true, true);
                $scope.gridApi.infiniteScroll.dataLoaded();
            }
        }

        // Search Criteria
        function getSearchCriteria() {
            var searchCriteria = {
                searchPhrase: filter.keyword ? filter.keyword : undefined,
                sort: uiGridHelper.getSortExpression($scope),
                skip: ($scope.pageSettings.currentPage - 1) * $scope.pageSettings.itemsPerPageCount,
                take: $scope.pageSettings.itemsPerPageCount
            };
            return searchCriteria;
        }
    }]);
