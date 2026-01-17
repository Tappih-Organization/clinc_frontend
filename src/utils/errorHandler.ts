import i18n from 'i18next';

interface ApiError {
  success: boolean;
  message: string;
  errors?: Array<{
    type: string;
    value: string;
    msg: string;
    path: string;
    location: string;
  }>;
}

// Translation mapping for backend error messages
const errorMessageTranslations: Record<string, string> = {
  'Error fetching warehouses': 'errors.errorFetchingWarehouses',
  'Warehouse not found': 'errors.warehouseNotFound',
  'Error fetching warehouse': 'errors.errorFetchingWarehouse',
  'Validation failed': 'errors.validationFailed',
  'At least one branch must be assigned': 'errors.atLeastOneBranchRequired',
  'One or more branches not found or do not belong to your tenant': 'errors.branchesNotFoundOrInvalid',
  'Duplicate branch IDs detected in assigned branches': 'errors.duplicateBranchIds',
  'Error creating warehouse': 'errors.errorCreatingWarehouse',
  'Warehouse created successfully': 'success.warehouseCreated',
  'Error updating warehouse': 'errors.errorUpdatingWarehouse',
  'Warehouse updated successfully': 'success.warehouseUpdated',
  'Status must be ACTIVE or INACTIVE': 'errors.invalidStatus',
  'Warehouse status updated successfully': 'success.warehouseStatusUpdated',
  'Error updating warehouse status': 'errors.errorUpdatingWarehouseStatus',
  'Error fetching warehouse items': 'errors.errorFetchingWarehouseItems',
  'Cannot delete warehouse. There are items assigned to this warehouse. Please remove or reassign all items before deleting.': 'errors.cannotDeleteWarehouseWithItems',
  'Warehouse deleted successfully': 'success.warehouseDeleted',
  // Validation messages from warehouseRoutes.ts
  'Type must be MAIN or SUB': 'Type must be MAIN or SUB',
  'Invalid branch ID': 'Invalid branch ID',
  'Invalid manager user ID': 'Invalid manager user ID',
  'isShared must be a boolean': 'isShared must be a boolean',
  'Warehouse name cannot be empty': 'Warehouse name cannot be empty',
  'Invalid warehouse ID': 'Invalid warehouse ID',
  'Page must be a positive integer': 'Page must be a positive integer',
  'Limit must be between 1 and 100': 'Limit must be between 1 and 100',
  'Limit must be between 1 and 10000': 'Limit must be between 1 and 10000',
  'Search must be a string': 'Search must be a string',
  'SortBy must be a string': 'SortBy must be a string',
  'SortOrder must be asc or desc': 'SortOrder must be asc or desc',
  'Error deleting warehouse': 'errors.errorDeletingWarehouse',
  'Inventory item created successfully': 'success.inventoryItemCreated',
  'SKU already exists': 'errors.skuAlreadyExists',
  'Internal server error': 'errors.internalServerError',
  'Inventory item not found or not accessible': 'errors.inventoryItemNotFoundOrNotAccessible',
  'Inventory item not found': 'errors.inventoryItemNotFound',
  'Inventory item updated successfully': 'success.inventoryItemUpdated',
  'Inventory item deleted successfully': 'success.inventoryItemDeleted',
  'Quantity must be a positive number': 'errors.quantityMustBePositive',
  'Inventory item not found after update': 'errors.inventoryItemNotFoundAfterUpdate',
  'Stock updated successfully': 'success.stockUpdated',
  'Error fetching clinics': 'errors.errorFetchingClinics',
  'Tenant information is required': 'errors.tenantInformationRequired',
  'No clinic selected': 'errors.noClinicSelected',
  'Clinic not found': 'errors.clinicNotFound',
  'Error fetching clinic details': 'errors.errorFetchingClinicDetails',
  'Authentication required': 'errors.authenticationRequired',
  'Sub Clinics are not allowed to create other clinics': 'errors.subClinicsCannotCreateClinics',
  'Clinic created successfully': 'success.clinicCreated',
  'Clinic code already exists': 'errors.clinicCodeAlreadyExists',
  'Error creating clinic': 'errors.errorCreatingClinic',
  'Access denied to this clinic': 'errors.accessDeniedToClinic',
  'Error fetching clinic': 'errors.errorFetchingClinic',
  'Clinic updated successfully': 'success.clinicUpdated',
  'Error updating clinic': 'errors.errorUpdatingClinic',
  'Only super administrators can deactivate clinics': 'errors.onlySuperAdminCanDeactivate',
  'Clinic deactivated successfully': 'success.clinicDeactivated',
  'Error deactivating clinic': 'errors.errorDeactivatingClinic',
  'Error fetching clinic statistics': 'errors.errorFetchingClinicStatistics',
  'Admin access required': 'errors.adminAccessRequired',
  'Error fetching clinic users': 'errors.errorFetchingClinicUsers',
  'Error fetching user clinic access': 'errors.errorFetchingUserClinicAccess',
  'User not found': 'errors.userNotFound',
  'User is already associated with this clinic': 'errors.userAlreadyAssociated',
  'User association reactivated': 'success.userAssociationReactivated',
  'User added to clinic successfully': 'success.userAddedToClinic',
  'Error adding user to clinic': 'errors.errorAddingUserToClinic',
  'User updated successfully': 'success.userUpdated',
  'Error updating user': 'errors.errorUpdatingUser',
  'Cannot remove yourself as the only admin': 'errors.cannotRemoveOnlyAdmin',
  'User not found in this clinic': 'errors.userNotFoundInClinic',
  'User removed from clinic successfully': 'success.userRemovedFromClinic',
  'Error removing user from clinic': 'errors.errorRemovingUserFromClinic',
  'Payment created successfully': 'success.paymentCreated',
  'Failed to create payment': 'errors.failedToCreatePayment',
  'Failed to fetch payments': 'errors.failedToFetchPayments',
  'Invalid payment ID': 'errors.invalidPaymentId',
  'Payment not found': 'errors.paymentNotFound',
  'Failed to fetch payment': 'errors.failedToFetchPayment',
  'Payment updated successfully': 'success.paymentUpdated',
  'Failed to update payment': 'errors.failedToUpdatePayment',
  'Payment status updated successfully': 'success.paymentStatusUpdated',
  'Failed to update payment status': 'errors.failedToUpdatePaymentStatus',
  'Failed to fetch payment statistics': 'errors.failedToFetchPaymentStatistics',
  'Can only refund completed payments': 'errors.canOnlyRefundCompletedPayments',
  'Refund initiated successfully': 'success.refundInitiated',
  'Failed to initiate refund': 'errors.failedToInitiateRefund',
  'Missing required fields: invoice_id, amount, method, description': 'errors.missingRequiredFields',
  'Invoice not found or does not belong to your clinic': 'errors.invoiceNotFoundOrInvalid',
  'Payment amount must be greater than 0': 'errors.paymentAmountMustBeGreaterThanZero',
  'Payment recorded successfully': 'success.paymentRecorded',
  'Failed to record payment': 'errors.failedToRecordPayment',
  'Missing required fields: amount, description, customer_email, patient_id': 'errors.missingRequiredFieldsForPayment',
  'Patient not found or does not belong to your clinic': 'errors.patientNotFoundOrInvalid',
  'Payment link created successfully': 'success.paymentLinkCreated',
  'Failed to create payment link': 'errors.failedToCreatePaymentLink',
  'Failed to get payment link details': 'errors.failedToGetPaymentLinkDetails',
  'Missing Stripe signature': 'errors.missingStripeSignature',
  'Webhook signature verification failed': 'errors.webhookSignatureVerificationFailed',
  'Webhook handled successfully': 'success.webhookHandled',
  'Error handling webhook': 'errors.errorHandlingWebhook',
  'Stripe payment not found': 'errors.stripePaymentNotFound',
  'Stripe refund created successfully': 'success.stripeRefundCreated',
  'Failed to create refund': 'errors.failedToCreateRefund',
  'Stripe statistics retrieved successfully': 'success.stripeStatisticsRetrieved',
  'Failed to get Stripe statistics': 'errors.failedToGetStripeStatistics',
  'Session ID is required': 'errors.sessionIdRequired',
  'Payment not found for this session': 'errors.paymentNotFoundForSession',
  'Payment not found after verification': 'errors.paymentNotFoundAfterVerification',
  'Payment details retrieved successfully': 'success.paymentDetailsRetrieved',
  'Failed to verify payment': 'errors.failedToVerifyPayment',
  'Pending Stripe payment not found': 'errors.pendingStripePaymentNotFound',
  'Payment link not available': 'errors.paymentLinkNotAvailable',
  'Payment link retrieved successfully': 'success.paymentLinkRetrieved',
  'Failed to resend payment link': 'errors.failedToResendPaymentLink',
  'Clinic is not active': 'errors.clinicNotActive',
  'User with this email already exists': 'errors.userEmailAlreadyExists',
  'User registered successfully': 'success.userRegistered',
  'Invalid email': 'errors.invalidEmail',
  'Account is deactivated': 'errors.accountDeactivated',
  'Invalid password': 'errors.invalidPassword',
  'Login successful': 'success.loginSuccessful',
  'Profile updated successfully': 'success.profileUpdated',
  'Current password is incorrect': 'errors.currentPasswordIncorrect',
  'New password must be different from current password': 'errors.newPasswordMustBeDifferent',
  'Password changed successfully': 'success.passwordChanged',
  'An unexpected error occurred. Please try again.': 'errors.unexpectedError',
  'Something went wrong': 'errors.somethingWentWrong',
};

// Helper function to translate error messages
const translateErrorMessage = (message: string): string => {
  // Check if message matches a known backend error
  const translationKey = errorMessageTranslations[message];
  if (translationKey) {
    return i18n.t(translationKey, { defaultValue: message });
  }
  
  // Check for dynamic messages (e.g., "Branch X already has a MAIN warehouse")
  if (message.includes('already has a MAIN warehouse')) {
    return i18n.t('errors.branchAlreadyHasMainWarehouse', { defaultValue: message });
  }
  
  if (message.includes('Cannot subtract more than available stock')) {
    return i18n.t('errors.cannotSubtractMoreThanAvailableStock', { defaultValue: message });
  }
  
  // Try to translate using the message directly as a key (for messages added to common.json)
  // This allows backend messages to be translated directly without mapping
  const directTranslation = i18n.t(message, { defaultValue: null });
  if (directTranslation && directTranslation !== message) {
    return directTranslation;
  }
  
  // Return original message if no translation found
  return message;
};

export const parseApiError = (error: any): string => {
  // If error is a string, translate and return it
  if (typeof error === 'string') {
    return translateErrorMessage(error);
  }

  // If error has a response (axios error)
  if (error?.response?.data) {
    const apiError: ApiError = error.response.data;
    
    // If there are specific field errors, format them nicely
    if (apiError.errors && apiError.errors.length > 0) {
      const fieldErrors = apiError.errors.map(err => translateErrorMessage(err.msg)).join(', ');
      return fieldErrors;
    }
    
    // Return the main message if available (translated)
    if (apiError.message) {
      return translateErrorMessage(apiError.message);
    }
  }

  // If error has a message property
  if (error?.message) {
    return translateErrorMessage(error.message);
  }

  // If error is an Error instance
  if (error instanceof Error) {
    return translateErrorMessage(error.message);
  }

  // Default fallback message (translated)
  return i18n.t('errors.unexpectedError', { defaultValue: 'An unexpected error occurred. Please try again.' });
}; 