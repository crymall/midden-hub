import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";

const MiddenModal = ({ isOpen, onClose, title, children }) => {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/70" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="bg-dark border-accent w-full max-w-md border-2 border-dashed p-6 shadow-xl">
          {title && (
            <DialogTitle className="font-gothic mb-4 text-3xl text-white">
              {title}
            </DialogTitle>
          )}
          {children}
        </DialogPanel>
      </div>
    </Dialog>
  );
};

export default MiddenModal;