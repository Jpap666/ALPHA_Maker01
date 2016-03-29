(function(ext) {
    var alarm_went_off = false; // This becomes true after the alarm goes off


    ext.set_alarm = function(time) {
       window.setTimeout(function() {
           alarm_went_off = true;
       }, time*1000);
    };

    ext.when_alarm = function() {
       // Reset alarm_went_off if it is true, and return true
       // otherwise, return false.
       if (alarm_went_off === true) {
           alarm_went_off = false;
           return true;
       }

       return false;
    };

    //*************************************************************
    ext._deviceRemoved = function(dev) {
        if(device != dev) return;
        if(poller) poller = clearInterval(poller);
        device = null;
    };

    ext._shutdown = function() {
        if(device) device.close();
        if(poller) poller = clearInterval(poller);
        device = null;
    };

    ext._getStatus = function() {
        if(!device) return {status: 1, msg: 'Maker desconectado'};
        if(watchdog) return {status: 1, msg: 'Procurando pela Maker'};
        return {status: 2, msg: 'Maker conectada'};
    }

    //************************************************************
    // Block and block menu descriptions
    var descriptor = {
        blocks: [
            ['h', 'when %m.booleanSensor',         'whenSensorConnected', 'button pressed'],
            ['h', 'when %m.sensor %m.lessMore %n', 'whenSensorPass',      'slider', '>', 50],
            ['b', 'sensor %m.booleanSensor?',      'sensorPressed',       'button pressed'],
            ['r', '%m.sensor sensor value',        'sensor',              'slider']
        ],
        menus: {
            booleanSensor: ['button pressed', 'A connected', 'B connected', 'C connected', 'D connected'],
            sensor: ['slider', 'light', 'sound', 'resistance-A', 'resistance-B', 'resistance-C', 'resistance-D'],
            lessMore: ['>', '<']
        },
        url: '/info/help/studio/tips/ext/PicoBoard/'
    };
    ScratchExtensions.register('ALPHA Maker', descriptor, ext, {type: 'serial'});
})({});
