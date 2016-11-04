Cordova+CSG plugin for PouchDB
=====

This PouchDB plugin aims at improving the performance of synchronization with Couchbase Sync Gateway when used in a cordova app.

**It is still in an early stage of development, use it at own risk!**

What does this plugin do?
----
It provides a hook for enabling multipart responses when used inside an embedded browser view (for example PhoneGap / Cordova): CSG's \_bulk_get endpoint always answers in multipart/mixed mode. As this is not well supported by the browsers, PouchDB falls back to one request per document, which can be very efficient. If your pouch instance run in an environment where you have access to a method to perform HTTP calls that supports multipart/mixed, this plugin provides a hook for using it for \_bulk_get. See below for usage.

In order to improve the synchronization process even more, have a look at the pouchdb-thrifty plugin.

Usage
----

    import PouchDBCSG from 'pouchdb-csg';
    import {multipartProvider} from './multipart';

    PouchDB.plugin(PouchDBCSG({
      multipartProvider: multipartProvider // this is optional
    }));

The multipartProvider is optional; it has to be a function that performs an HTTP call:

    function multipartProvider(method, url, headers, body) {
      return do_http_call(method, url, headers, body); // has to return a promise
    }

It has to perform a request, parse the multipart/mixed content and return a list of the contained JSON objects.
