# CaloReal
Ever wondered how many calories you're eating? Do you always have time to manually check all the calories you eat by the ingredients you use?
Now, there's a way to do it all in one website!

Visit: caloreal.web.app

Note: Not all features are currently functional. Specifically, the functionality of being able to upload a picture of a meal and find the ingredients directly from an analysis of the picture is unavailable. This feature has been temporarily replaced by a manual search of items through a database.

# How it works
The website was designed with HTML and JavaScript, and implemented features like Firebase Hosting in order to be universally accessible. The URL is currently caloreal.web.app.

The machine learning portion was designed to take in an image input, and return a value of type string (this would be entered into the JavaScript database, which would bring back a value for the calories of the portion).

The database portion was designed by taking a database of calories per portion for various foods, and then translated into a JavaScript dictionary. A JavaScript method in the dict.js file would return the value of a certain food type.
