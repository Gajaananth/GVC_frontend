/**
 * Delete Customer Modal
 * Complete deletion flow with password verification, archive PDF, and cascading deletion
 */

import React, { useState } from 'react';
import { AlertTriangle, Eye, EyeOff, Download, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../Modal';
import * as customerDeletionService from '../../services/customerDeletionService';

interface Props {
  customer: any;
  onClose: () => void;
  onSuccess: () => void;
  ownerId: string;
  ownerName: string;
}

enum DeletionStep {
  CONFIRMATION = 'confirmation',
  PASSWORD = 'password',
  PREVIEW = 'preview',
  ARCHIVING = 'archiving',
  DELETING = 'deleting',
  SUCCESS = 'success',
}

const DeleteCustomerModal = ({
  customer,
  onClose,
  onSuccess,
  ownerId,
  ownerName,
}: Props) => {
  const [step, setStep] = useState<DeletionStep>(DeletionStep.CONFIRMATION);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<any>(null);
  const [archivePdfUrl, setArchivePdfUrl] = useState('');

  const handleGetPreview = async () => {
    setIsLoading(true);
    setError('');
    try {
      const previewData = await customerDeletionService.getCustomerDeletionPreview(
        customer.id
      );
      setPreview(previewData);
      setStep(DeletionStep.PREVIEW);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async () => {
    setError('');

    // Validate password
    if (!password || password.length < 6) {
      setError('Please enter a valid password');
      return;
    }

    setIsLoading(true);

    try {
      // Verify password
      const isValid = await customerDeletionService.verifyOwnerPassword(ownerId, password);
      if (!isValid) {
        setError('Password is incorrect');
        setIsLoading(false);
        return;
      }

      // Get preview
      setStep(DeletionStep.PREVIEW);
      const previewData = await customerDeletionService.getCustomerDeletionPreview(
        customer.id
      );
      setPreview(previewData);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDeletion = async () => {
    setError('');
    setIsLoading(true);

    try {
      setStep(DeletionStep.ARCHIVING);

      // Execute complete deletion flow
      const result = await customerDeletionService.completeCustomerDeletion(
        {
          customerId: customer.id,
          ownerPassword: password,
          reason: reason || undefined,
        },
        ownerId,
        ownerName
      );

      // Set archive URL
      if (result.archivePdfUrl) {
        setArchivePdfUrl(result.archivePdfUrl);
      }

      setStep(DeletionStep.SUCCESS);
      toast.success('Customer deleted successfully');

      // Auto-close after 3 seconds
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 3000);
    } catch (err) {
      setError((err as Error).message);
      setIsLoading(false);
      setStep(DeletionStep.PASSWORD);
    }
  };

  const handleDownloadArchive = async () => {
    if (!archivePdfUrl) {
      setError('Archive PDF URL not available');
      return;
    }

    try {
      await customerDeletionService.downloadArchivePDF(
        archivePdfUrl,
        `customer-archive-${customer.id}.pdf`
      );
      toast.success('Archive PDF downloaded');
    } catch (err) {
      toast.error('Failed to download archive');
    }
  };

  return (
    <Modal
      title="Delete Customer"
      onClose={onClose}
      wide
      className="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Step: Confirmation */}
        {step === DeletionStep.CONFIRMATION && (
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">Permanent Deletion</p>
                <p className="text-sm text-red-800 mt-1">
                  This action will permanently delete all customer records, loans, payments,
                  collections, and fixed deposits. This cannot be undone.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Customer:</strong> {customer.full_name} ({customer.customer_code})
              </p>
              <p className="text-sm text-gray-600 mt-2">
                <strong>NIC:</strong> {customer.nic_number}
              </p>
            </div>

            <p className="text-sm text-gray-600">
              Before deletion, a complete PDF archive will be generated containing all customer
              information, documents, and transaction history.
            </p>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleGetPreview}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {isLoading ? 'Loading...' : 'View Details'}
              </button>
            </div>
          </div>
        )}

        {/* Step: Password */}
        {step === DeletionStep.PASSWORD && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Enter your password to confirm deletion. This is a security measure to prevent
              accidental deletion of customer records.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Owner Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pr-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Deletion (Optional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why are you deleting this customer?"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setStep(DeletionStep.CONFIRMATION);
                  setPassword('');
                  setError('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
              >
                Back
              </button>
              <button
                onClick={handlePasswordSubmit}
                disabled={isLoading || !password}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
              >
                {isLoading && <Loader className="w-4 h-4 animate-spin" />}
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step: Preview */}
        {step === DeletionStep.PREVIEW && preview && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              The following records will be permanently deleted:
            </p>

            <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-lg">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{preview.summary.loans}</p>
                <p className="text-xs text-gray-600">Loans</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{preview.summary.payments}</p>
                <p className="text-xs text-gray-600">Payments</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{preview.summary.collections}</p>
                <p className="text-xs text-gray-600">Collections</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{preview.summary.fixedDeposits}</p>
                <p className="text-xs text-gray-600">Fixed Deposits</p>
              </div>
              <div className="text-center col-span-2">
                <p className="text-2xl font-bold text-gray-900">{preview.totalRecordsToDelete}</p>
                <p className="text-xs text-gray-600">Total Records</p>
              </div>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-900">
                <strong>Archive Generated:</strong> A complete PDF archive will be generated and
                downloaded before deletion proceeds.
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setStep(DeletionStep.PASSWORD);
                  setError('');
                }}
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
              >
                Back
              </button>
              <button
                onClick={handleConfirmDeletion}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
              >
                {isLoading && <Loader className="w-4 h-4 animate-spin" />}
                Delete Permanently
              </button>
            </div>
          </div>
        )}

        {/* Step: Archiving */}
        {step === DeletionStep.ARCHIVING && (
          <div className="text-center space-y-4">
            <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
            <p className="font-medium text-gray-900">Processing Deletion...</p>
            <p className="text-sm text-gray-600">
              Generating archive PDF and removing all customer records. This may take a moment.
            </p>
          </div>
        )}

        {/* Step: Success */}
        {step === DeletionStep.SUCCESS && (
          <div className="space-y-4 text-center">
            <div className="text-green-600 text-5xl">✓</div>
            <div>
              <p className="font-medium text-gray-900">Customer Deleted Successfully</p>
              <p className="text-sm text-gray-600 mt-1">
                {customer.full_name} and all related records have been permanently removed.
              </p>
            </div>

            {archivePdfUrl && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-3">Archive PDF Available</p>
                <button
                  onClick={handleDownloadArchive}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Archive PDF
                </button>
              </div>
            )}

            <p className="text-xs text-gray-500 mt-4">Redirecting in 3 seconds...</p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default DeleteCustomerModal;
