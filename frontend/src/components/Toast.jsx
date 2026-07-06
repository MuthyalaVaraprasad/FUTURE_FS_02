import React, { useEffect } from 'react';
import { CheckIcon, XIcon, InfoIcon } from './Icons';

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000); // Auto-dismiss after 4 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckIcon className="w-5 h-5 text-green" />;
      case 'error':
        return <XIcon className="w-5 h-5 text-red" />;
      case 'warning':
      default:
        return <InfoIcon className="w-5 h-5 text-blue" />;
    }
  };

  return (
    <div className={`toast-notification toast-${type} animate-slide-in-right`}>
      <div className="toast-icon-wrapper">
        {getIcon()}
      </div>
      <span className="toast-message">{message}</span>
      <button className="toast-dismiss-btn" onClick={onClose}>✕</button>
    </div>
  );
};

export default Toast;
