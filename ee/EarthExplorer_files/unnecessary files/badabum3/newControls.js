//A generic function to call setInterval
function customInterval(executeCode, checkCode, timeInterval)
{
    var interval = setInterval(function ()
    {
        if (checkCode())
        {
            executeCode();
            clearInterval(interval);
        }
    }, timeInterval);
}

// Check if an element is in an array
// Examined
function in_array(needle, haystack, argStrict)
{
    var key = '', strict = !!argStrict;

    if (strict)
    {
        for (key in haystack)
        {
            if (haystack[key] === needle)
            {
                return true;
            }
        }
    }
    else
    {
        for (key in haystack)
        {
            if (haystack[key] == needle)
            {
                return true;
            }
        }
    }

    return false;
}

function objectKeyExists(needle, haystack)
{
	for (var key in haystack)
	{
		if (key == needle)
		{
		    return true;
		}
	}

	return false;
};

// Prototype for trimming whitespace
// Author: Douglas Crock
String.prototype.trim = function ()
{
    return this.replace(/^\s*(\S*(\s+\S+)*)\s*$/, "$1");
};

function isNumber(value)
{
    return !isNaN(parseFloat(value)) && isFinite(value);
}

// Check that the values input in the add/edit dialogs are valid
// Examined
function validateDialogInput(latitude, longitude, type)
{
    var errors = {
        latitude: 'Invalid latitude input.',
        longitude: 'Invalid longitude input.',
        numeric: 'Must contain only digits.',
        latRange: 'Must be between -90 and 90.',
        lngRange: 'Must be between -180 and 180.',
        dmslatRange: 'Must be between 0 and 90.',
        dmslngRange: 'Must be between 0 and 180.'
    };

    if (type == 'dd')
    {
        if (!isNumber(latitude))
        {
            return {valid: false, message: errors.latitude + ' ' + errors.numeric};
        }
        else if (!isNumber(longitude))
        {
            return {valid: false, message: errors.longitude + ' ' + errors.numeric};
        }

        if (latitude < -90.0 || latitude > 90.0)
        {
            return {valid: false, message: errors.latitude + ' ' + errors.latRange};
        }
        else if (longitude < -180.0 || longitude > 180.0)
        {
            return {valid: false, message: errors.longitude + ' ' + errors.lngRange};
        }
    }
    else if (type == 'dms')
    {
        for (var i = 0; i < 3; i++)
        {
            if (!isNumber(latitude[i]))
            {
                return {valid: false, message: errors.latitude + ' ' + errors.numeric};
            }
            else if (!isNumber(longitude[i]))
            {
                return {valid: false, message: errors.longitude + ' ' + errors.numeric};
            }
        }

        var degrees = [latitude[0]|0, longitude[0]|0];
        var minutes = [latitude[1]|0, longitude[1]|0];
        var seconds = [parseFloat(latitude[2]), parseFloat(longitude[2])];

        if (degrees[0] < 0 || degrees[0] > 90 ||
            minutes[0] >= 60 || minutes[0] < 0 ||
            seconds[0] >= 60.0 || seconds[0] < 0.0 )
        {
            return {valid: false, message: errors.latitude + ' ' + errors.dmslatRange};
        }
        else if (degrees[1] < 0 || degrees[1] > 180 ||
            minutes[1] >= 60 || minutes[1] < 0 ||
            seconds[1] >= 60.0 || seconds[1] < 0.0 )
        {
            return {valid: false, message: errors.longitude + ' ' + errors.dmslngRange};
        }

        // If the degrees are lat -90 or 90, -180 or 180, then min and sec must be zero
        if ((Math.abs(degrees[0]) == 90) &&
            (minutes[0] > 0 || seconds[0] > 0.0))
        {
            return {valid: false, message: errors.latitude};
        }
        else if ((Math.abs(degrees[1]) == 180) &&
            (minutes[1] > 0 || seconds[1] > 0.0))
        {
            return {valid: false, message: errors.longitude};
        }

    }

    return {valid: true};
}

function loadMetadataDialog (element)
{
    $.blockUI({
        theme:     true,
        title:    'Notice',
        message:  '<p>Loading Metadata...</p>',
        timeout: 0
    });

    $.ajax({
        dataType: 'html',
        method: 'get',
        url: $(element).data('url')
    }).fail(function () {
        // Let the generic error handler take care of errors
        $.unblockUI();

        createGrowl('Metadata Lookup Failed', 'Unable to load metadata');
    }).done(function (html) {
        $('#metadataDialogArea').html(html);
        $('#metadataDialog').dialog('open');

        $.unblockUI();
    });
}

function getBrowserName ()
{
    if (navigator.userAgent.match(/Firefox/)) {
        return 'Firefox';
    } else if (navigator.userAgent.match(/Chrome/)) {
        return 'Chrome';
    } else if (navigator.userAgent.match(/Safari/)) {
        return 'Safari';
    } else if (navigator.appName == 'Microsoft Internet Explorer') {
        return 'IE';
    } else if (navigator.appName == 'Opera') {
        return 'Opera';
    } else {
        return 'Unknown';
    }
}

$(document).ready(function () {
    EE.tabs.tabInfo.setLastChange([1,2,3,4]);
    EE.load.load();
});

/******************************************************************************
 * BULK DOWNLOAD
 *****************************************************************************/
EE.bulkDownload = {
    numberScenes: 0,
    allowBulk: false,
    allowDownloadThemAll: false,
    allowMedia: false,
    numberOptions: 0,
    deselect: function (entityId, collectionId) {
        $('#search-results-container').find('tr[data-entityId="' + entityId + '"][data-collectionId="' + collectionId + '"] a.bulk').removeClass('selected');
        $('#bulkroll_' + entityId).removeClass('selected');

        $('#addAllToBulk').prop('checked', false);
    },
    select: function (entityId, collectionId) {
        $('#search-results-container').find('tr[data-entityId="' + entityId + '"][data-collectionId="' + collectionId + '"] a.bulk').addClass('selected');
        $('#bulkroll_' + entityId).addClass('selected');

        if ($('#addAllToBulk').hasClass('selectAll') === false) {
            if (EE.controls.allResultsChecked('#show_search_data', 'a.bulk')) {
                $('#addAllToBulk').prop('checked', true);
            } else {
                $('#addAllToBulk').prop('checked', false);
            }
        }
    },
    remove: function (entityId, collectionId) {
        $('#search-results-container').find('tr[data-entityId="' + entityId + '"][data-collectionId="' + collectionId + '"] a.bulk').remove();
        $('#bulkroll_' + entityId).remove();
    },
    addAllToBulkCheck: function () {
        $addToBulkIcons = $('#search-results-container').find('tr a.bulk');        
        if ($addToBulkIcons.length === 0) {
            $('#addAllToBulkContainer').hide();
        }      
    },
    toggle: function (entityIdList, collectionId, select) {
        var entityCount = entityIdList.length;
        if (entityCount.length < 1) {
            $('#addAllToBulk').removeClass('selectAll');

            return;
        }

        $.ajax({
            dataType: 'json',
            method: 'post',
            url: EE.defaultUrl + 'scene/toggle/bulk/',
            data: {
                entityIds: entityIdList.join(','),
                collectionId: collectionId,
                select: select
            }
        }).fail(function () {
            // TODO: Let the generic error handler take care of errors?
        }).done(function (json) {
            if (json.success) {
                if (select) {
                    var failedCount = json.failed.length;
                    var requiresHddsLicensing = false;
                    if (failedCount > 0) { 
                        var unavailableItemsCount = 0;
                        var failedItems = [];
                        var license = [];
                                               
                        // check hdds restricted access before loop to improve performance
                        if ('licenseParameters' in json.failed[0]) {                            
                            requiresHddsLicensing = true;
                            license['event'] = null; 
                            license['platform'] = [];                                                
                        }

                        for (var i in json.failed) {                           
                            failedItems.push(json.failed[i].entityId); 
                            if (json.failed[i].licensingRequired === null) {
                                unavailableItemsCount += 1;                             
                            } else {                                
                                if (requiresHddsLicensing) {
                                    if (license['event'] === null) {
                                        license['event'] = json.failed[i].licenseParameters.event; 
                                    }
                                    if (json.failed[i].licensingRequired === 'hdds_platform' && !license['platform'].includes(json.failed[i].licenseParameters.platform)) {
                                        license['platform'].push(json.failed[i].licenseParameters.platform);
                                    }
                                } else {
                                    license.push(json.failed[i]);
                                }
                            }
                        }
                    }  
                }              
                    
                for (var index in entityIdList) {
                    if (select) { 
                        if (failedCount === 0) {
                            EE.dataset.datasets[collectionId].results.numberBulkOrdered++;
                            EE.bulkDownload.numberScenes++;
                            EE.bulkDownload.select(entityIdList[index], collectionId);
                        } else {
                            if (!failedItems.includes(entityIdList[index])) {
                                EE.dataset.datasets[collectionId].results.numberBulkOrdered++;
                                EE.bulkDownload.numberScenes++;
                                EE.bulkDownload.select(entityIdList[index], collectionId);
                            } else {
                                EE.bulkDownload.remove(entityIdList[index], collectionId);
                            }                            
                        }                     
                    } else {
                        EE.dataset.datasets[collectionId].results.numberBulkOrdered--;
                        EE.bulkDownload.numberScenes--;
                        EE.bulkDownload.deselect(entityIdList[index], collectionId);
                    }
                }

                if (select && failedCount > 0) {
                    var addedCount = entityCount - failedCount;   
                    var errorsHtml = '<p>';
                    if (addedCount > 0) {
                        errorsHtml += addedCount + (addedCount > 1 ? ' scenes were' : ' scene was') + ' added to your item basket. ';
                    } else {
                        EE.bulkDownload.addAllToBulkCheck(); // hide add all to bulk container if all add to bulk icons have been removed
                    }     
                    if (unavailableItemsCount > 0) {
                        errorsHtml += unavailableItemsCount + (unavailableItemsCount > 1 ? ' items are' : ' item is') + ' not available for bulk download. '
                    }
                    var requiredLicensingItemsCount = failedCount - unavailableItemsCount;
                    if (requiredLicensingItemsCount > 0) {
                        errorsHtml += requiredLicensingItemsCount + (requiredLicensingItemsCount > 1 ? ' scenes require' : ' scene requires') + ' special license.'
                    }
                    errorsHtml += '</p><br>';
                    if (requiresHddsLicensing) {
                        if (license['platform'].length > 0) {
                            for (var i in license['platform']) {
                                var licenseUri = EE.defaultUrl + 'access/requestplatform/?event=' + license['event']+ '&platform=' + license['platform'][i];
                                errorsHtml += '<p>Restricted event-platform ' + license['platform'][i] + ' access required. Click <a href= "' + licenseUri + '" target="_blank"><span style="font-style: bold; text-decoration: underline; color:blue; cursor: pointer;">here</span></a> to request access.</p>';
                            }
                        } else if (license['event'] !== null){
                            var licenseUri = EE.defaultUrl + 'access/request/?event=' + license['event'];
                            errorsHtml += '<p>Restricted event ' + license['event'] + ' access required. Click <a href= "' + licenseUri + '" target="_blank" ><span style="font-style: bold; text-decoration: underline; color:blue; cursor: pointer;">here</span></a> to request access.</p>';
                        }                        
                    } else {                       
                        for (var i in license) {
                            var lic = license[i].licensingRequired.split(",");
                            for (var j in lic) {
                                var licenseUri = EE.defaultUrl + 'access?entity_id=' + license[i].entityId + '&license=' + lic[j];
                                errorsHtml += '<p>Licensing required for ' + license[i].entityId + '. Click <a href= "' + licenseUri + '" target="_blank" ><span style="font-style: bold; text-decoration: underline; color:blue; cursor: pointer;">here</span></a> to request access.</p>';
                            }                            
                        }                      
                    }

                    $('#addToBulkErrorModal').find('.modal-body').html(errorsHtml);
                    $('#addToBulkErrorModal').modal({show: true});                 
                }                

                $('#shoppingCartLinkNumber').html(EE.order.numberScenes + EE.bulkDownload.numberScenes);
            } else {
                if (EE.controls.allResultsChecked('#show_search_data', 'a.bulk')) {
                    $('#addAllToBulk').prop('checked', true);
                } else {
                    $('#addAllToBulk').prop('checked', false);
                }

                var errorsHtml = '';

                for (var index in json.errors) {
                    errorsHtml += '<p>' + json.errors[index] + '</p>';
                }

                $.blockUI({
                    theme: true,
                    title: 'Could Not Add Scene(s)',
                    message: errorsHtml,
                    timeout: 3000
                });
            }

            $('#addAllToBulk').removeClass('selectAll');
        });
    },
    // TODO: Optimize this
    toggleAll: function (select)
    {
        var collectionId = $('#show_search_data').val().replace(/t4_dataset_/g, '');

        // Obtain all the entityIds that need to be toggled
        var entityIdList = [];

        $('#t4_dataset_' + collectionId).find('a.bulk').each(function () {
            if (select === !$(this).hasClass('selected')) {
                var $row = $(this).closest('tr');
                var entityId = $row.attr('data-entityId');

                // Add all rows that are not excluded
                if (!$('#resultRow_' + collectionId + '_' + entityId).hasClass('excludedResultRow')) {
                    entityIdList.push(entityId);
                }
            }
        });

        EE.bulkDownload.toggle(entityIdList, collectionId, select);
	},
	// TODO: Handle the roll stuff
    toggleAllRoll: function (select)
    {
        var collectionId = $('#rollCollectionId').val();

        // Obtain all the entityIds that need to be toggled
        var entityIdList = [];

        $('#rollResultContent').find('a.bulk').each(function ()
        {
            var $row = $(this).closest('tr');
            var entityId = $row.attr('data-entityId');

            if (select === !$(this).hasClass('selected'))
            {
                entityIdList.push(entityId);
            }
        });

        EE.bulkDownload.toggle(entityIdList, collectionId, select);
    },
    toggleSecondary: function(entityIds, collectionId, select, callback)
    {
        $.ajax({
            dataType: 'json',
            method: 'post',
            url: EE.defaultUrl + 'scene/toggle/bulk/',
            data: {
                entityIds: entityIds.join(','),
                collectionId: collectionId,
                select: select
            }
        }).fail(function () {
            // TODO: Let the generic error handler take care of errors?
        }).done(function (json) {
            if (json.success) {
                // EE.bulkDownload.numberScenes = json.total;
                if (Array.isArray(entityIds)) {
                    EE.bulkDownload.numberScenes += entityIds.length;
                } else {
                    EE.bulkDownload.numberScenes++;
                }
                $('#shoppingCartLinkNumber').html(EE.order.numberScenes + EE.bulkDownload.numberScenes);

                if (callback !== undefined) {
                    callback();
                }
            } else {
                var errorsHtml = '';
                for (var index in json.errors) {
                    errorsHtml += '<p>' + json.errors[index] + '</p>';
                }

                $.blockUI({
                    theme: true,
                    title: 'Could Not Add Scene',
                    message: errorsHtml,
                    timeout: 3000
                });
            }
        });

    }
};

/******************************************************************************
 * CONTROLS
 *****************************************************************************/
EE.controls = {
    allResultsChecked: function (selector, iconSelector)
    {
    	var result = true;
        var containerId = $(selector).val();
        var collectionId = containerId.replace(/t4_dataset_/g, '');
        var $iconSelectors = $('#' + containerId + ' table:visible tbody tr').not('.excludedResultRow').find(iconSelector);

        if (!EE.dataset.isResultLoaded(collectionId))
        {
            return false;
        }

        if ($iconSelectors.length < 1)
        {
            return false;
        }

        $iconSelectors.each(function ()
        {
            if (!$(this).hasClass('selected'))
            {
            	result = false;
                return false; //This line simply exits the .each
            }
        });

        return result;
    },
    allRollResultsChecked: function (selector,iconSelector)
    {
    	var result = true;
        $(selector + ' tr').find(iconSelector).each(function () {
            if (!$(this).hasClass('selected'))
            {
            	result = false;
                return false; //This line simply exits the .each
            }
        });

        return result;
    },
    bodyListener: {
        addListener: function ()
        {
            $('body').bind('click', function(e) {
                if ($('#monthSelectorDropPanel').is(':visible') &&
                    !$(e.target).is('#monthSelectorDropPanel span') &&
                    !$(e.target).is('#monthSelectorDropPanel span input') &&
                    !$(e.target).is('#monthSelector') &&
                    !$(e.target).is('#monthSelector span'))
                {
                    $('#monthSelector').find('span.ui-icon').attr('class', 'ui-icon ui-icon-triangle-1-s');
                    $('#monthSelectorDropPanel').slideUp(75, function () {
                        EE.controls.bodyListener.removeListener();
                    });
                }
            });
        },
        removeListener: function ()
        {
            $('body').unbind('click');
        }
    },
    lock: function ()
    {
        var height = $('#header').height() + $('#toolbar').height() + $('#wrapper').height() + $('#footer').height() + 104;
        $('#pageLock').height(height);
        $('#pageLock').show();
    },
    unlock: function ()
    {
        $('#pageLock').hide();
    }
};

/******************************************************************************
 * DATASET
 *****************************************************************************/
// TODO: EXAMINE!
EE.dataset = {
    loaded: false,
    datasets: [],
    datasets_hidden: 0,
    anyChecked: function ()
    {
        return $('#dataset-menu .dataset_checkbox:checked').length > 0
    },
    getAvailableDatasets: function(term)
    {
        var availableDatasets = [];
        var regex = new RegExp(term,'i');

        $('#dataset-container span.collection').each(function()
        {

        	var $datasetCheckbox = $(this).find('.dataset_checkbox');
        	if(!$datasetCheckbox.prop('checked') && !$datasetCheckbox.prop('disabled'))
        	{
        		var datasetName = $(this).find('label').text();
            	//if(datasetName.toLowerCase().substr(0,term.length) == term.toLowerCase())
            	if(regex.test(datasetName))
            	{
                	availableDatasets.push({label: datasetName,value: $datasetCheckbox.val()});
                }
        	}
        });

        if(availableDatasets.length > 0)
        {
        	availableDatasets.unshift({label: '(All Matched Results)',value: 'all'});
        }

    	return availableDatasets;
    },
    getCheckedDataSets: function ()
    {
        var selectedDatasets = [];
        $('#dataset-menu .dataset_checkbox:checked').each(function()
        {
            selectedDatasets.push($(this).closest('span.collection').attr('data-datasetId'));
        });

        return selectedDatasets;
    },
    getSelected: function ()
    {
        if ($('#activeDataSet').val() != -1)
        {
            return $('#activeDataSet').val() | 0;
        }
        else
        {
            return EE.dataset.findFirstSelected();
        }
    },
    buildDatasetDropdown: function (tabNumber)
    {
        var addCriteriaContent = '';
        var showSearchContent = '';


        if ($('#dataset-menu .dataset_checkbox:checked').length > 0) {
            // Build the drop downs for tabs 3 and 4
            $('#dataset-menu .dataset_checkbox:checked').each(function()
            {
                var datasetId = $(this).closest('span.collection').attr('data-datasetId');

                name = $('#collLabel_' + datasetId).text();
                addCriteriaContent += '<option value="frameset_' + datasetId + '">' + name + '</option>';
                showSearchContent += '<option value="t4_dataset_' + datasetId + '">' + name + '</option>';
            });

            // Replace all previously selected options
            if (tabNumber == 3) {
                $('#add_crit_data').html(addCriteriaContent);
            } else {
                $('#show_search_data').html(showSearchContent);
            }
        }
    },
    findFirstSelected: function ()
    {
        if ($('#dataset-menu .dataset_checkbox:checked').length === 0) {
            return -1;
        }

        return $('#dataset-menu .dataset_checkbox:checked:eq(0)').closest('span.collection').attr('data-datasetId');
    },
    clearResults: function (collectionId)
    {
        $('#invalidateResultButton').prop('disabled', true).val('Clearing Cache....');

        $.ajax({
            url: EE.defaultUrl + 'result/clear',
            data: {
                collection_id: collectionId
            },
            cache: false,
            async: true,
            dataType: 'html',
            success: function ()
            {
                EE.tabs.tabInfo.setLastChange([1,2,3]);
                EE.tabs.results.load();
                $('#invalidateResultButton').prop('disabled', false).val('Clear Result Cache');
            }
        });
    },
    // TODO: Rewrite this
    excludeResult: function (entityId, collectionId)
    {
        var sceneId = collectionId + '_' + entityId;

        // Remove the footprint, browse, and infoWindows
        if (EE.maps.overlays.footprints[sceneId] !== undefined)
        {
            EE.maps.footprints.hide(sceneId);
        }

        if (EE.maps.overlays.browse[sceneId] !== undefined)
        {
            EE.maps.browse.hide(sceneId);
        }

        if (EE.maps.overlays.infoWindows[sceneId] !== undefined)
        {
            EE.maps.overlays.infoWindows[sceneId].remove();
        }

        $.ajax({
            dataType: 'json',
            method: 'POST',
            url: EE.defaultUrl + 'scene/toggle/exclude/',
            data: {
                entityIds: entityId,
                collectionId: collectionId,
                select: true
            }
        }).fail(function () {
            // TODO: Let the generic error handler take care of errors?
        }).done(function (json) {
            if (json.error) {
                alert(json.error);

                return;
            }

            if (json.total > 0) {
                // Remove the excluded and selected classes
                var resultRow = $('#resultRow_' + collectionId + '_' + entityId);
                resultRow.addClass('excludedResultRow');
                resultRow.find('.excludeOption').addClass('selected');

                // Show the include excluded control
                $('.excludeReset_' + collectionId).show();
            } else {
                $('.excludeReset_' + collectionId).hide();
            }
        });
    },
    handleResultOptions: function (collection_id) {
        try {
            var checkBrowse = $('#t4_dataset_' + collection_id + ' a.browse');
            if (checkBrowse.length === 0) {
                EE.dataset.datasets[collection_id].results['showAllOverlaysOption'] = false;
                EE.dataset.datasets[collection_id].results['hasOverlays'] = false;
            }

            var checkFootprint = $('#t4_dataset_' + collection_id + ' a.footprint');
            if (checkFootprint.length === 0) {
                EE.dataset.datasets[collection_id].results['showAllFootprintsOption'] = false;
            }
            
            var pageInfo = EE.dataset.datasets[collection_id].results;
        } catch (exception) {
            // EE.dataset.datasets[collection_id] is undefined due to error -- simply return
            console.log(exception);
            return;
        }

        var showControls = (pageInfo.showAllFootprintsOption
                    || pageInfo.showAllOverlaysOption || pageInfo.showAllOrderOption
                    || pageInfo.showAllBulkOption || pageInfo.hasOverlays);

        if (pageInfo.hasResults)
        {
            if(showControls) $('#tab4controlsContainer').show();
            else $('#tab4controlsContainer').hide();

            $('#metadataExportButton').show();
        }
        else
        {
            $('#tab4controlsContainer').hide();
            $('#metadataExportButton').hide();
        }

        //Show/Hide the all options
        if (pageInfo.hasResults && pageInfo.showAllFootprintsOption)
        {
            $('#showAllFootprintsContainer').show();
            
            if (pageInfo.autoSelectFootprints) {
                if ($('#optionAutoCenter').prop('checked') === false) {
                    $('#optionAutoCenter').click();
                }
                
                $('#showAllFootprints').click();
            }
        }
        else
        {
            $('#showAllFootprintsContainer').hide();
        }
        
        if (pageInfo.hasResults && pageInfo.autoSelectCoverageMap)
        {
            //TODO :: TEST THIS - THE OLD CODE HAD DUPLICATED CODE SO I REPLACED IT BY SIMULATING THE CLICK ON THE COVERAGE LAYER
            $('.collection[data-datasetId="' + $('#show_search_data').val().split('_')[2] + '"] .coverageSelector').click();
        }

        if (pageInfo.hasResults && pageInfo.showAllOverlaysOption)
        {
            $('#showAllBrowseContainer').show();
            $('#showBrowseComparison').show();
        }
        else
        {
            $('#showAllBrowseContainer').hide();
            $('#showBrowseComparison').hide();
        }

        if (pageInfo.hasResults && pageInfo.showAllOrderOption)
        {
            $('#addAllToOrderContainer').show();
            $('#addAllToOrder').prop('checked', EE.controls.allResultsChecked('#show_search_data','a.order'));
        }
        else
        {
            $('#addAllToOrderContainer').hide();
        }

        if (pageInfo.hasResults && pageInfo.showAllBulkOption)
        {
            $('#addAllToBulkContainer').show();
            $('#addAllToBulk').prop('checked', EE.controls.allResultsChecked('#show_search_data','a.bulk'));

        }
        else
        {
            $('#addAllToBulkContainer').hide();
        }

        if (pageInfo.hasResults && pageInfo.hasOverlays)
        {
            $('#browseOpacityContainer').show();
        }
        else
        {
            $('#browseOpacityContainer').hide();
        }
    },
    toggleBrowseComparison: function (entityId, collectionId, isSelected) {
        $.ajax({
            dataType: 'json',
            method: 'POST',
            url: EE.defaultUrl + 'scene/toggle/compare/',
            data: {
                entityIds: entityId,
                collectionId: collectionId,
                select: !isSelected
            }
        }).fail(function () {
            // TODO: Let the generic error handler take care of errors?
        }).done(function (json) {
            if (json.error) {
                alert(json.error);

                return;
            }

            var resultRow = $('#resultRow_' + collectionId + '_' + entityId);

            if (!isSelected) {
                resultRow.find('.browseCompareOption').addClass('selected');
            } else {
                resultRow.find('.browseCompareOption').removeClass('selected');
            }
        });
    },
    // TODO: Rewrite this
    includeResult: function (entityId, collectionId) {
        $.ajax({
            dataType: 'json',
            method: 'POST',
            url: EE.defaultUrl + 'scene/toggle/exclude/',
            data: {
                entityId: entityId,
                collectionId: collectionId,
                select: false
            }
        }).fail(function () {
            // TODO: Let the generic error handler take care of errors?
        }).done(function (json) {
            if (json.error) {
                alert(json.error);

                return;
            }

            // Remove the excluded and selected classes
            var resultRow = $('#resultRow_' + collectionId + '_' + entityId);
            resultRow.removeClass('excludedResultRow');
            resultRow.find('.excludeOption').removeClass('selected');

            if (json.total < 1) {
                $('.excludeReset_' + collectionId).hide();
            } else {
                $('.excludeReset_' + collectionId).show();
            }
        });
    },
    // TODO: Rewrite this
    includeAllResults: function () {
        var dataSetContainerId = $('#show_search_data').val();
        var collectionId = dataSetContainerId.replace(/t4_dataset_/g, '');

        $.ajax({
            dataType: 'json',
            method: 'post',
            url: EE.defaultUrl + 'scene/excludereset/',
            data: {
                collectionId: collectionId
            },
            cache: false,
            success: function (json) {
                $('#' + dataSetContainerId).find('tr.excludedResultRow').each(function () {
                    // Remove the selected class
                    $(this).find('.excludeOption').removeClass('selected');

                    // Remove the excludedResultRow class
                    $(this).removeClass('excludedResultRow');
                });

                $('.excludeReset_' + collectionId).hide();
            }
        });
    },
    prefilter: {
        checked: false,
        run: function ()
        {
            if ($('#use_prefilter').prop('checked'))
            {
                EE.dataset.datasets_hidden = 0;
                $('#dataSetPrefilterToggle').text("(Show)");
                EE.dataset.prefilter.checked = false;

                // we need to run the pre-filter on the datasets
                $.ajax({
                    dataType: 'json',
                    method: 'get',
                    url: EE.defaultUrl + 'dataset/filter'
                }).fail(function () {
                    // TODO: Let the generic error handler take care of errors?
                }).done(function (json) {
                    var hasCriteria = json.includesCriteria;
                    var filtered_datasets = json.filteredDatasets;

                    $('#dataSetPrefilterHint').remove();

                    if (hasCriteria === false) {
                        $('#dataSetPrefilterMessage').prepend('<div id="dataSetPrefilterHint">You have not modified your search criteria.</div>');
                    }

                    var dataset_num = 0;

                    $('#dataset-container li').each(function () {
                        var thisDivRef = $(this);
                        if (!$(this).hasClass('expandable') && !$(this).hasClass('collapsable')) {
	                        thisDivRef.find('span.collection').each(function () {
	                            var thisRef = $(this);
	                            var dataset = thisRef.find('input.dataset_checkbox').attr('id').replace(/coll_/g, '');
	   							dataset_num++;

	                            if (!in_array(dataset, filtered_datasets)) {
                                    thisRef.data('hidden', true);

	                                if (EE.dataset.prefilter.checked) {
	                                    thisRef.find('input.dataset_checkbox').attr('disabled', true);
	                                    thisRef.addClass('dataset_disabled');
	                                } else {
	                                    thisRef.find('input.dataset_checkbox').attr('disabled', true);
	                                    thisRef.hide();
	                                    thisRef.addClass('dataset_disabled');

	                                }

	                                thisRef.find('input.dataset_checkbox').each(function () {
	                                    var thisInputRef = $(this);

	                                    if (thisInputRef.attr('checked')) {
	                                        if (!EE.dataset.anyChecked()) {
	                                            // Set tabs 1 & 2 to active
	                                            EE.tabs.tabInfo.setActive([1,2]);

	                                        }
	                                    }
	                                });
	                                EE.dataset.datasets_hidden++;
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

                    $('#dataSetPrefilterHiddenNum').html(EE.dataset.datasets_hidden);
                    $('#dataSetPrefilterTotal').html(dataset_num);
                    $('#dataSetPrefilterMessage').show();
                });
            }
            else
            {
                $('#dataset-container li').each(function ()
                {
                    var thisDivRef = $(this);

                    thisDivRef.find('span.collection').each(function ()
                    {
                        var thisSpanRef = $(this);

                        thisSpanRef.find('input.dataset_checkbox').each(function ()
                        {
                            var thisInputRef = $(this);
                            if (thisInputRef.prop('disabled') && thisInputRef.prop('checked'))
                            {
                                if (EE.dataset.anyChecked() && EE.tabs.tabInfo.isActive(3) === false)
                                {
                                    // Set tabs 3 and 4 to active if not already
                                    if (!EE.tabs.tabInfo.isActive(3) && !EE.tabs.tabInfo.isActive(4))
                                    {
                                        EE.tabs.tabInfo.setActive([1,2,3,4]);
                                    }
                                }
                            }
                        });

                        thisSpanRef.data('hidden', false);

                        if (EE.dataset.prefilter.checked)
                        {
                            thisSpanRef.find('input.dataset_checkbox').prop('disabled', false);
                            thisSpanRef.removeClass('dataset_disabled');
                        }
                        else
                        {
                            thisSpanRef.find('input.dataset_checkbox').prop('disabled', false);
                            thisSpanRef.show();
                            thisSpanRef.removeClass('dataset_disabled');
                        }
                    });

                    $(this).show();
                    $('#dataSetPrefilterHiddenNum').empty();
                    $('#dataSetPrefilterMessage').hide();
                    EE.dataset.datasets_hidden = 0;
                });
            }
        },
        toggle: function ()
        {
            if (EE.dataset.prefilter.checked)
            {
                $('#dataSetPrefilterToggle').text("(Show)");
                $('#dataset-container li').each(function ()
                {
                    $(this).find('span.dataset_disabled').each(function ()
                    {
                        $(this).hide();
                    });

                    if ($(this).find('span.collection').length == $(this).find('span.dataset_disabled').length)
                    {
                        $(this).hide();
                    }
                });
            }
            else
            {
                $('#dataSetPrefilterToggle').text("(Hide)");
                $('#dataset-container li').each(function ()
                {
                    $(this).children('span.collection').each(function ()
                    {
                        $(this).show();
                    });

                    $(this).show();
                });
            }

            EE.dataset.prefilter.checked = !EE.dataset.prefilter.checked;
        }
    },
    getResultPage: function(collectionId, pageNum)
    {
        var data = {
            datasetId : collectionId,
            resultsPerPage: $('#resultsPerPageSelect').val()
        };

        if (pageNum !== undefined && pageNum !== null) {
        	data.pageNum = pageNum;
        }

        var searchDialog = null;

        $.ajax({
            dataType: 'html',
            method: 'post',
            url: EE.defaultUrl + 'scene/search',
            data: data,
            cache: false,
            timeout: 300000, // 5 minutes
            xhr: function () {
                var jqXHR = $.ajaxSettings.xhr();

                return jqXHR;
            },
            beforeSend: function (jqXHR, settings) {
                searchDialog = $('<div><table id="searchDialog"><tbody></tbody></table></div>').dialog({
                    modal: true,
                    autoOpen: true,
                    closeOnEscape: false,
                    resizable: false,
                    dialogClass: 'ui-dialog-empty',
                    width: 425,
                    height: 'auto',
                    close: function () {
                        $(this).dialog('destroy');
                    }
                });

                var row = $('#searchDialogTemplate tr').clone();

                // Set the text to "Searching <Data Set>"
                row.find('.name').text("Searching " + $('#show_search_data option:selected').text());

                // Add the HTML to the searchDialog element
                var context = row.appendTo($('#searchDialog tbody'));

                row.find('.action button').click(function () {
                    jqXHR.abort();
                });
            },
            complete: function (jqXHR, textStatus) {
                var resultContainer = $('#t4_dataset_' + collectionId);

                // Make sure the dataset object is set -- on external networks, the EE.dataset.datasets object can sometimes not be populated prior to this request completing
                if (EE.dataset.datasets[collectionId] == undefined) {
                    EE.dataset.datasets[collectionId] = {};
                }

                if (textStatus == 'success' ) {
                    EE.dataset.datasets[collectionId].pageNum = parseInt(pageNum, 10);
                    resultContainer.html(jqXHR.responseText);

                    //Now that it's been sourced we can pull some info out of the result HTML
                    EE.dataset.datasets[collectionId].results = {
                        autoSelectCoverageMap: false,
                        autoSelectFootprints: false,
                        showAllFootprintsOption: true,
                        showAllOverlaysOption: true,
                        showAllBulkOption: true,
                        showAllOrderOption: true,
                        hasOverlays: true,
                        numberBulkOrdered: 0,
                        numberOrdered: 0,
                        numResults: 25,
                        hasResults: true
                    };
                } else if (textStatus == 'abort') {
                    resultContainer.html("<div class=\"noResultContainer\"><i class=\"far fa-exclamation-triangle fa-lg\"></i> Search was cancelled</div>");
                } else if (textStatus == 'timeout') {
                   resultContainer.html("<div class=\"noResultContainer\"><i class=\"far fa-exclamation-triangle fa-lg\"></i> Search Timed Out</div>");
                } else {
                   resultContainer.html("<div class=\"noResultContainer\"><i class=\"far fa-exclamation-triangle fa-lg\"></i> Search Failed</div>");
                }

                //If we don't have search results, make sure we have a result object defined for the downstream code to use
                if (textStatus != 'success') {
                    EE.dataset.datasets[collectionId].results = {
                        autoSelectCoverageMap: false,
                        autoSelectFootprints: false,
                        showAllFootprintsOption: false,
                        showAllOverlaysOption: false,
                        showAllBulkOption: false,
                        showAllOrderOption: false,
                        hasOverlays: false,
                        numberBulkOrdered: 0,
                        numberOrdered: 0,
                        numResults: 25,
                        hasResults: false
                    };
                }

                $('#search-results-container,#showAllContainer,#t4_dataset_' + collectionId + ' table').show();

                EE.dataset.handleResultOptions(collectionId);

                searchDialog.dialog('close');
            },
            error: function (jqXHR, textStatus, errorThrown) {
                var resultContainer = $('#t4_dataset_' + collectionId);
                if (resultContainer.length > 0) {
                    resultContainer.html("<div class=\"noResultContainer\"><i class=\"far fa-exclamation-triangle fa-lg\"></i> Search Failed (Server)</div>");
                }
            }
        });
    },
    isResultLoaded: function (collectionId)
    {
        return ($('#t4_dataset_' + collectionId).children('table.resultPageTable').length)? true : false;
    },
    searchDataSet: function (collectionId)
    {
        var html = '<div id="t4_dataset_' + collectionId + '" class="t4_dataSelectContainer"></div>';

        $('#search-results-container').append(html);

        if (EE.dataset.isResultLoaded(collectionId))
        {
            EE.dataset.handleResultOptions(collectionId);
        }
        else
        {
            EE.dataset.getResultPage(collectionId);
        }
    },
    showRoll: function (entity_id, displayId, page, newDialog)
    {
    	if(newDialog)
    	{
            $.blockUI({
                theme:     true,
                title:    'Gathering Results',
                message:  '<p>Please wait while we find the other scenes associated with your selection. This may take several minutes.</p>',
                baseZ: 2000
            });
        }
        else
        {
            $.blockUI({
                theme:     true,
                title:    'Gathering Result Page',
                message:  '<p>Please wait while we load more results. This may take several minutes.</p>',
                baseZ: 2000
            });
        }

        $.ajax({
            url: EE.defaultUrl + 'scene/related/',
            data: {
                entityId: entity_id,
                datasetId: $('#show_search_data').val().replace(/t4_dataset_/g, ''),
                page: page
            },
            cache: false,
            async: true,
            method: 'POST',
            dataType: 'html',
            success: function(html)
            {
            	$('#rollDialogContent').html(html);

            	if(newDialog)
            	{
                    $('#rollDialog').dialog({
                        modal: true,
                        autoOpen: false,
                        resizable: false,
                        width: 600,
                        height: 700,
                        title: 'Related Scenes for: ' + displayId,
                        buttons: {
                            'Close': function (){
                                $(this).dialog('close');
                            }
                        },
                        close: function (){
                            //Destroy the modal
                            $(this).dialog('option','buttons',{});
                            $(this).dialog('destroy');
                        }
                    });
                }

                var buttons = {};

                if($('#hasRollBulk').val() == 1)
                {
                    buttons['Add/Remove Page to Bulk Order'] = function()
                    {
                            EE.bulkDownload.toggleAllRoll(!EE.controls.allRollResultsChecked('#rollResultContent','a.bulk'));
                    };
                }

                if($('#hasRollOrder').val() == 1)
                {
                    buttons['Add/Remove Page to Order'] = function()
                    {
                            EE.order.toggleAllRoll(!EE.controls.allRollResultsChecked('#rollResultContent','a.order'));
                    };
                }

                buttons.Close = function(){
                        $('#rollDialog').dialog('close');
                };

                $('#rollDialog').dialog('option','buttons',buttons);

                $('.pageLinkRoll').click(
                	function()
                	{
                		if(!$(this).hasClass('disabled'))
                		{
                			EE.dataset.showRoll(entity_id, displayId, $(this).attr('id').split('||')[0], false);
                		}
                	}
                );

                $('.pageSelector_roll').change(
                	function()
                	{
                		EE.dataset.showRoll(entity_id, displayId, $(this).val(),false);
                	}
                );

                $.unblockUI();

                if(newDialog)
                {
                	$('#rollDialog').dialog('open');
                }
            },
            error: function() {
                $.unblockUI();
            }
        });
    },

    datasetSelNotify: function (objId)
    {
        var hasExpand = $('#' + objId).attr('aria-expanded');
        if (hasExpand === 'true') {
            $('#' + objId).text('Show Related Data Set List');
            $('#' + objId).prop('title', 'Show Related Data Set List');
        } else {
            $('#' + objId).text('Hide Related Data Set List');
            $('#' + objId).prop('title', 'Hide Related Data Set List');
        }
    }
};

/******************************************************************************
 * DOWNLOAD
 *****************************************************************************/
EE.download = {
    getDownloadOptions: function (dataset_id, entity_id) {
        $.blockUI({
            theme:     true,
            title:    'Notice',
            message:  '<p>Loading Download Options...</p>',
            timeout: 0
        });

        $.ajax({
            dataType: 'html',
            method: 'post',
            url: EE.defaultUrl + 'scene/downloadoptions/' + dataset_id + '/' + entity_id,
            data: {},
            async: true,
            cache: false,
            success: function (response) {
                $('<div></div>').html(response).dialog({
                    modal: true,
                    autoOpen: true,
                    dialogClass: 'downloadOptionsDialog',
                    resizable: false,
                    height: 'auto',
                    width: 'auto',
                    title: 'Download Options',
                    close: function () {
                        $(this).dialog('destroy');
                    }
                });

                if ($('#optionsContainer .downloadButton').length + $('#optionsContainer .secondaryDownloadButton').length === 0) {
                    $('#downloadErrorContainer').text('No download options were found').slideDown();
                }

                $('#optionsPage .downloadButton').click(function()
                {
                    EE.download.requestDownload($(this).attr('data-productId'), $(this).closest('.downloadButtons').attr('data-entityId'));
                });

                $('#optionsPage .secondaryDownloadButton').click(function()
                {
                    var eId = $(this).attr('data-entityId');
                    EE.download.requestDownload($(this).attr('data-productId'), eId, false);
                });

                $.unblockUI();
            },
            error: function (jqXHR, textStatus, errorThrown) {
                // TODO: Let the generic error handler take care of errors?
                /*if (errorThrown) {
                    alert(errorThrown);
                }*/
                $.unblockUI();
            }
        });
    },
    requestDownload: function(productId, entityId, isPrimary, systemId)
    {
        if (isPrimary === undefined) {
            isPrimary = true;
        }

        var downloadRequestUrl = EE.defaultUrl + 'download/' + productId + '/' + entityId + '/';

        if (systemId !== undefined && systemId !== null && systemId != '') {
            downloadRequestUrl += systemId + '/';
        }

        var $downloadErrorContainer = (isPrimary === true) ? $('#downloadErrorContainer') : $('#secondaryDownloadErrorContainer');
        if ($downloadErrorContainer.is(':visible')) {
            $downloadErrorContainer.slideUp();
        }

        $.ajax({
            dataType: 'json',
            method: 'post',
            url: downloadRequestUrl,
            data: {},
            async: true,
            cache: false,
            success: function (json) {
                if (json.url !== null) {
                    DevConsole.logMessage('download', entityId + ' - ' + json.url);

                    //If we have users, then the user must accept them before we allow the download
                    if (json.eulas !== undefined) {

                        var eulaContent = '';
                        $.each(json.eulas, function(i, eula)
                        {
                            eulaContent += ' <div class="contentBox" style="overflow: auto; max-height: 600px; max-width: 800px;">'
                                                + '<pre style="white-space: pre-wrap; word-wrap: break-word;">' + eula.agreementContent + '</pre>'
                                            +'</div>'
                        });

                        $('#eulaAgreeButton').attr('data-downloadUrl', encodeURI(json.url));
                        $('#eulaAgreement').html(eulaContent);

                        $('#eulaModal').modal('show');
                    } else {
                        window.open(json.url);
                    }
                } else {
                    DevConsole.logMessage('download', entityId + ' - ' + json.errorMessage);
                    $downloadErrorContainer.html(json.errorMessage).slideDown();
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                $downloadErrorContainer.text('Unable to retrieve download at this time').slideDown();
            }
        });
    }
};

/******************************************************************************
 * ORDER
 *****************************************************************************/
EE.order = {
    numberScenes: 0,
    listPrice: 0.0,
    totalPrice: 0.0,
    deselect: function (entityId, collectionId)
    {
        $('#t4_dataset_' + collectionId).find('tr[data-entityId="' + entityId + '"][data-collectionId="' + collectionId + '"] a.order').removeClass('selected');
        $('#orderroll_' + entityId).removeClass('selected');

        $('#addAllToOrder').prop('checked', false);
    },
    select: function (entityId, collectionId)
    {
        $('#t4_dataset_' + collectionId).find('tr[data-entityId="' + entityId + '"][data-collectionId="' + collectionId + '"] a.order').addClass('selected');
        $('#orderroll_' + entityId).addClass('selected');

        if ($('#addAllToOrder').hasClass('selectAll') === false) {
            if (EE.controls.allResultsChecked('#show_search_data', 'a.order')) {
                $('#addAllToOrder').prop('checked', true);
            } else {
                $('#addAllToOrder').prop('checked', false);
            }
        }
    },
    toggle: function (entityIdList, collectionId, select, selectAll)
    {
        if (entityIdList.length < 1) {
            return;
        }

        $.ajax({
            dataType: 'json',
            method: 'post',
            url: EE.defaultUrl + 'scene/toggle/order',
            data: {
                entityIds: entityIdList.join(','),
                collectionId: collectionId,
                select: select
            }
        }).fail(function () {
            // TODO: Let the generic error handler take care of errors?
        }).done(function (json) {
            if (selectAll === true) {
                $('#addAllToOrder').addClass('selectAll');
            }

            for (var index in json.sceneList) {
                if (select) {
                    EE.order.numberScenes++;
                    EE.dataset.datasets[collectionId].results.numberOrdered++;
                    EE.order.select(json.sceneList[index], collectionId);
                } else {
                    EE.order.numberScenes--;
                    EE.dataset.datasets[collectionId].results.numberOrdered--;
                    EE.order.deselect(json.sceneList[index], collectionId);
                }
            }

            // If the count of the entityIdList doesn't match the count of the affected scenes, all results were not added
            if (entityIdList.length != json.sceneList.length) {
                $('#addAllToOrder').prop('checked', false);
            }

            $('#addAllToOrder').removeClass('selectAll');

            $('#shoppingCartLinkNumber').html(EE.order.numberScenes + EE.bulkDownload.numberScenes);

            if (!json.success) {
                if (entityIdList.length == 1) {
                    var errorMessage = (json.errors.length == 1) ? json.errors[0] : entityIdList[0].displayId + ' could not be added to your item basket.';

                    $.blockUI({
                        theme: true,
                        title: 'Could Not Add Scene',
                        message: '<p>' + errorMessage + '</p>',
                        timeout: 3000
                    });
                } else {
                    var errorMessage = (json.errors.length == 1) ? json.errors[0] : 'Some or all of the scenes you requested could not be added to your item basket.';

                    $.blockUI({
                        theme: true,
                        title: 'Could Not Add Scenes',
                        message: '<p>' + errorMessage + '</p>',
                        timeout: 3000
                    });
                }
            }
        });
    },
    // TODO: Optimize as much as possible
    toggleAll: function (select)
    {
        var collectionId = $('#show_search_data').val().replace(/t4_dataset_/g, '');

        // Obtain all the entityIds that need to be toggled
        var entityIdList = [];

        $('#t4_dataset_' + collectionId).find('a.order').each(function () {
            if (select === !$(this).hasClass('selected')) {
                var $row = $(this).closest('tr');
                var entityId = $row.attr('data-entityId');

                // Add all rows that are not excluded
                if (!$('#resultRow_' + collectionId + '_' + entityId).hasClass('excludedResultRow')) {
                    entityIdList.push(entityId);
                }
            }
        });

        EE.order.toggle(entityIdList, collectionId, select);
    },
    // TODO: Rewrite to handle roll stuff
    toggleAllRoll: function (select)
    {
        var collectionId = $('#rollCollectionId').val();

        // Obtain all the entityIds that need to be toggled
        var entityIdList = [];

        $('#rollResultContent').find('a.order').each(function () {
            if (select === !$(this).hasClass('selected')) {
                var $row = $(this).closest('tr');
                var entityId = $row.attr('data-entityId');

                entityIdList.push(entityId);
            }
        });

        EE.order.toggle(entityIdList, collectionId, select);
	}
};

/******************************************************************************
 * SEARCH SUMMARY
 *****************************************************************************/
EE.searchSummary = {
    isOpen: false,
    clear: function ()
    {
        // Data sets list
        $('#summaryDataSets').html('<li>No data sets selected.</li>');

        // Coordinates list
        $('#summaryAreaOfInterest').html('<li>No coordinates selected.</li>');

        // Criteria list
        $('#summaryStartDate').html('None');
        $('#summaryEndDate').html('None');
        $('#summaryMonths').html($('#monthSelector span.text').html());
    },
    toggle: function ()
    {
        if (EE.searchSummary.isOpen){
            $("#searchCriteriaStatus").text("(Show)");
            $('#mapOverlays').hide();
            $("#searchCriteria").slideUp(function ()
            {
                $('#mapOverlays').show();
            });
        }
        else
        {
            $("#searchCriteriaStatus").text("(Hide)");
            $('#mapOverlays').hide();
            $("#searchCriteria").slideDown(function ()
            {
                $('#mapOverlays').show();
            });
        }

        EE.searchSummary.isOpen = !EE.searchSummary.isOpen;
    },
    update: function (data)
    {
        switch (data.tab)
        {
            case 1 :
                var coordinatesList = '';

                if(data.pType == 'shape')
                {
                	coordinatesList = '<li>Predefined Area: ' + data.spatialName +'</li>';
                }
                else
                {
	                // Populate the area of interest list
	                if (data.coordinates.length > 0)
	                {
	                    for (var index in data.coordinates)
	                    {
	                        coordinatesList += '<li><strong>Coordinate ' +
	                            ((data.coordinates[index].c | 0)+1) + ':</strong> ' +
	                            data.coordinates[index].a + ', ' +
	                            data.coordinates[index].o + '</li>';
	                    }
	                }
	                else
	                {
	                    coordinatesList = '<li>No coordinates selected.</li>';
	                }
                }
                $('#summaryAreaOfInterest').html(coordinatesList);

                // Populate the criteria list
                $('#summaryStartDate').html(data.dStart ? data.dStart : 'None');
                $('#summaryEndDate').html(data.dEnd ? data.dEnd : 'None');
                $('#summaryMonths').html($('#monthSelector span.text').html());

                break;
            case 2 :
                var dataSetList = '';

                // Grab the name of each data set selected
                if (data.cList.length > 0)
                {
                    for (var index in data.cList)
                    {
                        dataSetList += '<li>' +
                            $('#collLabel_' + data.cList[index]).attr('title') +
                            '</li>';
                    }
                }
                else
                {
                    dataSetList = '<li>No ' + EE.verbiage.collectionType.toLowerCase() + 's selected</li>';
                }

                $('#summaryDataSets').html(dataSetList);

                break;
        }
    }
};
