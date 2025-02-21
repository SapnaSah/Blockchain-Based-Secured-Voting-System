import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "./button";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { LogOut, User } from "lucide-react";

export function Navbar() {
  const { user, logoutMutation } = useAuth();

  if (!user) return null;

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/">
          <a className="font-semibold text-lg">BlockVote</a>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatarUrl || undefined} />
                <AvatarFallback>
                  {user.displayName?.[0]?.toUpperCase() || user.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href="/profile">
                <a className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </a>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => logoutMutation.mutate()}
              className="text-red-600"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
