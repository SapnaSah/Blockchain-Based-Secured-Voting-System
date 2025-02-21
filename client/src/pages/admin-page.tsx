import { useAuth } from "@/hooks/use-auth";
import { useVoting } from "@/hooks/use-voting";
import { Redirect } from "wouter";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertElectionSchema, insertCandidateSchema } from "@shared/schema";
import { z } from "zod";
import { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { Loader2 } from "lucide-react";

const extendedElectionSchema = insertElectionSchema.extend({
  startTime: z.string(),
  endTime: z.string(),
});

export default function AdminPage() {
  const { user } = useAuth();
  const { elections, candidates, votes, createElectionMutation, createCandidateMutation } = useVoting();
  const [selectedElection, setSelectedElection] = useState<number | null>(null);

  const electionForm = useForm({
    resolver: zodResolver(extendedElectionSchema),
    defaultValues: {
      title: "",
      description: "",
      startTime: "",
      endTime: "",
    },
  });

  const candidateForm = useForm({
    resolver: zodResolver(insertCandidateSchema),
    defaultValues: {
      name: "",
      description: "",
      electionId: 0,
    },
  });

  // Only allow admin access
  if (!user?.isAdmin) {
    return <Redirect to="/" />;
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const renderElectionResults = (electionId: number) => {
    const electionVotes = votes[electionId] || [];
    const electionCandidates = candidates[electionId] || [];

    const data = electionCandidates.map(candidate => ({
      name: candidate.name,
      value: electionVotes.filter(v => v.candidateId === candidate.id).length
    }));

    return (
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Create New Election</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Election</DialogTitle>
            </DialogHeader>
            <Form {...electionForm}>
              <form
                onSubmit={electionForm.handleSubmit((data) => {
                  createElectionMutation.mutate(data);
                  electionForm.reset();
                })}
                className="space-y-4"
              >
                <FormField
                  control={electionForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={electionForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={electionForm.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={electionForm.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={createElectionMutation.isPending}
                >
                  {createElectionMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Create Election
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {elections.map((election) => (
          <Card key={election.id} className="flex flex-col">
            <CardHeader>
              <CardTitle>{election.title}</CardTitle>
              <CardDescription>{election.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="mb-4">
                <p className="font-semibold">Time Period:</p>
                <p>{new Date(election.startTime).toLocaleString()} - </p>
                <p>{new Date(election.endTime).toLocaleString()}</p>
              </div>
              {renderElectionResults(election.id)}
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    className="w-full mt-4"
                    onClick={() => {
                      setSelectedElection(election.id);
                      candidateForm.setValue("electionId", election.id);
                    }}
                  >
                    Add Candidate
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Candidate to {election.title}</DialogTitle>
                  </DialogHeader>
                  <Form {...candidateForm}>
                    <form
                      onSubmit={candidateForm.handleSubmit((data) => {
                        createCandidateMutation.mutate(data);
                        candidateForm.reset();
                      })}
                      className="space-y-4"
                    >
                      <FormField
                        control={candidateForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={candidateForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <input type="hidden" name="electionId" value={selectedElection ?? 0} />
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={createCandidateMutation.isPending}
                      >
                        {createCandidateMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Add Candidate
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
