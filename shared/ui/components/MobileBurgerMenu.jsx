import { useState, useEffect, useEffectEvent } from "react";
import { Button, Dialog, DialogPanel } from "@headlessui/react";
import { Link, useLocation } from "react-router-dom";
import Can from "./gateways/Can";

const MobileBurgerMenu = ({ navLinks }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const setMenuClosedEvent = useEffectEvent(() => {
    setMobileMenuOpen(false);
  });

  useEffect(() => {
    setMenuClosedEvent();
  }, [location]);

  return (
    <>
      <Button
        onClick={() => setMobileMenuOpen(true)}
        className="hover:text-lightestGrey text-shadow-hard-grey font-mono text-2xl font-bold text-white transition-colors"
      >
        ≡
      </Button>
      <Dialog
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        className="relative z-50"
      >
        <DialogPanel className="fixed inset-0 flex flex-col items-center justify-center bg-black p-4">
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="absolute top-4 right-4 font-gothic text-4xl text-white hover:text-lightestGrey"
          >
            X
          </button>
          <div className="flex flex-col items-center gap-8">
            {navLinks.map((link) =>
              link.requiredPermission ? (
                <Can key={link.to} perform={link.requiredPermission}>
                  <Link
                    to={link.to}
                    aria-label={link.ariaLabel}
                    className="font-gothic text-4xl text-white hover:text-lightestGrey transition-colors"
                  >
                    {link.label}
                  </Link>
                </Can>
              ) : (
                <Link
                  key={link.to}
                  to={link.to}
                  aria-label={link.ariaLabel}
                  className="font-gothic text-4xl text-white hover:text-lightestGrey transition-colors"
                >
                  {link.label}
                </Link>
              ),
            )}
          </div>
        </DialogPanel>
      </Dialog>
    </>
  );
};

export default MobileBurgerMenu;