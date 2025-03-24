import { auth, currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import prismadb from "@/lib/prismadb";
import { PersonalityDashboard } from "@/components/personality-dashboard";


interface PersonalityPageProps {
  params: {
    companionId: string;
  };
}

const PersonalityPage = async ({ params }: PersonalityPageProps) => {
  const { userId } = auth();
  const user = await currentUser();

  if (!userId || !user) {
    redirect("/sign-in");
  }

  const companion = await prismadb.companion.findUnique({
    where: {
      id: params.companionId,
      userId,
    },
  });

  if (!companion) {
    redirect("/");
  }

  return (
    <div className="h-full p-4 space-y-2">
      <PersonalityDashboard
        companion={companion}
        companionId={params.companionId}
      />
    </div>
  );
};

export default PersonalityPage;