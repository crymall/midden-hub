import { useEffect, useEffectEvent, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button, Dialog, DialogPanel } from "@headlessui/react";

import Can from "../../core/gateways/Can";

const MobileBurgerMenu = ({ navLinks, titleLink = "/" }) => {
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
        className="hover:text-lightestGrey text-shadow-hard-grey font-icons icon text-2xl font-bold text-white transition-colors"
        aria-label="Navigation menu"
      >
        {"["}
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
            <Link
              to={titleLink}
              onClick={() => setMobileMenuOpen(false)}
              className="font-gothic text-4xl text-white hover:text-lightestGrey transition-colors"
            >
              Home
            </Link>
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
