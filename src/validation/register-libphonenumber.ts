/**
 * Set libphonenumber to the root of the application execution context
 * global for nodejs and window for browser;
 * If you want to use libphonenumber in project just import it globally:
 *
 * import "class-validator/umd/validation/register-libphonenumber";
 */
// tslint:disable-next-line:no-var-keyword
var self;
(function() {
    const root = typeof global === "object" ? global :
        typeof self === "object" ? self :
            typeof this === "object" ? this :
                Function("return this;")();
    if (typeof root.LibPhonenumber === "undefined") {
        root.libphonenumber = require("google-libphonenumber");
    }
})();
