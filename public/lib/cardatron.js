var cardGroups = [];
var meta = {};

var searchProperties = [];
var keywordOffset = 0; 
var toolTipProperties = [];

function loadJSON(file, callback) {

    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', file, true); // Replace 'my_data' with the path to your file
    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == "200") {
            // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
            callback(xobj.responseText);
        }
    };
    xobj.send(null);
}

function getTitle() {
    return meta.title;
}

function getMinSearchLength() {
    return meta.search.minSearchLength;
}

function getPropertyPosition(propertyName, caseSensitive = true) {
    const result = caseSensitive ? meta.properties.find(({ name }) => name === propertyName) :
        meta.properties.find(({ name }) => name.toLowerCase() === propertyName.toLowerCase());
    return result;
}

function getPropertyPositions(properties) {
    var positions = [];

    for (index in properties) {
        positions.push(getPropertyPosition(properties[index]));
    }

    return positions;
}

function initSorters() {
    for (sorterIndex in meta.sorting) {
        setSortPositions(meta.sorting[sorterIndex]);
        meta.sorting[sorterIndex].duplicateCheckProperties = getPropertyPositions(meta.sorting[sorterIndex].duplicates.checkFields);
    }
}

function setSortPositions(sorter) {
    for (index in sorter.sort) {
        if (sorter.sort[index].computed != true) {
            sorter.sort[index].positionProperty = getPropertyPosition(sorter.sort[index].property);
        }
    }
}

function getKeywordOffset(properties) {
    var offset = 0;

    for (index in properties) {
        if(properties[index].urlPart < offset) {
            offset = properties[index].urlPart;
        };
    }

    return offset;
    
}
function init(cardData, metaData) {
    cardGroups = cardData.groups;
    meta = metaData.meta;

    keywordOffset = getKeywordOffset(meta.properties);
    searchProperties = getPropertyPositions(meta.search.properties);
    toolTipProperties = getPropertyPositions(meta.toolTip.properties);
    initSorters();
    
    if(pageInit) {
        pageInit();
    }
}

function findSort(sortName) {
    const sorter = meta.sorting.find(({ name }) => name === sortName);
    return sorter;
}

function getSortInfo() {
    return {"sorters":meta.sorting.map(s => s.name), "default":meta.sort.default, "show":meta.sort.show};
}

document.addEventListener("DOMContentLoaded", function () {

    loadJSON('data/meta.json', function (response) {
        let metaData = JSON.parse(response);

        loadJSON('data/cards.json', function (response) {
            let cardData = JSON.parse(response);
            init(cardData, metaData);
        });
    });
});

function applySearchReplace(input) {
    let output = input;

    for (index in meta.specialCharacters.search.replacements) {
        let replacement = meta.specialCharacters.search.replacements[index];
        output = output.replace(replacement.find, replacement.replace)
    }
    
    return output;
}

function getArrayFromDelimitedText(text, delim) {
    var values=[];
    if(text != undefined) {
        values = values.concat(text.split(delim).map(Function.prototype.call, String.prototype.trim));
    }
    return values;
}

function getCardIds(results) {
    return results.map(card => card.id);
}

function search(search, supressDuplicates, sortBy, randomCount, selected, invert) {

    let queries = applySearchReplace(search).split(meta.specialCharacters.search.querySeparator);

    var results = [];

    for (queryIndex in queries) {

        let searchTerms = queries[queryIndex].toLowerCase().split(/\s+/);

        let supressDuplicatesFlag = (supressDuplicates == true && meta.specialCharacters.fileName.duplicateSeparator != undefined);

        for (groupIndex in cardGroups) {
            let group = cardGroups[groupIndex];
            for (index in group.cards) {
                let card = group.cards[index];

                if(invert == true) {
                    if(!selected.includes(card.id)) {
                        continue;
                    }
                } else {
                    if(selected.includes(card.id)){
                        continue;
                    }
                }

                if (card.file.search("\\$") > -1) {
                    continue;
                }

                if (supressDuplicatesFlag && card.file.search(meta.specialCharacters.fileName.duplicateSeparator) > -1) {
                    continue;
                }

                cardTerms = cardGroups[groupIndex].path.concat(card.file).toLowerCase().split("/");

                if (matchCard(cardTerms, searchTerms)) {
                    results.push({ "group":group, "card": card, "cardTerms": cardTerms });
                }
            }
        }
    }

    if(randomCount != undefined) {
        results = chooseRandom(results, randomCount);
    }

    var sorter = findSort(sortBy);

    results = sortResults(sorter, results);

    return makeResults(results, sorter, supressDuplicates);
}

function chooseRandom(results, count) {
    //do random stuff
    
    var items = [];

    while(items.length < count && items.length < results.length) {
        let item = Math.floor((Math.random() * results.length));
        if(!items.includes(item)) {
            items.push(item);
        }
    }

    var newResults = [];

    for(i = 0; i < items.length; i++) {
        newResults.push(results[items[i]]);
    }

    return newResults;
}

function sortResults(sorter, results) {

    let sort = sorter.sort;

    for (reverseIndex in sort) {
        let index = sort.length - reverseIndex - 1;

        if (sort[index].computed == true) {
            if (sort[index].property === "sortWeight") {
                let dir = sort[index].direction == "descending" ? -1 : 1;
                results = results.sort((a, b) => compare(getCardSizeSortWeight(a.card) * dir, getCardSizeSortWeight(b.card) * dir));
            }
        } else {
            let urlPart = sort[index].positionProperty.urlPart;

            if (sort[index].direction == "descending") {
                results = results.sort((a, b) => compare(b.cardTerms[urlPart < 0 ? b.cardTerms.length - 1 : urlPart], a.cardTerms[urlPart < 0 ? a.cardTerms.length - 1 : urlPart]));
            } else {
                results = results.sort((a, b) => compare(a.cardTerms[urlPart < 0 ? a.cardTerms.length - 1 : urlPart], b.cardTerms[urlPart < 0 ? b.cardTerms.length - 1 : urlPart]));
            }
        }
    }
    return results;
}

function getGroupBy(sorter, result) {
    var terms = [];
    let sort = sorter.sort;

    for (index in sort) {
        if (sort[index].groupBy == true) {
            if (sort[index].computed == true) {
                if (sort[index].property === "sortWeight") {
                    terms.push(getCardSizeSortWeight(result.card));
                }
            } else {
                let urlPart = sort[index].positionProperty.urlPart;
                terms.push(result.cardTerms[urlPart]);
            }
        }
    }
    return terms;
}

function getPropertyValue(property, cardTerms) {
    var values = [];

    let start = property.urlPart != -1 ? property.urlPart : cardTerms.length - 1;

    if (property.keywords && (cardTerms.length + keywordOffset) === start) {
        return values;
    }

    //end setups up keyword searches
    let end = property.keywords ?
        (property.limit > -1 ? start + property.limit - 1 : cardTerms.length - 1 + property.limit) :
        start;


    for (var cardTermIndex = start; cardTermIndex <= end; cardTermIndex++) {
        if(property.truncateAt != undefined) {
            values.push(cardTerms[cardTermIndex].substring(0,cardTerms[cardTermIndex].search(property.truncateAt)));
        } else {
            values.push(cardTerms[cardTermIndex]);
        }
    }

    return values;
}

function getPropertyValues(properties, cardTerms) {
    var values = [];
    for (index in properties) {
        values = values.concat(getPropertyValue(properties[index], cardTerms));
    }
    return values;
}

function getToolTip(result) {
    
    if(meta.toolTip.showCardId != undefined) {
        if(meta.toolTip.showCardId == true) {
            return result.card.id + "\n" + getPropertyValues(toolTipProperties, result.cardTerms).join("\n");
        } 
    }

    return getPropertyValues(toolTipProperties, result.cardTerms).join("\n");
    
}

function makeResults(results, sorter, supressDuplicates) {
    var newResults = [];

    var lastDuplicateCheckValue = "";

    for (index in results) {
        let result = results[index];
        let group = result.group;
        let card = result.card;
        let cardTerms = result.cardTerms;

        if (supressDuplicates == true) {

            let duplicateCheckValue = getPropertyValues(sorter.duplicateCheckProperties, cardTerms).join('/');

            if (lastDuplicateCheckValue == duplicateCheckValue) {
                continue;
            }

            lastDuplicateCheckValue = duplicateCheckValue;
        }

        newResults.push({"id": card.id, "url": group.path.concat(card.file), "size": getCardSize(card), "grouping": getGroupBy(sorter, result).join('/'), "toolTip": getToolTip(result) });
    }
    return newResults;
}

function compare(a, b) {
    if (a < b) {
        return -1;
    }
    if (a > b) {
        return 1;
    }
    return 0;
}

function getCardSize(card) {
    for (var index = 0; index < meta.sizing.sizes.length; index++) {
        if (card.height > meta.sizing.sizes[index].height || card.width > meta.sizing.sizes[index].width) {
            return meta.sizing.classPrefix
                + (card.width > card.height ? meta.sizing.orientation.landscape.code : meta.sizing.orientation.portrait.code)
                + meta.sizing.sizes[index].code;
        }
    }
    return "";
}

function getCardSizeSortWeight(card) {
    for (var index = 0; index < meta.sizing.sizes.length; index++) {
        if (card.height > meta.sizing.sizes[index].height || card.width > meta.sizing.sizes[index].width) {
            return (card.width > card.height ? meta.sizing.orientation.landscape.sortWeight : meta.sizing.orientation.portrait.sortWeight)
                + meta.sizing.sizes[index].sortWeight;
        }
    }
    return 0;
}

function matchCard(cardTerms, searchTerms) {

    var match = true;

    for (var index = 0; index < searchTerms.length; index++) {

        if(searchTerms[index].search(meta.specialCharacters.search.propertyEquals) > 0) {
            let parts = searchTerms[index].split(meta.specialCharacters.search.propertyEquals);
            let position = getPropertyPosition(parts[0], false);

            var doesNotMatchFlag = parts[1].startsWith(meta.specialCharacters.search.doesNotMatchCharacter);            
            var searchTerm = doesNotMatchFlag ? parts[1].slice(meta.specialCharacters.search.doesNotMatchCharacter.length) : parts[1];

            if(position != undefined) {
                match = matchTermToProperty(position, cardTerms, searchTerm);
                match = doesNotMatchFlag ? !match : match;    
            } else {
                match = false;
            }

            if(match != true) {
                break;
            }
            
        } else {
            var termMatch = false;

            var doesNotMatchFlag = searchTerms[index].startsWith(meta.specialCharacters.search.doesNotMatchCharacter);            
            var searchTerm = doesNotMatchFlag ? searchTerms[index].slice(meta.specialCharacters.search.doesNotMatchCharacter.length) : searchTerms[index];

            for (var searchIndex = 0; searchIndex < searchProperties.length; searchIndex++) {
                termMatch = matchTermToProperty(searchProperties[searchIndex], cardTerms, searchTerm);

                if (termMatch) {
                    break;
                }

            }

            termMatch = doesNotMatchFlag ? !termMatch : termMatch;

            if (termMatch != true) {
                match = false;
                break;
            }

        };
    }
    
    return match;
}

function matchTermToProperty(property, cardTerms, searchTerm){
    var termMatch = false;

    let start = property.urlPart != -1 ? property.urlPart : cardTerms.length - 1;

    //No Keywords, skip to next property
    if (property.keywords && (cardTerms.length + keywordOffset) === start) {
        return termMatch;
    }

    //end setups up keyword searches
    let end = property.keywords ?
        (property.limit > -1 ? start + property.limit - 1 : cardTerms.length - 1 + property.limit) :
        start;

    for (var cardTermIndex = start; cardTermIndex <= end; cardTermIndex++) {
        if (cardTerms[cardTermIndex].search(searchTerm) > -1) {
            termMatch = true;
            break;
        }
    }

    return termMatch;
}



