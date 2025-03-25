"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Twitter } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";

interface TwitterAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalysisComplete: (instructions: string, conversation: string) => void;
}

const TwitterAnalysisModal = ({ 
  isOpen, 
  onClose, 
  onAnalysisComplete 
}: TwitterAnalysisModalProps) => {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStage, setAnalysisStage] = useState<string>("");
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if(!username){

        toast({
            description: "Please enter a username",
            variant: "destructive",
        });
        return;

    } 
    try {
        setIsAnalyzing(true);
        setAnalysisStage("Fetching the tweets...")
        const response = await axios.post("/api/twitter-analysis", { username : username.replace("@", "") });
        if (response.data.instructions && response.data.conversation) {
            // Success - pass data back to parent
            onAnalysisComplete(response.data.instructions, response.data.conversation);
            toast({
              description: "Successfully analyzed Twitter profile"
            });
            onClose();
          } else {
            throw new Error("Failed to generate personality from tweets");
          }
        
    } catch (error) {
        console.log(error)
        toast({
            description: "Error analyzing Twitter profile",
            variant: "destructive",
        });
        
    }finally {
        setIsAnalyzing(false);
        setAnalysisStage("");
    }
        

  }
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Twitter className="h-5 w-5 text-[#1DA1F2]" />
            Twitter Personality Analysis
          </DialogTitle>
          <DialogDescription>
            Enter a Twitter username to analyze their tweets and generate a
            personality profile.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-2">
            {" "}
            <span className="text-muted-foreground">@</span>
            <Input
              placeholder="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isAnalyzing}
            />
          </div>
          {isAnalyzing && (
            <div className="flex flex-col items-center justify-center space-y-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">{analysisStage}</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isAnalyzing}>
            Cancel
          </Button>
          <Button onClick={handleAnalyze} disabled={isAnalyzing || !username}>
            {isAnalyzing ? "Analyzing..." : "Analyze Profile"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default TwitterAnalysisModal;
