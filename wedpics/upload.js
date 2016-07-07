var webPage = require("webpage");
var system = require("system");
var page = webPage.create();

// Fill in here
var USERNAME = "";
var PASSWORD = "";

var waitFor = function (testFx, onReady, timeOutMillis) {
    var maxtimeOutMillis = timeOutMillis ? timeOutMillis : 3000, //< Default Max Timout is 3s
        start = new Date().getTime(),
        condition = false,
        interval = setInterval(function() {
            if ( (new Date().getTime() - start < maxtimeOutMillis) && !condition ) {
                // If not time-out yet and condition not yet fulfilled
                condition = (typeof(testFx) === "string" ? eval(testFx)  : testFx()); //< defensive code
            } else {
                if(!condition) {
                    // If condition still not fulfilled (timeout but condition is 'false')
                    console.log("'waitFor()' timeout");
                    phantom.exit(1);
                } else {
                    // Condition fulfilled (timeout and/or condition is 'true')
                    console.log("'waitFor()' finished in " + (new Date().getTime() - start) + "ms.");
                    typeof(onReady) === "string" ? eval(onReady) : onReady(); //< Do what it's supposed to do once the condition is fulfilled
                    clearInterval(interval); //< Stop this interval
                }
            }
        }, 250); //< repeat check every 250ms
};

page.onConsoleMessage = function(msg) {
    console.log("Page.console.log:" + msg);
}
page.onError = function(msg, trace) {
    console.log("Page.console.log: " + msg);
}
page.onNavigationRequested = function(url, navigationType, willNavigate, main) {
    return;
    if (main === true) {
        console.log("Trying to navigate to: " + url);
        console.log("Caused by: " + navigationType);
        console.log("Will actually naviate?: " + willNavigate);
        console.log("Send from the page's main frame?: " + main);
    }
}

// Safari User Agent
page.settings.userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_4) AppleWebKit/601.5.17 (KHTML, like Gecko) Version/9.1 Safari/601.5.17";

page.viewportSize = { width: 1024, height: 768 };

var waitForDocumentReady = function(callback) {
    waitFor(function() {
        return page.evaluate(function() {
            return document.readyState === "complete";
        });
    }, function() {
        callback();
    }, 5000);
};

var doLogin = function(usr, pass, completedCallback) {
    console.log("Login");
    var start = new Date().getTime();

    // Email
    page.evaluate(function() {
        var loginBtn = $(".login-btn");
        loginBtn.click();

        var loginDlg = $("#login_lightbox");
        var emailInput = loginDlg.find("form input[type=email]");
        emailInput.val("");
        emailInput.focus();
    });
    page.sendEvent("keypress", usr);

    // Password
    page.evaluate(function() {
        $("#login_lightbox form input[type=password]").focus();
    });
    page.sendEvent("keypress", pass);

    // Click login button
    page.evaluate(function() {
        $("#login_lightbox form .standard-button").click();
    });

    // Wait for response from server (DOM will be updated)
    waitFor(function() {
        return page.evaluate(function(x) {
            return $("#switch_lightbox").is(":visible");
        });
    }, function() {
        page.evaluate(function() {
            $weddings = $("div.wedding-selector > div.wedding-names");
            $weddings.trigger("click");
        });

        waitFor(function() {
            return page.evaluate(function() {
                return document.location.href.match(/https:\/\/www.wedpics.com\/wedding\/GI3DSMBWGY2Q\/album\//);
            });
        }, function() {
            waitFor(function() {
                return page.evaluate(function() {
                    return $("#Header > a.camera2-icon").is(":visible");
                });
            }, function() {
                console.log("'doLogin()' finished in " + (new Date().getTime() - start) + "ms.");
                setTimeout(function() {
                    completedCallback();
                }, 3000);
            }, 10000);
        }, 10000)
    }, 10000);
};

page.open("https://www.wedpics.com", function(status) {
    waitForDocumentReady(function() {
        console.log("document is ready!");
        doLogin(USERNAME, PASSWORD, function(loginSucceeded) {
            var fileToUpload = system.args[1];
            console.log("Uploading: " + fileToUpload);

            console.log("Login succeeded");
            var start = new Date().getTime();

            page.evaluate(function() {
                $("#Header > a.camera2-icon").trigger("click");
            });

            // Simulate user click on upload file button
            page.evaluate(function() {
                $(".album-picker-dialog div.buttons .primary").trigger("click");
            });
            // Upload file
            page.uploadFile("aside.album-picker-dialog form > input[type=file]", fileToUpload);
            // Trigger event for when file is selected by user
            page.evaluate(function() {
                $("aside.album-picker-dialog form > input[type=file]").trigger("change", "onFilesSelected");
            });

            // Upload to complete!
            waitFor(function() {
                return page.evaluate(function() {
                    return $("#ToastRack > aside").is(":visible");
                }) === false;
            }, function() {
                setTimeout(function() {
                    console.log("'upload()' finished in " + (new Date().getTime() - start) + "ms.");
                    //page.render("test.png");
                    phantom.exit();
                }, 1500);
            }, 45*1000);
        });
    });
});
