import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Button } from "./ui/button";
import Link from "next/link";
import UserSection from "./UserSection";
import { LogOut } from "lucide-react";
import { AppSidebarNav } from "./AppSidebarNav";
import React from "react";
import CrownIcon from "@/assets/svgs/CrownIcon.svg";
import Image from "next/image";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader className="pt-6">
        <div className="flex items-center justify-between w-full px-4 mb-4">
          <span className="text-[#8B5CF6] font-extrabold text-2xl tracking-tight">
            Logo
          </span>
          <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-full border border-amber-100">
            <Image src={CrownIcon} height={10} width={10} alt="" />
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
              Upgrade
            </span>
          </div>
        </div>
        <div className="hidden md:block w-full">
          <UserSection />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="h-full">
          <SidebarGroupContent className="h-full">
            <SidebarMenu className="h-full">
              <div className="flex flex-col gap-4 h-full justify-between">
                <AppSidebarNav />
                <Button
                  variant={"destructive"}
                  size="lg"
                  asChild
                  className="w-full h-[50px] text-black"
                >
                  <Link
                    href={"/auth/logout"}
                    className="flex items-center justify-start gap-2 text-black"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span className="text-base">Log out</span>
                  </Link>
                </Button>
              </div>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
