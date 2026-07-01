"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

interface DropdownMenuContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
}

interface DropdownMenuSubContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  itemRef: React.RefObject<HTMLDivElement | null>;
  subContentRef: React.RefObject<HTMLDivElement | null>;
  menuItemClickedRef?: React.MutableRefObject<boolean>;
}

const DropdownMenuContext = React.createContext<DropdownMenuContextType | undefined>(undefined);
const DropdownMenuSubContext = React.createContext<DropdownMenuSubContextType | undefined>(undefined);

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedElement = target as Element;
      
      // Check if clicking inside submenu content (submenus are rendered via portal)
      const isInSubmenu = clickedElement.closest?.('[data-submenu-content="true"]');
      if (isInSubmenu) {
        return; // Don't close parent menu if clicking in submenu
      }
      
      // Check if clicking on a menu item inside a submenu
      const menuItemInSubmenu = clickedElement.closest?.('[data-menu-item="true"]');
      if (menuItemInSubmenu) {
        // Check if this menu item is inside a submenu content
        const submenuContent = menuItemInSubmenu.closest?.('[data-submenu-content="true"]');
        if (submenuContent) {
          return; // Don't close parent menu if clicking on submenu item
        }
      }
      
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        contentRef.current &&
        !contentRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen, triggerRef, contentRef }}>
      <div className="relative overflow-visible" ref={containerRef}>{children}</div>
    </DropdownMenuContext.Provider>
  );
}

export function DropdownMenuTrigger({
  asChild,
  children,
  className,
}: {
  asChild?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const context = React.useContext(DropdownMenuContext);
  if (!context) throw new Error("DropdownMenuTrigger must be used within DropdownMenu");

  const { open, setOpen, triggerRef } = context;

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      ref: triggerRef,
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        setOpen(!open);
        const originalOnClick = (children as React.ReactElement<any>).props.onClick;
        if (originalOnClick) {
          originalOnClick(e);
        }
      },
    });
  }

  return (
    <button
      ref={triggerRef as React.Ref<HTMLButtonElement>}
      className={cn(className)}
      onClick={() => setOpen(!open)}
      type="button"
    >
      {children}
    </button>
  );
}

export function DropdownMenuContent({
  align = "start",
  children,
  className,
}: {
  align?: "start" | "end";
  children: React.ReactNode;
  className?: string;
}) {
  const context = React.useContext(DropdownMenuContext);
  if (!context) throw new Error("DropdownMenuContent must be used within DropdownMenu");

  const { open, triggerRef, contentRef } = context;
  const [position, setPosition] = React.useState({ top: 0, left: 0 });

  React.useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 8,
        left: align === "end" ? rect.right + window.scrollX : rect.left + window.scrollX,
      });
    }
  }, [open, align, triggerRef]);

  if (!open) return null;

  const content = (
    <div
      ref={contentRef}
      className={cn(
        "fixed z-[9999] min-w-[8rem] overflow-hidden rounded-md border border-border bg-background p-1",
        className
      )}
      style={{
        top: `${position.top}px`,
        left: align === "end" ? undefined : `${position.left}px`,
        right: align === "end" ? `${window.innerWidth - position.left}px` : undefined,
      }}
    >
      {children}
    </div>
  );

  if (typeof window !== "undefined") {
    return createPortal(content, document.body);
  }

  return content;
}

export function DropdownMenuItem({
  children,
  className,
  onClick,
  hasSubmenu: hasSubmenuProp,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hasSubmenu?: boolean;
}) {
  const context = React.useContext(DropdownMenuContext);
  if (!context) throw new Error("DropdownMenuItem must be used within DropdownMenu");

  const { setOpen } = context;
  const subContext = React.useContext(DropdownMenuSubContext);
  const itemRef = React.useRef<HTMLDivElement>(null);
  const [submenuOpen, setSubmenuOpen] = React.useState(false);
  const closeTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  
  // Check if children contain DropdownMenuSub - use a more reliable method
  const childrenArray = React.Children.toArray(children);
  
  // Check if children contain DropdownMenuSub - search recursively
  let subMenuChild: React.ReactElement | null = null;
  let hasSubmenuFromChildren = false;
  
  const searchForSubmenu = (nodes: React.ReactNode[]): React.ReactElement | null => {
    for (const node of nodes) {
      if (!React.isValidElement(node)) continue;
      
      const nodeType = node.type;
      
      // Direct comparison
      if (nodeType === DropdownMenuSub) {
        return node as React.ReactElement;
      }
      
      // Check by function name
      if (typeof nodeType === 'function') {
        const funcName = (nodeType as any).name;
        const displayName = (nodeType as any).displayName;
        if (funcName === 'DropdownMenuSub' || displayName === 'DropdownMenuSub') {
          return node as React.ReactElement;
        }
      }
      
      // Check by string representation (fallback)
      const typeStr = String(nodeType);
      if (typeStr.includes('DropdownMenuSub') && !typeStr.includes('Content')) {
        return node as React.ReactElement;
      }
      
      // Recursively check children
      const props = node.props as any;
      if (props?.children) {
        const childNodes = React.Children.toArray(props.children);
        const found = searchForSubmenu(childNodes);
        if (found) {
          // If we found it in children, but this node might be the wrapper
          if (nodeType === DropdownMenuSub || 
              (typeof nodeType === 'function' && ((nodeType as any).name === 'DropdownMenuSub' || (nodeType as any).displayName === 'DropdownMenuSub'))) {
            return node as React.ReactElement;
          }
          return found;
        }
      }
    }
    return null;
  };
  
  subMenuChild = searchForSubmenu(childrenArray);
  hasSubmenuFromChildren = subMenuChild !== null;
  
  // If we didn't find DropdownMenuSub but want to be more lenient, check for DropdownMenuSubContent
  if (!hasSubmenuFromChildren) {
    const checkForContent = (nodes: React.ReactNode[]): boolean => {
      for (const node of nodes) {
        if (!React.isValidElement(node)) continue;
        const nodeType = node.type;
        if (nodeType === DropdownMenuSubContent) return true;
        if (typeof nodeType === 'function') {
          const name = (nodeType as any).name || (nodeType as any).displayName;
          if (name === 'DropdownMenuSubContent') return true;
        }
        const props = node.props as any;
        if (props?.children && checkForContent(React.Children.toArray(props.children))) {
          return true;
        }
      }
      return false;
    };
    hasSubmenuFromChildren = checkForContent(childrenArray);
  }
  
  // Use explicit prop if provided, otherwise try to detect
  const hasSubmenu = hasSubmenuProp !== undefined ? hasSubmenuProp : hasSubmenuFromChildren;
  
  // Force hasSubmenu to be true if prop is explicitly set
  const finalHasSubmenu = hasSubmenuProp === true ? true : (hasSubmenuProp === false ? false : hasSubmenu);
  
  // If hasSubmenu is true but we didn't find subMenuChild, search one more time
  // This handles cases where hasSubmenu is explicitly set to true
  if (hasSubmenu && !subMenuChild) {
    // Search in all children, including nested ones
    const deepSearch = (nodes: React.ReactNode[]): React.ReactElement | null => {
      for (const node of nodes) {
        if (!React.isValidElement(node)) continue;
        const nodeType = node.type;
        
        // Check if this is DropdownMenuSub
        if (nodeType === DropdownMenuSub) return node as React.ReactElement;
        
        // Check by any means possible
        if (typeof nodeType === 'function') {
          const name = (nodeType as any).name || (nodeType as any).displayName || String(nodeType);
          if (name.includes('DropdownMenuSub') && !name.includes('Content')) {
            return node as React.ReactElement;
          }
        }
        
        // Check children
        const props = node.props as any;
        if (props?.children) {
          const found = deepSearch(React.Children.toArray(props.children));
          if (found) {
            // If we found it in children, check if this node itself is DropdownMenuSub
            if (nodeType === DropdownMenuSub || 
                (typeof nodeType === 'function' && 
                 ((nodeType as any).name === 'DropdownMenuSub' || (nodeType as any).displayName === 'DropdownMenuSub'))) {
              return node as React.ReactElement;
            }
            return found;
          }
        }
      }
      return null;
    };
    
    subMenuChild = deepSearch(childrenArray);
  }

  const handleClick = (e: React.MouseEvent) => {
    if (finalHasSubmenu) {
      e.stopPropagation();
      setSubmenuOpen(!submenuOpen);
    } else {
      // Stop propagation to prevent click outside handlers
      e.stopPropagation();
      
      // If we're inside a submenu, mark that a menu item was clicked
      if (subContext?.menuItemClickedRef) {
        subContext.menuItemClickedRef.current = true;
      }
      
      // Call onClick immediately
      if (onClick) {
        onClick();
      }
      
      // Close menus after onClick completes
      setTimeout(() => {
        if (subContext) {
          subContext.setOpen(false);
          // Reset flag after closing
          if (subContext.menuItemClickedRef) {
            subContext.menuItemClickedRef.current = false;
          }
        }
        setOpen(false);
      }, 50);
    }
  };

  const handleMouseEnter = () => {
    if (finalHasSubmenu) {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
      setSubmenuOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (finalHasSubmenu) {
      closeTimeoutRef.current = setTimeout(() => {
        setSubmenuOpen(false);
      }, 150);
    }
  };

  React.useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  // Separate regular children from DropdownMenuSub
  const regularChildren = childrenArray.filter((child) => {
    if (!React.isValidElement(child)) return true;
    if (child === subMenuChild) return false;
    
    // Also check if this child contains the submenu
    const props = child.props as any;
    if (props && props.children) {
      const childNodes = React.Children.toArray(props.children);
      return searchForSubmenu(childNodes) === null;
    }
    return true;
  });

  return (
    <>
      <div
        ref={itemRef}
        data-menu-item="true"
        className={cn(
          "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent focus:bg-accent",
          className
        )}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {regularChildren}
        {finalHasSubmenu ? (
          <ChevronRight className="ml-auto h-4 w-4 flex-shrink-0" />
        ) : null}
      </div>
      {finalHasSubmenu && React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return null;
        
        // Check if this child is DropdownMenuSub or contains it
        const childType = child.type;
        let isSubmenu = false;
        
        if (childType === DropdownMenuSub) {
          isSubmenu = true;
        } else if (typeof childType === 'function') {
          const name = (childType as any).name || (childType as any).displayName || String(childType);
          if (name.includes('DropdownMenuSub') && !name.includes('Content')) {
            isSubmenu = true;
          }
        }
        
        // Also check if it contains DropdownMenuSub in its children
        if (!isSubmenu) {
          const props = child.props as any;
          if (props?.children) {
            const hasSubmenuChild = React.Children.toArray(props.children).some((c) => {
              if (!React.isValidElement(c)) return false;
              const ct = c.type;
              if (ct === DropdownMenuSub) return true;
              if (typeof ct === 'function') {
                const n = (ct as any).name || (ct as any).displayName || String(ct);
                return n.includes('DropdownMenuSub') && !n.includes('Content');
              }
              return false;
            });
            if (hasSubmenuChild) {
              // This child contains DropdownMenuSub, so clone it and pass props
              const childProps = child.props as any;
              return React.cloneElement(child as React.ReactElement<any>, {
                ...childProps,
                children: React.Children.map(childProps.children, (subChild) => {
                  if (!React.isValidElement(subChild)) return subChild;
                  const subType = subChild.type;
                  if (subType === DropdownMenuSub || 
                      (typeof subType === 'function' && 
                       ((subType as any).name === 'DropdownMenuSub' || (subType as any).displayName === 'DropdownMenuSub'))) {
                    return React.cloneElement(subChild as React.ReactElement<any>, {
                      ...(subChild.props as any),
                      itemRef,
                      open: submenuOpen,
                      setOpen: setSubmenuOpen,
                      onMouseEnter: () => {
                        if (closeTimeoutRef.current) {
                          clearTimeout(closeTimeoutRef.current);
                          closeTimeoutRef.current = null;
                        }
                      },
                      onMouseLeave: () => {
                        setSubmenuOpen(false);
                      },
                    });
                  }
                  return subChild;
                }),
              });
            }
          }
        }
        
        if (isSubmenu) {
          return React.cloneElement(child as React.ReactElement<any>, {
            ...(child.props as any),
            itemRef,
            open: submenuOpen,
            setOpen: setSubmenuOpen,
            onMouseEnter: () => {
              if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
                closeTimeoutRef.current = null;
              }
            },
            onMouseLeave: () => {
              setSubmenuOpen(false);
            },
          });
        }
        
        return null;
      })}
    </>
  );
}

export function DropdownMenuSub({
  children,
  itemRef: itemRefProp,
  open: openProp,
  setOpen: setOpenProp,
  onMouseEnter: onMouseEnterProp,
  onMouseLeave: onMouseLeaveProp,
}: {
  children: React.ReactNode;
  itemRef?: React.RefObject<HTMLDivElement | null>;
  open?: boolean;
  setOpen?: (open: boolean) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const itemRef = itemRefProp ?? React.useRef<HTMLDivElement>(null);
  const subContentRef = React.useRef<HTMLDivElement>(null);
  const menuItemClickedRef = React.useRef(false);
  const parentContext = React.useContext(DropdownMenuContext);
  if (!parentContext) throw new Error("DropdownMenuSub must be used within DropdownMenu");

  const open = openProp ?? internalOpen;
  const setOpen = setOpenProp ?? setInternalOpen;

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedElement = target as Element;
      
      // CRITICAL: Check if clicking on a menu item inside the submenu FIRST
      // This must be checked before any other logic to prevent closing before onClick runs
      const menuItemElement = clickedElement.closest?.('[data-menu-item="true"]');
      if (menuItemElement && subContentRef.current && subContentRef.current.contains(menuItemElement)) {
        // Don't close - let the onClick handler on the menu item run first
        // The menu item's onClick will handle closing after its handler completes
        return;
      }
      
      // If a menu item was clicked (flag set), don't close
      if (menuItemClickedRef.current) {
        menuItemClickedRef.current = false; // Reset flag
        return;
      }
      
      // Check if clicking inside submenu content (by data attribute or ref)
      if (clickedElement.closest && clickedElement.closest('[data-submenu-content="true"]')) {
        return; // Click is inside submenu, don't close
      }
      
      // CRITICAL: Don't close if clicking inside submenu content - check this first
      if (subContentRef.current && subContentRef.current.contains(target)) {
        // Click is inside submenu, let the onClick handler run
        return;
      }
      
      // Don't close if clicking on the parent item
      if (itemRef.current && itemRef.current.contains(target)) {
        return;
      }
      
      // Don't close if clicking in parent menu
      if (parentContext.contentRef.current && parentContext.contentRef.current.contains(target)) {
        return;
      }
      
      // Only close if click is truly outside
      setOpen(false);
    };

    if (open) {
      // Add listener immediately but check for menu items first
      // Using capture phase to catch events early, but we check for menu items first
      document.addEventListener("click", handleClickOutside, true);
      
      return () => {
        document.removeEventListener("click", handleClickOutside, true);
      };
    }
  }, [open, setOpen, itemRef, subContentRef, parentContext, menuItemClickedRef]);

  return (
    <DropdownMenuSubContext.Provider value={{ open, setOpen, itemRef, subContentRef, menuItemClickedRef }}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === DropdownMenuSubContent) {
          return React.cloneElement(child as React.ReactElement<any>, {
            itemRef,
            subContentRef,
            open,
            onMouseEnter: onMouseEnterProp,
            onMouseLeave: onMouseLeaveProp,
            menuItemClickedRef,
          });
        }
        return null;
      })}
    </DropdownMenuSubContext.Provider>
  );
}

// Set displayName immediately after function definition
if (typeof DropdownMenuSub !== 'undefined') {
  DropdownMenuSub.displayName = "DropdownMenuSub";
}

export function DropdownMenuSubContent({
  children,
  className,
  itemRef,
  subContentRef,
  open,
  onMouseEnter: onMouseEnterProp,
  onMouseLeave: onMouseLeaveProp,
}: {
  children: React.ReactNode;
  className?: string;
  itemRef?: React.RefObject<HTMLDivElement | null>;
  subContentRef?: React.RefObject<HTMLDivElement | null>;
  open?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  menuItemClickedRef?: React.MutableRefObject<boolean>;
}) {
  const context = React.useContext(DropdownMenuSubContext);
  const parentContext = React.useContext(DropdownMenuContext);
  if (!parentContext) throw new Error("DropdownMenuSubContent must be used within DropdownMenu");

  const isOpen = open ?? context?.open ?? false;
  const itemElement = itemRef?.current ?? context?.itemRef.current;
  const contentElement = (subContentRef ?? context?.subContentRef) as React.RefObject<HTMLDivElement | null>;
  const [position, setPosition] = React.useState({ top: 0, left: 0 });

  React.useEffect(() => {
    if (isOpen && itemElement) {
      const updatePosition = () => {
        const rect = itemElement!.getBoundingClientRect();
        let submenuWidth = 192; // Default to 192px (w-48)
        
        // Try to get actual width if content is rendered
        if (contentElement?.current) {
          submenuWidth = contentElement.current.offsetWidth;
        }
        
        setPosition({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX - submenuWidth - 8, // Position to the left with 8px gap
        });
      };
      
      // Initial position
      updatePosition();
      
      // Update position after a short delay to get accurate width
      const timeoutId = setTimeout(updatePosition, 0);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, itemElement, contentElement]);

  if (!isOpen) {
    return null;
  }

  const content = (
    <div
      ref={contentElement}
      data-submenu-content="true"
      className={cn(
        "fixed z-[10000] min-w-[8rem] overflow-hidden rounded-md border border-border bg-background p-1",
        className
      )}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      onMouseEnter={onMouseEnterProp}
      onMouseLeave={onMouseLeaveProp}
      onClick={(e) => {
        // Stop propagation to prevent click-outside from firing
        e.stopPropagation();
      }}
    >
      {children}
    </div>
  );

  if (typeof window !== "undefined") {
    return createPortal(content, document.body);
  }

  return content;
}

