
use 'strict';

exports.validate = function(form) {
	var formElementValidationResult = new dw.web.FormElementValidationResult();
	formElementValidationResult.setValid(true);

	return formElementValidationResult;
}