"use client"

import { Companion, Message } from "@prisma/client"
import { ChatHeader } from "./chat-header";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useCompletion } from 'ai/react'
import { ChatForm } from "@/components/chat-form";
import { ChatMessages } from "@/components/chat-messages";
import { ChatMessageProps } from "@/components/chat-message";

interface ChatClientProps {
    companion: Companion & {
        messages: Message[];
    }
}

export const ChatClient = ({
    companion
}: ChatClientProps) => {
  const router =  useRouter();
  const [messages, setMessages] = useState<ChatMessageProps[]>(companion.messages);
  const {
    input,
    isLoading,
    handleInputChange,
    handleSubmit,
    setInput,
  } = useCompletion({
    api:`/api/chat/${companion.id}`,
    onFinish(prompt, completion) {
      const systeMessage : ChatMessageProps = {
        role : "system",
        content: completion
      };
      setMessages((current)=> [...current,systeMessage]);
      setInput("");

      router.refresh();
    },

  });

  const onSubmit = (e : FormEvent<HTMLFormElement>) =>{
    const userMessage: ChatMessageProps= {
      role : "user",
      content: input
    };
    setMessages((current)=> [...current,userMessage]);
    handleSubmit(e);
  }
  



  return (
    <div className="flex flex-col h-full p-4 space-y-2">
      <ChatHeader companion={companion} />
      <ChatMessages
         companion={companion}
         isloading={isLoading}
         messages={messages}   
      />
    <ChatForm
        isLoading={isLoading}
        input = {input}
        handleInputChange={handleInputChange}
        onSubmit={onSubmit}  
    />
    
    </div>
    
  )
}