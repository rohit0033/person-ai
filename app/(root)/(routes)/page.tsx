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
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="flex flex-col md:flex-row items-center justify-between px-6 md:px-20 py-12 md:py-24 gap-10">
        <div className="flex flex-col space-y-6 max-w-2xl">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Connect with <span className="text-primary">AI Companions</span> designed for you
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            Experience meaningful conversations with AI personalities crafted to inspire, assist, and entertain you.
          </p>
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
      <section className="py-12 md:py-24 bg-muted/50">
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
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Popular Companions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <CompanionCard
              name="Melody"
              role="Music Expert"
              image="/images/melody.png"
              description="Your personal DJ who knows exactly what you want to hear."
            />
            <CompanionCard
              name="Einstein"
              role="Science Advisor"
              image="/images/einstien.png"
              description="Explaining complex scientific concepts in simple terms."
            />
            <CompanionCard
              name="Luna"
              role="Meditation Guide"
              image="/images/luna.png"
              description="Guiding you to inner peace through mindfulness practices."
            />
          </div>
          <div className="flex justify-center mt-12">
            <Link href="/persons">
              <Button size="lg">
                View All Companions
              </Button>
            </Link>
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
        <Link href={`/chat/${name.toLowerCase()}`} className="mt-4 inline-block">
          <Button variant="outline" size="sm">
            Chat Now
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default LandingPage;