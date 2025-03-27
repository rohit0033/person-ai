// app/settings/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { CopyIcon, PlusCircle, TrashIcon } from "lucide-react";
import axios from "axios";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";

interface ApiKey {
  id: string;
  name: string;
  createdAt: string;
  expiresAt: string | null;
}

const ApiKeysPage = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const[newKeyName,setNewKeyName] = useState("");
  const[newApiKey,setNewApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchApiKeys = useCallback(async () => {
    try {
      const response = await axios.get("/api/external/api-keys");
      setApiKeys(response.data);
      
    } catch (error) {
      console.error("Error fetching api keys", error);
      toast({
        variant: "destructive",
        title: "Failed to load API keys",
        description: "There was a problem loading your API keys."
      });
      
    }
  }, [toast]);
  
  useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  const generateApiKey = async () => {
    if(!newKeyName.trim()){
      toast({
        variant: "destructive",
        title: "Name Required",
        description: "Please provide a name for the API key."
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post('/api/external/api-keys', { name: newKeyName });
      setNewApiKey(response.data.key);
      setNewKeyName("");
      setShowModal(true);

      await fetchApiKeys();
    } catch (error) {
      console.error("Error generating api key", error);
      toast({
        variant: "destructive",
        title: "Failed to generate API key",
        description: "There was a problem generating your API key."
      });
      
    }finally {
      setIsLoading(false);
    }

  }

  const formatDate = (dateString: string) => {
    console.log("date to string",dateString);
    try {
      // Check if the date is a valid date
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Date unavailable";
      }
      return format(date, "PPP");
    } catch (error) {
      console.error("Invalid date format:", dateString);
      return "Date unavailable";
    }
  };
  const revokeApiKey = async (keyId: string) => {
    try {
      await axios.delete(`/api/external/api-keys/${keyId}`);
      
      // Refresh the list
      await fetchApiKeys();
      
      toast({
        title: "API key revoked",
        description: "Your API key has been revoked successfully."
      });
    } catch (error) {
      console.error("Failed to revoke API key:", error);
      toast({
        variant: "destructive",
        title: "Failed to revoke API key",
        description: "There was a problem revoking your API key."
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "API Key copied to clipboard",
      description: "Your API key has been copied to the clipboard."
    });
  }

  const handleRevokeClick= (keyId: string)=>{
    setKeyToDelete(keyId);
    setShowDeleteDialog(true);

  } 

  const confirmRevoke = ()=>{
    if(keyToDelete){
      revokeApiKey(keyToDelete);
      setShowDeleteDialog(false);
      setKeyToDelete(null);
  }
}

  
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-4"> API keys </h1>
      <p>
        Generate your api keys for external use here. You can use these keys to access the API from your own applications.
      </p>
      <div className="mb-10">
        <h2 className="text-xl font-bold mt-2 mb-4">
          Generate a new API key
        </h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="API Key name"
            className="w-full sm:w-3/5"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
          />
          <Button 
            onClick={generateApiKey}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            <span>Generate API Key</span>
          </Button>
        </div>

      </div>

      {/* APi keys */}
      <div className="lg:w-3/5 flex flex-col space-y-4">
        <h2 className="text-xl font-bold mb-4">
          Your API keys
        </h2>
        {apiKeys.length === 0 ? (
          <p>You have not generated any API keys yet.</p>):(
            <div className="flex flex-col space-y-3">
              {apiKeys.map((apiKey) => (
                <Card key={apiKey.id} className="w-full">
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex-1">
                      <span className="font-medium">{apiKey.name}</span>
                      <span className="text-sm text-muted-foreground ml-4">Created on {formatDate(apiKey.createdAt)}</span>
                    </div>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleRevokeClick(apiKey.id)}
                    >
                      <TrashIcon className="w-4 h-4 mr-2" />
                      Revoke
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
          

      </div>
          <Dialog open={showModal} onOpenChange={setShowModal}>
            <DialogContent >
            <DialogHeader>
            <DialogTitle>Your New API Key</DialogTitle>
            <DialogDescription>
              Please copy this key now. You won&apos;t be able to see it again.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted p-4 rounded-md my-4">
          <div className="flex justify-between items-center">
              <p className="font-mono text-sm break-all">{newApiKey}</p>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => copyToClipboard(newApiKey || "")}
              >
                <CopyIcon className="w-4 h-4" />
              </Button>
            </div>


          </div>
          <p className="text-sm text-muted-foreground">
            Store this API key securely. For security reasons, it wont be shown again.
          </p>
          <DialogFooter className="mt-4">
            <Button 
              onClick={() => {
                setShowModal(false);
                setNewApiKey("");
              }}
            >
              Ive Saved My Key
            </Button>
          </DialogFooter>

            </DialogContent>

          </Dialog>
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke this API key? This action cannot be undone,
              and any applications using this key will lose access immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmRevoke} className="bg-destructive text-destructive-foreground">
              Revoke Key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}

export default ApiKeysPage;