# UI Component Audit

| File | Astryx? | Shadcn? | Shadcn Components to Migrate |
|---|---|---|---|
| app\(dashboard)\achievements\page.tsx | ✅ | ❌ | None |
| app\(dashboard)\admin\certificates\create\cert-builder-client.tsx | ✅ | ❌ | None |
| app\(dashboard)\admin\certificates\page.tsx | ✅ | ❌ | None |
| app\(dashboard)\admin\forms\components\form-builder-client.tsx | ✅ | ❌ | None |
| app\(dashboard)\admin\inventory\page.tsx | ✅ | ❌ | None |
| app\(dashboard)\admin\projects\components\project-approval-list.tsx | ✅ | ❌ | None |
| app\(dashboard)\applications\components\applications-board.tsx | ✅ | ❌ | None |
| app\(dashboard)\archive\page.tsx | ❌ | ⚠️ | Card, CardContent, CardHeader, CardTitle, Badge |
| app\(dashboard)\certificates\page.tsx | ✅ | ❌ | None |
| app\(dashboard)\communications\page.tsx | ✅ | ❌ | None |
| app\(dashboard)\dashboard\components\admin-charts.tsx | ✅ | ❌ | None |
| app\(dashboard)\dashboard\components\admin-dashboard.tsx | ✅ | ❌ | None |
| app\(dashboard)\dashboard\components\dashboard-skeleton.tsx | ✅ | ⚠️ | Skeleton |
| app\(dashboard)\dashboard\components\lead-dashboard.tsx | ✅ | ❌ | None |
| app\(dashboard)\dashboard\components\student-dashboard.tsx | ✅ | ❌ | None |
| app\(dashboard)\dashboard\page.tsx | ✅ | ❌ | None |
| app\(dashboard)\events\[slug]\manage\components\event-certificates-tab.tsx | ✅ | ❌ | None |
| app\(dashboard)\events\[slug]\manage\components\event-communications-tab.tsx | ✅ | ⚠️ | Input, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue |
| app\(dashboard)\events\[slug]\manage\components\event-manage-tabs-nav.tsx | ✅ | ❌ | None |
| app\(dashboard)\events\[slug]\manage\components\event-overview-tab.tsx | ✅ | ❌ | None |
| app\(dashboard)\events\[slug]\manage\components\event-registrations-client.tsx | ✅ | ❌ | None |
| app\(dashboard)\events\[slug]\manage\components\event-registrations-tab.tsx | ✅ | ❌ | None |
| app\(dashboard)\events\[slug]\manage\components\event-scanner-tab.tsx | ✅ | ❌ | None |
| app\(dashboard)\events\[slug]\manage\page.tsx | ✅ | ❌ | None |
| app\(dashboard)\events\[slug]\not-found.tsx | ❌ | ⚠️ | Button |
| app\(dashboard)\events\[slug]\page.tsx | ✅ | ❌ | None |
| app\(dashboard)\events\create\create-event-wizard.tsx | ✅ | ❌ | None |
| app\(dashboard)\events\page.tsx | ✅ | ⚠️ | Skeleton |
| app\(dashboard)\finance\budget\page.tsx | ✅ | ❌ | None |
| app\(dashboard)\finance\expenses\components\add-expense-dialog.tsx | ❌ | ⚠️ | Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, , Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue |
| app\(dashboard)\finance\expenses\page.tsx | ✅ | ❌ | None |
| app\(dashboard)\finance\procurement\page.tsx | ✅ | ❌ | None |
| app\(dashboard)\internal-projects\projects-client.tsx | ✅ | ⚠️ | AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, Button |
| app\(dashboard)\inventory\components\add-inventory-dialog.tsx | ❌ | ⚠️ | Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, , Input, Label |
| app\(dashboard)\inventory\components\inventory-action-dialog.tsx | ❌ | ⚠️ | Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, , Input, Label |
| app\(dashboard)\inventory\page.tsx | ✅ | ❌ | None |
| app\(dashboard)\layout.tsx | ✅ | ❌ | None |
| app\(dashboard)\lead\achievements\page.tsx | ✅ | ❌ | None |
| app\(dashboard)\lead\certificates\page.tsx | ❌ | ⚠️ | Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter, buttonVariants |
| app\(dashboard)\lead\certificates\templates\[id]\edit\page.tsx | ❌ | ⚠️ | Card, CardContent, CardDescription, CardHeader, CardTitle |
| app\(dashboard)\lead\content\page.tsx | ❌ | ⚠️ | Card, CardContent, CardHeader, CardTitle, CardDescription, Badge |
| app\(dashboard)\leaderboard\page.tsx | ✅ | ❌ | None |
| app\(dashboard)\manage\approvals\approval-actions.tsx | ❌ | ⚠️ | Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, Textarea |
| app\(dashboard)\manage\approvals\page.tsx | ❌ | ⚠️ | Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Button, Tabs, TabsContent, TabsList, TabsTrigger, Badge |
| app\(dashboard)\manage\events\[id]\page.tsx | ❌ | ⚠️ | Button, Card, CardContent, CardHeader, CardTitle, CardDescription |
| app\(dashboard)\manage\forms\[id]\edit\page.tsx | ❌ | ⚠️ | Button, Input, Card, CardContent, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch, Label |
| app\(dashboard)\manage\forms\page.tsx | ❌ | ⚠️ | Button, Card, CardHeader, CardTitle, CardContent |
| app\(dashboard)\manage\projects\components\project-approval-list.tsx | ✅ | ❌ | None |
| app\(dashboard)\manage\recruitment\page.tsx | ❌ | ⚠️ | Card, CardHeader, CardTitle, CardContent, Button, Badge |
| app\(dashboard)\manage\settings\page.tsx | ✅ | ❌ | None |
| app\(dashboard)\not-found.tsx | ❌ | ⚠️ | Button |
| app\(dashboard)\notifications\page.tsx | ✅ | ❌ | None |
| app\(dashboard)\passes\[eventId]\page.tsx | ❌ | ⚠️ | Card, CardContent, CardHeader, CardTitle, CardDescription |
| app\(dashboard)\recruitment\interviews\components\schedule-interview-dialog.tsx | ✅ | ⚠️ | Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger |
| app\(dashboard)\recruitment\interviews\page.tsx | ✅ | ❌ | None |
| app\(dashboard)\settings\compliance\page.tsx | ✅ | ❌ | None |
| app\(dashboard)\settings\page.tsx | ✅ | ❌ | None |
| app\error.tsx | ❌ | ⚠️ | Alert, AlertDescription, AlertTitle, Button |
| app\global-error.tsx | ❌ | ⚠️ | Alert, AlertDescription, AlertTitle, Button |
| components\achievements\review-actions.tsx | ✅ | ❌ | None |
| components\achievements\submit-achievement-dialog.tsx | ✅ | ⚠️ | Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger |
| components\admin\member-table.tsx | ✅ | ❌ | None |
| components\app\activity-timeline.tsx | ❌ | ⚠️ | Avatar, AvatarFallback, AvatarImage, Badge, Card |
| components\app\breadcrumbs.tsx | ✅ | ❌ | None |
| components\app\command-menu.tsx | ❌ | ⚠️ | CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut, , Button |
| components\app\data-table\data-table-column-header.tsx | ❌ | ⚠️ | Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,  |
| components\app\data-table\data-table-pagination.tsx | ❌ | ⚠️ | Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,  |
| components\app\data-table\data-table-toolbar.tsx | ❌ | ⚠️ | Button, Input, DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,  |
| components\app\resource-action-menu.tsx | ❌ | ⚠️ | DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, , Button |
| components\app\responsive-form-surface.tsx | ❌ | ⚠️ | Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, , Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle,  |
| components\app\status-badge.tsx | ❌ | ⚠️ | Badge |
| components\app\theme-toggle.tsx | ❌ | ⚠️ | Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,  |
| components\astryx\app-mobile-nav.tsx | ✅ | ❌ | None |
| components\astryx\app-sidenav.tsx | ✅ | ❌ | None |
| components\astryx\confirm-dialog.tsx | ✅ | ❌ | None |
| components\astryx\data-table.tsx | ✅ | ❌ | None |
| components\astryx\empty-state.tsx | ✅ | ❌ | None |
| components\astryx\metric-card.tsx | ✅ | ❌ | None |
| components\astryx\page-header.tsx | ✅ | ❌ | None |
| components\astryx\status-badge.tsx | ✅ | ❌ | None |
| components\astryx\toast-provider.tsx | ✅ | ❌ | None |
| components\auth\login-form.tsx | ❌ | ⚠️ | Button, Input, Label |
| components\auth\register-form.tsx | ❌ | ⚠️ | Button, Input, Label |
| components\certificates\create-template-dialog.tsx | ❌ | ⚠️ | Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, Button, Input, Label |
| components\certificates\designer.tsx | ❌ | ⚠️ | Button |
| components\certificates\issue-certificate-dialog.tsx | ❌ | ⚠️ | Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, Button, Input, Label, Tabs, TabsContent, TabsList, TabsTrigger, Select, SelectContent, SelectItem, SelectTrigger, SelectValue |
| components\events\admin-event-controls.tsx | ❌ | ⚠️ | Button |
| components\events\cancel-registration-button.tsx | ❌ | ⚠️ | Button, AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,  |
| components\events\edit-event-form.tsx | ✅ | ⚠️ | Input, Label |
| components\events\event-filters.tsx | ✅ | ❌ | None |
| components\events\event-sessions.tsx | ❌ | ⚠️ | Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, , Input, Label, Textarea, Card, CardContent |
| components\events\issue-certificates-button.tsx | ❌ | ⚠️ | Button |
| components\events\register-button.tsx | ❌ | ⚠️ | Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, Input, Label, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue |
| components\global\cookie-banner.tsx | ❌ | ⚠️ | Button |
| components\notifications\notification-bell.tsx | ✅ | ⚠️ | Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, Button, Badge |
| components\providers\astryx-provider.tsx | ✅ | ❌ | None |
| components\reject-modal.tsx | ✅ | ⚠️ | Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle |
| components\scanner\qr-scanner.tsx | ❌ | ⚠️ | Button, Alert, AlertDescription |
| components\ui\alert-dialog.tsx | ❌ | ⚠️ | buttonVariants |
| components\ui\command.tsx | ❌ | ⚠️ | Dialog, DialogContent |
| components\ui\dialog.tsx | ❌ | ⚠️ | Button |
| components\ui\form.tsx | ❌ | ⚠️ | Label |
| components\ui\sidebar.tsx | ❌ | ⚠️ | Button, Input, Separator, Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, , Skeleton, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,  |
| components\ui\toggle-group.tsx | ❌ | ⚠️ | toggleVariants |
