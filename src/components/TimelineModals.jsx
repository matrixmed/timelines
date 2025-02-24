import React from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "./ui/alert-dialog";
import { useTimeline } from './TimelineProvider'; // Changed this import

export const DeleteConfirmationModal = ({ 
    isOpen, 
    onClose, 
    rowToDelete, 
    onConfirm 
}) => {
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

    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent className="sm:max-w-[425px]">
                <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete this row? This action cannot be undone.
                        {rowToDelete && (
                            <div className="mt-4 p-3 bg-gray-50 rounded-md space-y-2">
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="font-medium">Market:</div>
                                    <div className="col-span-2">{rowToDelete.market || '-'}</div>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="font-medium">Due Date:</div>
                                    <div className="col-span-2">{formatDate(rowToDelete.dueDate)}</div>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="font-medium">Task:</div>
                                    <div className="col-span-2">{rowToDelete.task || '-'}</div>
                                </div>
                            </div>
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={onConfirm}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export const TimelineModals = () => {
    const [modalState, setModalState] = React.useState({
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
            await deleteRow(modalState.data.id);
            handleModalClose();
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
        modals: (
            <>
                <DeleteConfirmationModal
                    isOpen={modalState.type === 'delete' && modalState.isOpen}
                    onClose={handleModalClose}
                    rowToDelete={modalState.data}
                    onConfirm={handleDeleteConfirm}
                />
            </>
        )
    };
};

export default TimelineModals;