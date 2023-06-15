# VISH 2023
This project was developed as part of the Visualization and HCI
module in the summer semester of 2023 at Hannover University of Applied Sciences
and Arts in the Master of Applied Computer Science program.
You can find the <i class="fa-brands fa-github"></i> GitHub repository at the following link: https://github.com/StevenStreller/vish2023.git

## Getting Started
There are several ways how to deploy the web application.

### GitHub Pages
Under the link https://stevenstreller.github.io/vish2023/ is already a provided web application

### Node.js
```
~:$ git clone https://github.com/StevenStreller/vish2023.git
~:$ cd vish2023
vish2023:$ npm install
vish2023:$ npm run http-server
```
### Docker
The project can also be easily deployed using `docker-compose.yml`.
In this case, the default port of the web application is `8080`. If this port is
already occupied, it must be adjusted accordingly in the file.
```
~:$ git clone https://github.com/StevenStreller/vish2023.git
~:$ cd vish2023
vish2023:$ docker-compose up -d
```
## Map and Leaflet.js
In order to display a map of Germany, we have used the well-known JavaScript
library [Leaflet.js](https://leafletjs.com/), which allows us to display
geographic information such as lines or polygons on the map by including
GeoJSON.
Fortunately, GeoJSON files already exist for Germany with different levels of
detail. Since our data only contains the federal state, we were only interested
in GeoJSON files that map the federal state level, which we found in the GitHub
repository of isellsoap (Repository: [deutschlandGeoJSON](https://github.com/isellsoap/deutschlandGeoJSON)
![GeoJSON](public/assets/docs/federal-states-geo-json.png)

## How can i add my own data to the map?
We have designed this web application in such a way that it is possible to add your
own files to the map in just a few steps. It is crucial that the files correspond to
the same JSON schema as already deposited files. The data can be viewed under
`public/assets/data`. In the folder you will also find a `template.json`
(absolute path `public/assets/data/template.json`), which is structured
according to the schema
```json
{
  "title": "Example title",
  "source": "Example source",
  "options": ["Example", "Option"],
  "description": "Example description",
  "years": [2021],
  "data": {
    "Example state 1": {
      "2021": {
        "Example": 5152920,
        "Option": 2942115
      }
    },
    "Example state 2": {
      "2021": {
        "Example": 5152920,
        "Option": 2942115
      }
    }
  }
}
```
Afterwards, the newly created JSON file (for example `example.json`) must
be placed in the directory `public/assets/data` and stored in the `main/loadData.js` in the variable `files`.
```javascript
let files = [
    "../assets/data/car-accidents.json",
    // [...]
    "../assets/data/example.json"
];
```
That's it. Now it is possible to access the data via the select field and make
further exciting calculations.

## Between which dates can I choose?
Using the select fields on the left you can easily choose between the following:
- Car accidents
- Carbon emissions
- Gross domestic product (GDP)
- Population
- Vehicle registrations
- Area

A short description is also available.

# Contributors
| First-/ Lastname          | GitHub-Profile                    |
|---------------------------|-----------------------------------|
| Nicolai Böttger           | https://github.com/Nico532        |
| Norbert Oskar Piotrkowicz | https://github.com/Norkill        |
| Jon-Steven Streller       | https://github.com/StevenStreller |
