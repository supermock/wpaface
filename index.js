const unix = require('unix-dgram');
const fs = require('fs');
const util = require('util');
const EventEmitter = require('events');
const AsyncLock = require('async-lock');

const CMD = {
    ATTACH: 'ATTACH',
    SCAN: 'SCAN',
    SCAN_RESULTS: 'SCAN_RESULTS'
};

function WPAFace(iface, callback) {
    EventEmitter.call(this);

    this._lock = new AsyncLock();

    this._wpaSendPath = `/var/run/wpa_supplicant/${iface}`;
    this._wpaRecvPath = `/tmp/wpa_ctrl_${process.pid}`;
    
    this._server = unix.createSocket('unix_dgram', buffer => {
      const msg = buffer.toString('utf8');
    
      if (msg.charAt(0) == '<') {
        if (msg.indexOf('<3>CTRL-') == 0) {
            const parts = msg.split(' ');

            const event = {
                name: parts[0].substring(3),
                args: parts[1] != '' ? parts.splice(1) : null
            };
            
            this.emit(event.name, event.args);
        }
      } else {
        this.emit('wpaface-response', msg);
      }
    }).on('connect', () => {
        this._sendCommandIsOK(CMD.ATTACH, callback.bind(this));
    }).on('error', callback.bind(this));
    this._server.bind(this._wpaRecvPath);
    this._server.connect(this._wpaSendPath);
}
util.inherits(WPAFace, EventEmitter);

WPAFace.prototype._sendCommand = function(cmd, callback) {
    this._server.send(Buffer.from(cmd));
    this.once('wpaface-response', callback);
}

WPAFace.prototype._sendCommandIsOK = function(cmd, callback) {
    this._sendCommand(cmd, response => response == 'OK\n' ? callback(null) : callback(new Error(response)));
}

WPAFace.prototype._safeExecution = function(execution, callback) {
    this._lock.acquire('_sendCommand', execution, callback);
}

WPAFace.prototype.scan = function(callback) {
    this._safeExecution(done => {
        this._sendCommandIsOK(CMD.SCAN, err => {
            if (!err) {
                this.once('CTRL-EVENT-SCAN-RESULTS', () => {
                    this._sendCommand(CMD.SCAN_RESULTS, response => {
                        let lines = response.split('\n');
                        let networks = [];
        
                        for (let l = 1; l < lines.length; l++) {
                            let fields = lines[l].split('\t');
                            
                            if (fields.length != 5) continue;
            
                            networks.push({
                                BSSID: fields[0],
                                Freq: parseInt(fields[1]),
                                RSSI: parseInt(fields[2]),
                                Flags: fields[3],
                                SSID: fields[4]
                            });
                        }
        
                        done(null, networks);
                    });
                });
            } else {
                done(err, null);
            }
        });
    }, callback);
}

WPAFace.prototype.close = function() {
    this._server.close();
    fs.unlinkSync(this._wpaRecvPath);
}

module.exports = WPAFace;