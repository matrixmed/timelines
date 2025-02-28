import React, { useState, useEffect } from 'react';
import { useTimeline } from './TimelineProvider';

export const DeleteConfirmationModal = ({ 
    isOpen, 
    onClose, 
    rowToDelete, 
    onConfirm 
}) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen]);

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (!isOpen || !rowToDelete) {
        return null;
    }

    const handleContentClick = (e) => {
        e.stopPropagation();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-dialog" onClick={handleContentClick}>
                <div className="modal-header">
                    <h3 className="modal-title">Confirm Deletion</h3>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <div className="modal-content">
                    <p>Are you sure you want to delete this row? This action cannot be undone.</p>
                    <div className="modal-info-box">
                        <div className="modal-info-row">
                            <div className="modal-info-label">Market:</div>
                            <div>{rowToDelete.market || '-'}</div>
                        </div>
                        <div className="modal-info-row">
                            <div className="modal-info-label">Due Date:</div>
                            <div>{formatDate(rowToDelete.dueDate)}</div>
                        </div>
                        <div className="modal-info-row">
                            <div className="modal-info-label">Task:</div>
                            <div>{rowToDelete.task || '-'}</div>
                        </div>
                    </div>
                </div>
                <div className="modal-footer">
                    <button 
                        className="modal-button cancel-button" 
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button 
                        className="modal-button delete-button" 
                        onClick={onConfirm}
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

export const TimelineModals = () => {
    const [modalState, setModalState] = useState({
        type: null,
        isOpen: false,
        data: null
    });

    const { deleteRow } = useTimeline();

    const handleModalClose = () => {
        setModalState({ type: null, isOpen: false, data: null });
    };

    const handleDeleteConfirm = async () => {
        if (modalState.data) {
            try {
                console.log("Attempting to delete row with ID:", modalState.data.id);
                
                handleModalClose();
                
                await deleteRow(modalState.data.id);
                
            } catch (error) {
                console.error("Delete operation failed:", error);
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
            <DeleteConfirmationModal
                isOpen={modalState.type === 'delete' && modalState.isOpen}
                onClose={handleModalClose}
                rowToDelete={modalState.data}
                onConfirm={handleDeleteConfirm}
            />
        )
    };
};

export default TimelineModals;