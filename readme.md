# node-image-compression

## Intro
This is a NodeJS image storage solution that is meant to be run as a microservice with docker. It stores images direclty on the filesysten and keeps metadata (owner and access list) in a CouchDB database. It handles converting, resizing and compressing images via the `sharp` library. It uses a `jwt` token in a `jwt_cookie` for authentication and is meant to be used along side the [`jwt_issuer` microservice](https://github.com/justitsi/jwt_issuer_public). The `jwt_cookie` cookie name can customized using the files in the `misc` directory.

## Starting docker containers
In order to start the docker containers, run:
1. `./makedirs.sh`
2. `docker-compose build`
3. `docker-compose up`

## Endpoints
### GET Routes
* GET `/liveliness` - returns current liveliness information about the application.  

* GET `/get/private/{imageID}` - loads the image requested image if the user has permission to view it. This route checks user permissions by reading a `jwt_token` cookie. Learn more about it by reading the `readme.md` in `/misc`.  

* GET `/get/public/{imageID}` - loads the image requested without checking the `jwt_token` cookie.  

* GET `/get/private/{imageID}/{size}` - same as `/get/private/{imageID}`, but rescales the image to the desired `{size}` (note that this will not crop the photo, it will rescale it to be contained withing the specified `size`). The `size` paramater should be a string of format `{Size_X}x{Size_Y}` where `{Size_X}` and `{Size_Y}` are positive integers, e.g.: `500x500`, `123456789x123456789`.  

* GET `/get/public/{imageID}/{size}` - same as `/get/private/{imageID}/{size}`, but without checking for the `jwt_cookie`.  

* GET `/get/imageData/byOwner` - returns the image IDs for the images the request sender owns. This is determined by the user ID in the jwt token, so a `jwt_cookie` is required.

* GET `/get/imageData/byImageId/{imageID}` - returns the image metadata if the request sender has access to the image - this is determined by using the using the request jwt token, so a `jwt_cookie` is required. 

### PUT Routes
* PUT `/put/private` - this route expects `form-data` in the `Body` of the request - this form should have a `file` key that has the image file that should be uploaded. This route expects a `jwt_cookie` as it sets the image owner based on the information in the cookie.

* PUT `/put/public` - this route is functionally identical to the `/put/ptivate` with the addition that it sets the visibility of the picture as public.

* POST `/put/private/{imageID}` - this route is used for setting the view permissions of a private image. It expects a `json` body of the format:  
```
{
	"accessList": [id1, id2, ..., idN]
}
```
There is no limit of the number of viewers set in the `accessList`. Sending this request will overwrite any previous items in the `accessList`. This route requires a `jwt_token` cookie in order to authenticate the owner of the image. Only the owner of a particular image can make changes to its `accessList`.  
### DELETE Routes
* DELETE `/delete/private/{imageID}` - This route is used for deleting images. A `jwt_cookie` is needed at this route to authenticate the image owner

* DELETE `/delete/public/{imageID}` - This route is identical to the `/delete/private/{imageID}` route.


## Local development

To start this application, `cd` into `src` and execute `node index.js` (don't forget to run `npm ci` beforehand!). The application needs a connection to CouchDB - set one up in the `database_settings.json` file in `/misc`. You can run a local instance of CouchDB with docker by using this command:

```
docker run -p 5984:5984 -d --name my-couchdb -e COUCHDB_USER=admin -e COUCHDB_PASSWORD=password couchdb:3
```

## The `jwt_cookie`
Eventhough it is possible to customize the name of the `jwt_cookie` using the configuration files in the `misc` directory, the application still requires the `jwt_token` to follow this format:
```
{
	"userID": {Id of the user, prefebly a string or int},
	"issued": {JS Date compatible time format},
	"expires": {JS Date compatible time format}
}
```
