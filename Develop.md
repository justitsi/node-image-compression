## Setup a db in a container for development:

```
docker run -p 5984:5984 -d --name my-couchdb -e COUCHDB_USER=admin -e COUCHDB_PASSWORD=password couchdb:3
```
