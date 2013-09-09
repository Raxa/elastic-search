elastic-search
==============
Secure and fast Elastic Search on various Raxa backend resources including patient, person, encounter, obs, etc

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
and restart ES to perform updates:
```
sudo service elasticsearch restart
```
### Installing nodejs
elastic-search require ```nodejs``` version 0.10+
```
sudo apt-get install nodejs npm
```
### Installing elastic-search
You can get elastic-search using ```git```:
```
git clone https://github.com/invercity/elastic-search.git
```
### Installing required mudules
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
Currently production scripts are *not* implemented, to run search server you must:
start rivers (for transmitting data from ```MySQL``` to ```ES```)
```
node app.js river
```
Then you can run search server:
```
npm start
```
*** Note, that ```river``` transmitting data taking some time, so at the first time server will *NO* return any data, 
just wait while index will be created
