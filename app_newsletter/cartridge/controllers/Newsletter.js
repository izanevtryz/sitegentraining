/**
* Newsletter Controller
*
* @module controllers/Newsletter
*/

'use strict';

var app = require('app_storefront_controllers/cartridge/scripts/app');
var guard = require('app_storefront_controllers/cartridge/scripts/guard');
var URLUtils = require('dw/web/URLUtils');
var customObjectMgr = require('dw/object/CustomObjectMgr');

function subscription(errorCode) {
	var templateName = 'newsletter/subscribe';
	var viewData = {
		ContinueURL: URLUtils.https('Newsletter-ProcessSubscription'),
		ErrorCode: errorCode
	};

	app.getView(viewData).render(templateName);
}

function processSubscription() {
	var r = request;
	var triggeredForm = request.triggeredForm;

	var subscribeForm = app.getForm('subscribe');

	subscribeForm.handleAction({
    	subscribe: function(args) {
    		var coexist = customObjectMgr.getCustomObject("NewsletterSubscription", args.emailAddress.value);

        	if (coexist) {
        		subscription('email');
        		return null;
        	} else {
        		try {
    	        	let Transaction = require('dw/system/Transaction');

    	        	Transaction.wrap(function() {
    	            	var co = customObjectMgr.createCustomObject("NewsletterSubscription", args.emailAddress.value);
    		        	co.custom.firstName = args.firstname.value;
    			    	co.custom.lastName = args.lastname.value;
    			    	co.custom.gender = args.gender.value;
    			    	co.custom.country = args.country.value;
    			    	co.custom.dateOfBirth = new Date(args.birthday.year.value, args.birthday.month.value-1, args.birthday.day.value);
    	    		});

    	        	subscribeForm.clear();

    		    	response.redirect(URLUtils.https('Newsletter-Success'));
        		} catch (err) {
                    var Logger = require('dw/system/Logger');
                    Logger.error(err);
                    
                    subscription("unknown");

                    return null;
        		}
        	}

        	subscription();
    	},
    	removeSome: function(args) {
    		show();
    	},
    	error: function(args) {
    		subscription('invalid');
    	}
    });
}

function removeSome() {
	var Transaction = require('dw/system/Transaction');

	var selectedIds = request.httpParameterMap.get('selected[]').values;

	for (var index in selectedIds) {
    	Transaction.wrap(function() {
    		var uuid = selectedIds[index];

    		var subscriptionObject = customObjectMgr.queryCustomObject("NewsletterSubscription", "UUID = {0}", uuid);

			if (subscriptionObject) {
				customObjectMgr.remove(subscriptionObject);
			}
    	});
	}
	
	response.redirect(URLUtils.https('Newsletter-Show'));
}

function subscriptionSuccess() {
	app.getView().render('newsletter/subscribeSuccess');
}

function show() {
	var content = dw.content.ContentMgr.getContent("newsletter-subscription-header");

	var ArrayList = require('dw/util/ArrayList');

	var subscriptionsList = new ArrayList();
	var subscriptionsIterator = customObjectMgr.getAllCustomObjects("NewsletterSubscription");

	for each (s in subscriptionsIterator) {
		s.custom.dateOfBirth = new Date(s.custom.dateOfBirth);
		subscriptionsList.add(s);
	}

	var subscriptionsCount = subscriptionsIterator.getCount();

	app.getView({
		Subscriptions: subscriptionsList,
		SubscriptionsCount: subscriptionsCount,
		RemoveSubscriptionsURL: URLUtils.https('Newsletter-RemoveSome')
	}).render('newsletter/show');
}

exports.Subscription = guard.ensure([], subscription);
exports.ProcessSubscription = guard.ensure(['post', 'csrf'], processSubscription);
exports.Success = guard.ensure(['get'], subscriptionSuccess);
exports.Show = guard.ensure(['get'], show);
exports.RemoveSome = guard.ensure(['post', 'csrf'], removeSome);

