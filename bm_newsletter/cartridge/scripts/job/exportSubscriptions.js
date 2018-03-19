'use strict';

var FileWriter = require("dw/io/FileWriter");
var File = require("dw/io/File");

var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var system = require( 'dw/system' );
var Transaction = require('dw/system/Transaction');

function exportSubscriptionsCSV(subscriptionsIterator, filename) {
	var CSVStreamWriter = require('dw/io/CSVStreamWriter');

	Transaction.wrap(function() {
		var fileWriter = new FileWriter(new File("/temp/" + filename + ".csv"), "UTF-8");
		var writer = new CSVStreamWriter(fileWriter, ",");

		for each (var subscription in subscriptionsIterator) {
			writer.writeNext([
				subscription.custom.firstName,
				subscription.custom.lastName,
				subscription.custom.emailAddress,
				subscription.custom.country.displayValue,
				subscription.custom.gender.displayValue,
				subscription.custom.dateOfBirth
			]);

	    	subscription.custom._exported = true;
		}

		writer.close();
		fileWriter.close();
	});
};

function exportSubscriptionsXML(subscriptionsIterator, filename) {
	var XMLStreamWriter = require('dw/io/XMLStreamWriter');

	Transaction.wrap(function() {
		var fileWriter = new FileWriter(new File("/temp/" + filename + ".xml"), "UTF-8");
		var xsw = new XMLStreamWriter(fileWriter);

		xsw.writeStartDocument();
		xsw.writeStartElement("subscriptions");

		for each (var subscription in subscriptionsIterator) {
			xsw.writeStartElement("NewsletterSubscription");

			xsw.writeStartElement("firstName");
			xsw.writeCharacters(subscription.custom.firstName);
			xsw.writeEndElement();

			xsw.writeStartElement("lastName");
			xsw.writeCharacters(subscription.custom.lastName);
			xsw.writeEndElement();

			xsw.writeStartElement("emailAddress");
			xsw.writeCharacters(subscription.custom.emailAddress);
			xsw.writeEndElement();

			xsw.writeStartElement("country");
			xsw.writeCharacters(subscription.custom.country.displayValue);
			xsw.writeEndElement();

			xsw.writeStartElement("gender");
			xsw.writeCharacters(subscription.custom.gender.displayValue);
			xsw.writeEndElement();

			xsw.writeStartElement("dateOfBirth");
			xsw.writeCharacters(subscription.custom.dateOfBirth);
			xsw.writeEndElement();

			xsw.writeEndElement();

			subscription.custom._exported = true;
		}

		xsw.writeEndElement();
		xsw.writeEndDocument();

		xsw.close();
		fileWriter.close();
	});
};

function validateParameters(parameters) {
	var notvalid = false;

	var filenameRegex = new RegExp("^[a-z0-9_]+$", "g");

	if (!filenameRegex.test(parameters.filename)) {
		notvalid = true;
	}

	if (notvalid) {
		throw new Error("Parameters Not Valid");
	}
};

function handleJob( parameters, stepExecution ) {
	try {
		var newSubscriptionsIterator = CustomObjectMgr.queryCustomObjects("NewsletterSubscription", "custom._exported = NULL OR custom._exported != true", "UUID ASC");

		validateParameters(parameters);

		if (parameters.format == 'CSV') {
			exportSubscriptionsCSV(newSubscriptionsIterator, parameters.filename);
		} else if (parameters.format == 'XML') {
			exportSubscriptionsXML(newSubscriptionsIterator, parameters.filename);
		}

	    return new system.Status(system.Status.OK);
	} catch (err) {
        var Logger = require('dw/system/Logger');
        Logger.error(err);

		return new system.Status(system.Status.ERROR, null, err);
	}
};


exports.execute = function( parameters, stepExecution ) {
	handleJob(parameters, stepExecution);
}