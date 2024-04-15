"use client"

import { Companion } from "@prisma/client"
import { ChatMessage, ChatMessageProps } from "./chat-message";
import { ElementRef, useEffect, useRef, useState } from "react";

interface ChatMessagesProps {
    messages:ChatMessageProps[];
    isloading:boolean;
    companion: Companion
}

export const ChatMessages = ({ messages, isloading, companion }: ChatMessagesProps) => {
    
    const scrollRef = useRef<ElementRef<"div">>(null);
    const [fakeLoading, setFakeLoading] = useState(messages.length === 0 ? true : false);


    useEffect(() => {
        const timeout = setTimeout(() =>{
            setFakeLoading(false);

        },1000);

        return ()=> {
            clearTimeout(timeout);
        }

    },[]);
    useEffect(() => {
        scrollRef?.current?.scrollIntoView({behavior: "smooth"});

    },[messages.length]);
    return (
        <div className="flex-1 overflow-y-auto pr-4">
            <ChatMessage
               isLoading={fakeLoading}
               src={companion.src} 
               role="system"
               content={`Hello, I am ${companion.name}, ${companion.description}`}
            /> 
            {messages.map((message)=>(
                <ChatMessage
                    key={message.content}
                    src={message.src} 
                    role={message.role}
                    content={message.content}
                />
            ))}
            {isloading && (
                <ChatMessage
                    isLoading={true}
                    role="system"
                    content={companion.src}
                />
            )}
           <div ref={scrollRef} />
        </div>
    )
}