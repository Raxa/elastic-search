elastic-search
==============

Secure and fast Elastic Search on various Raxa backend resources including patient, person, encounter, obs, etc

Installing required software:
-----------------------------

*Installing ES:*

curl https://download.elasticsearch.org/elasticsearch/elasticsearch/elasticsearch-0.90.2.deb

sudo dpkg -i elasticsearch-0.90.2.deb

*Installing node:*

sudo apt-get install nodejs npm

*Installing required mudules:*

npm install mysql async elasticsearchclient


Running
-------

Currently production scripts are *not* implemented, so you can run search server using

node server.js
