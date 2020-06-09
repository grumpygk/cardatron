# cardatron

Cardatron is a web application for handling large collections of gaming cards.

## Usage

Scan your card into image files and place them into a logical folder structure, the file name and folder names will make up the keywords you will be able to search by.  When naming the image files avoid using special characters and spaces, if you plan on keeping multiple copies of a card images select a character to seperate the number from the rest of the file name.  Example: game\cart_type\filename.jpg
                     game\cart_type\filename-2.jpg

Copy the folders with the images into the public\images folder.

Run the CardIndex program to create the cards.json file.
```java CardIndex public > public/data/cards.json```

Bring up a web server for the public foler such as jetty or heep-server (using node)

```http-server public```

Using a broswer navigate to localhost:8080

