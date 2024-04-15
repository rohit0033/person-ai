import prisamdb from "@/lib/prismadb";
import { auth, redirectToSignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { ChatClient } from "./components/client";

interface ChatIdPageProps {
    params:{
        chatId: string;

    }
}

const ChatIdPage =async({
    params
}: ChatIdPageProps) => {
    const{userId} = auth()
    if(!userId){
        return redirectToSignIn();
    }

    const companion = await prisamdb.companion.findUnique({
        where:{
            id:params.chatId
        },
        include:{
            messages:{
                orderBy:{
                    createdAt: "asc"
                },
                where:{
                    userId,
                }
            }
        },
        
        
    });
    if(!companion){
        return redirect("/")
    }
    return (
        <ChatClient companion={companion}/>
    )
}

export default ChatIdPage;