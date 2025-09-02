import React from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectAuthModal,
  hideModal as hideAuthModal,
} from "../../Redux/slices/authSlice";
import {
  selectModal,
  hideModal as hideUIModal,
} from "../../Redux/slices/uiSlice";
import {
  FiX,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
  FiAlertTriangle,
} from "react-icons/fi";

const ReduxModal = () => {
  const dispatch = useDispatch();
  const authModal = useSelector(selectAuthModal);
  const uiModal = useSelector(selectModal);

  const activeModal = authModal.isOpen
    ? authModal
    : uiModal.isOpen
    ? uiModal
    : null;
  const isAuthModal = authModal.isOpen;

  if (!activeModal || !activeModal.isOpen) {
    return null;
  }

  const handleClose = () => {
    if (isAuthModal) {
      dispatch(hideAuthModal());
    } else {
      dispatch(hideUIModal());
    }

    if (activeModal.onClose) {
      activeModal.onClose();
    }
  };

  const handleConfirm = () => {
    if (activeModal.onConfirm) {
      activeModal.onConfirm();
    }
    handleClose();
  };

  const handleCancel = () => {
    if (activeModal.onCancel) {
      activeModal.onCancel();
    }
    handleClose();
  };

  const getIcon = () => {
    switch (activeModal.type) {
      case "success":
        return <FiCheckCircle className="w-6 h-6 text-green-500" />;
      case "error":
        return <FiAlertCircle className="w-6 h-6 text-red-500" />;
      case "warning":
        return <FiAlertTriangle className="w-6 h-6 text-yellow-500" />;
      default:
        return <FiInfo className="w-6 h-6 text-blue-500" />;
    }
  };

  const getHeaderColor = () => {
    switch (activeModal.type) {
      case "success":
        return "text-green-700 dark:text-green-300";
      case "error":
        return "text-red-700 dark:text-red-300";
      case "warning":
        return "text-yellow-700 dark:text-yellow-300";
      default:
        return "text-blue-700 dark:text-blue-300";
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-xl transition-all">
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getIcon()}
                <h3 className={`text-lg font-semibold ${getHeaderColor()}`}>
                  {activeModal.title}
                </h3>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="px-6 pb-6">
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
              {activeModal.message}
            </p>
          </div>

          <div className="px-6 pb-6">
            {activeModal.onConfirm || activeModal.onCancel ? (
              <div className="flex space-x-3 justify-end">
                {activeModal.onCancel && (
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                )}
                {activeModal.onConfirm && (
                  <button
                    onClick={handleConfirm}
                    className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${
                      activeModal.type === "error"
                        ? "bg-red-600 hover:bg-red-700"
                        : activeModal.type === "warning"
                        ? "bg-yellow-600 hover:bg-yellow-700"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    Confirm
                  </button>
                )}
              </div>
            ) : (
              <div className="flex justify-end">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                >
                  OK
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReduxModal;
