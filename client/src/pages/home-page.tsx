import { useAuth } from "@/hooks/use-auth";
import { useVoting } from "@/hooks/use-voting";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { Link } from "wouter";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  const { elections, candidates, votes, castVoteMutation } = useVoting();
  const [selectedElection, setSelectedElection] = useState<number | null>(null);

  if (!elections.length) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Active Elections</h1>
          <p className="text-muted-foreground">
            There are currently no active elections. Please check back later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      {user?.isAdmin && (
        <div className="mb-8">
          <Link href="/admin">
            <Button>Admin Dashboard</Button>
          </Link>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {elections.map((election) => (
          <Card key={election.id}>
            <CardHeader>
              <CardTitle>{election.title}</CardTitle>
              <CardDescription>{election.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                <span className="font-semibold">Start:</span>{" "}
                {new Date(election.startTime).toLocaleString()}
                <br />
                <span className="font-semibold">End:</span>{" "}
                {new Date(election.endTime).toLocaleString()}
              </p>
              <Button
                className="w-full"
                onClick={() => setSelectedElection(election.id)}
              >
                View Candidates
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog
        open={selectedElection !== null}
        onOpenChange={() => setSelectedElection(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {elections.find((e) => e.id === selectedElection)?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            {candidates[selectedElection ?? 0]?.map((candidate) => {
              const voteCount = votes[selectedElection ?? 0]?.filter(
                (v) => v.candidateId === candidate.id
              ).length ?? 0;

              return (
                <Card key={candidate.id}>
                  <CardHeader>
                    <CardTitle>{candidate.name}</CardTitle>
                    <CardDescription>{candidate.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4">Current Votes: {voteCount}</p>
                    <Button
                      className="w-full"
                      onClick={() =>
                        castVoteMutation.mutate({
                          candidateId: candidate.id,
                          electionId: selectedElection,
                        })
                      }
                      disabled={castVoteMutation.isPending}
                    >
                      {castVoteMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Vote
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
