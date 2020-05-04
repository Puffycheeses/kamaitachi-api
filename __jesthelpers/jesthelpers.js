function IsSortedLexicographicallyOnKey(objArr, key){
    let items = objArr.map(e => e[key]);
    return items.slice(1).every((item, i) => items[i].localeCompare(item,{sensitivity: "case"}) <= 0);
}

// check sort, sorry for the mess
function IsSortedOnKey(objArr, key){
    let items = objArr.map(e => e[key]);
    return items.slice(1).every((item, i) => items[i] <= item);
}

module.exports = {
    IsSortedLexicographicallyOnKey,
    IsSortedOnKey
}