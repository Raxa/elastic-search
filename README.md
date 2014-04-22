elastic-search
==============
Secure and fast Elastic Search on various Raxa backend resources including patient, person, encounter, obs, etc
Requirements
-------------
```
JDK v6+ (for Elasticsearch server)
Elasticsearch v0.9+
MySQL server
Node.JS v0.8+
npm v1.3+
elasticsearch mysql-river plugin & MySQL JDBC connector (for indexing)
```
Installing required software (Ubuntu)
-----------------------------
### Installing Elasticsearch server
You can get latest version of ```ES``` from official website, or install it using commands:
```
wget https://download.elasticsearch.org/elasticsearch/elasticsearch/elasticsearch-0.90.2.deb
sudo dpkg -i elasticsearch-0.90.2.deb
```
### Installing river plugin
At first, download plugin and ```MySQL JDBC``` connector:
```
https://bintray.com/pkg/show/general/jprante/elasticsearch-plugins/elasticsearch-river-jdbc
http://dev.mysql.com/downloads/connector/j/
```
then go to Elasticsearch home directory, lets called it ```$ES_HOME``` (```/usr/share/elasticsearch``` by default)
```
cd $ES_HOME
```
installing plugin:
```
./bin/plugin --url file://PATH_TO_PLUGIN/plugin.zip -install river-jdbc
```
Also you can install it manually:
```
mkdir plugins/river-jdbc
cp PATH_TO_PLUGIN/plugin.jar plugins/river-jdbc
```
then copy ```JDBC``` connector to plugin directory:
```
cp PATH_TO_JDBC_CONNECTOR/connector.jar plugins/river-jdbc/
```
and restart ```ES``` to perform updates:
```
sudo service elasticsearch restart
```
### Installing nodejs
```elastic-search``` require ```nodejs``` version 0.80+
```
sudo apt-get install nodejs npm
```
### Installing elastic-search
You can get ```elastic-search``` using ```git```:
```
git clone https://github.com/invercity/elastic-search.git
```
### Installing required modules
Currently you can install it using:
```
cd elastic-search
npm install
```
Configuring
-----------
Before running, you must set up ```MySQL``` and ```Elasticsearch``` server configuration
for this, edit ```default.json``` file
```
cd config
nano default.json
```
Running
-------
To run search server just execute next command:
```
npm start
```
Testing
-------
At first, install ```jasmine-node```
```
npm install -g jasmine-node
```
Then you can run tests:
```
npm test
```
Indexing
-------
When you're done with testing, you can run ```rivers``` for indexing data from MySQL:
```
node app.js river
```
*** Note, that ```river``` transmitting data taking some time, so at the first time server will *NO* return any data, 
just wait while indexes will be created
To remove data, run
``` 
node app.js clean
```
Additional info
---------------
You can get additional information on wiki:
https://raxaemr.atlassian.net/wiki/display/RAXAJSS/Search+layer
