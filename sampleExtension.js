(function(ext) {
    var device = null;
    var rawData = null;
    var notifyConnection = false;
    
     ext.resetAll = function(){};
     
    // Configure serial baudrate = 9600, parity=none, stopbits=1, databits=8
    
    function appendBuffer( buffer1, buffer2 ) {
        var tmp = new Uint8Array( buffer1.byteLength + buffer2.byteLength );
        tmp.set( new Uint8Array( buffer1 ), 0 );
        tmp.set( new Uint8Array( buffer2 ), buffer1.byteLength );
        return tmp.buffer;
    }
    
    //************************************************************
    //   BLOCOS
    
    ext.MakerConectada = function() {
        if (notifyConnection) return true;
            return false;
    };
    
    
    ext.wait_random = function(callback) {
        wait = Math.random();
        console.log('Waiting for ' + wait + ' seconds');
        window.setTimeout(function() {
            callback();
        }, wait*1000);
    };
    
  
    //*************************************************************
    
    
    
    
    var potentialDevices = [];
    ext._deviceConnected = function(dev) {
        potentialDevices.push(dev);
        console.log('Aqui 1. ');
        if (!device) {
            console.log('Aqui 2. ');
            tryNextDevice();
        }
    }

    function checkMaker(bytes){
        var data = String.fromCharCode.apply(null, bytes);
        console.log('Data: ' + data);
        var t_index = data.indexOf('t');
        var l_index = data.indexOf('l');
        if(t_index >= 0 && l_index >= 0){
            t_index ++;
            l_index ++;
            var kernelVersion = data.substring(t_index, t_index + 4);
            var legalVersion = data.substring(l_index, l_index + 4);

            console.log('Kernel: ' + kernelVersion);
            console.log('Legal: ' + legalVersion);

            if(kernelVersion >= 106 && legalVersion >= 108) {
                notifyConnection = true;
                return true;
            }    
        }
        return false;
    }


    
    var inputArray = [];
    function processData() {
        var bytes = new Uint8Array(rawData);

        console.log('Aqui 8. ');
        console.log('bytes[0] ' + bytes[0]);
        

        if (watchdog && (checkMaker(bytes))) {
            // Reconhece como sendo uma Maker
            clearTimeout(watchdog);
            watchdog = null;
            clearInterval(poller);
            poller = null;
            console.log('bingo!');
        }

 
        rawData = null;
    }


    var poller = null;
    var watchdog = null;
    function tryNextDevice() {
        // If potentialDevices is empty, device will be undefined.
        // That will get us back here next time a device is connected.
        device = potentialDevices.shift();
        console.log('Aqui 3. ');
        if (!device) return;
        console.log('Aqui 4. ');
        device.open({ stopBits: 0, bitRate: 9600, ctsFlowControl: 0 });
        
        device.set_receive_handler(function(data) {
            console.log('Aqui: 5');
            console.log('Recebi: ' + data.byteLength);
            if(!rawData || rawData.byteLength == 2) rawData = new Uint8Array(data);
            else rawData = appendBuffer(rawData, data);

            if(rawData.byteLength >= 2) {
                console.log('rawData '+ rawData);
                processData();
                //device.send(pingCmd.buffer);
            }
        });

        // Envia Mn
        var pingCmd = new Uint8Array(3);
        pingCmd[0]= 77;  //'M';
        pingCmd[1]= 110; //'n';
        pingCmd[2] = 13;
        //poller = setInterval(function() {
        poller = setTimeout(function() {
            console.log('Sending Mn'); //Aqui 6
            device.send(pingCmd.buffer);
        }, 500);
        
        watchdog = setTimeout(function() {
            console.log('Watchdog triggered'); //Aqui 7
            // This device didn't get good data in time, so give up on it. Clean up and then move on.
            // If we get good data then we'll terminate this watchdog.
            clearInterval(poller);
            poller = null;
            device.set_receive_handler(null);
            device.close();
            device = null;
            tryNextDevice();
        }, 5000);
    };

    //*************************************************************
    ext._deviceRemoved = function(dev) {
        console.log('_deviceRemoved');
        if(device != dev) return;
        if(poller) poller = clearInterval(poller);
        device = null;
        notifyConnection = false;
    };

    ext._shutdown = function() {
        if(device) device.close();
        if(poller) poller = clearInterval(poller);
        device = null;
    };

    ext._getStatus = function() {
        console.log('_getStatus');
        if(!device) return {status: 0, msg: 'Maker desconectado'};
        if(watchdog) return {status: 1, msg: 'Procurando pela Maker'};
        return {status: 2, msg: 'Maker conectada'};
    }

    //************************************************************
    // Block and block menu descriptions
    var descriptor = {
        blocks: [
                ['h', 'when ALPHA Maker is connected', 'MakerConectada'],
                ['w', 'wait for random time', 'wait_random'],
                [' ', 'Synchronous wait for random time', 'wait_random2'],
        ],
        menus: {
            booleanSensor: ['button pressed', 'A connected', 'B connected', 'C connected', 'D connected'],
            sensor: ['slider', 'light', 'sound', 'resistance-A', 'resistance-B', 'resistance-C', 'resistance-D'],
            lessMore: ['>', '<']
        },
    };
    console.log('TESTE ');
    ScratchExtensions.register('ALPHA Maker', descriptor, ext, {type: 'serial'});
})({});
