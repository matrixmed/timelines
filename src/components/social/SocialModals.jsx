import React, { useState, useEffect } from 'react';
import { useSocial } from './SocialProvider';

export const SocialDeleteConfirmationModal = ({
  isOpen, onClose, rowToDelete, onConfirm
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  if (!isOpen || !rowToDelete) return null;

  const handleContentClick = (e) => e.stopPropagation();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={handleContentClick}>
        <div className="modal-header">
          <h3 className="modal-title">Delete Social Post</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-content">
          <p>Are you sure you want to delete this social post? This action cannot be undone.</p>
          <div className="modal-info-box">
            <div className="modal-info-row">
              <div className="modal-info-label">Details:</div>
              <div>{rowToDelete.details || '-'}</div>
            </div>
            <div className="modal-info-row">
              <div className="modal-info-label">Brand:</div>
              <div>{rowToDelete.brand || '-'}</div>
            </div>
            <div className="modal-info-row">
              <div className="modal-info-label">Post Date:</div>
              <div>{rowToDelete.postDate || '-'}</div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="modal-button cancel-button" onClick={onClose}>Cancel</button>
          <button className="modal-button delete-button" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
};

export const SocialModals = () => {
  const [modalState, setModalState] = useState({
    type: null,
    isOpen: false,
    data: null
  });

  const { deleteRow } = useSocial();

  const handleModalClose = () => {
    setModalState({ type: null, isOpen: false, data: null });
  };

  const handleDeleteConfirm = async () => {
    if (modalState.data) {
      try {
        handleModalClose();
        await deleteRow(modalState.data.id);
      } catch (error) {
        console.error('Social delete failed:', error);
      }
    }
  };

  const openDeleteModal = (row) => {
    setModalState({
      type: 'delete',
      isOpen: true,
      data: row
    });
  };

  return {
    openDeleteModal,
    DeleteModal: () => (
      <SocialDeleteConfirmationModal
        isOpen={modalState.type === 'delete' && modalState.isOpen}
        onClose={handleModalClose}
        rowToDelete={modalState.data}
        onConfirm={handleDeleteConfirm}
      />
    )
  };
};

export default SocialModals;