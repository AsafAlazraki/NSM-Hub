
"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { VariantProps, cva } from "class-variance-authority"
import { PanelLeft, LayoutDashboard, Users, BookOpenCheck, Trash2, User, LogOut, Settings, ChevronDown, FileText, Package, Ship, ClipboardCheck, Home, Activity, CalendarPlus, ShoppingCart, DollarSign, Wrench } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, } from "@/components/ui/tooltip"
import Link from "next/link"
import { Logo } from "@/components/Logo"
import type { UserProfile } from "@/lib/types"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

type SidebarContext = {
  open: boolean
  setOpen: (open: boolean) => void
  logo?: string | null;
  onSignOut?: () => void;
  onProfileClick?: () => void;
  onBinClick?: () => void;
  currentUserProfile?: UserProfile | null;
}

const SidebarContext = React.createContext<SidebarContext | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }
  return context
}

interface SidebarProviderProps extends React.ComponentProps<"div"> {
    open?: boolean
    onOpenChange?: (open: boolean) => void
    logo?: string | null;
    onSignOut?: () => void;
    onProfileClick?: () => void;
    onBinClick?: () => void;
    currentUserProfile?: UserProfile | null;
}


const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  SidebarProviderProps
>(
  (
    {
      open: openProp,
      onOpenChange: setOpenProp,
      className,
      children,
      logo,
      onSignOut,
      onProfileClick,
      onBinClick,
      currentUserProfile,
      ...props
    },
    ref
  ) => {
    const [_open, _setOpen] = React.useState(false)
    const open = openProp ?? _open
    const setOpen = setOpenProp ?? _setOpen

    const contextValue = React.useMemo<SidebarContext>(
      () => ({
        open,
        setOpen,
        logo,
        onSignOut,
        onProfileClick,
        onBinClick,
        currentUserProfile
      }),
      [open, setOpen, logo, onSignOut, onProfileClick, onBinClick, currentUserProfile]
    )

    return (
      <SidebarContext.Provider value={contextValue}>
        <TooltipProvider delayDuration={0}>
          <div
            className={cn("group/sidebar-wrapper", className)}
            ref={ref}
            {...props}
          >
            {children}
          </div>
        </TooltipProvider>
      </SidebarContext.Provider>
    )
  }
)
SidebarProvider.displayName = "SidebarProvider"


const SidebarTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>((props, ref) => {
  return (
    <Button
        ref={ref}
        data-sidebar="trigger"
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        {...props}
        >
        <PanelLeft />
        <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
});
SidebarTrigger.displayName = "SidebarTrigger";


const Sidebar = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>((props, ref) => {
  const { open, setOpen, logo, onSignOut, onProfileClick, onBinClick } = useSidebar()

  const handleLinkClick = (cb?: () => void) => {
    setOpen(false);
    cb?.();
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
            <SidebarTrigger />
        </SheetTrigger>
        <SheetContent
            className="w-full max-w-xs border-r bg-card p-0 text-card-foreground"
            side="left"
        >
            <SheetHeader className='p-4 pb-0'>
                <SheetTitle className="sr-only">Main Menu</SheetTitle>
                <div className="flex flex-col gap-2 items-center mb-4">
                    <Logo logo={logo} className="w-full"/>
                </div>
            </SheetHeader>
            <div className="flex h-full w-full flex-col">
                <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto mt-4">
                    <ul className="flex w-full min-w-0 flex-col gap-1 px-2">
                         <li className="group/menu-item relative">
                            <Link href="/" onClick={() => handleLinkClick()} className="peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 pl-4 text-left text-sm outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground">
                                <Home />
                                <span>Home</span>
                            </Link>
                        </li>

                        <li className="group/menu-item relative">
                            <Link href="/sales-hub" onClick={() => handleLinkClick()} className="peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 pl-4 text-left text-sm outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground">
                                <DollarSign />
                                <span>Sales Hub</span>
                            </Link>
                        </li>
                        
                        <li className="group/menu-item relative">
                            <Link href="/service-hub/estimates" onClick={() => handleLinkClick()} className="peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 pl-4 text-left text-sm outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground">
                                <Wrench />
                                <span>Service Hub</span>
                            </Link>
                        </li>

                        <Collapsible className="group/menu-item relative">
                             <CollapsibleTrigger className="peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 pl-4 text-left text-sm outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground">
                                <BookOpenCheck />
                                <span>Data Modules</span>
                                <ChevronDown className="ml-auto h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <ul className="flex w-full min-w-0 flex-col gap-1 py-1 pl-6">
                                    <li className="group/menu-item relative">
                                        <Link href="/catalogue" onClick={() => handleLinkClick()} className="peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 pl-4 text-left text-sm outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground">
                                            <BookOpenCheck />
                                            <span>Data Modules Hub</span>
                                        </Link>
                                    </li>
                                     <li className="group/menu-item relative">
                                        <Link href="/catalogue/kits" onClick={() => handleLinkClick()} className="peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 pl-4 text-left text-sm outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground">
                                            <Package />
                                            <span>Kits</span>
                                        </Link>
                                    </li>
                                </ul>
                            </CollapsibleContent>
                        </Collapsible>
                        
                         {onBinClick && (
                            <li className="group/menu-item relative">
                                <button onClick={() => handleLinkClick(onBinClick)} className="peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 pl-4 text-left text-sm outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground">
                                    <Trash2 />
                                    <span>Archive</span>
                                </button>
                            </li>
                         )}
                    </ul>
                </div>
                <div className="mt-auto flex flex-col gap-2 p-2">
                    <ul className="flex w-full min-w-0 flex-col gap-1 px-2">
                        <li className="group/menu-item relative">
                             <button onClick={() => handleLinkClick(onProfileClick)} className="peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 pl-4 text-left text-sm outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground">
                                <User />
                                <span>My Profile</span>
                            </button>
                        </li>
                        <li className="group/menu-item relative">
                            <button onClick={() => handleLinkClick(onSignOut)} className="peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 pl-4 text-left text-sm outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground">
                                <LogOut />
                                <span>Sign Out</span>
                            </button>
                        </li>
                    </ul>
                </div>
            </div>
        </SheetContent>
    </Sheet>
  )
})
Sidebar.displayName = "Sidebar"

export {
  Sidebar,
  SidebarProvider,
  useSidebar,
}

    