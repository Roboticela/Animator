"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface LicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LicenseModal({ isOpen, onClose }: LicenseModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (typeof window === "undefined") return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] pointer-events-auto"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none"
          >
            <div 
              className="w-full max-w-3xl max-h-[90vh] bg-card border border-border rounded-xl overflow-hidden flex flex-col pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center justify-between p-4 sm:p-6 border-b border-border bg-gradient-to-r from-accent/10 via-accent/5 to-transparent"
              >
                <motion.h2
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                  className="text-xl sm:text-2xl font-bold text-foreground"
                >
                  GNU Affero General Public License v3.0
                </motion.h2>
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="p-2 rounded-lg border border-border bg-card/80 backdrop-blur-sm hover:bg-accent hover:border-primary/50 transition-all duration-200"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-foreground" />
                </motion.button>
              </motion.div>

              {/* Content */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 md:p-8"
                style={{ scrollbarGutter: 'stable' }}
              >
                <div className="prose prose-invert max-w-none">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="text-foreground/90 text-sm sm:text-base leading-relaxed space-y-4"
                  >
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">Preamble</h3>
                      <p className="mb-2">
                        The GNU Affero General Public License is a free, copyleft license for software and other kinds of works, specifically designed to ensure cooperation with the community in the case of network server software.
                      </p>
                      <p className="mb-2">
                        The licenses for most software and other practical works are designed to take away your freedom to share and change the works. By contrast, our General Public Licenses are intended to guarantee your freedom to share and change all versions of a program--to make sure it remains free software for all its users.
                      </p>
                      <p className="mb-2">
                        When we speak of free software, we are referring to freedom, not price. Our General Public Licenses are designed to make sure that you have the freedom to distribute copies of free software (and charge for them if you wish), that you receive source code or can get it if you want it, that you can change the software or use pieces of it in new free programs, and that you know you can do these things.
                      </p>
                      <p className="mb-2">
                        Developers that use our General Public Licenses protect your rights with two steps: (1) assert copyright on the software, and (2) offer you this License which gives you legal permission to copy, distribute and/or modify the software.
                      </p>
                      <p className="mb-2">
                        A secondary benefit of defending all users' freedom is that improvements made in alternate versions of the program, if they receive widespread use, become available for other developers to incorporate. Many developers of free software are heartened and encouraged by the resulting cooperation. However, in the case of software used on network servers, this result may not achieve the program's potential benefits to the free software community.
                      </p>
                      <p className="mb-2">
                        The GNU Affero General Public License is designed specifically to ensure that, in such cases, the modified source code becomes available to the community. It requires the operator of a network server to provide the source code of the modified version running there to the users of that server. Therefore, public use of a modified version, on a publicly accessible server, gives the public access to the source code of the modified version.
                      </p>
                    </div>

                    <div className="pt-4 border-t border-border/40">
                      <h3 className="text-lg font-semibold text-foreground mb-2">Terms and Conditions</h3>
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-base font-medium text-foreground mb-1">0. Definitions</h4>
                          <p className="text-sm">
                            "This License" refers to version 3 of the GNU Affero General Public License. "Copyright" also means copyright-like laws that apply to other kinds of works, such as semiconductor masks. "The Program" refers to any copyrightable work licensed under this License. Each licensee is addressed as "you". "Licensees" and "recipients" may be individuals or organizations.
                          </p>
                        </div>
                        <div>
                          <h4 className="text-base font-medium text-foreground mb-1">1. Source Code</h4>
                          <p className="text-sm">
                            The "source code" for a work means the preferred form of the work for making modifications to it. "Object code" means any non-source form of a work.
                          </p>
                        </div>
                        <div>
                          <h4 className="text-base font-medium text-foreground mb-1">2. Basic Permissions</h4>
                          <p className="text-sm">
                            All rights granted under this License are granted for the term of copyright on the Program, and are irrevocable provided the stated conditions are met. This License explicitly affirms your unlimited permission to run the unmodified Program. The output from running a covered work is covered by this License only if the output, given its content, constitutes a covered work.
                          </p>
                        </div>
                        <div>
                          <h4 className="text-base font-medium text-foreground mb-1">3. Protecting Users' Legal Rights From Anti-Circumvention Law</h4>
                          <p className="text-sm">
                            No covered work shall be deemed part of an effective technological measure under any applicable law fulfilling obligations under article 11 of the WIPO copyright treaty adopted on 20 December 1996, or similar laws prohibiting or restricting circumvention of such measures.
                          </p>
                        </div>
                        <div>
                          <h4 className="text-base font-medium text-foreground mb-1">4. Conveying Verbatim Copies</h4>
                          <p className="text-sm">
                            You may convey verbatim copies of the Program's source code as you receive it, in any medium, provided that you conspicuously and appropriately publish on each copy an appropriate copyright notice; keep intact all notices stating that this License and any non-permissive terms added in accord with section 7 apply to the code; keep intact all notices of the absence of any warranty; and give all recipients a copy of this License along with the Program.
                          </p>
                        </div>
                        <div>
                          <h4 className="text-base font-medium text-foreground mb-1">5. Conveying Modified Source Versions</h4>
                          <p className="text-sm">
                            You may convey a work based on the Program, or the modifications to produce it from the Program, in the form of source code under the terms of section 4, provided that you also meet all of these conditions: (a) The work must carry prominent notices stating that you modified it, and giving a relevant date. (b) The work must carry prominent notices stating that it is released under this License and any conditions added under section 7. (c) You must license the entire work, as a whole, under this License to anyone who comes into possession of a copy.
                          </p>
                        </div>
                        <div>
                          <h4 className="text-base font-medium text-foreground mb-1">6. Conveying Non-Source Forms</h4>
                          <p className="text-sm">
                            You may convey a covered work in object code form under the terms of sections 4 and 5, provided that you also convey the machine-readable Corresponding Source under the terms of this License, in one of these ways: (a) Convey the object code in, or embodied in, a physical product (including a physical distribution medium), accompanied by the Corresponding Source fixed on a durable physical medium customarily used for software interchange. (b) Convey the object code in, or embodied in, a physical product (including a physical distribution medium), accompanied by a written offer, valid for at least three years and valid for as long as you offer spare parts or customer support for that product model, to give anyone who possesses the object code either (1) a copy of the Corresponding Source for all the software in the product that is covered by this License, on a durable physical medium customarily used for software interchange, for a price no more than your reasonable cost of physically performing this conveying of source, or (2) access to copy the Corresponding Source from a network server at no charge.
                          </p>
                        </div>
                        <div>
                          <h4 className="text-base font-medium text-foreground mb-1">7. Additional Terms</h4>
                          <p className="text-sm">
                            "Additional permissions" are terms that supplement the terms of this License by making exceptions from one or more of its conditions. Additional permissions that are applicable to the entire Program shall be treated as though they were included in this License, to the extent that they are valid under applicable law. If additional permissions apply only to part of the Program, that part may be used separately under those permissions, but the entire Program remains governed by this License without regard to the additional permissions.
                          </p>
                        </div>
                        <div>
                          <h4 className="text-base font-medium text-foreground mb-1">8. Termination</h4>
                          <p className="text-sm">
                            You may not propagate or modify a covered work except as expressly provided under this License. Any attempt otherwise to propagate or modify it is void, and will automatically terminate your rights under this License (including any patent licenses granted under the third paragraph of section 11).
                          </p>
                        </div>
                        <div>
                          <h4 className="text-base font-medium text-foreground mb-1">9. Acceptance Not Required for Having Copies</h4>
                          <p className="text-sm">
                            You are not required to accept this License in order to receive or run a copy of the Program. Ancillary propagation of a covered work occurring solely as a consequence of using peer-to-peer transmission to receive a copy likewise does not require acceptance. However, nothing other than this License grants you permission to propagate or modify any covered work. These actions infringe copyright if you do not accept this License. Therefore, by modifying or propagating a covered work, you indicate your acceptance of this License to do so.
                          </p>
                        </div>
                        <div>
                          <h4 className="text-base font-medium text-foreground mb-1">10. Automatic Licensing of Downstream Recipients</h4>
                          <p className="text-sm">
                            Each time you convey a covered work, the recipient automatically receives a license from the original licensors, to run, modify and propagate that work, subject to this License. You are not responsible for enforcing compliance by third parties with this License.
                          </p>
                        </div>
                        <div>
                          <h4 className="text-base font-medium text-foreground mb-1">11. Patents</h4>
                          <p className="text-sm">
                            A "contributor" is a copyright holder who authorizes use under this License of the Program or a work on which the Program is based. The work thus licensed is called the contributor's "contributor version". A contributor's "essential patent claims" are all patent claims owned or controlled by the contributor, whether already acquired or hereafter acquired, that would be infringed by some manner, permitted by this License, of making, using, or selling its contributor version, but do not include claims that would be infringed only as a consequence of further modification of the contributor version.
                          </p>
                        </div>
                        <div>
                          <h4 className="text-base font-medium text-foreground mb-1">12. No Surrender of Others' Freedom</h4>
                          <p className="text-sm">
                            If conditions are imposed on you (whether by court order, agreement or otherwise) that contradict the conditions of this License, they do not excuse you from the conditions of this License. If you cannot convey a covered work so as to satisfy simultaneously your obligations under this License and any other pertinent obligations, then as a consequence you may not convey it at all.
                          </p>
                        </div>
                        <div>
                          <h4 className="text-base font-medium text-foreground mb-1">13. Use with the GNU Affero General Public License</h4>
                          <p className="text-sm">
                            Notwithstanding any other provision of this License, you have permission to link or combine any covered work with a work licensed under version 3 of the GNU Affero General Public License into a single combined work, and to convey the resulting work. The terms of this License will continue to apply to the part which is the covered work, but the work with which it is combined will remain governed by version 3 of the GNU Affero General Public License.
                          </p>
                        </div>
                        <div>
                          <h4 className="text-base font-medium text-foreground mb-1">14. Revised Versions of this License</h4>
                          <p className="text-sm">
                            The Free Software Foundation may publish revised and/or new versions of the GNU Affero General Public License from time to time. Such new versions will be similar in spirit to the present version, but may differ in detail to address new problems or concerns.
                          </p>
                        </div>
                        <div>
                          <h4 className="text-base font-medium text-foreground mb-1">15. Disclaimer of Warranty</h4>
                          <p className="text-sm">
                            THERE IS NO WARRANTY FOR THE PROGRAM, TO THE EXTENT PERMITTED BY APPLICABLE LAW. EXCEPT WHEN OTHERWISE STATED IN WRITING THE COPYRIGHT HOLDERS AND/OR OTHER PARTIES PROVIDE THE PROGRAM "AS IS" WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE. THE ENTIRE RISK AS TO THE QUALITY AND PERFORMANCE OF THE PROGRAM IS WITH YOU. SHOULD THE PROGRAM PROVE DEFECTIVE, YOU ASSUME THE COST OF ALL NECESSARY SERVICING, REPAIR OR CORRECTION.
                          </p>
                        </div>
                        <div>
                          <h4 className="text-base font-medium text-foreground mb-1">16. Limitation of Liability</h4>
                          <p className="text-sm">
                            IN NO EVENT UNLESS REQUIRED BY APPLICABLE LAW OR AGREED TO IN WRITING WILL ANY COPYRIGHT HOLDER, OR ANY OTHER PARTY WHO MODIFIES AND/OR CONVEYS THE PROGRAM AS PERMITTED ABOVE, BE LIABLE TO YOU FOR DAMAGES, INCLUDING ANY GENERAL, SPECIAL, INCIDENTAL OR CONSEQUENTIAL DAMAGES ARISING OUT OF THE USE OR INABILITY TO USE THE PROGRAM (INCLUDING BUT NOT LIMITED TO LOSS OF DATA OR DATA BEING RENDERED INACCURATE OR LOSSES SUSTAINED BY YOU OR THIRD PARTIES OR A FAILURE OF THE PROGRAM TO OPERATE WITH ANY OTHER PROGRAMS), EVEN IF SUCH HOLDER OR OTHER PARTY HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
                          </p>
                        </div>
                        <div>
                          <h4 className="text-base font-medium text-foreground mb-1">17. Interpretation of Sections 15 and 16</h4>
                          <p className="text-sm">
                            If the disclaimer of warranty and limitation of liability provided above cannot be given local legal effect according to their terms, reviewing courts shall apply local law that most closely approximates an absolute waiver of all civil liability in connection with the Program, unless a warranty or assumption of liability accompanies a copy of the Program in return for a fee.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border/40">
                      <p className="text-foreground/80 text-xs sm:text-sm">
                        END OF TERMS AND CONDITIONS
                      </p>
                      <p className="text-foreground/80 text-xs sm:text-sm mt-2">
                        For the full text of the GNU Affero General Public License v3.0, please visit:{" "}
                        <a 
                          href="https://www.gnu.org/licenses/agpl-3.0.html" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          https://www.gnu.org/licenses/agpl-3.0.html
                        </a>
                      </p>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}

