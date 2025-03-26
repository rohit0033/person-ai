import Link from "next/link";
import { ArrowRight, Bot, MessageSquare, Music, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import React, { ReactNode } from "react";

// Define interfaces for component props
interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
}

interface CompanionCardProps {
  name: string;
  role: string;
  image: string;
  description: string;
}

const LandingPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-r from-primary/5 to-background">
      {/* Hero Section */}
      <section className="flex flex-col md:flex-row items-center justify-between px-6 md:px-20 py-8 md:py-24 gap-10">
        <div className="flex flex-col space-y-6 max-w-2xl">
            <div className="animate-fade-in space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight animate-slide-up">
              Connect with <span className="text-primary bg-gradient-to-r from-primary to-primary-light bg-clip-text ">AI Companions</span> designed for you or by you
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground animate-slide-up animation-delay-300">
              Experience meaningful conversations with AI personalities crafted to inspire, assist, and entertain you.
            </p>
            </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/persons">
              <Button size="lg" className="w-full sm:w-auto">
                Explore Companions <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/companion/create">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Create Your Own
              </Button>
            </Link>
          </div>
        </div>
        <div className="relative w-full md:w-1/2 h-[300px] md:h-[400px] rounded-lg overflow-hidden">
          <Image 
            src="/images/HeroImage.png" 
            alt="AI Companions" 
            fill 
            className="object-cover"
            priority
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-24 bg-muted/50 bg-gradient-to-r from-primary/5 to-background">
        <div className="container px-6 md:px-20">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Why Choose Our AI Companions?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Bot className="w-10 h-10 text-primary" />}
              title="Personalized Experience"
              description="Every AI companion is uniquely designed to provide personalized interactions based on your preferences."
            />
            <FeatureCard 
              icon={<MessageSquare className="w-10 h-10 text-primary" />}
              title="Natural Conversations"
              description="Engage in flowing, natural conversations that adapt to your style and interests."
            />
            <FeatureCard 
              icon={<Users className="w-10 h-10 text-primary" />}
              title="Diverse Personalities"
              description="Choose from a wide range of AI personalities - from musicians to philosophers to personal assistants."
            />
          </div>
        </div>
      </section>

      {/* Testimonials or Showcase */}
      <section className="py-12 md:py-24">
        <div className="container px-6 md:px-20">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
        Train Through Conversation
          </h2>
          <p className="text-lg text-center text-muted-foreground mb-12 max-w-3xl mx-auto">
        Our AI companions learn and evolve through your interactions, developing unique personality traits based on your conversations.
          </p>
          
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl overflow-hidden shadow-lg border border-border col-span-2">
            <Image 
              src="/images/conversation-1.png" 
              alt="Learning Process" 
              width={600}
              height={400}
              quality={100}
              priority
              className="w-full h-full object-cover"
            />
            </div>
            <div className="rounded-xl overflow-hidden shadow-lg border border-border col-span-2">
            <Image 
              src="/images/conversation-2.png" 
              alt="AI Interaction" 
              width={600}
              height={400}
              quality={100}
              priority
              className="w-full h-full object-cover"
            />
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
            <h3 className="text-xl font-semibold mb-2">Make your own Peron</h3>
            <p className="text-muted-foreground">Make your own peron by by giving neccessary details .</p>
            </div>
            <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
            <h3 className="text-xl font-semibold mb-2">Adaptive Learning</h3>
            <p className="text-muted-foreground">Your companion adapts to your conversation style, preferences, and interests over time.</p>
            </div>
            
            <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
            <h3 className="text-xl font-semibold mb-2">Personality Customization</h3>
            <p className="text-muted-foreground">Guide your companions development by providing feedback and having meaningful conversations.</p>
            </div>
            
            <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
            <h3 className="text-xl font-semibold mb-2">Memory Retention</h3>
            <p className="text-muted-foreground">Your companion remembers important details from past conversations to create a continuous experience.</p>
            </div>
          </div>
            </div>
        </div>
      </section>
    </div>
  );
};

// Component for feature cards
const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => {
  return (
    <div className="bg-card p-6 rounded-lg shadow-sm border border-border hover:shadow-md transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
};

// Component for companion cards
const CompanionCard: React.FC<CompanionCardProps> = ({ name, role, image, description }) => {
  return (
    <div className="bg-card rounded-lg overflow-hidden border border-border hover:shadow-md transition-shadow">
      <div className="relative h-48 w-full">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover"
        />
      </div>
      <div className="p-6">
        <h3 className="text-xl font-semibold">{name}</h3>
        <p className="text-primary font-medium">{role}</p>
        <p className="mt-2 text-muted-foreground">{description}</p>
        <Link href={`/persons`} className="mt-4 inline-block">
          <Button variant="outline" size="sm">
            Chat Now
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default LandingPage;