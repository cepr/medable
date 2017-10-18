/*
Copyright [2017] [Cedric Priscal

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

const querystring = require('querystring');
const https = require('https');

/**
 * Represents a connection to a Medable server.
 *
 * @constructor
 *
 * @param {string} server   - Server URL to connect to
 * @param {string} orgname  - Organisation name
 * @param {string} apikey   - API key to use for HTTP requests
 */
function Connection(server, orgname, apikey) {
    // Initialize instance attributes
    this.server = server;
    this.orgname = orgname;
    this.apikey = apikey;
    this.cookie = null;
}

// Private helper function to encapsulate an HTTP request into a Promise
function buildHttpPromise(connection, options, data) {
    return new Promise(function(resolve, reject) {
        var buf = []
        var req = https.request(options, function(res) {
            //console.log('statusCode:', res.statusCode);
            // TODO check res.statusCode
            //console.log('headers:', res.headers);
            if ('set-cookie' in res.headers) {
                connection.cookie = res.headers['set-cookie'].join('; ');
            }
            res.on('data', function(d) {
                buf.push(d);
            });
            res.on('end', function() {
                resolve(JSON.parse(Buffer.concat(buf).toString()));
            })
        }).on('error', function(e) {
            reject(e);
        });
        if (data != null) {
            //console.log("Sending:");
            //console.log(data);
            req.write(new Buffer(data));
        }
        req.end();
    });
}

/**
 * Login using Session-Based Authentication.
 * 
 * @param {string} email    - Account email for authentication
 * @param {string} password - Account password
 * 
 * @return {Promise} a Promise of the HTTP request.
 */
Connection.prototype.login = function(email, password) {
    const data = querystring.stringify({
        'email': email,
        'password': password
    });
    // Build a Promise to run the login asynchronously
    return buildHttpPromise(
        // Connection instance
        this,
        // HTTP options
        {
            hostname: this.server,
            port: 443,
            path: '/' + this.orgname + '/v2/accounts/login',
            method: 'POST',
            headers: {
                'medable-client-key': this.apikey,
                'content-type': 'application/x-www-form-urlencoded',
                'content-length': Buffer.byteLength(data)
            },
        },
        // Data to send
        data
    );
};

/**
 * Post data to a Cortex or custom Object.
 * 
 * @param {string} name  - Cortex or custom Object name.
 * @param {object} value - JavaScript object to post.
 * 
 * @return {Promise} a Promise of the HTTP request.
 */
Connection.prototype.post = function(name, value) {
    const data = JSON.stringify(value);
    // Build a Promise to run the login asynchronously
    return buildHttpPromise(
        // Connection instance
        this,
        // HTTP options
        {
            hostname: this.server,
            port: 443,
            path: '/' + this.orgname + '/v2/' + name,
            method: 'POST',
            headers: {
                'medable-client-key': this.apikey,
                'Cookie': this.cookie,
                'content-type': 'application/json',
                'content-length': Buffer.byteLength(data)
            },
        },
        // Data to send
        data
    );
};

/**
 * Retrieve the content of a Cortex or custom Object.
 *
 * @param {string} name  - Cortex or custom Object name.
 *
 * @return {Promise} a Promise of the HTTP request.
 */
Connection.prototype.list = function(name) {
    // Build a Promise to run the login asynchronously
    return buildHttpPromise(
        // Connection instance
        this,
        // HTTP options
        {
            hostname: this.server,
            port: 443,
            path: '/' + this.orgname + '/v2/' + name,
            method: 'GET',
            headers: {
                'medable-client-key': this.apikey,
                'Cookie': this.cookie,
                'content-length': '0'
            },
        },
        // Data to send
        null
    );
};

module.exports.Connection = Connection;
