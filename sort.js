/* 
 *
 * Matthew Proctor's Presence Dashboard
 * Functions to sort the presence tiles - by name and status/presence 
 * 
 */

function sort_dashboard_by_status() {
    // Derived from http://stackoverflow.com/a/1603751/2276431
    var categories = new Array();
    var content = new Array();
    var ids = new Array();
    //Get Divs
    $('#dashboardoutput > [category]').each(function (i) {
        //Add to local array
        categories[i] = $(this).attr('category');
        ids[i] = $(this).attr('id');
        content[i] = $(this).html();
    });
    $('#dashboardoutput').empty();
    //Sort Divs
    for (i = 0; i < category_sort_order.length; i++) {
        //Grab all divs in this category and add them back to the form
        for (j = 0; j < categories.length; j++) {
            if (categories[j] == category_sort_order[i]) {
                $('#dashboardoutput').append('<div category="' + category_sort_order[i] + '" class="col-sm-3" id="' + ids[i] + '" >' + content[j] + '</div>');
            }
        };
    }
}


function sort_dashboard_by_name() {
    // Derived from http://stackoverflow.com/a/1603751/2276431
    var categories = new Array();
    var content = new Array();
    var ids = new Array();
    //Get Divs
    $('#dashboardoutput > [id]').each(function (i) {
        //Add to local array
        categories[i] = $(this).attr('category');
        ids[i] = $(this).attr('id');
        content[i] = $(this).html();
    });
    $('#dashboardoutput').empty();
    for (i = 0; i < ids.length - 1; i++) {
        for (j = i + 1; j < categories.length; j++) {
            if (ids[i] > ids[j]) {
                var temp_categories = categories[i];
                var temp_content = content[i];
                var temp_ids = ids[i];
                categories[i] = categories[j];
                content[i] = content[j];
                ids[i] = ids[j];
                categories[j] = temp_categories
                content[j] = temp_content;
                ids[j] = temp_ids;
            }
        }
    }
    //Sort Divs
    for (i = 0; i < ids.length; i++) {
        $('#dashboardoutput').append('<div category="' + categories[i] + '" class="col-sm-3" id="' + ids[i] + '" >' + content[i] + '</div>');
    }
}
