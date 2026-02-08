
import { MyGroupsList } from "@/components/groups/MyGroupsList";

export default function GroupsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-6 border-b">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Groups</h1>
            <p className="text-muted-foreground mt-2">
              View and manage the groups you are a member of.
            </p>
          </div>
        </div>

        <MyGroupsList />
      </div>
    </div>
  );
}
