import { createContext, ReactNode, useContext } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Election, Candidate, Vote } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useRef } from "react";

type VotingContextType = {
  elections: Election[];
  candidates: Record<number, Candidate[]>;
  votes: Record<number, Vote[]>;
  castVoteMutation: any;
  createElectionMutation: any;
  createCandidateMutation: any;
};

const VotingContext = createContext<VotingContextType | null>(null);

export function VotingProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const wsRef = useRef<WebSocket | null>(null);

  // Queries
  const { data: elections = [] } = useQuery<Election[]>({ 
    queryKey: ["/api/elections"]
  });

  const candidates = useQuery({
    queryKey: ["/api/candidates"],
    queryFn: () => {
      const candidatesByElection: Record<number, Candidate[]> = {};
      elections.forEach(async (election) => {
        const res = await fetch(`/api/elections/${election.id}/candidates`);
        candidatesByElection[election.id] = await res.json();
      });
      return candidatesByElection;
    },
    enabled: elections.length > 0,
  });

  const votes = useQuery({
    queryKey: ["/api/votes"],
    queryFn: () => {
      const votesByElection: Record<number, Vote[]> = {};
      elections.forEach(async (election) => {
        const res = await fetch(`/api/elections/${election.id}/results`);
        votesByElection[election.id] = await res.json();
      });
      return votesByElection;
    },
    enabled: elections.length > 0,
  });

  // Mutations
  const castVoteMutation = useMutation({
    mutationFn: async (data: { candidateId: number; electionId: number }) => {
      const res = await apiRequest("POST", "/api/vote", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/votes"] });
      toast({ title: "Vote cast successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to cast vote",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createElectionMutation = useMutation({
    mutationFn: async (data: Omit<Election, "id">) => {
      const res = await apiRequest("POST", "/api/elections", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/elections"] });
      toast({ title: "Election created successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create election",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createCandidateMutation = useMutation({
    mutationFn: async (data: Omit<Candidate, "id">) => {
      const res = await apiRequest("POST", "/api/candidates", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
      toast({ title: "Candidate added successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add candidate",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // WebSocket setup
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case "NEW_VOTE":
          queryClient.invalidateQueries({ queryKey: ["/api/votes"] });
          break;
        case "NEW_ELECTION":
          queryClient.invalidateQueries({ queryKey: ["/api/elections"] });
          break;
        case "NEW_CANDIDATE":
          queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
          break;
      }
    };

    wsRef.current = socket;
    return () => socket.close();
  }, []);

  return (
    <VotingContext.Provider
      value={{
        elections,
        candidates: candidates.data ?? {},
        votes: votes.data ?? {},
        castVoteMutation,
        createElectionMutation,
        createCandidateMutation,
      }}
    >
      {children}
    </VotingContext.Provider>
  );
}

export function useVoting() {
  const context = useContext(VotingContext);
  if (!context) {
    throw new Error("useVoting must be used within a VotingProvider");
  }
  return context;
}
