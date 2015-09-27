/**
 *
 * Matthew Proctor's Presence Dashboard
 * Loads all contacts for the signed-in user, and displays them in a 'Presence Dashboard' style approach
 * http://www.matthewproctor.com/
 * 
 */

// Two dynamic arrays to store our div id's and email addresses
var name_ids = new Array();
var emailAddresses = new Array();
var category_sort_order = ['Online', 'Away', 'Busy', 'DoNotDisturb', 'Offline'];

// this function replaces a broken image with a nice blue Lync/Skype icon - indicating the contact doesn't have a photo.
function imgError(image) {
    image.onerror = "";
    image.src = "assets/noimage.png";
    return true;
}

function pause(howlongfor) {
    log("Pausing for " + howlongfor + "ms");
    var currentTime = new Date().getTime();
    while (currentTime + howlongfor >= new Date().getTime()) { }
}

function log(texttolog) {
    var d = new Date();
    var time = padLeft(d.getHours(), 2) + ":" + padLeft(d.getMinutes(), 2) + ":" + padLeft(d.getSeconds(), 2) + ":" + padLeft(d.getMilliseconds(), 3);
    $('#logging_box').prepend(time + ": " + texttolog + "<br>");
}
function padLeft(nr, n, str) {
    return Array(n - String(nr).length + 1).join(str || '0') + nr;
}

var bs_header = '';  // reserved for future use
var bs_footer = '';  // reserved for future use  

$(function () {
    'use strict';

    $('#controlbox').hide();
    $('#thedashboard').hide();
    $('#thenavbar').hide();
    $('#settings').hide();
    $('#loggingdiv').show();
    $('#presencelegenddiv').hide();
    $('#welcomebox').hide();

    $('#showoffline').attr('checked', false);
    $('#sortbyname').attr('checked', false);
    $('#sortbystatus').attr('checked', false);

    log("App Loaded");

    var Application
    var client;
    Skype.initialize({
        apiKey: 'SWX-BUILD-SDK',
    }, function (api) {
        Application = api.application;
        client = new Application();
        log("Client Created");
       
    }, function (err) {
        log('some error occurred: ' + err);
    });

     

    //start the refresh spinner
    function spinner_start() {
        $("#refreshicon").addClass("spin");
    }
    //stop the refresh spinner
    function spinner_stop() {
        $("#refreshicon").removeClass("spin");
    }

   
    function build_dashboard() {
        log('Building Dashboard...');
        $('#welcomebox').hide();
        
        //clear the name cache
        name_ids.length = 0;
        emailAddresses.length = 0;

        spinner_start();

        // clear the existing dashboard
        $('#dashboardoutput').empty();

        var thestatus = '';
        var destination = '';
        var personuri = "";

        client.personsAndGroupsManager.all.persons.get().then(function (persons) {
            // `persons` is an array, so we can use Array::forEach here
            log('Found Collection');
            $('#dashboardoutput').append(bs_header);

            persons.forEach(function (person) {
                // the `name` may not be loaded at the moment
                personuri = "";

                person.displayName.get().then(function (name) {

                    // subscribe to the status change of everyone - so that we can see who goes offline/away/busy/online etc.
                    person.status.changed(function (status) {
                        $("#updatelabel").val(name + ' is now ' + status);

                        var d = new Date();
                        var curr_hour = d.getHours();
                        var curr_min = d.getMinutes();
                        var curr_sec = d.getSeconds();

                        var new_presence_state = '';
                        if (status == 'Online') {
                            new_presence_state = 'alert alert-success';
                        }
                        else if (status == 'DoNotDisturb') {
                            new_presence_state = 'alert alert-dnd';
                        }
                        else if (status == 'Away') {
                            new_presence_state = 'alert alert-warning';
                        }
                        else if (status == 'Busy') {
                            new_presence_state = 'alert alert-danger';
                        }
                        else {
                            if ($('#showoffline').is(":checked")) {
                                new_presence_state = 'alert alert-info';
                            }
                        }
                        if (new_presence_state != '') {
                            var name_id = name.replace(/[^a-z0-9]/gi, '');
                            $('#status' + name_id).attr('class', new_presence_state);
                        }
                        if ($('#sortbyname').is(":checked")) {
                            sort_dashboard_by_name();
                        }
                    });
                    person.status.subscribe();

                    // if the name is their email address, drop the domain component so that it's a little more readable
                    var name_shortened = name.split("@")[0];
                    var name_shortened = name_shortened.split("(")[0];
                    var name_id = name.replace(/[^a-z0-9]/gi, '');

                    //if the displayname is actually an email address,
                    if (name.contains("@") && name.contains(".")) {
                        personuri = name;
                    }

                    person.emails.get().then(function (emails) {
                        var json_text = JSON.stringify(emails, null, 2).toString();
                        json_text = json_text.replace("[", "");
                        json_text = json_text.replace("]", "");
                        var obj = $.parseJSON(json_text);
                        personuri = obj['emailAddress'];
                        name_ids.push(name_id);
                        emailAddresses.push(personuri);
                    });
                     

                    person.status.get().then(function (status) {

                        //select a bootstrap helper style that reasonably approximates the Skype presence colours.
                        var presence_state = '';
                        if (status == 'Online') {
                            presence_state = 'alert alert-success';
                            destination = 'contact_online';
                        }
                        else if (status == 'Away') {
                            presence_state = 'alert alert-warning';
                            destination = 'contact_away';
                        }
                        else if (status == 'Busy') {
                            presence_state = 'alert alert-danger';
                            destination = 'contact_busy';
                        }
                        else if (status == 'DoNotDisturb') {
                            presence_state = 'alert alert-dnd';
                            destination = 'contact_dnd';
                        }
                        else {
                            if ($('#showoffline').is(":checked")) {
                                presence_state = 'alert alert-info';
                                destination = 'contact_offline';
                            }
                        }
                        // if a presence has been determined, display the user.
                        if (presence_state != '') {

                            //now get their Photo/Avatar URL
                            person.avatarUrl.get().then(function (url) {
                                $('#dashboardoutput').append(build_card(name, name_id, presence_state, url, name_shortened, personuri, status));
                            }).then(null, function (error) {
                                $('#dashboardoutput').append(build_card(name, name_id, presence_state, '', name_shortened, personuri, status));
                            });
                            if ($('#sortbyname').is(":checked")) {
                                sort_dashboard_by_name();
                            }
                        }
                    });

                });
            });


            $('#dashboardoutput').append(bs_footer);
            spinner_stop();

        }).then(null, function (error) {
            log(error || 'Something went wrong.');
        });
        log('Finished');
        if ($('#sortbyname').is(":checked")) {
            sort_dashboard_by_name();
        }

    }

    
   
    function build_card(name, name_id, presence_state, url, name_shortened, personuri, status) {
        var temp = "";
        temp = temp + "<div category=\"" + status + "\" class=\"col-sm-3 \" id=\"" + name + "\"><p id=\"status" + name_id + "\" class=\"" + presence_state + "\">";
        if (url != "") {
            temp = temp + "<img hspace=5 src=\"" + url + "\" width=32  onError=\"this.onerror=null;this.src='assets/noimage.png';\" />";
        }
        temp = temp + name_shortened;


        if (personuri != "") {
            //http://stackoverflow.com/questions/15385207/how-to-change-href-attribute-using-javascript-after-opening-the-link-in-a-new-wi
            temp = temp + "<a onClick=\"clickAddress('" + name_id + "')\" href=\"#\"><i class=\"glyphicon glyphicon-comment\" style=\"float:right; color:#0094ff; font-size:14pt; top:5px;\"></i></a>";
        }

        temp = temp + "<a onClick=\"clickAddress('" + name_id + "')\" href=\"#\"><i class=\"glyphicon glyphicon-info-sign\" style=\"float:right; padding-right:2px; color:#0094ff; font-size:14pt; top:5px;\"></i></a>";

        temp = temp + "</p></div>";
        return temp;
    }

    $('#everyone').click(function () {
        build_dashboard();
    })

    function signin() {
        $('#signin').hide();
        log('Signing in...');
        // The asynchronous "signIn" method
        client.signInManager.signIn({
            username: $('#address').text(),
            password: $('#password').text()
        }).then(function () {
            log('Logged In Succesfully');
            $('#controlbox').show();
            $('#loginbox').hide();
            $('#thedashboard').show();
            $('#thenavbar').show();
            $('#welcomebox').show();
        }).then(null, function (error) {
            // if either of the operations above fails, tell the user about the problem
            //console.error(error);
            log('Sorry, we were not able to sign in successfully. Error' + error);
            $('#signin').show()
        });
    }

    function signout() {
        log("Signing Out");
        client.signInManager.signOut().then(
            function () {
                log('Signed out');
                $('#controlbox').hide();
                $('#thedashboard').hide();
                $('#loginbox').show();
                $('#signin').show();
                $('#thenavbar').hide();
                $('#thenavbar').hide();
                $('#settings').hide();
                $('#presencelegenddiv').hide();
                $('#welcomebox').hide();
            },
        function (error) {
            log('Error signing out:' + error);
        });
    }

    // sort dashboard by presence status
    $('#sbs').click(function () {
        log("Clicked Sort by Status");
        sort_dashboard_by_status();
    });

    // sort dashboard by presence status
    $('#sbn').click(function () {
        log("Clicked Sort by Name");
        sort_dashboard_by_name();
    });

    // when the user clicks the refresh/recycle button on the navbar
    $('#refreshdashboard').click(function () {
        build_dashboard();
    });

    // when the user clicks the show-offline checkbox, refresh the dashboard
    $('#showoffline').click(function () {
        build_dashboard();
    });

    // when the user clicks the sort by name checkbox
    $('#sortbyname').click(function () {
        if ($('#sortbyname').is(":checked")) {
            $('#sortbystatus').attr('checked', false);
            sort_dashboard_by_name();
        }
    });

    // when the user clicks the sort by status name
    $('#sortbystatus').click(function () {
        if ($('#sortbystatus').is(":checked")) {
            $('#sortbyname').attr('checked', false);
            sort_dashboard_by_status();
        }
    });

    // when the user clicks the "Sign In" button
    $('#signin').click(function () {
        signin();
    });

    // when the user clicks the "Sign Out" button
    $('#signout').click(function () {
        signout();
    });
    // when the user clicks the "Sign Out" button
    $('#logout-icon').click(function () {
        signout();
    });

    // toggle the logging panel
    $('#togglelogs').click(function () {
        $('#loggingdiv').toggle();
    });

    // toggle the logging panel
    $('#togglelegend').click(function () {
        $('#presencelegenddiv').toggle();
    });

    // toggling the settings panel
    $('#togglesettings').click(function () {
        $('#settings').toggle();
    });

    // clicked the about button
    $('#aboutlink').click(function () {
        $("#dialog").dialog("open");
        return false;
    });

    

    modalPosition();
    $(window).resize(function () {
        modalPosition();
    });
    $('#openModal').click(function (e) {
        $('.modal, .modal-backdrop').fadeIn('fast');
        e.preventDefault();
    });
    $('#aboutthedashboard').click(function (e) {
        $('.modal, .modal-backdrop').fadeIn('fast');
        e.preventDefault();
    });
    $('#modal-header-bar').click(function (e) {
        $('.modal, .modal-backdrop').fadeOut('fast');
    });
    $('.close-modal').click(function (e) {
        $('.modal, .modal-backdrop').fadeOut('fast');
    });
    function modalPosition() {
        var width = $('.modal').width();
        var pageWidth = $(window).width();
        var x = (pageWidth / 2) - (width / 2);
        $('.modal').css({ left: x + "px" });
        $('.modal').css({ top: "50px" });
    }
});

function clickAddress(name_id) {
    var id = name_ids.indexOf(name_id);
    log("Starting IM conversation with "+emailAddresses[id]);
    var emailAddress = emailAddresses[id];
    location.href = "sip:" + emailAddress;
}
