"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Brain, Lightbulb, MessageSquare, User, Heart, BadgeInfo } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { Companion } from "@prisma/client";
import Image from "next/image";

interface PersonalityDashboardProps {
  companion: Companion;
  companionId: string;
}

interface PersonalityTrait {
  id: string;
  type: string;
  content: string;
  confidence: number;
  source?: string;
  createdAt: string;
}

interface PersonalityProfile {
  coreTraits: string[];
  communicationStyle: string;
  interests: string[];
  opinions: Record<string, string>;
  behavioralPatterns: string[];
  emotionalTendencies: string[];
}

export const PersonalityDashboard = ({ companion, companionId }: PersonalityDashboardProps) => {
  const [traits, setTraits] = useState<PersonalityTrait[]>([]);
  const [profile, setProfile] = useState<PersonalityProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();

  const fetchPersonalityData = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`/api/companion/${companionId}/personality`);
      setTraits(response.data.traits || []);
      setProfile(response.data.profile || null);
    } catch (error) {
      console.error("Error fetching personality traits:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load personality data",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonalityData();
  }, [companionId]);

  const refreshPersonality = async () => {
    try {
      setIsRefreshing(true);
      await axios.post(`/api/companion/${companionId}/personality/analyze`);
      await fetchPersonalityData();
      toast({
        title: "Personality refreshed",
        description: "New personality insights have been generated",
      });
    } catch (error) {
      console.error("Error refreshing personality:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to refresh personality data. You may need more conversation history.",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Group traits by type
  const getTraitsByType = (type: string) => {
    return traits.filter(trait => trait.type === type)
      .sort((a, b) => b.confidence - a.confidence);
  };

  const interestTraits = getTraitsByType("interest");
  const opinionTraits = getTraitsByType("opinion");
  const behaviorTraits = getTraitsByType("behavior");
  const communicationTraits = getTraitsByType("communication");
  const emotionalTraits = getTraitsByType("emotional");

  const getTraitIcon = (type: string) => {
    switch (type) {
      case "interest": return <Lightbulb className="h-4 w-4" />;
      case "opinion": return <MessageSquare className="h-4 w-4" />;
      case "behavior": return <User className="h-4 w-4" />;
      case "communication": return <MessageSquare className="h-4 w-4" />;
      case "emotional": return <Heart className="h-4 w-4" />;
      default: return <BadgeInfo className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Personality Analysis</h2>
          <p className="text-muted-foreground">
            Explore how {companion.name} develops through conversations
          </p>
        </div>
        <Button 
          onClick={refreshPersonality} 
          variant="outline" 
          size="sm"
          disabled={isLoading || isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <div className="mr-2 h-12 w-12 rounded-full overflow-hidden relative">
                <Image 
                  src={companion.src} 
                  alt={companion.name} 
                  className="object-cover"
                  fill
                />
              </div>
              <div>
                {companion.name}
                <CardDescription>{companion.description}</CardDescription>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium flex items-center">
                  <Brain className="h-4 w-4 mr-2 text-primary" />
                  Learning Progress
                </h3>
                <p className="text-xs text-muted-foreground mb-2">
                  {traits.length > 20 
                    ? "Advanced personality model" 
                    : traits.length > 10 
                      ? "Developing personality" 
                      : "Basic personality model"}
                </p>
                <Progress value={Math.min(traits.length * 5, 100)} className="h-2" />
              </div>
              
              {profile?.coreTraits && profile.coreTraits.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2 flex items-center">
                    <BadgeInfo className="h-4 w-4 mr-2 text-primary" />
                    Core Personality Traits
                  </h3>
                  <div className="flex flex-wrap gap-1">
                    {profile.coreTraits.map((trait, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {trait}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Personality Insights</CardTitle>
            <CardDescription>
              Based on {traits.length} learned traits from conversations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="interests">Interests</TabsTrigger>
                <TabsTrigger value="behaviors">Behaviors</TabsTrigger>
                <TabsTrigger value="emotions">Emotions</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                {isLoading ? (
                  <div className="flex items-center justify-center h-40">
                    <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : profile ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-sm mb-2">Communication Style</h3>
                      <p className="text-sm text-muted-foreground">{profile.communicationStyle}</p>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-medium text-sm mb-2">Interests & Passions</h3>
                        <ul className="list-disc list-inside text-sm text-muted-foreground">
                          {profile.interests.slice(0, 5).map((interest, index) => (
                            <li key={index}>{interest}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h3 className="font-medium text-sm mb-2">Behavioral Patterns</h3>
                        <ul className="list-disc list-inside text-sm text-muted-foreground">
                          {profile.behavioralPatterns.slice(0, 5).map((pattern, index) => (
                            <li key={index}>{pattern}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      Keep chatting with {companion.name} to develop their personality
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="interests">
                <div className="space-y-4">
                  <h3 className="font-medium text-sm">Interests & Opinions</h3>
                  {interestTraits.length === 0 && opinionTraits.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No interests or opinions learned yet</p>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {[...interestTraits, ...opinionTraits].slice(0, 10).map((trait, index) => (
                        <Card key={index} className="overflow-hidden">
                          <div className="flex items-center p-3 bg-muted/50">
                            <div className="mr-2 p-1.5 rounded-full bg-primary/10">
                              {getTraitIcon(trait.type)}
                            </div>
                            <div className="flex-1 truncate">
                              <p className="text-sm font-medium">{trait.content}</p>
                              <p className="text-xs text-muted-foreground">{trait.type}</p>
                            </div>
                            <div className="w-12 text-right">
                              <span className="text-xs font-medium">
                                {Math.round(trait.confidence * 100)}%
                              </span>
                            </div>
                          </div>
                          <Progress 
                            value={trait.confidence * 100} 
                            className="h-1 rounded-none" 
                          />
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="behaviors">
                <div className="space-y-4">
                  <h3 className="font-medium text-sm">Behaviors & Communication</h3>
                  {behaviorTraits.length === 0 && communicationTraits.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No behaviors learned yet</p>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {[...behaviorTraits, ...communicationTraits].slice(0, 10).map((trait, index) => (
                        <Card key={index} className="overflow-hidden">
                          <div className="flex items-center p-3 bg-muted/50">
                            <div className="mr-2 p-1.5 rounded-full bg-primary/10">
                              {getTraitIcon(trait.type)}
                            </div>
                            <div className="flex-1 truncate">
                              <p className="text-sm font-medium">{trait.content}</p>
                              <p className="text-xs text-muted-foreground">{trait.type}</p>
                            </div>
                            <div className="w-12 text-right">
                              <span className="text-xs font-medium">
                                {Math.round(trait.confidence * 100)}%
                              </span>
                            </div>
                          </div>
                          <Progress 
                            value={trait.confidence * 100} 
                            className="h-1 rounded-none" 
                          />
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="emotions">
                <div className="space-y-4">
                  <h3 className="font-medium text-sm">Emotional Tendencies</h3>
                  {emotionalTraits.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No emotional patterns learned yet</p>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {emotionalTraits.slice(0, 10).map((trait, index) => (
                        <Card key={index} className="overflow-hidden">
                          <div className="flex items-center p-3 bg-muted/50">
                            <div className="mr-2 p-1.5 rounded-full bg-primary/10">
                              <Heart className="h-4 w-4" />
                            </div>
                            <div className="flex-1 truncate">
                              <p className="text-sm font-medium">{trait.content}</p>
                              <p className="text-xs text-muted-foreground">{trait.type}</p>
                            </div>
                            <div className="w-12 text-right">
                              <span className="text-xs font-medium">
                                {Math.round(trait.confidence * 100)}%
                              </span>
                            </div>
                          </div>
                          <Progress 
                            value={trait.confidence * 100} 
                            className="h-1 rounded-none" 
                          />
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {traits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Development Timeline</CardTitle>
            <CardDescription>
              How {companion.name}s personality evolves
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative pl-6 border-l border-border space-y-6">
              <div className="relative">
                <div className="absolute -left-[25px] p-1 rounded-full bg-primary">
                  <div className="h-3 w-3 rounded-full bg-background" />
                </div>
                <div>
                  <p className="text-sm font-medium">Initial Personality</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    Created with base instructions
                  </p>
                  <Card className="bg-muted/30 p-3">
                    <p className="text-xs line-clamp-3">{companion.instructions.substring(0, 150)}...</p>
                  </Card>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -left-[25px] p-1 rounded-full bg-primary">
                  <div className="h-3 w-3 rounded-full bg-background" />
                </div>
                <div>
                  <p className="text-sm font-medium">Learning Phase</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    {traits.length} traits learned through conversations
                  </p>
                  <div className="flex flex-wrap gap-1 max-w-xl">
                    {traits.slice(0, 8).map((trait, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {trait.content}
                      </Badge>
                    ))}
                    {traits.length > 8 && (
                      <Badge variant="outline" className="text-xs">
                        +{traits.length - 8} more
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {profile && (
                <div className="relative">
                  <div className="absolute -left-[25px] p-1 rounded-full bg-primary">
                    <div className="h-3 w-3 rounded-full bg-background" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Current Personality</p>
                    <p className="text-xs text-muted-foreground mb-2">
                      Developed through AI learning
                    </p>
                    <div className="flex flex-wrap gap-1 max-w-xl">
                      {profile.coreTraits.map((trait, index) => (
                        <Badge key={index} className="text-xs">
                          {trait}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};