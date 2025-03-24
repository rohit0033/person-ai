"use Client";

import { Button } from "@/components/ui/button";
import { Companion, Message } from "@prisma/client";
import { ChevronLeft, Edit, MoreVertical, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { BotAvatar } from "./bot-avatar";
import { useUser } from "@clerk/nextjs";
import axios from "axios";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { Brain } from "lucide-react";
import Link from "next/link";

interface ChatHeaderProps {
  companion: Companion & {
    messages: Message[];
  };
}

export const ChatHeader = ({ companion }: ChatHeaderProps) => {
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();

  const onDelete = async () => {
    try {
      await axios.delete(`/api/companion/${companion.id}`);
      toast({
        description: "Success",
      });
      router.refresh();
      router.push("/");
    } catch (error) {
      console.log(error);
      toast({
        description: "Error deleting companion",
        variant: "destructive",
      });
    }
  };
  return (
    <div className="flex w-full justify-between items-center border-b border-primary/10 pb-4">
      <div className="flex gap-x-2 items-center">
        <Button onClick={() => router.back()} size="icon" variant="ghost">
          <ChevronLeft className="h-8 w-8" />
        </Button>
        <BotAvatar src={companion.src} />
        <div className="flex flex-col gap-y-1">
          <div className="flex items-center gap-x-2">
            <p className="font-bold">{companion.name}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Created by {companion.userName}
          </p>
        </div>
      </div>
      {user?.id === companion.userId && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon">
              <MoreVertical />
        
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => router.push(`/companion/${companion.id}`)}
            >
              <Edit className="w-4 h-4 mr-2 " />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push(`/companion/${companion.id}/personality`)}
            >
              <Brain className="w-4 h-4 mr-2 " />
              Personality
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete}>
              <Trash className="w-4 h-4 mr-2 " />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};
