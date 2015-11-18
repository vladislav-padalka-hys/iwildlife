function getTime(data) {
    var timeArr = data.split(":");
    var hour = parseInt(timeArr[0]);
    var minutes = timeArr[1];
    var time='';
    if (readFromLocalStorage("time") === '12') {
        if (hour > 12) {
            hour = hour - 12;
            time = hour + ':' + minutes + ' P.M.';
        } else if (hour === 12) {
            time = hour + ':' + minutes + ' P.M.';
        } else if (hour === 0) {
            hour = 12;
            time = hour + ':' + minutes + ' A.M.';
        } else {

            time = hour + ':' + minutes + ' A.M.';
        }
    }
    else {
        time = hour + ':' + minutes;
    }
    return time;
}

function getTemperature(data) {
    var temperature = parseInt(data);
    if (readFromLocalStorage("temperature") === 'F') {
        temperature = ((1.8 * temperature) + 32).toFixed() + '°F';
        return temperature;
    }
    else {
        return temperature.toFixed() + '°C';
    }
}

function getDistance(data) {
    var distance = parseInt(data);
    if (readFromLocalStorage("distance") === 'miles') {
        distance = distance * 0.62;
    }
    return distance.toFixed();
}

function getWeight(data) {
    var weight = parseInt(data);
    if (readFromLocalStorage("weight") === 'pounds') {
        weight = weight * 2.2;
    }
    return weight.toFixed();
}