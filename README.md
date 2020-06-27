# cardatron
Cardatron is a web application for handling large collections of gaming cards.

#### Disclaimer
This project is aimed at non-developers, I did not want to complicate things by using any development technology that was not absolutely necessary.  So at this point in time, it is not a traditional project, it does not follow normal development standards or processes.  It is a work in progress and may eventually evolve into a ***normal*** project. 

## Usage
Scan your cards into image files and place them into a logical folder structure, the file name and folder names will make up the keywords you will be able to search by.  When naming the image files avoid using special characters and spaces, if you plan on keeping multiple copies of a card images select a character to separate the number from the rest of the file name.  

Example: 

    game\cart_type\filename_replace_spaces.jpg
    game\cart_type\filename_replace_spaces-2.jpg

#### Copy the folders with the images into the public\images folder.

#### Create the card data file.
From the cardatron root folder, run the java executable CardIndex redirecting output to publix/data/cards.json 

    java CardIndex public > public/data/cards.json

On windows you can use the batch file indexcard.cmd 

    indexcards.cmd
    
#### Start the local web server
From the cardatron root folder, run the java executable EmbeddedJettyFileServer 

    java -classpath ".;.\lib\*" EmbeddedJettyFileServer

On windows you can use the batch file start.cmd 

    start.cmd

By default the EmbeddedJettyFileServer runs on port 8080, serving files from the ./public path and will not show directory listings.  Your can override these by passing the optional parameters {port} {path} {dirs allowed}:

    java -classpath ".;.\lib\*" EmbeddedJettyFileServer 8080 ./public false  -- the defaults
    java -classpath ".;.\lib\*" EmbeddedJettyFileServer 9090  -- will start the server on port 9090

EmbeddedJettyFileServer is provided as a convenience, any web server software can be used.

#### Using a browser navigate to localhost:8080
You should now see the cardatron web page

# Additional way to add keywords for images
## keywords.json file
Some images may have more information that that you may wish to include as keywords than make sense in a file name or folder structure, to handle this you can place a ```keywords.json``` file in each folder containing images that provide additional keywords that can be searched on or included on card tool tips.

The keywords.json file supports adding one or more keywords to one or more images, the format is as follows:

    [
        {
            "keywords":["gunslinger","six shooter template","dead eye","cerberus","hellfire"],
            "images":["Page_06.JPG"]
        },
    ]

these additional keywords are referred to as extended keywords.
    
# Customization

## Meta File
You can use the data\meta.json to customize the application behavior.

#### Meta >> Title - Tile that shows at the top of the application page

#### Meta >> Properties - maps folder structure and file to searchable properties

Example:

    "properties":[
        {"name":"keywords", "urlPart":1, "keywords":true, "limit":-1},
        {"name":"name", "urlPart":-1, "truncateAt":"[.]"}        
    ],   

For the file: images\world\set\group\keyword1\keyword2\imagefile.jpg

When processing the image urls, the url is split into parts based on the file separator character '\', these url parts are used to map the folders and file name to property names.

In this case the folders starting with world (urlPart 1) and ending at keyword2 (limit -1 = 1 from the end) would be searchable keywords and the filename imagefile would be the card name (urlPart -1 = = last part of url), trunateAt is used to drop the filename extension from the property. 

    keywords = "world, set, group, keyword1, keyword2"
    name = "imagefile"

A more complicated example;

    "properties":[
        {"name":"world", "urlPart": 1},
        {"name":"setType", "urlPart": 2},
        {"name":"setName", "urlPart": 3},
        {"name":"groupType", "urlPart": 4},
        {"name":"groupName", "urlPart": 5},
        {"name":"keywords", "urlPart":6, "keywords":true, "limit":-1},
        {"name":"name", "urlPart":-1, "truncateAt":"[.]"}        
    ],

For the file: images/Shadows_of_Brimstone/Core_Set/Swamps_of_Death/Card/Loot/Sack_Of_Gold_Dust.JPG"

    world = "Shadows_of_Brimstone"
    setType = "Core_Set"
    setName="Swamps_of_Death"
    groupType="Card"
    groupName="Loot"
    keywords="" (none)
    name="Sack_of_Gold_Dust"

##### Why would you want to map more properties versus just letting everything be a keyword?
Properties allow you to customize how searching, sorting, and tool tips are processed.  That being said you can (should) start off with defining everything as a keyword and make the decision and define properties once you figure out how you want to organize your cards (I have gone thru several iterations of folder structures). You may find that you are happy without getting all complicated with folders and property definitions as you get most of the functionality without it.

#### Meta >> specialCharacters - Characters that have special meaning for searching and processing
    "specialCharacters":{
        "fileName" : {
            "duplicateSeparator":"-"
        },
        "search" : {
            "querySeparator" : "&",
            "propertyEquals" : ":",
            "doesNotMatchCharacter" : "-",
            "replacements" : [
                {"find": "." , "replace" : "\\b"}
            ]
        }
    },

#### filename.duplicateSeparator - defines how duplicate card image files are denoted.  
So for this meta data the duplicate separator is defined as '-', so the '-' character is used to indicates that what follow is the copy # of the card.  The original file should be defined without a copy number. 

Example:

    game\cart_type\filename.jpg   -- first copy of card
    game\cart_type\filename-2.jpg -- second copy of card, can be excluded from searches using 'exclude duplicates' option.

#### search.querySeparator - character that allows multiple queries to be combined in one search request.  
So for this meta data the querySeparator is defined as '&', so as an example:

    artifact gun & gear gun -- would execute a query for 'artifact gun' and 'gear gun' and combine the results for display

#### search.propertyEquals - character that indicates that the preceding term is to be treated as a property value.  
So for this meta data the propertyEquals character is defined as ':', so as an example:

    groupname:artifact name:gun -- would execute a query for cards where the 'groupName' property contains 'artifact' and the 'name' property contains 'gun'

#### search.doesNotMatchCharacter - character that indicates that items that have the following term are to be excluded from the results.  
So for this meta data the doesNotMatchCharacter character is defined as '-', so as an example:

    -gun groupname:artifact undead -- would execute a query for cards where the 'groupName' property contains 'artifact' and any property or keyword contains 'undead' but none of the properties or keywords contain 'gun'.

    that can also be applied to properties, as in '-groupname:enemy' would excluded items where the 'groupname' property contained 'enemy'

#### search.replacements - characters that should be replaced in the search term before executing query.
Example:
  {"find": "." , "replace" : "\\b"} -- will find the '.' character and replace it with '\b' (the '\' must be escaped with an extra '\' because of the javascript search method)

  This weird replacement is actually implementing starts with / ends with functionality.  The javascript search function uses regex, in regex '\b' indicates a matching item should start or end with the term that precedes ot follows the '\b' character.  This is sort of free functionality (I didn't have to code for it other then the replacement).

  You might find other creative uses for replacements.

### Speaking of free functionality - 'or' condition - the '|' character in searches
I mentioned how regex is used bt the javascript search functionality, well another benefit of this is that when I wanted to enable 'or' functionality I did not have to code it.  The '|' character in regex indicates an or condition.

Example:

    artifact|gear gun|rifle|pistol -- searches for items that have keywords or properties that contain 'gear' or 'artifact'  *and*  'gun' or 'rifle' or 'pistol'

#### Meta >> search
    "search":{
        "minSearchLength":2,
        "properties":["setType", "setName","groupType","groupName","keywords","name"],
        "useExtendedKeywords": true
    },

    minSearchLength - minimum number of characters that must be entered before a search will be run
    properties - list of properties that will be searched during query execution
    useExtendedKeywords - use extended keywords contained in the keywords.json files while processing searches

#### Meta >> sort
    "toolTip": {
        "properties": ["setType","setName","groupName","keywords","name"],
        "showCardId": true,
        "useExtendedKeywords": true
    },   

    properties - list of properties that will be build the card tool tip
    showCardId - show the id assigned to each image, this number is used for random card selection tracking and ma have other uses
    useExtendedKeywords - use extended keywords contained in the keywords.json files while building tool tips

#### Meta >> sort
    "sort":{
        "default":"Default",
        "show":false
    },

    default - search (see sorting) to enable by default
    show - show sorting drop down (should be false if only 1 sort)

#### Meta >> sorting
    "sorting":[
        {"name": "Default",
            "sort":[
                {"property":"sortWeight", "computed":true, "direction":"ascending","groupBy":true},
                {"property":"name","direction":"ascending","groupBy":false}
            ],
            "duplicates":{
                "checkFields":[]
            }
        }
    ],

Sorting contains the defined sorts available, each sort has the following properties

    name - the name of the sort (will show in drop down if enabled)

    sort - list of properties included in sort 
        each properties can have the following
            property - the name of the property to be sorted on
            computed - indicates this is a computed property, only sortWeight has this at the moment
            direction - ascending or descending 
            groupBy - used to break search results into groups for display

    duplicates.checkFields - list of properties considered when trying to eliminate duplicate cards from sorted search results

#### Meta >> sizing
    "sizing":{
                "classPrefix":"i",
                "sizes":[
                    {"code":"x", "height":1200, "width":1200, "sortWeight":400},
                    {"code":"l", "height":700, "width":700, "sortWeight":300},
                    {"code":"m", "height":550, "width":550, "sortWeight":200},
                    {"code":"s", "height":0, "width":0,"sortWeight":100}
                ],
                "orientation":{
                    "portrait":{"code":"p","sortWeight":0},
                    "landscape":{"code":"l", "sortWeight":50}
                }
            }

This information is used to generate a image class property defined in the cardatron.css file that allows the cards to be sized in the html document for display 

    classPrefix -  prefix character of css class definition.
    sizes - definitions for image sizes expected
    orientation - definitions for landscape and portrait orientations

From this the following image types are defined:

    ixp - extra large portrait
    ixl - extra large landscape
    ilp - large portrait
    ill - large landscape
    imp - medium portrait
    iml - medium landscape
    isp - small portrait
    isl - small landscape

The sort weight from the image size and orientation are combined to allow for sorting of items based on image size

## Other Stuff
### Java compile commands

To build the java code you will need to have the java SDK installed (version 1.8+)

    javac cardIndex.java
    javac -classpath ".\lib\*" EmbeddedJettyFileServer.java

    build.cmd - executes both compile commands

### Java run commands
    testindex.cmd - Runs card indexing dumping output to the screen for testing.  Executes the command 'java CardIndex public' 

    indexcards.cmd - Runs card indexing redirecting output to the file 'cards.json' in the 'public/data' folder.  Executes the command 'java CardIndex public > public/data/cards.json'

    start.cmd - Runs the local web server. Executes the command 'java -classpath ".;.\lib\*" EmbeddedJettyFileServer'
    
    makekeywords.cmd {path} - Create keywords file for the directory passed in as 1st paramater.
    java MakeKeywordFile {path}

## Other code used (not my code)  
To provide a way to run the application without deploying it to a web server this project makes use of the Jetty Web Server, please refer to https://www.eclipse.org/jetty/ for additional information

For displaying the larger image popup when an image is clicked uglipop.js is being used, please see https://flouthoc.github.io/uglipop.js/ for more information


Playing card images provided by https://code.google.com/archive/p/vector-playing-cards/