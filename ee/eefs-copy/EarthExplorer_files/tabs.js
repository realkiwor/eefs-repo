/******************************************************************************
 * TABS
 *****************************************************************************/
EE.tabs = {
    autoReloadCount: 0,
    criteria: {
        clear: function (silent) {
            // Clear the geocoders
            EE.maps.googleCoder.clear();
            EE.maps.pathrowCoder.clear();
            EE.maps.featureCoder.clear();
            EE.maps.calValCoder.clear();

            // Clear the coordinates from the map
            EE.maps.coordinates.clear();

            // Reset the format to DMS
            $('#latlonfmtdeg').prop('checked', true);
            //$('#lat_lon_section').controlgroup('refresh');
            $('#lat_lon_section input[name="latlonfmt"]').checkboxradio('refresh');
            EE.maps.settings.format = 'dms';

			// Clear the date range
            $('#start_linked').val('');
            $('#end_linked').val('');

            // Reset the selected months to All
            for (var i = 0; i < document.monthForm.monthBoxes.length; i++) {
                document.monthForm.monthBoxes[i].checked = true;
            }

            $('#monthSelector span.text').html('(all)');

            $("#cloudCoverSlider").slider("values", 0, 0);
            $("#cloudCoverSlider").slider("values", 1, 100);
            $('#includeUnknownCloudCover').val('1');
        },
        load: function () {
            // Increase the opacity of the AOI polygon
            EE.maps.polygon.increaseOpacity();

            // Show all the markers
            EE.maps.markers.redraw();

            // Turn on the KeyBounds stuff
            if ($('#tabPolygon').hasClass('selected')) {
                // Set the markers to be draggable
                for (var marker in EE.maps.overlays.markers) {
                    EE.maps.overlays.markers[marker].dragging.enable();
                }
            }

            // Redraw the month selector to make sure it is good

        },
        save: function (callback) {
            var coordinates = [];
            var coordinateList = EE.maps.coordinateList;
            var bounds = new L.LatLngBounds();

            // Build the coordinate list object for PHP
            for (var index in coordinateList) {
            	bounds.extend(coordinateList[index]);
                coordinates.push({
                    'c' : index,
                    'a' : coordinateList[index].lat.toFixed(EE.coordinatePrecision),
                    'o' : coordinateList[index].lng.toFixed(EE.coordinatePrecision)
                });
            }
            
            if (coordinates.length > 0) {
                var westBound = bounds.getSouthWest().lng;
                var eastBound = bounds.getNorthEast().lng;

                if (westBound > eastBound) {
                    eastBound += 360;
                }

                if (eastBound - westBound > 180) {
                    $.blockUI({
                        theme:     true,
                        title:    'Notice - Spatial Extent Too Large',
                        message:  '<p>Please refine your spatial extent to no more than 180 degrees longitude.</p>',
                        timeout:   5000
                    });

                    EE.tabs.moveToTab(1);
                    return;
                }
            }

            var polygonType = $('#polygonType').val();

            var data = {
                tab: 1,
                destination: EE.tabs.tabInfo.getCurrent(),
                coordinates: coordinates,
                format: EE.maps.settings.getFormat(),
                dStart: $("#start_linked").val(),
                dEnd: $("#end_linked").val(),
                searchType: $('#searchTypeSection input[type=radio]:checked').val(),
                includeUnknownCC: $('#includeUnknownCloudCover').val(),
                maxCC: $("#cloudCoverSlider").slider("values", 1),
                minCC: $("#cloudCoverSlider").slider("values", 0),
                months: (function () {
                    var months = [];

                    for (var i = 0; i < document.monthForm.monthBoxes.length; i++) {
                        if (document.monthForm.monthBoxes[i].checked) {
                            months.push(document.monthForm.monthBoxes[i].value);
                        }
                    }

                    return months;
                })(),
                pType: polygonType
            };

            if (polygonType === "shape") {
                data['spatialId'] = $('#areaShapeSection').find('.boundaryName').data('boundaryId');
                data['spatialName'] = $('#areaShapeSection').find('.boundaryName').text();
            }

            $.ajax({
                dataType: 'text',
                method: 'post',
                url: EE.defaultUrl + 'tabs/save',
                data: {
                    data: JSON.stringify(data)
                }
            }).fail(function () {
                EE.tabs.moveToTab(data.tab);
            }).done(function (response) {
                // Decrease the opacity of the AOI polygon
                EE.maps.polygon.decreaseOpacity();

                // Hide the markers if greater than 1
                if (EE.maps.overlays.markers.length > 1) {
                    EE.maps.markers.hide();
                } else {
                    EE.maps.markers.redraw();
                }

                // If there was a change on tab 1
                if (parseInt(response, 10) === 1) {
                    EE.tabs.tabInfo.setLastChange([1]);

                    EE.searchSummary.update(data);

                    // Remove the results on tab 4
                    $('#search-results-container').children('div.t4_dataSelectContainer').each(function () {
                       $(this).remove();
                    });
                }

                EE.tabs.load(data.destination);

                if (callback != null) {
                    callback();
                }
            });
        }
    },

    dataSets: {
        clear: function (silent) {
            $('#dataset-menu .dataset_checkbox:checked').prop('checked', false);
        },
        load: function () {
            // Check if this is a Bulk Search
            var searchType = $('#searchTypeSection input[type=radio]:checked').val();

            if (searchType == 'Bulk') {
                // Hide the Data Set Prefilter
                $('#dataSetPrefilter').parent().hide();

                // Hide the Data Set Search
                $('#dataSetSearch').parent().hide();

                $.ajax({
                    dataType: 'json',
                    method: 'get',
                    url: EE.defaultUrl + 'media/datasets'
                }).done(function (dataSets) {
                    // Hide all data sets except Bulk Search available data sets
                    $('#dataset-container li').each(function () {
                        var thisDivRef = $(this);

                        if (!$(this).hasClass('expandable') && !$(this).hasClass('collapsable')) {
                            thisDivRef.find('span.collection').each(function () {
                                var thisRef = $(this);
                                var dataset = thisRef.find('input.dataset_checkbox').attr('id').replace(/coll_/g, '');

                                if (!in_array(dataset, dataSets)) {
                                    thisRef.data('hidden', true);

                                    thisRef.find('input.dataset_checkbox').attr('disabled', true);
                                    thisRef.hide();
                                    thisRef.addClass('dataset_disabled');

                                    thisRef.find('input.dataset_checkbox').each(function () {
                                        var thisInputRef = $(this);

                                        if (thisInputRef.attr('checked')) {
                                            if (!EE.dataset.anyChecked()) {
                                                // Set tabs 1 & 2 to active
                                                EE.tabs.tabInfo.setActive([1,2]);
                                            }
                                        }
                                    });
                                } else {
                                    thisRef.find('input.dataset_checkbox').attr('disabled', false);
                                    thisRef.removeClass('dataset_disabled');
                                    thisRef.show();
                                }
                            });
                        }
                    });

                    $('#dataset-container li').each(function () {
                        if ($(this).find('span.collection').length == $(this).find('span.dataset_disabled').length) {
                            $(this).hide();
                        }
                    });
                });
            } else {
                // Show the Data Set Prefilter
                $('#dataSetPrefilter').parent().show();

                // Show the Data Set Search
                $('#dataSetSearch').parent().show();

                // Run the prefilter
                EE.dataset.prefilter.run();
            }
        },
        save: function (callback) {
            var dataSetsChecked = [];
            var collectionId = 0;

            // Save the activeDataSet
            var selectedDataSets = EE.dataset.getCheckedDataSets();
            if (in_array(EE.dataset.getSelected(), selectedDataSets)) {
                $('#activeDataSet').val(EE.dataset.getSelected());
            }

            $('#dataset-menu .dataset_checkbox').each(function()
            {
                var datasetId = $(this).closest('span.collection').attr('data-datasetId');
                if ($(this).is(':checked')) {
                    dataSetsChecked.push(datasetId);
                } else {
                    // Clear the results and additional criteria
                    $('#t4_dataset_' + datasetId).remove();

                    $('#frameset_' + datasetId).children('form').each(function () {
                        this.reset();
                    });
                }
            });

			var data = {
				tab: 2,
				destination: EE.tabs.tabInfo.getCurrent(),
				cList: dataSetsChecked,
				selected: EE.dataset.getSelected()
			};

			$.ajax({
                dataType: 'text',
                method: 'post',
                url: EE.defaultUrl + 'tabs/save',
                data: {
                    data: JSON.stringify(data)
                }
            }).fail(function () {
                EE.tabs.moveToTab(data.tab);
			}).done(function (response) {
                if (parseInt(response, 10) === 1) {
					EE.tabs.tabInfo.setLastChange([2]);

					EE.searchSummary.update(data);
				}

                EE.tabs.load(data.destination);

                if (callback != null) {
                    callback();
                }
            });
        }
    },
    additionalCriteria: {
        clear: function (silent) {
            var confirmation = false;

            if (silent) {
                confirmation = true;
            } else if (confirm('This will clear all the current additional criteria for all data sets. Are you sure you want to do this?')) {
                confirmation = true;
            }

            if (confirmation) {
                $("#add-criteria-container form .elementRow").remove();

                // LASTCHANGE
                //EE.tabs.tabInfo.setLastChange([3]);
            }
        },
        load: function () {
            if (EE.dataset.loaded === false) {
                //We only retry 10 times - each time it waits another second
                if (EE.tabs.autoReloadCount <= 10) {
                    setTimeout(function()
                    {
                        EE.tabs.autoReloadCount++;
                        EE.tabs.additionalCriteria.load();
                    }, (EE.tabs.autoReloadCount) ? 250 : EE.tabs.autoReloadCount * 1000);
                } else {
                    console.log('Unabe to auto-reload criteria tab - exceeded maximum auto-tries');
                }

                return;
            }

			EE.dataset.buildDatasetDropdown(3);

			// Select the active data set
			if ($('#activeDataSet').val() != -1) {
                $('#add_crit_data').val('frameset_' + $('#activeDataSet').val());
            }

			EE.tabs.additionalCriteria.loadForm();
        },
        loadForm: function () {
            // Fix for IE
            if ($('#add_crit_data').val() == null) {
                document.getElementById('add_crit_data').selectedIndex = 0;
            }

            var selectedDataSetId = $('#add_crit_data').val();
            var datasetId = selectedDataSetId.replace(/frameset_/g, '');

            // Check if it is already loaded
            if ($('#' + selectedDataSetId).length) {
                $('#add-criteria-container .add_criteria_forms').each(function () {
                    $(this).hide();
                });
                $('#' + selectedDataSetId).show();
            } else {
                $('#add-criteria-container .add_criteria_forms').each(function () {
                    $(this).hide();
                });

                $('#additionalCriteriaLoader').show();

                $.ajax({
                    dataType: 'html',
                    method: 'get',
                    url: EE.defaultUrl + 'dataset/criteria',
                    data: {
                        datasetName: $('#dataset-menu span.collection[data-datasetId="' + datasetId + '"]').attr('data-datasetAlias')
                    }
                }).done(function (data) {
                    $('#additionalCriteriaLoader').hide();
                    $('#add-criteria-container').append(data);
                    $('#' + selectedDataSetId).show();
                });
            }
        },
        save: function (callback) {
			var criteria = {};

			var myArray = new Array();

			$('#add-criteria-container form input, #add-criteria-container form select').each(function () {
				// Get the form values if they are present
				if ($(this).val()) {
					if ($(this).val() != 'Reset' && $(this).attr('id') != 'collection_id') {
					    if ($(this).attr('type') == 'text') {
                            $(this).val($(this).val().trim());
                        }

                        //Make sure we're not on the hidden item
                        if ($(this).closest('.filterElement').length === 1) {
                            return;
                        }

						var collection = $(this).parents('fieldset.add_criteria_forms').attr('id').split('_')[1];
						var key = $(this).attr('data-filterId');
						var val = $(this).val();

						if (criteria[collection] === undefined) {
							criteria[collection] = {};
						}

						if (criteria[collection][key] === undefined) {
							criteria[collection][key] = ($(this).attr('data-key') !== undefined) ? {} : [];
						}

                        if (val == '') {
                            $(this).closest('.elementRow').remove();
                            return;
                        }

                        if ($(this).attr('data-key') !== undefined) {
                            var idParts = $(this).attr('id').split('_');
                            if (criteria[collection][key][idParts[2]] === undefined) {
                                criteria[collection][key][idParts[2]] = {};
                            }

                            criteria[collection][key][idParts[2]][$(this).attr('data-key')] = val;
                        } else {
                            criteria[collection][key].push(val);
                        }
					}
				}
			});

			// Save the selected data set to the hidden form holder
		    var dataSetSelected = -1;

			if ($('#add_crit_data').val() !== null) {
			    dataSetSelected = $('#add_crit_data').val().replace(/frameset_/g, '');
            }

            $('#activeDataSet').val(dataSetSelected);

			var data = {
				tab: 3,
				destination: EE.tabs.tabInfo.getCurrent(),
				criteria: criteria,
				selected: dataSetSelected
			};

            $.ajax({
                dataType: 'text',
                method: 'post',
                url: EE.defaultUrl + 'tabs/save',
                data: {
                    data: JSON.stringify(data)
                }
            }).fail(function () {
                EE.tabs.moveToTab(data.tab);
            }).done(function (response) {
                if (parseInt(response, 10) === 1) {
                    EE.tabs.tabInfo.setLastChange([3]);
                }

                EE.tabs.load(data.destination);

                if (callback != null) {
                    callback();
                }
            });
        }
    },
    results: {
        clear: function (silent) {
        },
        load: function () {
            // Check if the user is trying to do a Bulk Search
            if ($('#searchTypeSection input[type=radio]:checked').val() == 'Bulk') {
                var data = {
                    tab: 4,
                    destination: 1
                };

                $.ajax({
                    dataType: 'text',
                    method: 'post',
                    url: EE.defaultUrl + 'tabs/save',
                    data: {
                        data: JSON.stringify(data)
                    }
                }).done(function () {
                    window.location = EE.defaultUrl + 'media';
                });
            } else {
                if (EE.dataset.loaded === false) {
                    EE.dataset.onLoad = function() {
                        EE.tabs.results.load();
                    }
                    return;
                }

                // Build the drop down selector
                EE.dataset.buildDatasetDropdown(4);

                // Select the active data set
                $('#show_search_data').val('t4_dataset_' + $('#activeDataSet').val());

                // Fix for IE
                if ($('#show_search_data').val() == null) {
                    document.getElementById('show_search_data').selectedIndex = 0;
                }

                // If tab1/tab2/tab3 is newer than tab4...
                if (EE.tabs.tabInfo.lastChange[1] > EE.tabs.tabInfo.lastChange[4] || EE.tabs.tabInfo.lastChange[2] > EE.tabs.tabInfo.lastChange[4] || EE.tabs.tabInfo.lastChange[3] > EE.tabs.tabInfo.lastChange[4]) {
                    // Clear the footprints
                    EE.maps.footprints.clearAll();

                    // Clear the browse overlays
                    EE.maps.browse.clearAll();

                    // Delete the info windows
                    EE.maps.infoWindows.clearAll();
                }

                // If tab1 or tab3 is newer, clear the results
                if (EE.tabs.tabInfo.lastChange[1] > EE.tabs.tabInfo.lastChange[4] || EE.tabs.tabInfo.lastChange[3] > EE.tabs.tabInfo.lastChange[4]) {
                    $("#search-results-container").empty();
                } else {
                    // Else ensure the data set is still relevant
                    var dataSetsChecked = EE.dataset.getCheckedDataSets();

                    $('#search-results-container').children('div.t4_dataSelectContainer').each(function () {
                        if (!in_array($(this).attr('id').replace(/t4_dataset_/g, ''), dataSetsChecked)) {
                            $(this).remove();
                        }
                    });
                }

                var dataSetContainerId = $('#show_search_data').val();
                if (dataSetContainerId == null) {
                    //A dataset hasn't been selected yet
                    console.log('A dataset hasnt been selected');
                }

                var collectionId = dataSetContainerId.replace(/t4_dataset_/g, '');

                if (EE.dataset.isResultLoaded(collectionId)) {
                    EE.dataset.handleResultOptions(collectionId);
                } else {
                    EE.dataset.searchDataSet(collectionId);
                }

                // Hide all data set containers
                $('#search-results-container').children('div.t4_dataSelectContainer').each(function () {
                    $(this).hide();
                });

                // Show the selected data set container
                $('#' + dataSetContainerId).show();

                // Uncheck show all footprint/browse/bulk/order boxes
                $('#showAllFootprints').prop('checked', EE.maps.footprints.allChecked());
                $('#showAllBrowse').prop('checked', EE.maps.browse.allChecked());
                $('#addAllToBulk').prop('checked', EE.controls.allResultsChecked('#show_search_data','a.bulk'));
                $('#addAllToOrder').prop('checked', EE.controls.allResultsChecked('#show_search_data','a.order'));
            }
        },
        save: function (callback) {
            // Save the selected data set to the hidden form holder
            var dataSetSelected = -1;

            if ($('#show_search_data').val() !== null) {
                dataSetSelected = $('#show_search_data').val().replace(/t4_dataset_/g, '');
            }

            $('#activeDataSet').val(dataSetSelected);

            var data = {
                tab: 4,
                destination: EE.tabs.tabInfo.getCurrent(),
                selected: dataSetSelected
            };

            $.ajax({
                dataType: 'text',
                method: 'post',
                url: EE.defaultUrl + 'tabs/save',
                data: {
                    data: JSON.stringify(data)
                }
            }).fail(function () {
                EE.moveToTab(data.tab);
            }).done(function () {
                EE.tabs.tabInfo.setLastChange([4]);

                EE.tabs.load(data.destination);

                if (callback != null) {
                    callback();
                }
            });
        }
    },
    clearAll: function () {
        EE.tabs.criteria.clear(true);
        EE.tabs.dataSets.clear(true);
        EE.tabs.additionalCriteria.clear(true);
        EE.tabs.results.clear(true);
    },
    load: function (tab) {
        switch (tab) {
            case 1 : EE.tabs.criteria.load();
                break;
            case 2 : EE.tabs.dataSets.load();
                break;
            case 3 : EE.tabs.additionalCriteria.load();
                break;
            case 4 : EE.tabs.results.load();
                break;
        }
    },
    save: function (tab, callback) {
        switch (tab) {
            case 1 : EE.tabs.criteria.save(callback);
                break;
            case 2 : EE.tabs.dataSets.save(callback);
                break;
            case 3 : EE.tabs.additionalCriteria.save(callback);
                break;
            case 4 : EE.tabs.results.save(callback);
                break;
        }
    },
    moveToTab: function (destination) {
        if (EE.tabs.tabInfo.isActive(destination) === false) {
            return;
        }

        // Show and hide map controls based on which tab is selected
        if (destination == 4) {
            $('#optionsControl').find('span.polygonTool').hide();
            EE.maps.map.setMaxBounds(L.latLngBounds(new L.latLng(85, -360), new L.latLng(-85, 180)));
        } else {
            $('#optionsControl').find('span.polygonTool').show();
            EE.maps.map.setMaxBounds(L.latLngBounds(new L.latLng(85, -180), new L.latLng(-85, 180)));
        }

        // Check if a data set is selected yet
        if (destination > 2) {
            var message = "";

            // Tell the user about the issue
            if($('#dataset-menu span.collection').length === 0) {
                message = "The data set list has not loaded yet. Please wait for it to load before proceeding to the Additional Criteria or Results tab.";
            } else if (EE.dataset.anyChecked() === false) {
                message = "No data sets have been selected. Please select a data set on the Data Sets tab before proceeding to the Additional Criteria or Results tab.";
            }

            if (message !== '') {
                $.blockUI({
                    theme:     true,
                    title:    'Notice',
                    message:  '<p>' + message + '</p>',
                    timeout:   4000
                });

                return;
            }
        }

        var currentTab = EE.tabs.tabInfo.getCurrent();

        if (currentTab == destination) {
            return;
        }

        // Check if the user is moving from tab 4 to any other tab
        if (destination != 4) {
            // Remove footprints
            EE.maps.footprints.clearAll();

            // Remove browse
            EE.maps.browse.clearAll();

            // Close info windows
            EE.maps.infoWindows.clearAll();
        }

        // Check if the user is performing a Bulk Search. If so, direct them to media page instead of tab 4
        if (destination == 4 && $('#searchTypeSection input[type=radio]:checked').val() == 'Bulk') {
            // Save Tab 2 if moving from another tab
            if (currentTab != 2) {
                // Don't move tabs while saving tab 2
                EE.tabs.tabInfo.setCurrent(currentTab);

                EE.tabs.save(2);
            }
        }

        // Apply the selected class to the selected tab
        $('#tab' + currentTab).removeClass('selected');
        $('#tab' + destination).addClass('selected');

        // Show the current tab
        $('#tab' + currentTab + 'data').hide();
        $('#tab' + destination + 'data').show();

        // Set the new current tab
        EE.tabs.tabInfo.setCurrent(destination);

        // Save current tab
        // TODO: Moved to call manually so a failed save can move back to a tab without more failures: EE.tabs.save(currentTab);

        // Load the tab
        // TODO: Moved to the end of each save() function: EE.tabs.load(destination);
    },

    tabInfo: {
        activeTabs: [],
        currentTab: null,
        dataSaved: [],
        lastChange: [],

        getActive: function ()
        {
            if (EE.tabs.tabInfo.activeTabs.length < 1) {
                EE.tabs.tabInfo.activeTabs = $('#activeTabs').val().split(' ');

                for (var i = 0; i < EE.tabs.tabInfo.activeTabs.length; i++) {
                    EE.tabs.tabInfo.activeTabs[i] = parseInt(EE.tabs.tabInfo.activeTabs[i], 10);
                }
            }

            return EE.tabs.tabInfo.activeTabs;
        },
        getCurrent: function ()
        {
            if (EE.tabs.tabInfo.currentTab === null) {
                EE.tabs.tabInfo.currentTab = parseInt($('#currentTab').val(), 10);
            }

            return parseInt(EE.tabs.tabInfo.currentTab, 10);
        },
        isActive: function (tabNumber)
        {
            if (in_array(tabNumber, EE.tabs.tabInfo.getActive())) {
                return true;
            } else {
                return false;
            }
        },
        setActive: function (tabs)
        {
            EE.tabs.tabInfo.activeTabs = tabs;

            for (var i = 0; i < 4; i++) {
                $('#tab' + (i + 1)).addClass('disabled');
                $('#tab' + (i + 1)).attr('tabindex', '-1');
            }

            for (var index in tabs) {
                $('#tab' + tabs[index]).removeClass('disabled');
                $('#tab' + tabs[index]).attr('tabindex', '0');
            }
        },
        setCurrent: function (tab)
        {
            EE.tabs.tabInfo.currentTab = tab;
        },
        setLastChange: function (tabs)
        {
            for (var i = 0; i < tabs.length; i++) {
                EE.tabs.tabInfo.lastChange[tabs[i]] = new Date().getTime();
            }
        }
    }
};
