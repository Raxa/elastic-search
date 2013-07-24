elastic-search
==============
Secure and fast Elastic Search on various Raxa backend resources including patient, person, encounter, obs, etc

Installing required software (Ubuntu)
-----------------------------
### Installing Elasticsearch server
You can get latest version of ES from official website, or install it using commands:
```
wget https://download.elasticsearch.org/elasticsearch/elasticsearch/elasticsearch-0.90.2.deb
sudo dpkg -i elasticsearch-0.90.2.deb
```
### Installing nodejs
elastic-search require nodejs version 0.10+
```
sudo apt-get install nodejs npm
```
### Installing elastic-search
You can get elastic-search using git:
```
git clone https://github.com/invercity/elastic-search.git
```
### Installing required mudules
Currently you can install it using script:
```
cd elastic-search
./install.sh
```
Configuring
-----------
Before running, you must set up mysql and es params
for this, edit ```default.json``` file
```
cd config
nano default.json
```
Running
-------
Currently production scripts are *not* implemented, to run search server you must:
index mysql database:
```
node app.js index
```
if you want index only selected instances, run
```
node index.js _instance_name
```
Then you can run search server:
```
node app.js run
```
