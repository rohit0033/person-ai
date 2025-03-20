"use client";

import { cn } from "@/lib/utils";
import { Home, Plus, Settings,PersonStanding } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

export const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();

  const routes = [
    {
      name: Home,
      href: "/",
      label: "Home",
      pro: false, //
    },
    {
      name:PersonStanding,
      href: "/persons",
      label: "Persons",
      pro: false,
      

    },

    {
      name: Plus,
      href: "/companion/new",
      label: "Create",
      pro: true,
    },
    {
      name: Settings,
      href: "/settings",
      label: "Settings",
      pro: false,
    },
  ];


  const onNavigate =(url: string, pro : boolean) => {


    return router.push(url);

  }
  return (
    <div className="space-y-4 flex flex-col h-full text-primary bg-secondary">
      <div className="p-3 flex flex-1 justify-center">
        <div className="space-y-2">
          {routes.map((route) => (
            <div
              onClick={() => onNavigate(route.href, route.pro)}
              key={route.href}
              className={cn(
                "text-muted-foreground text-xs group flex p-3 w-full justify start font-medium cursor-pointer hover:text-primary hover:bg-primary/10 rounded-lg transistion",
                pathname === route.href && "bg-primary/10 text-primary"
              )}
            >
              <div className="flex flex-col gap-y-3 items-center flex-1">
                <route.name className="h-5 w-5" />
                {route.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
