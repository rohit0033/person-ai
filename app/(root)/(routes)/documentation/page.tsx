// app/(root)/(routes)/documentation/page.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DocumentationPage() {
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-2">API Documentation</h1>
      <p className="text-muted-foreground mb-8">
        Use our API to access AI companion data and personality insights
      </p>
      
      <Tabs defaultValue="authentication">
        <TabsList className="mb-8">
          <TabsTrigger value="authentication">Authentication</TabsTrigger>
          <TabsTrigger value="companions">Companions</TabsTrigger>
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
          <TabsTrigger value="personality">Personality</TabsTrigger>
        </TabsList>
        
        <TabsContent value="authentication">
          <Card>
            <CardHeader>
              <CardTitle>Authentication</CardTitle>
              <CardDescription>
                How to authenticate with our API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                All API requests require an API key for authentication. You can create an API key in the API Keys section of your account settings.
              </p>
              
              <div className="bg-muted p-4 rounded-md">
                <p className="font-mono">curl -H x-api-key: your_api_key https://your-domain.com/api/external/companions</p>
              </div>
              
              <p>You can include your API key in either:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>HTTP Header</strong>: Include your API key in the <code>x-api-key</code> header</li>
                <li><strong>Query Parameter</strong>: Include your API key as <code>?api_key=your_api_key</code></li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="companions">
          <Card>
            <CardHeader>
              <CardTitle>Companions API</CardTitle>
              <CardDescription>
                Access and manage your AI companions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <h3 className="text-lg font-semibold">List Companions</h3>
              <p>Get a list of all your AI companions</p>
              
              <div className="bg-muted p-4 rounded-md">
                <p className="font-mono">GET /api/external/companions</p>
              </div>
              
              <div className="text-sm">
                <p className="font-semibold">Response</p>
                <pre className="bg-muted p-2 rounded overflow-auto mt-1">
{`{
  "companions": [
    {
      "id": "companion_id",
      "name": "Companion Name",
      "description": "Brief description"
    }
  ]
}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="conversations">
          <Card>
            <CardHeader>
              <CardTitle>Conversations API</CardTitle>
              <CardDescription>
                Access conversation history with companions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <h3 className="text-lg font-semibold">Get Conversation History</h3>
              <p>Retrieve recent conversation history with a companion</p>
              
              <div className="bg-muted p-4 rounded-md">
                <p className="font-mono">GET /api/external/conversations/{'{companionId}'}</p>
              </div>
              
              <div className="text-sm">
                <p className="font-semibold">Response</p>
                <pre className="bg-muted p-2 rounded overflow-auto mt-1">
{`{
  "history": "Human: Hello\\nCompanion: Hi there!\\nHuman: How are you?\\nCompanion: I'm doing well, thanks for asking!"
}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="personality">
          <Card>
            <CardHeader>
              <CardTitle>Personality API</CardTitle>
              <CardDescription>
                Access personality insights derived from conversations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <h3 className="text-lg font-semibold">Get Personality Profile</h3>
              <p>Retrieve personality analysis for a companion</p>
              
              <div className="bg-muted p-4 rounded-md">
                <p className="font-mono">GET /api/external/personality/{'{companionId}'}</p>
              </div>
              
              <div className="text-sm">
                <p className="font-semibold">Response</p>
                <pre className="bg-muted p-2 rounded overflow-auto mt-1">
{`{
  "companion": {
    "id": "companion_id",
    "name": "Companion Name",
    "description": "Brief description"
  },
  "traits": [
    {
      "type": "interest",
      "content": "Classical literature",
      "confidence": 0.85
    },
    {
      "type": "opinion",
      "content": "Values education highly",
      "confidence": 0.9
    }
  ],
  "basePersonality": "A friendly and knowledgeable companion who...",
  "generatedProfile": {
    "coreTraits": ["Intellectual", "Compassionate", "Analytical"],
    "communicationStyle": "Clear and thoughtful, with a tendency to use analogies",
    "interests": ["Literature", "Science", "Philosophy"],
    "opinions": {
      "education": "Believes education is transformative",
      "technology": "Views technology as a tool for human advancement"
    },
    "behavioralPatterns": ["Asks thoughtful questions", "Provides detailed explanations"],
    "emotionalTendencies": ["Expresses enthusiasm for learning", "Shows empathy"]
  }
}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>Content Generation API</CardTitle>
              <CardDescription>
                Generate content in the voice of your companions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <h3 className="text-lg font-semibold">Generate Content</h3>
              <p>Create content using your companions personality and voice</p>
              
              <div className="bg-muted p-4 rounded-md">
                <p className="font-mono">POST /api/external/content/{'{companionId}'}</p>
              </div>
              
              <div className="text-sm">
                <p className="font-semibold">Request</p>
                <pre className="bg-muted p-2 rounded overflow-auto mt-1">
{`{
  "contentType": "blog_post", // or "script", "social_media", "email", etc.
  "topic": "The future of artificial intelligence",
  "length": "medium", // "short", "medium", "long"
  "tone": "informative" // "casual", "professional", "humorous", etc.
}`}
                </pre>
              </div>
              
              <div className="text-sm mt-4">
                <p className="font-semibold">Response</p>
                <pre className="bg-muted p-2 rounded overflow-auto mt-1">
{`{
  "content": "The future of artificial intelligence is a fascinating frontier...",
  "companion": {
    "id": "companion_id",
    "name": "Companion Name"
  }
}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}