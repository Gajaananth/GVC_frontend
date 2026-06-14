/**
 * Customer Deletion Service
 * Handles complete customer deletion with password verification,
 * archive PDF generation, and cascading data removal with transactions
 */

import { fetchApi } from './api';

export interface CustomerDeletionRequest {
  customerId: string;
  ownerPassword: string;
  reason?: string;
  notes?: string;
}

export interface CustomerArchiveData {
  customer: any;
  loans: any[];
  payments: any[];
  collections: any[];
  dueSchedules: any[];
  fixedDeposits: any[];
  documents: any[];
  auditTrail: any[];
}

export interface DeletionResult {
  success: boolean;
  archivePdfUrl?: string;
  deletedRecords?: {
    customers: number;
    loans: number;
    payments: number;
    collections: number;
    dueSchedules: number;
    fixedDeposits: number;
    documents: number;
    auditRecords: number;
    notes: number;
    assignments: number;
  };
  timestamp: string;
  message: string;
}

/**
 * Verify owner password
 */
export async function verifyOwnerPassword(
  ownerId: string,
  password: string
): Promise<boolean> {
  try {
    const response = await fetchApi(`/auth/verify-password`, {
      method: 'POST',
      body: JSON.stringify({
        user_id: ownerId,
        password,
      }),
    });
    return response.data?.verified === true;
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}

/**
 * Get all customer data for archive
 */
export async function getCustomerArchiveData(
  customerId: string
): Promise<CustomerArchiveData> {
  try {
    const response = await fetchApi(`/customers/${customerId}/archive-data`);
    return response.data;
  } catch (error) {
    console.error('Error fetching archive data:', error);
    throw new Error('Failed to fetch customer archive data');
  }
}

/**
 * Generate customer archive PDF
 * Returns PDF blob URL for download
 */
export async function generateCustomerArchivePDF(
  customerId: string,
  archiveData: CustomerArchiveData,
  generatedBy: string
): Promise<{ pdfUrl: string; fileName: string }> {
  try {
    // Prepare PDF data
    const pdfData = {
      customer: archiveData.customer,
      loans: archiveData.loans || [],
      payments: archiveData.payments || [],
      collections: archiveData.collections || [],
      dueSchedules: archiveData.dueSchedules || [],
      fixedDeposits: archiveData.fixedDeposits || [],
      auditTrail: archiveData.auditTrail || [],
      generatedBy,
      generatedAt: new Date().toISOString(),
    };

    // Request PDF generation from backend
    const response = await fetchApi(`/customers/${customerId}/generate-archive-pdf`, {
      method: 'POST',
      body: JSON.stringify(pdfData),
    });

    const fileName = `customer-archive-${customerId}-${new Date().toISOString().split('T')[0]}.pdf`;

    return {
      pdfUrl: response.data.pdfUrl || response.data.url,
      fileName,
    };
  } catch (error) {
    console.error('Error generating archive PDF:', error);
    throw new Error('Failed to generate customer archive PDF');
  }
}

/**
 * Delete customer permanently (with transaction support)
 * This includes:
 * - Customer profile
 * - All loans and loan-related data
 * - Payment records
 * - Collection records
 * - Due schedules
 * - Fixed deposits
 * - Documents
 * - Notes
 * - Assignments
 * - Audit records
 */
export async function deleteCustomerPermanently(
  customerId: string,
  deletedBy: string,
  reason?: string
): Promise<DeletionResult> {
  try {
    const response = await fetchApi(`/customers/${customerId}/delete-permanently`, {
      method: 'DELETE',
      body: JSON.stringify({
        deleted_by: deletedBy,
        deletion_reason: reason || 'No reason provided',
        deleted_at: new Date().toISOString(),
      }),
    });

    return {
      success: true,
      deletedRecords: response.data.deletedRecords,
      timestamp: new Date().toISOString(),
      message: 'Customer deleted successfully',
    };
  } catch (error) {
    console.error('Error deleting customer:', error);
    throw new Error('Failed to delete customer - transaction rolled back');
  }
}

/**
 * Complete deletion flow with password verification and archive
 * 1. Verify owner password
 * 2. Get archive data
 * 3. Generate PDF
 * 4. Delete customer
 * 5. Log audit
 */
export async function completeCustomerDeletion(
  request: CustomerDeletionRequest,
  ownerId: string,
  ownerName: string
): Promise<DeletionResult> {
  try {
    // Step 1: Verify password
    console.log('Step 1: Verifying owner password...');
    const isPasswordValid = await verifyOwnerPassword(ownerId, request.ownerPassword);
    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }

    // Step 2: Get archive data
    console.log('Step 2: Fetching customer archive data...');
    const archiveData = await getCustomerArchiveData(request.customerId);

    // Step 3: Generate PDF
    console.log('Step 3: Generating archive PDF...');
    const { pdfUrl, fileName } = await generateCustomerArchivePDF(
      request.customerId,
      archiveData,
      ownerName
    );

    // Step 4: Delete customer
    console.log('Step 4: Deleting customer permanently...');
    const deletionResult = await deleteCustomerPermanently(
      request.customerId,
      ownerId,
      request.reason
    );

    // Step 5: Log audit
    console.log('Step 5: Logging audit trail...');
    await logCustomerDeletion({
      customerId: request.customerId,
      customerName: archiveData.customer?.full_name || 'Unknown',
      deletedBy: ownerId,
      deletedByName: ownerName,
      reason: request.reason || 'No reason provided',
      archivePdfUrl: pdfUrl,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      archivePdfUrl: pdfUrl,
      deletedRecords: deletionResult.deletedRecords,
      timestamp: new Date().toISOString(),
      message: `Customer deleted successfully. Archive PDF: ${fileName}`,
    };
  } catch (error) {
    console.error('Error in complete deletion flow:', error);
    throw error;
  }
}

/**
 * Log customer deletion in audit trail
 */
export async function logCustomerDeletion(auditData: {
  customerId: string;
  customerName: string;
  deletedBy: string;
  deletedByName: string;
  reason: string;
  archivePdfUrl: string;
  timestamp: string;
}): Promise<void> {
  try {
    await fetchApi(`/audit-logs`, {
      method: 'POST',
      body: JSON.stringify({
        action: 'customer_deletion',
        entity_type: 'customer',
        entity_id: auditData.customerId,
        entity_name: auditData.customerName,
        performed_by: auditData.deletedBy,
        performed_by_name: auditData.deletedByName,
        details: {
          reason: auditData.reason,
          archivePdfUrl: auditData.archivePdfUrl,
        },
        timestamp: auditData.timestamp,
      }),
    });
  } catch (error) {
    console.error('Error logging customer deletion:', error);
    // Don't throw - audit logging failure shouldn't block deletion
  }
}

/**
 * Download archive PDF
 */
export async function downloadArchivePDF(pdfUrl: string, fileName: string): Promise<void> {
  try {
    const response = await fetch(pdfUrl);
    const blob = await response.blob();
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading PDF:', error);
    throw new Error('Failed to download archive PDF');
  }
}

/**
 * Validate deletion request
 */
export function validateDeletionRequest(
  request: CustomerDeletionRequest
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!request.customerId || request.customerId.trim().length === 0) {
    errors.push('Customer ID is required');
  }

  if (!request.ownerPassword || request.ownerPassword.length === 0) {
    errors.push('Owner password is required');
  }

  if (request.ownerPassword && request.ownerPassword.length < 6) {
    errors.push('Password format invalid');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get customer deletion preview
 * Shows what will be deleted
 */
export async function getCustomerDeletionPreview(customerId: string) {
  try {
    const archiveData = await getCustomerArchiveData(customerId);

    return {
      customerName: archiveData.customer?.full_name || 'Unknown',
      customerId,
      summary: {
        loans: archiveData.loans?.length || 0,
        payments: archiveData.payments?.length || 0,
        collections: archiveData.collections?.length || 0,
        dueSchedules: archiveData.dueSchedules?.length || 0,
        fixedDeposits: archiveData.fixedDeposits?.length || 0,
        documents: archiveData.documents?.length || 0,
      },
      totalRecordsToDelete:
        (archiveData.loans?.length || 0) +
        (archiveData.payments?.length || 0) +
        (archiveData.collections?.length || 0) +
        (archiveData.dueSchedules?.length || 0) +
        (archiveData.fixedDeposits?.length || 0) +
        (archiveData.documents?.length || 0) +
        1, // +1 for customer record itself
    };
  } catch (error) {
    console.error('Error getting deletion preview:', error);
    throw new Error('Failed to get deletion preview');
  }
}
