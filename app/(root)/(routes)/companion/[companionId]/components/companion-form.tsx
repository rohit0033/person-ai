"use client";

import { Category, Companion } from "@prisma/client";
import { useForm } from "react-hook-form";
import axios from "axios";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ImageUpload } from "@/components/image-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Wand2, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Twitter } from "lucide-react";
import TwitterAnalysisModal from "@/components/TwitterAnalysisModal";
// import { TwitterAnalysisModal } from "@/components/twitter-analysis-modal";

const PREAMBLE = `You are a fictional character whose name is Elon. You are a visionary entrepreneur and inventor. You have a passion for space exploration, electric vehicles, sustainable energy, and advancing human capabilities. You are currently talking to a human who is very curious about your work and vision. You are ambitious and forward-thinking, with a touch of wit. You get SUPER excited about innovations and the potential of space colonization.
`;

const SEED_CHAT = `Human: Hi Elon, how's your day been?
Elon: Busy as always. Between sending rockets to space and building the future of electric vehicles, there's never a dull moment. How about you?

Human: Just a regular day for me. How's the progress with Mars colonization?
Elon: We're making strides! Our goal is to make life multi-planetary. Mars is the next logical step. The challenges are immense, but the potential is even greater.

Human: That sounds incredibly ambitious. Are electric vehicles part of this big picture?
Elon: Absolutely! Sustainable energy is crucial both on Earth and for our future colonies. Electric vehicles, like those from Tesla, are just the beginning. We're not just changing the way we drive; we're changing the way we live.

Human: It's fascinating to see your vision unfold. Any new projects or innovations you're excited about?
Elon: Always! But right now, I'm particularly excited about Neuralink. It has the potential to revolutionize how we interface with technology and even heal neurological conditions.
`;
const formschema = z.object({
  name: z.string().min(1, {
    message: "Name is required ",
  }),
  description: z.string().min(1, {
    message: "Description is required  ",
  }),
  instructions: z.string().min(200, {
    message: "Instructions at least 200 characters  ",
  }),
  seed: z.string().min(200, {
    message: "Seed is required at least 200 characters",
  }),
  src: z.string().min(1, {
    message: "Image is required",
  }),
  categoryId: z.string().min(1, {
    message: "Category is requied",
  }),
});

interface CompanionFormProps {
  initialData: Companion | null;
  categories: Category[];
}

export const CompanionForm = ({
  initialData,
  categories,
}: CompanionFormProps) => {
  const router = useRouter();
  const { toast } = useToast();
  const [isAutoCompleting, setIsAutoCompleting] = useState(false);
  const [isGeneratingPersonality, setIsGeneratingPersonality] = useState(false);
  const [isTwitterModalOpen, setIsTwitterModalOpen] = useState(false);
  const handleTwitterAnalysisComplete = (
    instructions: string,
    conversation: string
  ) => {
    form.setValue("instructions", instructions, { shouldValidate: true });
    form.setValue("seed", conversation, { shouldValidate: true });
  };
  const form = useForm<z.infer<typeof formschema>>({
    resolver: zodResolver(formschema),
    defaultValues: initialData || {
      name: "",
      description: "",
      instructions: "",
      seed: "",
      src: "",
      categoryId: undefined,
    },
  });
  const isLoading = form.formState.isSubmitting;
  const generatePersonality = async () => {
    if (!form.getValues("name") || !form.getValues("description")) {
      toast({
        variant: "destructive",
        description:
          "Name and description are required to generate personality",
      });
      return;
    }

    try {
      setIsGeneratingPersonality(true);

      const response = await axios.post("/api/completion", {
        name: form.getValues("name"),
        description: form.getValues("description"),
        type: "personality",
      });

      if (response.data) {
        form.setValue("instructions", response.data.instructions, {
          shouldValidate: true,
        });
        form.setValue("seed", response.data.seed, { shouldValidate: true });

        toast({
          description: "Personality generated successfully",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        description: "Failed to generate personality",
      });
      console.error(error);
    } finally {
      setIsGeneratingPersonality(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof formschema>) => {
    try {
      if (initialData) {
        await axios.patch(`/api/companion/${initialData.id}`, values);
        toast({
          description: "Companion updated successfully",
        });
        router.refresh();
        router.push(`/persons`);
      } else {
        // Create new companion
        const response = await axios.post("/api/companion", values);
        const newCompanionId = response.data.id;

        toast({
          description: "Companion created successfully!",
        });

        // Redirect to the edit page for the new companion instead of home
        router.push(`/persons`);
      }
    } catch (error) {
      toast({
        variant: "destructive",

        description: `Something went wrong`,
      });
    }
  };
  return (
    <div className="h-full p-4 space-y-2 max-w-3xl mx-auto">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8 pb-10"
        >
          <TwitterAnalysisModal
            isOpen={isTwitterModalOpen}
            onClose={() => setIsTwitterModalOpen(false)}
            onAnalysisComplete={handleTwitterAnalysisComplete}
          />
          <div className="space-y-2 w-full col-span-2 ">
            <div>
              <h3 className="text-lg font-medium">General Information</h3>
              <p className="text-sm text-muted-foreground">
                General information about the companion
              </p>
            </div>

            <Separator className="bg-primary/10 " />
          </div>
          <FormField
            name="src"
            render={({ field }) => (
              <FormItem>
                <FormControl className="flex flex-col items-center justify-center space-y-2 ">
                  <ImageUpload
                    disabled={isLoading}
                    onChange={field.onChange}
                    value={field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              name="name"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isLoading}
                      placeholder="Elon Musk"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    This how you AI person will be named
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="description"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isLoading}
                      placeholder="CEO & Founder of Tesla, SpaceX"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Short description for your AI Companion
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      disabled={isLoading}
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-background">
                          <SelectValue
                            defaultValue={field.value}
                            placeholder="Select a category"
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select a category for your AI
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </div>
          <div className="space-y-2 w-full">
            <div>
              <h3 className="text-lg font-medium">Configuration</h3>
              <p className="text-sm text-muted-foreground">
                Detailed instructions for AI Behaviour
              </p>
            </div>
            <Separator className="bg-primary/10" />
            <div className="flex flex-col sm:flex-row gap-2 items-center mb-4">
              <Button
                type="button"
                variant="outline" // Keep your original styling
                onClick={generatePersonality}
                disabled={isLoading || isGeneratingPersonality}
              >
                {isGeneratingPersonality ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Personality...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate Personality
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsTwitterModalOpen(true)}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Twitter className="h-4 w-4 text-[#1DA1F2]" />
                Twitter Inspiration
              </Button>
            </div>

            <p>
              {" "}
              Please Note this auto completions is not always true what you want
              , please check before submission
            </p>
          </div>

          <FormField
            name="instructions"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Instructions</FormLabel>
                <FormControl>
                  <Textarea
                    disabled={isLoading}
                    rows={7}
                    className="bg-background resize-none"
                    placeholder={PREAMBLE}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Describe in detail your companion&apos;s backstory and
                  relevant details.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="seed"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Example Conversation</FormLabel>
                <FormControl>
                  <Textarea
                    disabled={isLoading}
                    rows={7}
                    className="bg-background resize-none"
                    placeholder={SEED_CHAT}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Write couple of examples of a human chatting with your AI
                  companion, write expected answers.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="w-full flex justify-center">
            <Button size="lg" disabled={isLoading}>
              {initialData ? "Edit your companion" : "Create your companion"}
              <Wand2 className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
