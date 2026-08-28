import {
  LayoutDashboard,
  PenSquare,
  Calendar,
  FileText,
  Megaphone,
  BarChart3,
  Share2,
  Sparkles,
  Users,
  CreditCard,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  group: "main" | "workspace";
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, group: "main" },
  { label: "Create Post", href: "/create", icon: PenSquare, group: "main" },
  { label: "Calendar", href: "/calendar", icon: Calendar, group: "main" },
  { label: "Posts", href: "/posts", icon: FileText, group: "main" },
  { label: "Campaigns", href: "/campaigns", icon: Megaphone, group: "main" },
  { label: "Analytics", href: "/analytics", icon: BarChart3, group: "main" },
  { label: "AI Studio", href: "/ai-studio", icon: Sparkles, group: "main" },
  { label: "Social Accounts", href: "/social-accounts", icon: Share2, group: "workspace" },
  { label: "Team", href: "/team", icon: Users, group: "workspace" },
  { label: "Billing", href: "/billing", icon: CreditCard, group: "workspace" },
  { label: "Settings", href: "/settings", icon: Settings, group: "workspace" },
];
