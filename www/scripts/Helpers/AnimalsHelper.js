function getUsersForField(currField) {
    var usersArr = [],
        currUser = null,
        isAlreadyIncluded = false;
    
    for (var i = 0; i < currField.Sightings.length; i++) {
        currUser = currField.Sightings[i].Hunter.UserName;
        for (var j = 0; j < usersArr.length; j++) {
            if (currUser == usersArr[j])
                isAlreadyIncluded = true;
        }
        if (isAlreadyIncluded)
            isAlreadyIncluded = false;
        else
            usersArr.push(currUser);
    };

    return usersArr;
}

function getAnimalsForField(currField) {
    var arr = [];
    for (i = 0; i < currField.Sightings.length; i++) {
        var animalindex = -1;
        var animalFound = false;
        for (j = 0; j < arr.length; j++) {
            if (arr[j].name == currField.Sightings[i].Animal) {
                animalFound = true;
                animalindex = j;
            }
        }
        if (animalFound) {
            //if (arr[animalindex].types) {
            var typeFound = false;
            for (k = 0; k < arr[animalindex].types.length; k++) {
                if (arr[animalindex].types[k] == currField.Sightings[i].Type)
                    typeFound = true;
            }
            if (!typeFound) {
                if (currField.Sightings[i].Type != null)
                    if (currField.Sightings[i].Type != '')
                        arr[animalindex].types.push(currField.Sightings[i].Type);
            }
            // }
        } else {
            var ifType = (currField.Sightings[i].Type != null && currField.Sightings[i].Type != '');
            if (currField.Sightings[i].Animal != null)
                if (currField.Sightings[i].Animal != '') {
                    if (ifType)
                        arr.push({ name: currField.Sightings[i].Animal, types: [currField.Sightings[i].Type] });
                    else
                        arr.push({ name: currField.Sightings[i].Animal, types: [] });
                }
        }
    }
    return arr;
}
